const {
  FINSTRUVIAL_SERVICIOS_DEFAULTS,
  mergeFinstruvialServicios,
} = require('./aulaVirtualFinstruvialServiciosDefaults');

const SERVIAL_SERVICIOS_DEFAULTS = require('./aulaVirtualServialServiciosDefaults.json');

const SLUGS = [
  'aulaVirtual',
  'peridata',
  'capacitacionSensibilizacion',
  'estudiosDiagnosticosTecnicos',
  'herramientasEducativasTecnologicas',
  'inventariosViales',
  'planeacionGestionVial',
];

function servialPortafolioMediaOnly(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const paginas = {};
  for (const slug of SLUGS) {
    const p = raw.paginas?.[slug];
    if (!p) continue;
    const imagenes = Array.isArray(p.imagenes)
      ? p.imagenes.filter((img) => img?.url?.trim() || img?.urlAbsoluta?.trim())
      : [];
    const videos = Array.isArray(p.videos)
      ? p.videos.filter((v) => v?.url?.trim() || v?.urlAbsoluta?.trim())
      : [];
    const hasHero = p.heroImagenUrl?.trim() || p.heroImagenUrlAbsoluta?.trim();
    const hasVideo = p.heroVideoYoutubeUrl?.trim();
    if (!imagenes.length && !videos.length && !hasHero && !hasVideo && p.activa === undefined) continue;
    paginas[slug] = {
      activa: p.activa,
      heroImagenUrl: p.heroImagenUrl?.trim() || '',
      heroImagenUrlAbsoluta: p.heroImagenUrlAbsoluta?.trim() || '',
      heroVideoYoutubeUrl: p.heroVideoYoutubeUrl?.trim() || '',
      imagenes,
      videos,
    };
  }
  const hubHero = raw.hub?.heroImagenUrl?.trim() || raw.hub?.heroImagenUrlAbsoluta?.trim();
  return {
    activa: raw.activa,
    hub: hubHero
      ? {
          heroImagenUrl: raw.hub?.heroImagenUrl?.trim() || '',
          heroImagenUrlAbsoluta: raw.hub?.heroImagenUrlAbsoluta?.trim() || '',
        }
      : undefined,
    paginas,
  };
}

function resolvePortalHeroEstilo(tema) {
  const explicit = tema?.heroEstilo;
  if (explicit === 'servial-mesh' || explicit === 'starfield' || explicit === 'educarte-mesh') {
    return explicit;
  }
  const accent = String(tema?.colorAcento || '').toLowerCase();
  const fuente = String(tema?.fuente || '').toLowerCase();
  const primOscuro = String(tema?.colorPrimarioOscuro || '').toLowerCase();
  if (accent === '#33dd6f' && fuente.includes('poppins') && primOscuro === '#0a0a0a') {
    return 'educarte-mesh';
  }
  if (
    ['#ffd200', '#aee929', '#d9d314', '#f5c400'].includes(accent) &&
    (fuente.includes('poppins') || fuente.includes('figtree')) &&
    ['#000000', '#04060c', '#0a0a0a', '#081a33', '#112d4a', '#0b1b47'].includes(primOscuro)
  ) {
    return 'servial-mesh';
  }
  return 'starfield';
}

function portafolioServiciosEsServial(tema) {
  return resolvePortalHeroEstilo(tema) === 'servial-mesh';
}

function portafolioServiciosDefaultsForTema(tema) {
  return portafolioServiciosEsServial(tema) ? SERVIAL_SERVICIOS_DEFAULTS : FINSTRUVIAL_SERVICIOS_DEFAULTS;
}

function mergePortafolioServicios(raw, tema) {
  const base = portafolioServiciosDefaultsForTema(tema);
  const paginasDefaults = base.paginas || {};
  const src = portafolioServiciosEsServial(tema) ? servialPortafolioMediaOnly(raw) : raw;
  return mergeFinstruvialServicios(src, paginasDefaults, base);
}

module.exports = {
  mergePortafolioServicios,
  portafolioServiciosDefaultsForTema,
  portafolioServiciosEsServial,
  resolvePortalHeroEstilo,
  SERVIAL_SERVICIOS_DEFAULTS,
};
