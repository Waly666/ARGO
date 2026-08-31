const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const {
  listarCursosVirtualesAdmin,
  obtenerCursoVirtual,
} = require('../services/aulaVirtualCatalogo');
const {
  guardarConfigAula,
  obtenerConfigAula,
  obtenerConfigPortalAdmin,
  mergeLanding,
} = require('../services/aulaVirtualPortal');
const { mergePortalSite } = require('../services/portalSiteConfig');
const { LANDING_DEFAULTS } = require('../constants/aulaVirtualLandingDefaults');
const {
  obtenerConfig,
  guardarConfig,
  asignarPaquete,
  agregarMaterialArchivo,
  eliminarMaterial,
  asegurarDirPaquete,
  asegurarProgramaVirtual,
  actualizarFichaPrograma,
} = require('../services/aulaVirtualConfig');
const {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} = require('../services/aulaVirtualCategorias');
const {
  listarAdmin: listarBlogAdmin,
  obtenerAdmin: obtenerBlogAdmin,
  crearPost,
  actualizarPost,
  eliminarPost,
  urlImagenSubida,
} = require('../services/aulaVirtualBlog');
const { publicUrl, publicUrlPath, resolvePath, sanitizeApkFilename } = require('../middleware/upload');
const { optimizarImagenArchivo } = require('../utils/optimizarImagen');
const { listarUsuariosPortalAdmin, eliminarUsuarioPortal, crearUsuarioPortalAdmin } = require('../services/aulaVirtualUsuarios');
const { inyectarBridgeEnPaquete, detectarStoragePrefix } = require('../services/aulaVirtualBridge');
const { detectarIndexHtml, paqueteListo, listarEntradasPaquete } = require('../services/aulaVirtualPaquete');
const CapacitacionVirtualConfig = require('../models/CapacitacionVirtualConfig');
const { matricularVirtual } = require('../services/aulaVirtualMatricula');
const { listarProgresoAlumnosAdmin, listarProgresoAlumnoAdmin } = require('../services/aulaVirtualProgresoAdmin');
const {
  anularMatriculaVirtualAdmin,
  reiniciarProgresoVirtualAdmin,
} = require('../services/aulaVirtualGestionMatricula');

async function persistirStoragePrefix(idPrograma, abs, indexRel, user) {
  const storagePrefix = detectarStoragePrefix(abs, indexRel);
  if (!storagePrefix) return null;
  await CapacitacionVirtualConfig.updateOne(
    { idPrograma: String(idPrograma) },
    { $set: { storagePrefix, userChangeRecord: user?.username || 'sistema' } },
  );
  return storagePrefix;
}

exports.listarCursosAdmin = async (_req, res, next) => {
  try {
    res.json(await listarCursosVirtualesAdmin());
  } catch (e) {
    next(e);
  }
};

exports.obtenerCursoAdmin = async (req, res, next) => {
  try {
    const curso = await obtenerCursoVirtual(req.params.id, { requierePublicado: false });
    if (!curso) return res.status(404).json({ message: 'Programa virtual no encontrado' });
    const config = await obtenerConfig(req.params.id);
    res.json({ curso, config });
  } catch (e) {
    next(e);
  }
};

exports.guardarConfigCurso = async (req, res, next) => {
  try {
    const config = await guardarConfig(req.params.id, req.body || {}, req.user);
    res.json({ config, message: 'Configuración del curso virtual guardada' });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.subirPaqueteZip = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message:
          'No llegó el archivo ZIP al servidor. Compruebe que el archivo tenga extensión .zip y que no supere el límite de tamaño.',
      });
    }

    const { rel, abs } = asegurarDirPaquete(req.params.id);
    const zipPath = req.file.path;

    try {
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(abs, true);
    } catch (extractErr) {
      console.error('[ARGO] Error extrayendo ZIP curso virtual:', extractErr);
      try {
        fs.unlinkSync(zipPath);
      } catch (_e) {
        /* ignore */
      }
      const code = extractErr?.code;
      if (code === 'ENOSPC') {
        return res.status(507).json({ message: 'No hay espacio en disco en el servidor para extraer el curso.' });
      }
      if (code === 'EACCES' || code === 'EPERM') {
        return res.status(500).json({
          message: 'Sin permisos para escribir en la carpeta del curso en el servidor (uploads).',
        });
      }
      return res.status(400).json({
        message: `No se pudo extraer el ZIP: ${extractErr.message || 'archivo dañado o formato no válido'}`,
      });
    }

    try {
      fs.unlinkSync(zipPath);
    } catch (_e) {
      /* ignore */
    }

    const indexRel = detectarIndexHtml(abs, 'index.html');
    if (!paqueteListo(abs, indexRel)) {
      const visto = listarEntradasPaquete(abs).join(', ') || '(vacío)';
      return res.status(400).json({
        message:
          `No se encontró index.html en el ZIP. Debe estar en la raíz o dentro de una sola carpeta. Contenido: ${visto}`,
      });
    }

    let config = await asignarPaquete(req.params.id, rel, req.user);
    if (indexRel !== (config.indexHtml || 'index.html')) {
      await CapacitacionVirtualConfig.updateOne(
        { idPrograma: String(req.params.id) },
        { $set: { indexHtml: indexRel, userChangeRecord: req.user?.username || 'sistema' } },
      );
      config = await obtenerConfig(req.params.id);
    }
    const bridge = inyectarBridgeEnPaquete(abs, indexRel);
    await persistirStoragePrefix(req.params.id, abs, indexRel, req.user);
    config = await obtenerConfig(req.params.id);
    res.json({
      config,
      message:
        bridge.inyectados > 0
          ? `Paquete extraído e integrado con ARGO en ${bridge.inyectados} página(s) HTML`
          : 'Paquete del curso extraído correctamente (ARGO ya estaba integrado)',
      playerPath: publicUrlPath(rel, indexRel),
      bridgeInyectado: bridge.inyectados,
      bridgePaginas: bridge.total,
      storagePrefix: bridge.storagePrefix || config.storagePrefix || null,
    });
  } catch (e) {
    console.error('[ARGO] subirPaqueteZip:', e);
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.subirMaterial = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Seleccione un archivo' });
    const titulo = String(req.body?.titulo || req.file.originalname || 'Material').trim();
    const tipo = ['pdf', 'link', 'video', 'otro'].includes(req.body?.tipo) ? req.body.tipo : 'pdf';
    const url = publicUrl('aula-virtual-materiales', req.file.filename);
    const config = await agregarMaterialArchivo(
      req.params.id,
      { titulo, tipo, url, orden: Number(req.body?.orden || 0) },
      req.user,
    );
    res.json({ config, message: 'Material agregado' });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.eliminarMaterial = async (req, res, next) => {
  try {
    const config = await eliminarMaterial(req.params.id, req.params.materialId);
    res.json({ config, message: 'Material eliminado' });
  } catch (e) {
    next(e);
  }
};

exports.obtenerConfigPortal = async (_req, res, next) => {
  try {
    res.json(await obtenerConfigPortalAdmin());
  } catch (e) {
    next(e);
  }
};

exports.guardarConfigPortal = async (req, res, next) => {
  try {
    await guardarConfigAula(req.body || {}, req.user);
    res.json({ config: await obtenerConfigPortalAdmin(), message: 'Configuración del portal guardada' });
  } catch (e) {
    next(e);
  }
};

exports.subirLogoPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione una imagen (PNG, JPG o WEBP)' });
    }
    const filePath = path.join(req.file.destination, req.file.filename);
    await optimizarImagenArchivo(filePath, { maxWidth: 256, maxHeight: 256 });
    const urlLogo = publicUrl('aula-virtual-logo', req.file.filename);
    await guardarConfigAula({ urlLogo }, req.user);
    const { sincronizarLogoRecibo } = require('../services/configRecibo');
    await sincronizarLogoRecibo(urlLogo);
    res.json({ config: await obtenerConfigPortalAdmin(), message: 'Logo del portal actualizado' });
  } catch (e) {
    next(e);
  }
};

