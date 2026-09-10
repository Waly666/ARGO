const SLUGS = [

  'aulaVirtual',

  'peridata',

  'capacitacionSensibilizacion',

  'estudiosDiagnosticosTecnicos',

  'herramientasEducativasTecnologicas',

  'inventariosViales',

  'planeacionGestionVial',

];



const FINSTRUVIAL_SERVICIO_MENU_LABELS = {

  aulaVirtual: 'Aula Virtual y Formación',

  peridata: 'Análisis de Siniestralidad – PERIDATA',

  capacitacionSensibilizacion: 'Capacitación y Sensibilización',

  estudiosDiagnosticosTecnicos: 'Estudios y Diagnósticos Técnicos',

  herramientasEducativasTecnologicas: 'Herramientas Educativas y Tecnológicas',

  inventariosViales: 'Inventarios Viales',

  planeacionGestionVial: 'Planeación y Gestión Vial',

};



const FINSTRUVIAL_SERVICIOS_DEFAULTS = {

  activa: true,

  menuLabel: 'Nuestros Servicios',

  hub: {

    kicker: 'Portafolio institucional',

    tituloLinea: 'Servicios de',

    tituloAcento: 'FINSTRUVIAL',

    lead:

      'Consultoría, asesoría, investigación, planeación, estudios técnicos, formación y desarrollo tecnológico en tránsito, transporte, movilidad y seguridad vial.',

    gridTitulo: 'Líneas de servicio',

    gridLead:

      'Consultoría técnica, planeación, tecnología y formación en tránsito, transporte, movilidad y seguridad vial.',

    heroImagenUrl: '',

    heroImagenAlt: 'Portafolio de servicios FINSTRUVIAL',

  },

  paginas: {},

};



function str(val, fallback = '') {

  return String(val ?? '').trim() || fallback;

}



function arr(val, fallback) {

  return Array.isArray(val) && val.length ? val : fallback;

}



const FINSTRUVIAL_SERVICIO_ROUTE_SEGMENT_DEFAULT = {

  aulaVirtual: 'aula-virtual',

  peridata: 'peridata',

  capacitacionSensibilizacion: 'capacitacion-sensibilizacion',

  estudiosDiagnosticosTecnicos: 'estudios-diagnosticos-tecnicos',

  herramientasEducativasTecnologicas: 'herramientas-educativas-tecnologicas',

  inventariosViales: 'inventarios-viales',

  planeacionGestionVial: 'planeacion-gestion-vial',

};



function defaultRouteSegment(slug) {

  return FINSTRUVIAL_SERVICIO_ROUTE_SEGMENT_DEFAULT[slug] || slug;

}



function normalizeRouteSegment(raw) {

  return String(raw ?? '')

    .trim()

    .toLowerCase()

    .normalize('NFD')

    .replace(/[\u0300-\u036f]/g, '')

    .replace(/[^a-z0-9]+/g, '-')

    .replace(/^-+|-+$/g, '');

}



function routeSegmentFrom(slug, routeSegment) {

  const custom = normalizeRouteSegment(routeSegment);

  return custom || defaultRouteSegment(slug);

}

const ESTILO_WIREFRAME_POR_SLUG = {
  aulaVirtual: 'academy',
  peridata: 'tech',
  inventariosViales: 'tech',
  herramientasEducativasTecnologicas: 'tech',
};

function resolveEstilo(slug, srcEstilo, defaultEstilo) {
  const fromSrc = String(srcEstilo ?? '').trim();
  if (fromSrc && fromSrc !== 'default') return fromSrc;
  return ESTILO_WIREFRAME_POR_SLUG[slug] || defaultEstilo || 'default';
}



