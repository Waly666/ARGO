const fs = require('fs');

const path = require('path');

const { mergeLanding } = require('./aulaVirtualPortalLanding');
const { obtenerConfigAula, guardarConfigAula } = require('./aulaVirtualPortal');
const { publicUrl, resolvePath } = require('../middleware/upload');
const { optimizarImagenArchivo } = require('../utils/optimizarImagen');

const VALID_SLUGS = new Set([
  'aulaVirtual',
  'peridata',
  'capacitacionSensibilizacion',
  'estudiosDiagnosticosTecnicos',
  'herramientasEducativasTecnologicas',
  'inventariosViales',
  'planeacionGestionVial',
]);

const UPLOAD_KEY = 'aula-virtual-finstruvial-servicios';

function assertSlug(slug) {
  const key = String(slug || '').trim();
  if (!VALID_SLUGS.has(key)) {
    const err = new Error('Línea de servicio no válida.');
    err.status = 400;
    throw err;
  }
  return key;
}

function getPagina(landing, slug) {
  const paginas = landing.finstruvialServicios?.paginas;
  if (!paginas?.[slug]) {
    const err = new Error('Configuración de servicio no encontrada.');
    err.status = 404;
    throw err;
  }
  return paginas[slug];
}

function findImagen(pagina, imagenId) {
  const id = String(imagenId || 'hero').trim();
  const idx = (pagina.imagenes || []).findIndex((img) => String(img?.id || '') === id);
  if (idx < 0) {
    const err = new Error('Imagen no configurada para este servicio.');
    err.status = 400;
    throw err;
  }
  return { idx, id };
}

function findOrCreateVideo(pagina, videoId) {
  const id = String(videoId || '').trim();
  if (!id) {
    const err = new Error('ID de video requerido.');
    err.status = 400;
    throw err;
  }
  if (!Array.isArray(pagina.videos)) pagina.videos = [];
  let idx = pagina.videos.findIndex((v) => String(v?.id || '') === id);
  if (idx < 0) {
    pagina.videos.push({ id, etiqueta: 'Video', url: '', urlAbsoluta: '', alt: 'Video' });
    idx = pagina.videos.length - 1;
  }
  return { idx, id };
}

function findVideo(pagina, videoId) {
  const id = String(videoId || '').trim();
  const idx = (pagina.videos || []).findIndex((v) => String(v?.id || '') === id);
  if (idx < 0) {
    const err = new Error('Video no configurado para este servicio.');
    err.status = 400;
    throw err;
  }
  return { idx, id };
}

function quitarArchivoAnterior(fileUrl) {
  const rel = String(fileUrl || '').replace(/^\/uploads\//, '').trim();
  if (!rel.startsWith(`${UPLOAD_KEY}/`)) return;
  const p = resolvePath(rel);
  if (p && fs.existsSync(p)) fs.unlinkSync(p);
}

function quitarImagenAnterior(imagenUrl) {
  quitarArchivoAnterior(imagenUrl);
}

async function subirImagenServicioFinstruvial(slugRaw, imagenIdRaw, file, usuario) {
  const slug = assertSlug(slugRaw);
  const imagenId = String(imagenIdRaw || 'hero').trim();

  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing || {}, aula.site?.tema);
  if (!landing.finstruvialServicios?.paginas) {
    const err = new Error('Servicios Finstruvial no configurados.');
    err.status = 400;
    throw err;
  }
  const pagina = getPagina(landing, slug);
  if (imagenId !== 'hero') {
    findImagen(pagina, imagenId);
  }

  await optimizarImagenArchivo(file.path, { maxWidth: 1920, maxHeight: 1280 });
  const rel = `${UPLOAD_KEY}/${slug}/${imagenId}-${Date.now()}.webp`;
  const abs = resolvePath(rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.renameSync(file.path, abs);

  let prevUrl = '';
  if (imagenId === 'hero') {
    prevUrl = pagina.heroImagenUrl;
  } else {
    const { idx } = findImagen(pagina, imagenId);
    prevUrl = pagina.imagenes[idx]?.url || '';
  }
  quitarImagenAnterior(prevUrl);

  const url = `/uploads/${rel}`;
  const urlAbsoluta = publicUrl(rel);

  if (imagenId === 'hero') {
    pagina.heroImagenUrl = url;
    pagina.heroImagenUrlAbsoluta = urlAbsoluta;
  } else {
    const { idx } = findImagen(pagina, imagenId);
    pagina.imagenes[idx] = {
      ...pagina.imagenes[idx],
      url,
      urlAbsoluta,
    };
  }

  landing.finstruvialServicios.paginas[slug] = pagina;
  await guardarConfigAula({ landing }, usuario);

  return {
    config: { ...aula, landing },
    url,
    urlAbsoluta,
    message: 'Imagen del servicio actualizada.',
  };
}

async function quitarImagenServicioFinstruvial(slugRaw, imagenIdRaw, usuario) {
  const slug = assertSlug(slugRaw);
  const imagenId = String(imagenIdRaw || 'hero').trim();

  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing || {}, aula.site?.tema);
  const pagina = getPagina(landing, slug);

  if (imagenId === 'hero') {
    quitarImagenAnterior(pagina.heroImagenUrl);
    pagina.heroImagenUrl = '';
    pagina.heroImagenUrlAbsoluta = '';
  } else {
    const { idx } = findImagen(pagina, imagenId);
    quitarImagenAnterior(pagina.imagenes[idx]?.url);
    pagina.imagenes[idx] = { ...pagina.imagenes[idx], url: '', urlAbsoluta: '' };
  }

  landing.finstruvialServicios.paginas[slug] = pagina;
  await guardarConfigAula({ landing }, usuario);

  return {
    config: { ...aula, landing },
    message: 'Imagen del servicio eliminada.',
  };
}

