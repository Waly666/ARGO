const fs = require('fs');
const path = require('path');

const { mergeLanding } = require('./aulaVirtualPortalLanding');
const { obtenerConfigAula, guardarConfigAula } = require('./aulaVirtualPortal');
const { publicUrl, resolvePath } = require('../middleware/upload');
const { optimizarImagenArchivo } = require('../utils/optimizarImagen');

/** Configuración de imagen de hero por sección del landing. */
const LANDING_HERO_IMAGE_PAGES = {
  blog: {
    label: 'Blog',
    uploadKey: 'aula-virtual-blog-hero',
    multerExport: 'aulaVirtualBlogHero',
    path: ['blog'],
    urlField: 'heroImagenUrl',
    altField: 'heroImagenAlt',
  },
  pqr: {
    label: 'PQR',
    uploadKey: 'aula-virtual-pqr-hero',
    multerExport: 'aulaVirtualPqrHero',
    path: ['pqr', 'hero'],
    urlField: 'imagenUrl',
    altField: 'imagenAlt',
  },
  examenTeorico: {
    label: 'Examen teórico',
    uploadKey: 'aula-virtual-examen-teorico-hero',
    multerExport: 'aulaVirtualExamenTeoricoHero',
    path: ['examenTeorico'],
    urlField: 'heroImagenUrl',
    altField: 'heroImagenAlt',
  },
  jornadasCapacitacion: {
    label: 'Jornadas de capacitación',
    uploadKey: 'aula-virtual-jornadas-hero',
    multerExport: 'aulaVirtualJornadasHero',
    path: ['jornadasCapacitacion', 'hero'],
    urlField: 'imagenUrl',
    altField: 'imagenAlt',
  },
  evaluacionJornadas: {
    label: 'Evaluación de jornadas',
    uploadKey: 'aula-virtual-evaluacion-jornadas-hero',
    multerExport: 'aulaVirtualEvaluacionJornadasHero',
    path: ['evaluacionJornadas', 'hero'],
    urlField: 'imagenUrl',
    altField: 'imagenAlt',
  },
  consultaCertificados: {
    label: 'Consulta certificados',
    uploadKey: 'aula-virtual-consulta-certificados-hero',
    multerExport: 'aulaVirtualConsultaCertificadosHero',
    path: ['consultaCertificados'],
    urlField: 'heroImagenUrl',
    altField: 'heroImagenAlt',
  },
};

function getPageConfig(pageKey) {
  const cfg = LANDING_HERO_IMAGE_PAGES[String(pageKey || '').trim()];
  if (!cfg) {
    const err = new Error('Página de hero no válida.');
    err.status = 400;
    throw err;
  }
  return cfg;
}

function getLandingTarget(landing, cfg) {
  let node = landing;
  for (let i = 0; i < cfg.path.length - 1; i += 1) {
    const key = cfg.path[i];
    node[key] = node[key] && typeof node[key] === 'object' ? { ...node[key] } : {};
    node = node[key];
  }
  const leafKey = cfg.path[cfg.path.length - 1];
  node[leafKey] = node[leafKey] && typeof node[leafKey] === 'object' ? { ...node[leafKey] } : {};
  return { landing, leaf: node[leafKey], leafKey, parent: node };
}

function readHeroImageUrl(landing, cfg) {
  let node = landing;
  for (const key of cfg.path) {
    node = node?.[key];
  }
  return String(node?.[cfg.urlField] || '').trim();
}

function quitarImagenAnterior(imagenUrl, uploadKey) {
  const rel = String(imagenUrl || '').replace(/^\/uploads\//, '').trim();
  if (!rel.startsWith(`${uploadKey}/`)) return;
  const p = resolvePath(rel);
  if (p && fs.existsSync(p)) fs.unlinkSync(p);
}

async function guardarHeroImagenLanding(pageKey, imagenUrl, usuario) {
  const cfg = getPageConfig(pageKey);
  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing);
  const { leaf, leafKey, parent } = getLandingTarget(landing, cfg);
  parent[leafKey] = {
    ...leaf,
    [cfg.urlField]: String(imagenUrl || '').trim(),
  };
  if (!String(imagenUrl || '').trim()) {
    delete parent[leafKey][`${cfg.urlField}Absoluta`];
  }
  await guardarConfigAula({ landing }, usuario);
}

async function subirLandingHeroImagen(pageKey, file, usuario) {
  const cfg = getPageConfig(pageKey);
  if (!file) {
    const err = new Error('Seleccione una imagen (PNG, JPG o WEBP)');
    err.status = 400;
    throw err;
  }

  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing);
  const prevUrl = readHeroImageUrl(landing, cfg);
  quitarImagenAnterior(prevUrl, cfg.uploadKey);

  const filePath = path.join(file.destination, file.filename);
  await optimizarImagenArchivo(filePath, { maxWidth: 1920, maxHeight: 1200 });
  const imagenUrl = publicUrl(cfg.uploadKey, file.filename);
  await guardarHeroImagenLanding(pageKey, imagenUrl, usuario);

  return {
    message: `Imagen del héroe de ${cfg.label} actualizada en el sitio`,
  };
}

async function quitarLandingHeroImagen(pageKey, usuario) {
  const cfg = getPageConfig(pageKey);
  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing);
  const prevUrl = readHeroImageUrl(landing, cfg);
  quitarImagenAnterior(prevUrl, cfg.uploadKey);
  await guardarHeroImagenLanding(pageKey, '', usuario);

  return {
    message: `Imagen del héroe de ${cfg.label} eliminada`,
  };
}

module.exports = {
  LANDING_HERO_IMAGE_PAGES,
  getPageConfig,
  subirLandingHeroImagen,
  quitarLandingHeroImagen,
};