exports.quitarLogoPortal = async (_req, res, next) => {
  try {
    await guardarConfigAula({ urlLogo: '' }, _req.user);
    const { sincronizarLogoRecibo } = require('../services/configRecibo');
    await sincronizarLogoRecibo('');
    res.json({ config: await obtenerConfigPortalAdmin(), message: 'Logo del portal eliminado' });
  } catch (e) {
    next(e);
  }
};

async function guardarUrlHeroPortal(urlHero, usuario) {
  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing);
  const site = mergePortalSite(
    { ...aula.site, tema: { ...(aula.site?.tema || {}), urlHero } },
    { nav: landing.nav, footer: landing.footer },
  );
  await guardarConfigAula({ site }, usuario);
}

exports.subirImagenHeroPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione una imagen (PNG, JPG o WEBP)' });
    }
    const filePath = path.join(req.file.destination, req.file.filename);
    await optimizarImagenArchivo(filePath, { maxWidth: 1920, maxHeight: 1200 });
    const urlHero = publicUrl('aula-virtual-hero', req.file.filename);
    await guardarUrlHeroPortal(urlHero, req.user);
    res.json({ config: await obtenerConfigPortalAdmin(), message: 'Imagen del banner actualizada en el sitio' });
  } catch (e) {
    next(e);
  }
};

exports.quitarImagenHeroPortal = async (req, res, next) => {
  try {
    await guardarUrlHeroPortal('', req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen del banner eliminada; se usará la imagen por defecto',
    });
  } catch (e) {
    next(e);
  }
};

async function guardarImagenFundacionPortal(imagenUrl, usuario) {
  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing);
  landing.fundacion = {
    ...landing.fundacion,
    hero: {
      ...landing.fundacion.hero,
      imagenUrl: String(imagenUrl || '').trim(),
    },
  };
  await guardarConfigAula({ landing }, usuario);
}

function quitarImagenFundacionAnterior(imagenUrl) {
  const rel = String(imagenUrl || '').replace(/^\/uploads\//, '').trim();
  if (!rel.startsWith('aula-virtual-fundacion-hero/')) return;
  const p = resolvePath(rel);
  if (p && fs.existsSync(p)) fs.unlinkSync(p);
}

exports.subirImagenFundacionPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione una imagen (PNG, JPG o WEBP)' });
    }
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    quitarImagenFundacionAnterior(landing.fundacion?.hero?.imagenUrl);

    const imagenUrl = publicUrl('aula-virtual-fundacion-hero', req.file.filename);
    await guardarImagenFundacionPortal(imagenUrl, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen de la página institucional actualizada en el sitio',
    });
  } catch (e) {
    next(e);
  }
};

exports.quitarImagenFundacionPortal = async (req, res, next) => {
  try {
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    quitarImagenFundacionAnterior(landing.fundacion?.hero?.imagenUrl);
    await guardarImagenFundacionPortal('', req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen institucional eliminada; se usará la del inicio o la predeterminada',
    });
  } catch (e) {
    next(e);
  }
};

async function guardarImagenAcercaPortal(imagenUrl, usuario) {
  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing);
  landing.acerca = {
    ...landing.acerca,
    hero: {
      ...landing.acerca.hero,
      imagenUrl: String(imagenUrl || '').trim(),
    },
  };
  await guardarConfigAula({ landing }, usuario);
}

function quitarImagenAcercaAnterior(imagenUrl) {
  const rel = String(imagenUrl || '').replace(/^\/uploads\//, '').trim();
  if (!rel.startsWith('aula-virtual-acerca-hero/')) return;
  const p = resolvePath(rel);
  if (p && fs.existsSync(p)) fs.unlinkSync(p);
}

exports.subirImagenAcercaPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione una imagen (PNG, JPG o WEBP)' });
    }
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    quitarImagenAcercaAnterior(landing.acerca?.hero?.imagenUrl);

    const imagenUrl = publicUrl('aula-virtual-acerca-hero', req.file.filename);
    await guardarImagenAcercaPortal(imagenUrl, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen de «Acerca de» actualizada en el sitio',
    });
  } catch (e) {
    next(e);
  }
};