function mergePagina(slug, raw, defaults) {

  const d = defaults || {

    slug,

    activa: true,

    menuLabel: FINSTRUVIAL_SERVICIO_MENU_LABELS[slug] || slug,

    routeSegment: defaultRouteSegment(slug),

    kicker: '',

    tituloLinea: '',

    tituloAcento: '',

    lead: '',

    heroParrafos: [],

    theme: 'blue',

    mostrarBadgeVirtual: false,

    heroImagenUrl: '',

    heroImagenAlt: '',

    heroVideoYoutubeUrl: '',

    ctaPrincipal: 'Solicitar información',

    ctaPrincipalUrl: '/acerca#contacto',

    ctaSecundario: 'Ver todos los servicios',

    ctaSecundarioUrl: '/servicios',

    hubIcon: '🛣️',

    hubLead: '',

    introKicker: '',

    introTitulo: '',

    introLead: '',

    introParrafos: [],

    introMedios: [],

    estilo: 'default',

    bloquesKicker: '',

    bloquesTitulo: '',

    bloques: [],

    metodologiaKicker: '',

    metodologiaTitulo: '',

    metodologiaLead: '',

    metodologiaPasos: [],

    resultadoKicker: '',

    resultadoTitulo: '',

    resultadoIconos: [],

    flujoVertical: [],

    flujoTecnologico: [],

    sistemaSeguroCentro: '',

    sistemaSeguroItems: [],

    sistemaSeguroLead: '',

    publicos: [],

    experiencias: [],

    mensajeTitulo: '',

    mensajeSubtitulo: '',

    dashboardFiltros: [],

    dashboardStats: [],

    preguntas: [],

    ecosistemaCentro: '',

    ecosistemaKicker: '',

    ecosistemaTitulo: '',

    ecosistemaItems: [],

    gamificacionKicker: '',

    gamificacionTitulo: '',

    gamificacionItems: [],

    formulaAprendizaje: '',

    pilaresEducativos: [],

    rutaAprendizaje: [],

    experienciaItems: [],

    experienciaSeccionKicker: '',

    experienciaSeccionTitulo: '',

    usarCatalogoCursos: false,

    modulosPlataformaKicker: '',

    modulosPlataformaTitulo: '',

    modulosPlataformaLead: '',

    guiasPlataformaKicker: '',

    guiasPlataformaTitulo: '',

    guiasPlataformaLead: '',

    guiasPlataforma: [],

    modulosPlataforma: [],

    cierreQuote: '',

    listaServicios: [],

    listaTitulo: 'Servicios principales',

    productoKicker: 'Solución tecnológica',

    productoNombre: '',

    productoLead: '',

    productoParrafos: [],

    productoEtiquetas: [],

    productoMedios: [],

    productoVideoYoutubeUrl: '',

    productoImagenId: '',

    ctaTitulo: '¿Necesita este servicio?',

    ctaLead:

      'Contáctenos para una asesoría técnica o una propuesta a la medida de su entidad u organización.',

    ctaBtnPrincipal: 'Solicitar información',

    ctaBtnSecundario: 'Ver todos los servicios',

    tarjetaCta: 'Conocer más',

    imagenes: [],

    videos: [],

    metaDescription: '',

  };

  const src = raw && typeof raw === 'object' ? raw : {};

  return {

    ...d,

    slug,

    activa: src.activa !== false && d.activa !== false,

    menuLabel: str(src.menuLabel, d.menuLabel),

    routeSegment: routeSegmentFrom(slug, str(src.routeSegment, d.routeSegment)),

    kicker: str(src.kicker, d.kicker),

    tituloLinea: str(src.tituloLinea, d.tituloLinea),

    tituloAcento: str(src.tituloAcento, d.tituloAcento),

    lead: str(src.lead, d.lead),

    heroParrafos: arr(src.heroParrafos, d.heroParrafos),

    theme: src.theme || d.theme,

    mostrarBadgeVirtual: src.mostrarBadgeVirtual === true,

    heroImagenUrl: str(src.heroImagenUrl, d.heroImagenUrl),

    heroImagenUrlAbsoluta: src.heroImagenUrlAbsoluta?.trim() || d.heroImagenUrlAbsoluta,

    heroImagenAlt: str(src.heroImagenAlt, d.heroImagenAlt),

    heroImagenPrompt: str(src.heroImagenPrompt, d.heroImagenPrompt),

    heroVideoYoutubeUrl: str(src.heroVideoYoutubeUrl, d.heroVideoYoutubeUrl),

    ctaPrincipal: str(src.ctaPrincipal, d.ctaPrincipal),

    ctaPrincipalUrl: str(src.ctaPrincipalUrl, d.ctaPrincipalUrl),

    ctaSecundario: str(src.ctaSecundario, d.ctaSecundario),

    ctaSecundarioUrl: str(src.ctaSecundarioUrl, d.ctaSecundarioUrl),

    hubIcon: str(src.hubIcon, d.hubIcon),

    hubLead: str(src.hubLead, d.hubLead),

    introKicker: str(src.introKicker, d.introKicker),

    introTitulo: str(src.introTitulo, d.introTitulo),

    introLead: str(src.introLead, d.introLead),

    introParrafos: arr(src.introParrafos, d.introParrafos),

    introMedios: arr(src.introMedios, d.introMedios),

    estilo: resolveEstilo(slug, src.estilo, d.estilo),

    bloquesKicker: str(src.bloquesKicker, d.bloquesKicker),

    bloquesTitulo: str(src.bloquesTitulo, d.bloquesTitulo),

    bloques: arr(src.bloques, d.bloques),

    metodologiaKicker: str(src.metodologiaKicker, d.metodologiaKicker),

    metodologiaTitulo: str(src.metodologiaTitulo, d.metodologiaTitulo),

    metodologiaLead: str(src.metodologiaLead, d.metodologiaLead),

    metodologiaPasos: arr(src.metodologiaPasos, d.metodologiaPasos),

    resultadoKicker: str(src.resultadoKicker, d.resultadoKicker),

    resultadoTitulo: str(src.resultadoTitulo, d.resultadoTitulo),

    resultadoIconos: arr(src.resultadoIconos, d.resultadoIconos),

    flujoVertical: arr(src.flujoVertical, d.flujoVertical),

    flujoTecnologico: arr(src.flujoTecnologico, d.flujoTecnologico),

    sistemaSeguroCentro: str(src.sistemaSeguroCentro, d.sistemaSeguroCentro),

    sistemaSeguroItems: arr(src.sistemaSeguroItems, d.sistemaSeguroItems),

    sistemaSeguroLead: str(src.sistemaSeguroLead, d.sistemaSeguroLead),

    publicos: arr(src.publicos, d.publicos),

    experiencias: arr(src.experiencias, d.experiencias),

    mensajeTitulo: str(src.mensajeTitulo, d.mensajeTitulo),

    mensajeSubtitulo: str(src.mensajeSubtitulo, d.mensajeSubtitulo),

    dashboardFiltros: arr(src.dashboardFiltros, d.dashboardFiltros),

    dashboardStats: arr(src.dashboardStats, d.dashboardStats),

    preguntas: arr(src.preguntas, d.preguntas),

    ecosistemaCentro: str(src.ecosistemaCentro, d.ecosistemaCentro),

    ecosistemaKicker: str(src.ecosistemaKicker, d.ecosistemaKicker),

    ecosistemaTitulo: str(src.ecosistemaTitulo, d.ecosistemaTitulo),

    ecosistemaItems: arr(src.ecosistemaItems, d.ecosistemaItems),

    gamificacionKicker: str(src.gamificacionKicker, d.gamificacionKicker),

    gamificacionTitulo: str(src.gamificacionTitulo, d.gamificacionTitulo),

    gamificacionItems: arr(src.gamificacionItems, d.gamificacionItems),

    formulaAprendizaje: str(src.formulaAprendizaje, d.formulaAprendizaje),

    pilaresEducativos: arr(src.pilaresEducativos, d.pilaresEducativos),

    rutaAprendizaje: arr(src.rutaAprendizaje, d.rutaAprendizaje),

    experienciaItems: arr(src.experienciaItems, d.experienciaItems),

    experienciaSeccionKicker: str(src.experienciaSeccionKicker, d.experienciaSeccionKicker),

    experienciaSeccionTitulo: str(src.experienciaSeccionTitulo, d.experienciaSeccionTitulo),

    usarCatalogoCursos:
      slug === 'aulaVirtual'
        ? true
        : src.usarCatalogoCursos !== undefined
          ? src.usarCatalogoCursos === true
          : d.usarCatalogoCursos === true,

    modulosPlataformaKicker: str(src.modulosPlataformaKicker, d.modulosPlataformaKicker),

    modulosPlataformaTitulo: str(src.modulosPlataformaTitulo, d.modulosPlataformaTitulo),

    modulosPlataformaLead: str(src.modulosPlataformaLead, d.modulosPlataformaLead),

    guiasPlataformaKicker: str(src.guiasPlataformaKicker, d.guiasPlataformaKicker),

    guiasPlataformaTitulo: str(src.guiasPlataformaTitulo, d.guiasPlataformaTitulo),

    guiasPlataformaLead: str(src.guiasPlataformaLead, d.guiasPlataformaLead),

    guiasPlataforma: arr(src.guiasPlataforma, d.guiasPlataforma),

    modulosPlataforma: arr(src.modulosPlataforma, d.modulosPlataforma),

    cierreQuote: str(src.cierreQuote, d.cierreQuote),

    listaServicios: arr(src.listaServicios, d.listaServicios),

    listaTitulo: str(src.listaTitulo, d.listaTitulo),

    productoKicker: str(src.productoKicker, d.productoKicker),

    productoNombre: str(src.productoNombre, d.productoNombre),

    productoLead: str(src.productoLead, d.productoLead),

    productoParrafos: arr(src.productoParrafos, d.productoParrafos),

    productoEtiquetas: arr(src.productoEtiquetas, d.productoEtiquetas),

    productoMedios: arr(src.productoMedios, d.productoMedios),

    productoVideoYoutubeUrl: str(src.productoVideoYoutubeUrl, d.productoVideoYoutubeUrl),

    productoImagenId: str(src.productoImagenId, d.productoImagenId),

    ctaTitulo: str(src.ctaTitulo, d.ctaTitulo),

    ctaLead: str(src.ctaLead, d.ctaLead),

    ctaBtnPrincipal: str(src.ctaBtnPrincipal, d.ctaBtnPrincipal),

    ctaBtnSecundario: str(src.ctaBtnSecundario, d.ctaBtnSecundario),

    tarjetaCta: str(src.tarjetaCta, d.tarjetaCta),

    imagenes: arr(src.imagenes, d.imagenes),

    videos: arr(src.videos, d.videos),

    metaDescription: str(src.metaDescription, d.metaDescription),

  };

}



