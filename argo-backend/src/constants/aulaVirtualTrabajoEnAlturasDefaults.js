const { TRABAJO_EN_ALTURAS_DOCUMENTOS_GRUPOS } = require('./aulaVirtualTrabajoEnAlturasDocumentos');
const {
  mergePromoHeroPillars,
  mergePromoHeroStats,
  mergePromoHeroTheme,
  PROMO_HERO_PILARES_TA,
} = require('./portalPromoHeroFields');

const landingJson = require('./trabajo-en-alturas-landing.json');
const { promptFotoHorizontal } = require('../utils/portalImagenPrompt');

function str(v, fb) {
  const t = String(v ?? '').trim();
  return t || fb;
}

const TRABAJO_EN_ALTURAS_GUION_VERSION = 1;

const TRABAJO_EN_ALTURAS_SEO_PATCH = {
  guionVersion: TRABAJO_EN_ALTURAS_GUION_VERSION,
  kicker: 'SERVIAL Colombia · Trabajo en alturas · Villavicencio',
  titulo: 'Curso de Trabajo Seguro en Alturas en Villavicencio, Meta',
  tituloLinea2: '',
  subtitulo: 'Resolución 4272 de 2021 · Prevención · SG-SST · Sector transporte',
  heroLead:
    'Capacitación en trabajo seguro en alturas para trabajadores y empresas de Villavicencio, Meta y los Llanos Orientales, conforme a la normativa vigente en Colombia.',
  heroPillarsLabel: 'Contenido del Curso de Trabajo en Alturas',
  ctaInicioTexto: 'Información del curso de trabajo en alturas',
  introAudienciaTitulo: '¿Quién debe realizar el Curso de Trabajo en Alturas?',
  normativaTitulo: 'Normativa de Trabajo en Alturas en Colombia',
  modulosTitulo: 'Contenido del Curso de Trabajo en Alturas — 20 módulos',
  localTitulo: 'Curso de Trabajo en Alturas en Villavicencio, Meta',
  localTexto:
    'SERVIAL Colombia brinda capacitación en trabajo seguro en alturas para trabajadores, contratistas y empresas de Villavicencio, Meta y los Llanos Orientales.',
  homeItems: [
    {
      numero: 1,
      icon: 'document',
      acento: 'purple',
      titulo: 'Resolución 4272 de 2021',
      texto: 'Altura mínima 2,0 m, requisitos del Trabajador Autorizado y vigencia de certificación de 3 años.',
    },
    {
      numero: 2,
      icon: 'shield-check',
      acento: 'blue',
      titulo: 'Obligaciones SG-SST',
      texto: 'Responsabilidades del empleador y del trabajador en prevención, capacitación y uso de EPI.',
    },
    {
      numero: 3,
      icon: 'download',
      acento: 'teal',
      titulo: 'Normativa descargable',
      texto: 'Resolución 4272, Ley 1562 de 2012 y manual técnico de referencia en PDF.',
    },
  ],
};

const TRABAJO_EN_ALTURAS_HERO_DEFAULTS = {
  heroPillarsLabel: 'Contenido del Curso de Trabajo en Alturas',
  heroPillars: PROMO_HERO_PILARES_TA,
  heroStats: ['Res. 4272 de 2021', '2,0 m'],
  backLabel: '← Volver al inicio',
  theme: 'violet',
  mostrarBadgeVirtual: true,
  virtualBadgeLabel: 'VIRTUAL',
};

const TRABAJO_EN_ALTURAS_IMAGENES = [
  {
    id: 'hero',
    etiqueta: 'Imagen principal',
    url: '',
    alt: 'Trabajador en alturas sector transporte',
    promptImagen: promptFotoHorizontal(
      'Trabajador autorizado con arnés en la parte superior de un camión de carga en patio logístico del sector transporte.',
    ),
  },
  {
    id: 'intro',
    etiqueta: 'Sección introducción',
    url: '',
    alt: 'Operaciones en altura sector transportador',
    promptImagen: promptFotoHorizontal(
      'Operario realizando cargue en altura con medidas de seguridad, escalera o plataforma, en entorno de transporte de carga.',
    ),
  },
  {
    id: 'normativa',
    etiqueta: 'Sección normativa',
    url: '',
    alt: 'Marco jurídico trabajo en alturas',
    promptImagen: promptFotoHorizontal(
      'Ambiente profesional con documentos de seguridad laboral y elementos de cumplimiento normativo en oficina técnica.',
    ),
  },
  {
    id: 'epi',
    etiqueta: 'Sección EPI',
    url: '',
    alt: 'Equipo de protección individual',
    promptImagen: promptFotoHorizontal(
      'Primer plano de arnés, casco, línea de vida y otros equipos de protección individual bien colocados; trabajador listo para operar en altura.',
    ),
  },
];