exports.quitarImagenAcercaPortal = async (req, res, next) => {
  try {
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    quitarImagenAcercaAnterior(landing.acerca?.hero?.imagenUrl);
    await guardarImagenAcercaPortal('', req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen de «Acerca de» eliminada; se mostrará el logo de la empresa',
    });
  } catch (e) {
    next(e);
  }
};

async function guardarImagenGaleriaHeroPortal(imagenUrl, usuario) {
  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing);
  landing.galeria = {
    ...landing.galeria,
    heroImagenUrl: String(imagenUrl || '').trim(),
  };
  await guardarConfigAula({ landing }, usuario);
}

function quitarImagenGaleriaHeroAnterior(imagenUrl) {
  const rel = String(imagenUrl || '').replace(/^\/uploads\//, '').trim();
  if (!rel.startsWith('aula-virtual-galeria-hero/')) return;
  const p = resolvePath(rel);
  if (p && fs.existsSync(p)) fs.unlinkSync(p);
}

exports.subirImagenGaleriaHeroPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione una imagen (PNG, JPG o WEBP)' });
    }
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    quitarImagenGaleriaHeroAnterior(landing.galeria?.heroImagenUrl);

    const imagenUrl = publicUrl('aula-virtual-galeria-hero', req.file.filename);
    await guardarImagenGaleriaHeroPortal(imagenUrl, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen del héroe de galería actualizada',
    });
  } catch (e) {
    next(e);
  }
};

exports.quitarImagenGaleriaHeroPortal = async (req, res, next) => {
  try {
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    quitarImagenGaleriaHeroAnterior(landing.galeria?.heroImagenUrl);
    await guardarImagenGaleriaHeroPortal('', req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen del héroe de galería eliminada; se usará la primera foto de la galería',
    });
  } catch (e) {
    next(e);
  }
};

async function guardarImagenCursosConduccionPortal(imagenUrl, usuario) {
  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing);
  landing.cursosConduccion = {
    ...landing.cursosConduccion,
    hero: {
      ...landing.cursosConduccion.hero,
      imagenUrl: String(imagenUrl || '').trim(),
    },
  };
  await guardarConfigAula({ landing }, usuario);
}

function quitarImagenCursosConduccionAnterior(imagenUrl) {
  const rel = String(imagenUrl || '').replace(/^\/uploads\//, '').trim();
  if (!rel.startsWith('aula-virtual-cursos-conduccion-hero/')) return;
  const p = resolvePath(rel);
  if (p && fs.existsSync(p)) fs.unlinkSync(p);
}

exports.subirImagenCursosConduccionPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione una imagen (PNG, JPG o WEBP)' });
    }
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    quitarImagenCursosConduccionAnterior(landing.cursosConduccion?.hero?.imagenUrl);

    const imagenUrl = publicUrl('aula-virtual-cursos-conduccion-hero', req.file.filename);
    await guardarImagenCursosConduccionPortal(imagenUrl, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen de Cursos conducción actualizada en el sitio',
    });
  } catch (e) {
    next(e);
  }
};

exports.quitarImagenCursosConduccionPortal = async (req, res, next) => {
  try {
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    quitarImagenCursosConduccionAnterior(landing.cursosConduccion?.hero?.imagenUrl);
    await guardarImagenCursosConduccionPortal('', req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen eliminada; se usará la predeterminada del portal',
    });
  } catch (e) {
    next(e);
  }
};

async function guardarImagenPopupPortal(imagenUrl, usuario) {
  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing);
  landing.popup = {
    ...landing.popup,
    imagenUrl: String(imagenUrl || '').trim(),
  };
  if (!String(imagenUrl || '').trim()) {
    landing.popup.activo = false;
  }
  await guardarConfigAula({ landing }, usuario);
}

function quitarImagenPopupAnterior(imagenUrl) {
  const rel = String(imagenUrl || '').replace(/^\/uploads\//, '').trim();
  if (!rel.startsWith('aula-virtual-popup/')) return;
  const p = resolvePath(rel);
  if (p && fs.existsSync(p)) fs.unlinkSync(p);
}

exports.subirImagenPopupPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione una imagen (PNG, JPG o WEBP)' });
    }
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    quitarImagenPopupAnterior(landing.popup?.imagenUrl);

    const filePath = path.join(req.file.destination, req.file.filename);
    await optimizarImagenArchivo(filePath, { maxWidth: 1600, maxHeight: 1200 });
    const imagenUrl = publicUrl('aula-virtual-popup', req.file.filename);
    await guardarImagenPopupPortal(imagenUrl, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen del popup actualizada en el sitio',
    });
  } catch (e) {
    next(e);
  }
};

exports.quitarImagenPopupPortal = async (req, res, next) => {
  try {
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    quitarImagenPopupAnterior(landing.popup?.imagenUrl);
    await guardarImagenPopupPortal('', req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen del popup eliminada',
    });
  } catch (e) {
    next(e);
  }
};

async function guardarAppMobileApkConfig(apkUrl, apkNombre, usuario) {
  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing);
  landing.appMobile = {
    ...landing.appMobile,
    apkUrl: String(apkUrl || '').trim(),
    apkNombre: String(apkNombre || '').trim(),
  };
  await guardarConfigAula({ landing }, usuario);
}

/** Sube APK al directorio /apk del portal y actualiza landing.appMobile. */
exports.subirApkPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione un archivo .apk de Android' });
    }
    const apkNombre = sanitizeApkFilename(req.file.filename);
    const apkUrl = `/apk/${apkNombre}`;
    await guardarAppMobileApkConfig(apkUrl, apkNombre, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      apkUrl,
      apkNombre,
      message: `APK publicada en el servidor (${apkNombre}). Los visitantes pueden descargarla desde el inicio del portal.`,
    });
  } catch (e) {
    next(e);
  }
};