function mergeFinstruvialServicios(raw, paginasDefaults = {}, configDefaults = FINSTRUVIAL_SERVICIOS_DEFAULTS) {

  const d = configDefaults;

  const src = raw && typeof raw === 'object' ? raw : {};

  const paginas = {};

  for (const slug of SLUGS) {

    paginas[slug] = mergePagina(slug, src.paginas?.[slug], paginasDefaults[slug]);

  }

  return {

    activa: src.activa !== false && d.activa !== false,

    menuLabel: str(src.menuLabel, d.menuLabel),

    hub: {

      ...d.hub,

      ...(src.hub || {}),

      kicker: str(src.hub?.kicker, d.hub.kicker),

      tituloLinea: str(src.hub?.tituloLinea, d.hub.tituloLinea),

      tituloAcento: str(src.hub?.tituloAcento, d.hub.tituloAcento),

      lead: str(src.hub?.lead, d.hub.lead),

      gridTitulo: str(src.hub?.gridTitulo, d.hub.gridTitulo),

      gridLead: str(src.hub?.gridLead, d.hub.gridLead),

      heroImagenUrl: str(src.hub?.heroImagenUrl, d.hub.heroImagenUrl),

      heroImagenUrlAbsoluta: src.hub?.heroImagenUrlAbsoluta?.trim() || d.hub.heroImagenUrlAbsoluta,

      heroImagenAlt: str(src.hub?.heroImagenAlt, d.hub.heroImagenAlt),

      heroImagenPrompt: str(src.hub?.heroImagenPrompt, d.hub.heroImagenPrompt),

      guionVersion: Number(src.hub?.guionVersion) || Number(d.hub.guionVersion) || 0,

      seoTextoTitulo: str(src.hub?.seoTextoTitulo, d.hub.seoTextoTitulo || ''),

      seoTextoParrafos: Array.isArray(src.hub?.seoTextoParrafos) && src.hub.seoTextoParrafos.length
        ? src.hub.seoTextoParrafos
        : d.hub.seoTextoParrafos || [],

      localTitulo: str(src.hub?.localTitulo, d.hub.localTitulo || ''),

      localTexto: str(src.hub?.localTexto, d.hub.localTexto || ''),

      localDireccion: str(src.hub?.localDireccion, d.hub.localDireccion || ''),

      localTelefono: str(src.hub?.localTelefono, d.hub.localTelefono || ''),

      localEmail: str(src.hub?.localEmail, d.hub.localEmail || ''),

      faqTitulo: str(src.hub?.faqTitulo, d.hub.faqTitulo || 'Preguntas frecuentes'),

      faq: Array.isArray(src.hub?.faq) && src.hub.faq.length ? src.hub.faq : d.hub.faq || [],

      tarjetas: Array.isArray(src.hub?.tarjetas) && src.hub.tarjetas.length
        ? src.hub.tarjetas
        : d.hub.tarjetas || [],

      heroStats: Array.isArray(src.hub?.heroStats) && src.hub.heroStats.length
        ? src.hub.heroStats
        : d.hub.heroStats || [],

      formacionImagenUrl: str(src.hub?.formacionImagenUrl, d.hub.formacionImagenUrl || ''),

      formacionImagenUrlAbsoluta: src.hub?.formacionImagenUrlAbsoluta?.trim() || d.hub.formacionImagenUrlAbsoluta,

      formacionImagenAlt: str(src.hub?.formacionImagenAlt, d.hub.formacionImagenAlt || ''),

      formacionImagen2Url: str(src.hub?.formacionImagen2Url, d.hub.formacionImagen2Url || ''),

      formacionImagen2UrlAbsoluta: src.hub?.formacionImagen2UrlAbsoluta?.trim() || d.hub.formacionImagen2UrlAbsoluta,

      formacionImagen2Alt: str(src.hub?.formacionImagen2Alt, d.hub.formacionImagen2Alt || ''),

    },

    paginas,

  };

}



module.exports = {

  SLUGS,

  FINSTRUVIAL_SERVICIO_MENU_LABELS,

  FINSTRUVIAL_SERVICIOS_DEFAULTS,

  mergeFinstruvialServicios,

};