const TRABAJO_EN_ALTURAS_DEFAULTS = {
  ...landingJson,
  ...TRABAJO_EN_ALTURAS_SEO_PATCH,
  ...TRABAJO_EN_ALTURAS_HERO_DEFAULTS,
  imagenes: TRABAJO_EN_ALTURAS_IMAGENES,
  documentosGrupos: JSON.parse(JSON.stringify(TRABAJO_EN_ALTURAS_DOCUMENTOS_GRUPOS)),
};

function trabajoEnAlturasNecesitaActualizarGuion(src) {
  const v = Number(src.guionVersion) || 0;
  if (v < TRABAJO_EN_ALTURAS_GUION_VERSION) return true;
  const titulo = String(src.titulo || '').trim();
  if (titulo === 'Trabajo Seguro') return true;
  if (/gamificad|20 módulos gamificados|ruleta de 15 retos/i.test(String(src.heroLead || ''))) return true;
  return String(src.normativaTitulo || '').trim() === 'Marco normativo colombiano';
}

function mergeTrabajoEnAlturasPreservandoUsuario(src, d) {
  const enlaceCursoUrl = String(src.enlaceCursoUrl ?? '').trim();
  return {
    ...JSON.parse(JSON.stringify(d)),
    guionVersion: TRABAJO_EN_ALTURAS_GUION_VERSION,
    enlaceCursoUrl,
    imagenes: mergeImagenes(src.imagenes, d.imagenes),
  };
}

function mergeImagenes(raw, fb) {
  const src = Array.isArray(raw) ? raw : [];
  return fb.map((item, i) => {
    const r = src.find((x) => x.id === item.id) || src[i];
    return {
      id: item.id,
      etiqueta: r?.etiqueta?.trim() || item.etiqueta,
      url: r?.url?.trim() || item.url,
      urlAbsoluta: r?.urlAbsoluta?.trim() || item.urlAbsoluta,
      alt: r?.alt?.trim() || item.alt,
      promptImagen: str(r?.promptImagen, item.promptImagen),
    };
  });
}