async function guardarVideoAsistenteCertificados(videoUrl, usuario) {
  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing);
  const d = LANDING_DEFAULTS.asistente;
  landing.asistente = {
    ...(landing.asistente || d),
    videoUrl: String(videoUrl || '').trim() || d.videoUrl,
    paginas: landing.asistente?.paginas || d.paginas,
  };
  await guardarConfigAula({ landing }, usuario);
}

function quitarVideoAsistenteAnterior(videoUrl) {
  const rel = String(videoUrl || '').replace(/^\/uploads\//, '').trim();
  if (!rel.startsWith('aula-virtual-consulta-asistente/')) return;
  const p = resolvePath(rel);
  if (p && fs.existsSync(p)) fs.unlinkSync(p);
}

exports.subirVideoAsistenteCertificadosPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione un video MP4 o WEBM' });
    }
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    quitarVideoAsistenteAnterior(landing.asistente?.videoUrl);

    const videoUrl = publicUrl('aula-virtual-consulta-asistente', req.file.filename);
    await guardarVideoAsistenteCertificados(videoUrl, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Video del asistente de certificados actualizado',
    });
  } catch (e) {
    next(e);
  }
};

exports.quitarVideoAsistenteCertificadosPortal = async (req, res, next) => {
  try {
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    quitarVideoAsistenteAnterior(landing.asistente?.videoUrl);
    await guardarVideoAsistenteCertificados(LANDING_DEFAULTS.asistente.videoUrl, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Video personalizado eliminado; se usará el predeterminado del portal',
    });
  } catch (e) {
    next(e);
  }
};

exports.listarCategoriasAdmin = async (_req, res, next) => {
  try {
    res.json(await listarCategorias());
  } catch (e) {
    next(e);
  }
};

