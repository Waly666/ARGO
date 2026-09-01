/** Catálogo SEO por página del portal (editor del sitio). */

const PORTAL_SEO_PAGE_KEYS = [
  'home',
  'cursos',
  'tienda',
  'acerca',
  'fundacion',
  'consultaCertificados',
  'cursosConduccion',
  'examenTeorico',
  'mercanciasPeligrosas',
  'trabajoEnAlturas',
  'blog',
  'galeria',
  'pqr',
  'jornadasCapacitacion',
  'evaluacionJornadas',
];

function str(v) {
  return String(v ?? '').trim();
}

function normalizarSeoPagina(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    titulo: str(src.titulo),
    descripcion: str(src.descripcion),
    keywords: str(src.keywords),
  };
}

function normalizarSeo(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  for (const key of PORTAL_SEO_PAGE_KEYS) {
    out[key] = normalizarSeoPagina(src[key]);
  }
  return out;
}

module.exports = {
  PORTAL_SEO_PAGE_KEYS,
  normalizarSeo,
};