async function subirVideoServicioFinstruvial(slugRaw, videoIdRaw, file, usuario) {
  const slug = assertSlug(slugRaw);
  const videoId = String(videoIdRaw || '').trim();
  if (!videoId) {
    const err = new Error('ID de video requerido.');
    err.status = 400;
    throw err;
  }

  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing || {}, aula.site?.tema);
  if (!landing.finstruvialServicios?.paginas) {
    const err = new Error('Servicios Finstruvial no configurados.');
    err.status = 400;
    throw err;
  }
  const pagina = getPagina(landing, slug);
  const { idx } = findOrCreateVideo(pagina, videoId);

  const ext = path.extname(file.originalname || '').toLowerCase() || '.mp4';
  const rel = `${UPLOAD_KEY}/${slug}/${videoId}-${Date.now()}${ext}`;
  const abs = resolvePath(rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });

  const prevUrl = pagina.videos[idx]?.url || '';
  quitarArchivoAnterior(prevUrl);
  fs.renameSync(file.path, abs);

  const url = `/uploads/${rel}`;
  const urlAbsoluta = publicUrl(rel);
  pagina.videos[idx] = {
    ...pagina.videos[idx],
    url,
    urlAbsoluta,
  };

  landing.finstruvialServicios.paginas[slug] = pagina;
  await guardarConfigAula({ landing }, usuario);

  return {
    config: { ...aula, landing },
    url,
    urlAbsoluta,
    message: 'Video del servicio actualizado.',
  };
}

async function quitarVideoServicioFinstruvial(slugRaw, videoIdRaw, usuario) {
  const slug = assertSlug(slugRaw);
  const videoId = String(videoIdRaw || '').trim();
  if (!videoId) {
    const err = new Error('ID de video requerido.');
    err.status = 400;
    throw err;
  }

  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing || {}, aula.site?.tema);
  const pagina = getPagina(landing, slug);
  const { idx } = findVideo(pagina, videoId);

  quitarArchivoAnterior(pagina.videos[idx]?.url);
  pagina.videos[idx] = { ...pagina.videos[idx], url: '', urlAbsoluta: '' };

  landing.finstruvialServicios.paginas[slug] = pagina;
  await guardarConfigAula({ landing }, usuario);

  return {
    config: { ...aula, landing },
    message: 'Video del servicio eliminado.',
  };
}

const HUB_IMAGE_SLOTS = {
  hero: {
    urlKey: 'heroImagenUrl',
    absKey: 'heroImagenUrlAbsoluta',
    filePrefix: 'hub-hero',
    messageOk: 'Imagen del portafolio actualizada.',
    messageRemoved: 'Imagen del portafolio eliminada.',
  },
  formacion: {
    urlKey: 'formacionImagenUrl',
    absKey: 'formacionImagenUrlAbsoluta',
    filePrefix: 'hub-formacion-1',
    messageOk: 'Imagen de formación 1 actualizada.',
    messageRemoved: 'Imagen de formación 1 eliminada.',
  },
  formacion2: {
    urlKey: 'formacionImagen2Url',
    absKey: 'formacionImagen2UrlAbsoluta',
    filePrefix: 'hub-formacion-2',
    messageOk: 'Imagen de formación 2 actualizada.',
    messageRemoved: 'Imagen de formación 2 eliminada.',
  },
};

function resolveHubImageSlot(slotRaw) {
  const slot = String(slotRaw || 'hero').trim();
  const cfg = HUB_IMAGE_SLOTS[slot];
  if (!cfg) {
    const err = new Error('Slot de imagen del portafolio no válido.');
    err.status = 400;
    throw err;
  }
  return { slot, cfg };
}

async function subirImagenHubServicios(file, usuario, slotRaw) {
  const { cfg } = resolveHubImageSlot(slotRaw);
  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing || {}, aula.site?.tema);
  const hub = landing.finstruvialServicios?.hub;
  if (!hub) {
    const err = new Error('Hub de servicios no configurado.');
    err.status = 400;
    throw err;
  }

  await optimizarImagenArchivo(file.path, { maxWidth: 1920, maxHeight: 1280 });
  const rel = `${UPLOAD_KEY}/hub/${cfg.filePrefix}-${Date.now()}.webp`;
  const abs = resolvePath(rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.renameSync(file.path, abs);

  quitarImagenAnterior(hub[cfg.urlKey]);
  const url = `/uploads/${rel}`;
  hub[cfg.urlKey] = url;
  hub[cfg.absKey] = publicUrl(rel);

  await guardarConfigAula({ landing }, usuario);
  return {
    config: { ...aula, landing },
    url,
    urlAbsoluta: hub[cfg.absKey],
    message: cfg.messageOk,
  };
}

async function quitarImagenHubServicios(usuario, slotRaw) {
  const { cfg } = resolveHubImageSlot(slotRaw);
  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing || {}, aula.site?.tema);
  const hub = landing.finstruvialServicios?.hub;
  if (!hub) {
    const err = new Error('Hub de servicios no configurado.');
    err.status = 400;
    throw err;
  }
  quitarImagenAnterior(hub[cfg.urlKey]);
  hub[cfg.urlKey] = '';
  hub[cfg.absKey] = '';
  await guardarConfigAula({ landing }, usuario);
  return {
    config: { ...aula, landing },
    message: cfg.messageRemoved,
  };
}

module.exports = {
  VALID_SLUGS,
  subirImagenServicioFinstruvial,
  quitarImagenServicioFinstruvial,
  subirVideoServicioFinstruvial,
  quitarVideoServicioFinstruvial,
  subirImagenHubServicios,
  quitarImagenHubServicios,
};