function mergeTrabajoEnAlturasLanding(raw) {
  const d = TRABAJO_EN_ALTURAS_DEFAULTS;
  const src = raw && typeof raw === 'object' ? raw : {};
  if (trabajoEnAlturasNecesitaActualizarGuion(src)) {
    return mergeTrabajoEnAlturasPreservandoUsuario(src, d);
  }
  const str = (v, fb) => String(v ?? fb).trim() || fb;
  const arr = (v, fb) => (Array.isArray(v) && v.length ? v : fb);

  return {
    ...d,
    guionVersion: TRABAJO_EN_ALTURAS_GUION_VERSION,
    kicker: str(src.kicker, d.kicker),
    titulo: str(src.titulo, d.titulo),
    tituloLinea2: str(src.tituloLinea2, d.tituloLinea2),
    subtitulo: str(src.subtitulo, d.subtitulo),
    heroLead: str(src.heroLead, d.heroLead),
    heroParrafos: arr(src.heroParrafos, d.heroParrafos),
    heroPillarsLabel: str(src.heroPillarsLabel, d.heroPillarsLabel),
    heroPillars: mergePromoHeroPillars(src.heroPillars, d.heroPillars),
    heroStats: mergePromoHeroStats(src.heroStats, d.heroStats),
    backLabel: str(src.backLabel, d.backLabel),
    theme: mergePromoHeroTheme(src.theme, d.theme),
    mostrarBadgeVirtual: src.mostrarBadgeVirtual !== false,
    virtualBadgeLabel: str(src.virtualBadgeLabel, d.virtualBadgeLabel),
    enlaceCursoUrl: str(src.enlaceCursoUrl, d.enlaceCursoUrl),
    enlaceCursoEtiqueta: str(src.enlaceCursoEtiqueta, d.enlaceCursoEtiqueta),
    ctaNormativaTexto: str(src.ctaNormativaTexto, d.ctaNormativaTexto),
    ctaDocumentosTexto: str(src.ctaDocumentosTexto, d.ctaDocumentosTexto),
    ctaFaqTexto: str(src.ctaFaqTexto, d.ctaFaqTexto),
    ctaInicioTexto: str(src.ctaInicioTexto, d.ctaInicioTexto),
    ctaUrl: str(src.ctaUrl, d.ctaUrl) || d.ctaUrl,
    homeItems: arr(src.homeItems, d.homeItems),
    fechaActualizacion: str(src.fechaActualizacion, d.fechaActualizacion),
    fraseFinal: str(src.fraseFinal, d.fraseFinal),
    disclaimer: str(src.disclaimer, d.disclaimer),
    nav: arr(src.nav, d.nav),
    imagenes: mergeImagenes(src.imagenes, d.imagenes),
    introTitulo: str(src.introTitulo, d.introTitulo),
    introTexto: str(src.introTexto, d.introTexto),
    introRiesgos: arr(src.introRiesgos, d.introRiesgos),
    introAudiencia: arr(src.introAudiencia, d.introAudiencia),
    introAudienciaTitulo: str(src.introAudienciaTitulo, d.introAudienciaTitulo),
    objetivosTitulo: str(src.objetivosTitulo, d.objetivosTitulo),
    objetivoGeneral: str(src.objetivoGeneral, d.objetivoGeneral),
    objetivosEspecificos: arr(src.objetivosEspecificos, d.objetivosEspecificos),
    normativaTitulo: str(src.normativaTitulo, d.normativaTitulo),
    normativaLead: str(src.normativaLead, d.normativaLead),
    normativaDestacados: arr(src.normativaDestacados, d.normativaDestacados),
    normativaAspectos: arr(src.normativaAspectos, d.normativaAspectos),
    normativaResolucionTitulo: str(src.normativaResolucionTitulo, d.normativaResolucionTitulo),
    normativaResolucionTexto: str(src.normativaResolucionTexto, d.normativaResolucionTexto),
    normativaArticulos: arr(src.normativaArticulos, d.normativaArticulos),
    responsabilidadesEmpleador: arr(src.responsabilidadesEmpleador, d.responsabilidadesEmpleador),
    responsabilidadesTrabajador: arr(src.responsabilidadesTrabajador, d.responsabilidadesTrabajador),
    sectorTitulo: str(src.sectorTitulo, d.sectorTitulo),
    sectorLead: str(src.sectorLead, d.sectorLead),
    sectorOperaciones: arr(src.sectorOperaciones, d.sectorOperaciones),
    modulosTitulo: str(src.modulosTitulo, d.modulosTitulo),
    modulosLead: str(src.modulosLead, d.modulosLead),
    modulos: arr(src.modulos, d.modulos),
    tresCTitulo: str(src.tresCTitulo, d.tresCTitulo),
    tresCLead: str(src.tresCLead, d.tresCLead),
    tresCItems: arr(src.tresCItems, d.tresCItems),
    metodologiaTitulo: str(src.metodologiaTitulo, d.metodologiaTitulo),
    metodologiaLead: str(src.metodologiaLead, d.metodologiaLead),
    metodologiaItems: arr(src.metodologiaItems, d.metodologiaItems),
    evaluacionTitulo: str(src.evaluacionTitulo, d.evaluacionTitulo),
    evaluacionLead: str(src.evaluacionLead, d.evaluacionLead),
    evaluacionDetalles: arr(src.evaluacionDetalles, d.evaluacionDetalles),
    documentosTitulo: str(src.documentosTitulo, d.documentosTitulo),
    documentosLead: str(src.documentosLead, d.documentosLead),
    documentosGrupos: arr(src.documentosGrupos, d.documentosGrupos),
    localTitulo: str(src.localTitulo, d.localTitulo),
    localTexto: str(src.localTexto, d.localTexto),
    faq: arr(src.faq, d.faq),
  };
}

module.exports = {
  TRABAJO_EN_ALTURAS_DEFAULTS,
  mergeTrabajoEnAlturasLanding,
  trabajoEnAlturasNecesitaActualizarGuion,
};