exports.crearCategoria = async (req, res, next) => {
  try {
    const row = await crearCategoria(req.body || {}, req.user);
    res.status(201).json({ categoria: row, message: 'Categoría creada' });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.actualizarCategoria = async (req, res, next) => {
  try {
    const row = await actualizarCategoria(req.params.id, req.body || {}, req.user);
    res.json({ categoria: row, message: 'Categoría actualizada' });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.eliminarCategoria = async (req, res, next) => {
  try {
    await eliminarCategoria(req.params.id);
    res.json({ ok: true, message: 'Categoría eliminada' });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.subirPortadaCurso = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Seleccione una imagen de portada' });
    await asegurarProgramaVirtual(req.params.id);
    const urlPortadaVirtual = publicUrl('programas-virtual', req.file.filename);
    await actualizarFichaPrograma(
      req.params.id,
      { urlPortadaVirtual },
      req.user,
    );
    res.json({ urlPortadaVirtual, message: 'Portada del curso actualizada' });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.quitarPortadaCurso = async (req, res, next) => {
  try {
    await asegurarProgramaVirtual(req.params.id);
    await actualizarFichaPrograma(req.params.id, { urlPortadaVirtual: '' }, req.user);
    res.json({ message: 'Portada eliminada' });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.reintegrarBridge = async (req, res, next) => {
  try {
    const config = await obtenerConfig(req.params.id);
    if (!config?.rutaPaquete) {
      return res.status(400).json({ message: 'El curso no tiene paquete cargado' });
    }
    const abs = resolvePath(config.rutaPaquete);
    if (!abs || !fs.existsSync(abs)) {
      return res.status(404).json({ message: 'Carpeta del paquete no encontrada en el servidor' });
    }
    const indexRel = detectarIndexHtml(abs, config.indexHtml || 'index.html');
    if (!paqueteListo(abs, indexRel)) {
      return res.status(400).json({ message: 'No se encontró index.html en el paquete del curso' });
    }
    if (indexRel !== (config.indexHtml || 'index.html')) {
      await CapacitacionVirtualConfig.updateOne(
        { idPrograma: String(req.params.id) },
        { $set: { indexHtml: indexRel, userChangeRecord: req.user?.username || 'sistema' } },
      );
      config = await obtenerConfig(req.params.id);
    }
    const bridge = inyectarBridgeEnPaquete(abs, indexRel);
    const storagePrefix = await persistirStoragePrefix(req.params.id, abs, indexRel, req.user);
    res.json({
      message:
        bridge.inyectados > 0
          ? `ARGO integrado en ${bridge.inyectados} página(s). Entrada: ${indexRel}`
          : `ARGO ya integrado. Entrada del curso: ${indexRel}`,
      indexHtml: indexRel,
      bridgeInyectado: bridge.inyectados,
      bridgePaginas: bridge.total,
      storagePrefix: storagePrefix || bridge.storagePrefix || config.storagePrefix || null,
    });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.matricularAlumnoCurso = async (req, res, next) => {
  try {
    const body = req.body || {};
    const numDoc = body.numDoc ?? req.params.numDoc;
    const out = await matricularVirtual({
      numDoc,
      idPrograma: req.params.id,
      observaciones: body.observaciones,
      crearUsuarioPortal: body.crearUsuarioPortal === true || body.crearUsuarioPortal === 'true',
      email: body.email,
      password: body.password,
    });
    res.status(out.yaMatriculado ? 200 : 201).json(out);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.listarUsuariosPortal = async (req, res, next) => {
  try {
    const q = String(req.query?.q || '').trim();
    const limit = Number(req.query?.limit) || 200;
    res.json(await listarUsuariosPortalAdmin({ q, limit }));
  } catch (e) {
    next(e);
  }
};

exports.crearUsuarioPortal = async (req, res, next) => {
  try {
    const body = req.body || {};
    const out = await crearUsuarioPortalAdmin({
      email: body.email,
      password: body.password,
      alumno: body.alumno || body,
      usuarioErp: req.user?.username || req.user?.nick || 'erp',
    });
    res.status(201).json(out);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.eliminarUsuarioPortal = async (req, res, next) => {
  try {
    res.json(await eliminarUsuarioPortal(req.params.id));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.listarProgresoAlumnos = async (req, res, next) => {
  try {
    const curso = await obtenerCursoVirtual(req.params.id, { requierePublicado: false });
    if (!curso) return res.status(404).json({ message: 'Programa virtual no encontrado' });
    const ctx = req.sedeId ? { idSede: req.sedeId } : {};
    res.json(await listarProgresoAlumnosAdmin(req.params.id, req.query, ctx));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.listarProgresoAlumno = async (req, res, next) => {
  try {
    const ctx = req.sedeId ? { idSede: req.sedeId } : {};
    res.json(await listarProgresoAlumnoAdmin(req.params.numDoc, req.query, ctx));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.reiniciarProgresoAlumnoCurso = async (req, res, next) => {
  try {
    const r = await reiniciarProgresoVirtualAdmin({
      numDoc: req.params.numDoc,
      idPrograma: req.params.idPrograma,
    });
    res.json(r);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.anularMatriculaAlumnoCurso = async (req, res, next) => {
  try {
    const body = req.body || {};
    const r = await anularMatriculaVirtualAdmin({
      numDoc: req.params.numDoc,
      idPrograma: req.params.idPrograma,
      usuario: req.user,
      motivo: body.motivo,
      enviarCorreo: body.enviarCorreo === true || body.enviarCorreo === 'true',
    });
    res.json(r);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.listarAlertasEventosPortal = async (req, res, next) => {
  try {
    const { listarEventosRecientes } = require('../services/aulaVirtualAlertasEventos');
    const { reglaPorClave } = require('../services/configAlertas');
    const minReg = Number(req.query?.minutosRegistro);
    const minMat = Number(req.query?.minutosMatricula);
    const reglaReg = await reglaPorClave('alarmas.aula_virtual.registro_nuevo');
    const reglaMat = await reglaPorClave('alarmas.aula_virtual.matricula_nueva');
    const ventanaReg =
      Number.isFinite(minReg) && minReg > 0
        ? minReg
        : Math.max(5, Number(reglaReg?.duracionMinutos) || 120);
    const ventanaMat =
      Number.isFinite(minMat) && minMat > 0
        ? minMat
        : Math.max(5, Number(reglaMat?.duracionMinutos) || 120);
    const ahora = Date.now();
    const desdeReg = new Date(ahora - ventanaReg * 60 * 1000);
    const desdeMat = new Date(ahora - ventanaMat * 60 * 1000);
    const [registro, matricula] = await Promise.all([
      listarEventosRecientes({ desde: desdeReg, tipos: ['registro'], limit: 30 }),
      listarEventosRecientes({ desde: desdeMat, tipos: ['matricula'], limit: 40 }),
    ]);
    res.json({
      registro: registro.registro,
      matricula: matricula.matricula,
    });
  } catch (e) {
    next(e);
  }
};

exports.listarAlertasAccesoPorVencer = async (req, res, next) => {
  try {
    const { listarAccesosPorVencer } = require('../services/aulaVirtualAccesoPlazo');
    const { reglaPorClave } = require('../services/configAlertas');
    const qDias = Number(req.query?.dias);
    const regla = await reglaPorClave('alarmas.aula_virtual.acceso_por_vencer');
    const dias =
      Number.isFinite(qDias) && qDias > 0
        ? Math.floor(qDias)
        : Math.max(1, Number(regla?.diasAntelacion) || 1);
    res.json(await listarAccesosPorVencer({ diasAntelacion: dias }));
  } catch (e) {
    next(e);
  }
};

exports.listarBlogAdmin = async (_req, res, next) => {
  try {
    res.json(await listarBlogAdmin());
  } catch (e) {
    next(e);
  }
};

exports.obtenerBlogAdmin = async (req, res, next) => {
  try {
    res.json(await obtenerBlogAdmin(req.params.id));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.crearBlogPost = async (req, res, next) => {
  try {
    const post = await crearPost(req.body || {}, req.user);
    res.status(201).json({ post, message: 'Artículo creado' });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.actualizarBlogPost = async (req, res, next) => {
  try {
    const post = await actualizarPost(req.params.id, req.body || {}, req.user);
    res.json({ post, message: 'Artículo actualizado' });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.eliminarBlogPost = async (req, res, next) => {
  try {
    await eliminarPost(req.params.id);
    res.json({ ok: true, message: 'Artículo eliminado' });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.subirImagenBlog = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione una imagen (PNG, JPG o WEBP)' });
    }
    const url = urlImagenSubida(req.file.filename);
    res.status(201).json({ url, message: 'Imagen subida' });
  } catch (e) {
    next(e);
  }
};

function urlGaleriaSubida(filename) {
  return publicUrl('aula-virtual-galeria', filename);
}

function quitarArchivoGaleria(url) {
  const rel = String(url || '').replace(/^\/uploads\//, '').trim();
  if (!rel.startsWith('aula-virtual-galeria/')) return;
  const p = resolvePath(rel);
  if (p && fs.existsSync(p)) fs.unlinkSync(p);
}

async function anexarFotosGaleria(filenames, usuario) {
  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing);
  const fotos = [...(landing.galeria?.fotos || [])];
  for (const filename of filenames) {
    const url = urlGaleriaSubida(filename);
    const ext = path.extname(filename).toLowerCase();
    const tipo = ext === '.mp4' || ext === '.webm' ? 'video' : 'imagen';
    fotos.push({
      id: `${Date.now()}_${Math.round(Math.random() * 1e6)}`,
      url,
      leyenda: '',
      tipo,
      orden: fotos.length,
    });
  }
  landing.galeria = { ...landing.galeria, fotos };
  await guardarConfigAula({ landing }, usuario);
}

exports.subirImagenesGaleriaPortal = async (req, res, next) => {
  try {
    const files = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];
    if (!files.length) {
      return res.status(400).json({ message: 'Seleccione una o más imágenes o videos' });
    }
    for (const file of files) {
      if (file.mimetype?.startsWith('image/')) {
        const filePath = path.join(file.destination, file.filename);
        await optimizarImagenArchivo(filePath, { maxWidth: 1920, maxHeight: 1920 });
      }
    }
    await anexarFotosGaleria(
      files.map((f) => f.filename),
      req.user,
    );
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: `${files.length} archivo(s) agregado(s) a la galería`,
    });
  } catch (e) {
    next(e);
  }
};

exports.eliminarFotoGaleriaPortal = async (req, res, next) => {
  try {
    const url = String(req.body?.url || req.query?.url || '').trim();
    if (!url) {
      return res.status(400).json({ message: 'Indique la URL del archivo a eliminar' });
    }
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    const antes = landing.galeria?.fotos || [];
    const fotos = antes.filter((f) => f.url !== url);
    if (fotos.length === antes.length) {
      return res.status(404).json({ message: 'Archivo no encontrado en la galería' });
    }
    quitarArchivoGaleria(url);
    landing.galeria = { ...landing.galeria, fotos };
    await guardarConfigAula({ landing }, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Archivo eliminado de la galería',
    });
  } catch (e) {
    next(e);
  }
};

const MAX_HOME_FOTOS = 2;

function urlHomeFotoSubida(filename) {
  return publicUrl('aula-virtual-home-fotos', filename);
}

function quitarArchivoHomeFoto(url) {
  const rel = String(url || '').replace(/^\/uploads\//, '').trim();
  if (!rel.startsWith('aula-virtual-home-fotos/')) return;
  const p = resolvePath(rel);
  if (p && fs.existsSync(p)) fs.unlinkSync(p);
}

exports.subirImagenHomeFotoPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione una imagen' });
    }
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    const fotos = [...(landing.fotosInicio?.fotos || [])];
    if (fotos.length >= MAX_HOME_FOTOS) {
      quitarArchivoHomeFoto(urlHomeFotoSubida(req.file.filename));
      return res.status(400).json({
        message: `Solo puede haber ${MAX_HOME_FOTOS} fotos destacadas en el inicio`,
      });
    }
    const filePath = path.join(req.file.destination, req.file.filename);
    await optimizarImagenArchivo(filePath, { maxWidth: 1920, maxHeight: 1280 });
    fotos.push({
      url: urlHomeFotoSubida(req.file.filename),
      leyenda: '',
    });
    landing.fotosInicio = { ...landing.fotosInicio, fotos };
    await guardarConfigAula({ landing }, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Foto del inicio agregada',
    });
  } catch (e) {
    next(e);
  }
};

exports.eliminarImagenHomeFotoPortal = async (req, res, next) => {
  try {
    const url = String(req.body?.url || req.query?.url || '').trim();
    if (!url) {
      return res.status(400).json({ message: 'Indique la URL de la foto a eliminar' });
    }
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    const antes = landing.fotosInicio?.fotos || [];
    const fotos = antes.filter((f) => f.url !== url);
    if (fotos.length === antes.length) {
      return res.status(404).json({ message: 'Foto no encontrada en el inicio' });
    }
    quitarArchivoHomeFoto(url);
    landing.fotosInicio = { ...landing.fotosInicio, fotos };
    await guardarConfigAula({ landing }, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Foto eliminada del inicio',
    });
  } catch (e) {
    next(e);
  }
};

const MAX_HOME_PUBLICIDAD = 8;

function urlHomePublicidad(filename) {
  return publicUrl('aula-virtual-home-publicidad', filename);
}

function quitarArchivoHomePublicidad(url) {
  const rel = String(url || '').replace(/^\/uploads\//, '').trim();
  if (!rel.startsWith('aula-virtual-home-publicidad/')) return;
  const p = resolvePath(rel);
  if (p && fs.existsSync(p)) fs.unlinkSync(p);
}

function asegurarPublicidadInicio(landing) {
  if (!landing.publicidadInicio || typeof landing.publicidadInicio !== 'object') {
    landing.publicidadInicio = { activo: true, intervaloSegundos: 5, slides: [] };
  }
  if (!Array.isArray(landing.publicidadInicio.slides)) {
    landing.publicidadInicio.slides = [];
  }
  return landing.publicidadInicio;
}

exports.subirImagenHomePublicidadPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione una imagen PNG' });
    }
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    const publicidad = asegurarPublicidadInicio(landing);
    const slides = [...publicidad.slides];
    if (slides.length >= MAX_HOME_PUBLICIDAD) {
      quitarArchivoHomePublicidad(urlHomePublicidad(req.file.filename));
      return res.status(400).json({
        message: `Solo puede haber ${MAX_HOME_PUBLICIDAD} imágenes de publicidad en el inicio`,
      });
    }
    const filePath = path.join(req.file.destination, req.file.filename);
    await optimizarImagenArchivo(filePath, { maxWidth: 1920, maxHeight: 800 });
    slides.push({
      url: urlHomePublicidad(req.file.filename),
      alt: 'Publicidad',
      enlace: '',
    });
    landing.publicidadInicio = { ...publicidad, slides };
    await guardarConfigAula({ landing }, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen de publicidad agregada al inicio',
    });
  } catch (e) {
    next(e);
  }
};

exports.eliminarImagenHomePublicidadPortal = async (req, res, next) => {
  try {
    const url = String(req.body?.url || req.query?.url || '').trim();
    if (!url) {
      return res.status(400).json({ message: 'Indique la URL de la imagen a eliminar' });
    }
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    const publicidad = asegurarPublicidadInicio(landing);
    const antes = publicidad.slides || [];
    const slides = antes.filter((s) => s.url !== url);
    if (slides.length === antes.length) {
      return res.status(404).json({ message: 'Imagen no encontrada en la publicidad del inicio' });
    }
    quitarArchivoHomePublicidad(url);
    landing.publicidadInicio = { ...publicidad, slides };
    await guardarConfigAula({ landing }, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen de publicidad eliminada del inicio',
    });
  } catch (e) {
    next(e);
  }
};

const MAX_CURSOS_CONDUCCION_PUBLICIDAD = 8;

function urlCursosConduccionPublicidad(filename) {
  return publicUrl('aula-virtual-cursos-conduccion-publicidad', filename);
}

function quitarArchivoCursosConduccionPublicidad(url) {
  const rel = String(url || '').replace(/^\/uploads\//, '').trim();
  if (!rel.startsWith('aula-virtual-cursos-conduccion-publicidad/')) return;
  const p = resolvePath(rel);
  if (p && fs.existsSync(p)) fs.unlinkSync(p);
}

function asegurarPublicidadCursosConduccion(landing) {
  if (!landing.cursosConduccion) landing.cursosConduccion = {};
  if (!landing.cursosConduccion.publicidad || typeof landing.cursosConduccion.publicidad !== 'object') {
    landing.cursosConduccion.publicidad = { activo: true, intervaloSegundos: 5, slides: [] };
  }
  if (!Array.isArray(landing.cursosConduccion.publicidad.slides)) {
    landing.cursosConduccion.publicidad.slides = [];
  }
  return landing.cursosConduccion.publicidad;
}

exports.subirImagenCursosConduccionPublicidadPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione una imagen PNG' });
    }
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    const publicidad = asegurarPublicidadCursosConduccion(landing);
    const slides = [...publicidad.slides];
    if (slides.length >= MAX_CURSOS_CONDUCCION_PUBLICIDAD) {
      quitarArchivoCursosConduccionPublicidad(urlCursosConduccionPublicidad(req.file.filename));
      return res.status(400).json({
        message: `Solo puede haber ${MAX_CURSOS_CONDUCCION_PUBLICIDAD} imágenes de publicidad`,
      });
    }
    const filePath = path.join(req.file.destination, req.file.filename);
    await optimizarImagenArchivo(filePath, { maxWidth: 1920, maxHeight: 800 });
    slides.push({
      url: urlCursosConduccionPublicidad(req.file.filename),
      alt: 'Publicidad',
      enlace: '',
    });
    landing.cursosConduccion.publicidad = { ...publicidad, slides };
    await guardarConfigAula({ landing }, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen de publicidad agregada',
    });
  } catch (e) {
    next(e);
  }
};

exports.eliminarImagenCursosConduccionPublicidadPortal = async (req, res, next) => {
  try {
    const url = String(req.body?.url || req.query?.url || '').trim();
    if (!url) {
      return res.status(400).json({ message: 'Indique la URL de la imagen a eliminar' });
    }
    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    const publicidad = asegurarPublicidadCursosConduccion(landing);
    const antes = publicidad.slides || [];
    const slides = antes.filter((s) => s.url !== url);
    if (slides.length === antes.length) {
      return res.status(404).json({ message: 'Imagen no encontrada en la publicidad' });
    }
    quitarArchivoCursosConduccionPublicidad(url);
    landing.cursosConduccion.publicidad = { ...publicidad, slides };
    await guardarConfigAula({ landing }, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen de publicidad eliminada',
    });
  } catch (e) {
    next(e);
  }
};

exports.subirArchivoCursosConduccionPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione un archivo PDF' });
    }
    const { publicUploadUrl } = require('../utils/uploadPublicUrl');
    const archivoUrl = publicUrl('aula-virtual-cursos-conduccion', req.file.filename);
    const nombreArchivo =
      String(req.file.originalname || 'documento.pdf')
        .replace(/[^\w.\- ]+/g, '_')
        .trim() || 'documento.pdf';
    res.json({
      archivoUrl,
      archivoUrlAbsoluta: publicUploadUrl(archivoUrl) || archivoUrl,
      nombreArchivo,
      message: 'Archivo cargado. Publique los cambios del sitio para que aparezca en el portal.',
    });
  } catch (e) {
    next(e);
  }
};

exports.subirArchivoExamenTeoricoPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione un archivo PDF' });
    }
    const { publicUploadUrl } = require('../utils/uploadPublicUrl');
    const archivoUrl = publicUrl('aula-virtual-examen-teorico', req.file.filename);
    const nombreArchivo =
      String(req.file.originalname || 'documento.pdf')
        .replace(/[^\w.\- ]+/g, '_')
        .trim() || 'documento.pdf';

    const tipo = String(req.body?.tipo || '').trim().toLowerCase();
    const index = Number(req.body?.index);
    let persisted = false;

    if (tipo && Number.isFinite(index) && index >= 0) {
      const aula = await obtenerConfigAula();
      const landing = mergeLanding(aula.landing);
      const et = landing.examenTeorico || {};

      if (tipo === 'normograma' && Array.isArray(et.normograma?.items) && et.normograma.items[index]) {
        et.normograma.items[index].archivoUrl = archivoUrl;
        et.normograma.items[index].nombreArchivo = nombreArchivo;
        persisted = true;
      } else if (tipo === 'resolucion' && Array.isArray(et.resoluciones) && et.resoluciones[index]) {
        et.resoluciones[index].archivoUrl = archivoUrl;
        et.resoluciones[index].nombreArchivo = nombreArchivo;
        persisted = true;
      }

      if (persisted) {
        landing.examenTeorico = et;
        await guardarConfigAula({ landing }, req.user);
      }
    }

    res.json({
      archivoUrl,
      archivoUrlAbsoluta: publicUploadUrl(archivoUrl) || archivoUrl,
      nombreArchivo,
      persisted,
      message: persisted
        ? 'PDF guardado. Ya está disponible en el portal.'
        : 'Archivo cargado. Publique los cambios del sitio para que aparezca en el portal.',
    });
  } catch (e) {
    next(e);
  }
};

const { mergeMercanciasPeligrosasLanding } = require('../constants/aulaVirtualMercanciasPeligrosasDefaults');

function urlMercanciasPeligrosas(filename) {
  return publicUrl('aula-virtual-mercancias-peligrosas', filename);
}

function quitarImagenMercanciasPeligrosasAnterior(imagenUrl) {
  const rel = String(imagenUrl || '').replace(/^\/uploads\//, '').trim();
  if (!rel.startsWith('aula-virtual-mercancias-peligrosas/')) return;
  const p = resolvePath(rel);
  if (p && fs.existsSync(p)) fs.unlinkSync(p);
}

exports.subirImagenMercanciasPeligrosasPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione una imagen (PNG, JPG o WEBP)' });
    }
    const imagenId = String(req.body?.imagenId || '').trim();
    if (!imagenId) {
      return res.status(400).json({ message: 'Indique la imagen a actualizar (imagenId)' });
    }

    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    const mp = mergeMercanciasPeligrosasLanding(landing.mercanciasPeligrosas);
    const idx = mp.imagenes.findIndex((i) => i.id === imagenId);
    if (idx < 0) {
      return res.status(400).json({ message: 'Imagen no reconocida en la configuración' });
    }

    const filePath = path.join(req.file.destination, req.file.filename);
    await optimizarImagenArchivo(filePath, { maxWidth: 1920, maxHeight: 1280 });
    const nuevaUrl = urlMercanciasPeligrosas(req.file.filename);
    quitarImagenMercanciasPeligrosasAnterior(mp.imagenes[idx].url);
    mp.imagenes[idx] = { ...mp.imagenes[idx], url: nuevaUrl };
    landing.mercanciasPeligrosas = mp;
    await guardarConfigAula({ landing }, req.user);

    const { publicUploadUrl } = require('../utils/uploadPublicUrl');
    res.json({
      config: await obtenerConfigPortalAdmin(),
      imagenId,
      url: nuevaUrl,
      urlAbsoluta: publicUploadUrl(nuevaUrl) || nuevaUrl,
      message: 'Imagen actualizada en la página de mercancías peligrosas',
    });
  } catch (e) {
    next(e);
  }
};

exports.quitarImagenMercanciasPeligrosasPortal = async (req, res, next) => {
  try {
    const imagenId = String(req.body?.imagenId || req.query?.imagenId || '').trim();
    if (!imagenId) {
      return res.status(400).json({ message: 'Indique la imagen a quitar (imagenId)' });
    }

    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    const mp = mergeMercanciasPeligrosasLanding(landing.mercanciasPeligrosas);
    const idx = mp.imagenes.findIndex((i) => i.id === imagenId);
    if (idx < 0) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    quitarImagenMercanciasPeligrosasAnterior(mp.imagenes[idx].url);
    mp.imagenes[idx] = { ...mp.imagenes[idx], url: '' };
    landing.mercanciasPeligrosas = mp;
    await guardarConfigAula({ landing }, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen eliminada de la página de mercancías peligrosas',
    });
  } catch (e) {
    next(e);
  }
};

const { mergeTrabajoEnAlturasLanding } = require('../constants/aulaVirtualTrabajoEnAlturasDefaults');

function urlTrabajoEnAlturas(filename) {
  return publicUrl('aula-virtual-trabajo-en-alturas', filename);
}

function quitarImagenTrabajoEnAlturasAnterior(imagenUrl) {
  const rel = String(imagenUrl || '').replace(/^\/uploads\//, '').trim();
  if (!rel.startsWith('aula-virtual-trabajo-en-alturas/')) return;
  const p = resolvePath(rel);
  if (p && fs.existsSync(p)) fs.unlinkSync(p);
}

exports.subirImagenTrabajoEnAlturasPortal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione una imagen (PNG, JPG o WEBP)' });
    }
    const imagenId = String(req.body?.imagenId || '').trim();
    if (!imagenId) {
      return res.status(400).json({ message: 'Indique la imagen a actualizar (imagenId)' });
    }

    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    const ta = mergeTrabajoEnAlturasLanding(landing.trabajoEnAlturas);
    const idx = ta.imagenes.findIndex((i) => i.id === imagenId);
    if (idx < 0) {
      return res.status(400).json({ message: 'Imagen no reconocida en la configuración' });
    }

    const filePath = path.join(req.file.destination, req.file.filename);
    await optimizarImagenArchivo(filePath, { maxWidth: 1920, maxHeight: 1280 });
    const nuevaUrl = urlTrabajoEnAlturas(req.file.filename);
    quitarImagenTrabajoEnAlturasAnterior(ta.imagenes[idx].url);
    ta.imagenes[idx] = { ...ta.imagenes[idx], url: nuevaUrl };
    landing.trabajoEnAlturas = ta;
    await guardarConfigAula({ landing }, req.user);

    const { publicUploadUrl } = require('../utils/uploadPublicUrl');
    res.json({
      config: await obtenerConfigPortalAdmin(),
      imagenId,
      url: nuevaUrl,
      urlAbsoluta: publicUploadUrl(nuevaUrl) || nuevaUrl,
      message: 'Imagen actualizada en la página de trabajo en alturas',
    });
  } catch (e) {
    next(e);
  }
};

exports.quitarImagenTrabajoEnAlturasPortal = async (req, res, next) => {
  try {
    const imagenId = String(req.body?.imagenId || req.query?.imagenId || '').trim();
    if (!imagenId) {
      return res.status(400).json({ message: 'Indique la imagen a quitar (imagenId)' });
    }

    const aula = await obtenerConfigAula();
    const landing = mergeLanding(aula.landing);
    const ta = mergeTrabajoEnAlturasLanding(landing.trabajoEnAlturas);
    const idx = ta.imagenes.findIndex((i) => i.id === imagenId);
    if (idx < 0) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    quitarImagenTrabajoEnAlturasAnterior(ta.imagenes[idx].url);
    ta.imagenes[idx] = { ...ta.imagenes[idx], url: '' };
    landing.trabajoEnAlturas = ta;
    await guardarConfigAula({ landing }, req.user);
    res.json({
      config: await obtenerConfigPortalAdmin(),
      message: 'Imagen eliminada de la página de trabajo en alturas',
    });
  } catch (e) {
    next(e);
  }
};
