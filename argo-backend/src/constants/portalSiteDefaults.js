/** Configuración visual y estructural del portal (constructor de sitio). */

const HOME_SECCIONES_ORDEN = [
  'instBar',
  'hero',
  'publicidadInicio',
  'infoCards',
  'ofertas',
  'beneficios',
  'licencias',
  'examenTeorico',
  'mercanciasPeligrosas',
  'trabajoEnAlturas',
  'quoteBand',
  'fotosInicio',
  'serviciosEmpresa',
  'carreras',
  'cursosVirtuales',
  'valores',
  'pasos',
  'appMobile',
  'testimonios',
  'faq',
  'pilares',
];

const HOME_SECCIONES_LABELS = {
  instBar: 'Barra institucional',
  hero: 'Banner principal (hero)',
  publicidadInicio: 'Carrusel de publicidad',
  infoCards: 'Tarjetas de contacto',
  ofertas: 'Qué ofrecemos',
  beneficios: 'Beneficios',
  licencias: 'Licencias de conducción',
  examenTeorico: 'Examen teórico (normatividad)',
  mercanciasPeligrosas: 'Mercancías peligrosas',
  trabajoEnAlturas: 'Trabajo en alturas',
  quoteBand: 'Frase destacada',
  fotosInicio: 'Fotos destacadas del inicio',
  serviciosEmpresa: 'Servicios para empresas',
  testimonios: 'Testimonios',
  valores: 'Valores / Somos tu mejor opción',
  cursosVirtuales: 'Cursos virtuales (catálogo)',
  carreras: 'Carreras técnicas',
  pasos: 'Cómo funciona',
  appMobile: 'App Mobile',
  faq: 'Preguntas frecuentes',
  pilares: 'Capacitación y campañas',
};

function paginasDefault(nav = {}) {
  return {
    home: { activa: true, etiquetaMenu: nav.home || 'Inicio', ruta: '/' },
    tienda: { activa: true, etiquetaMenu: nav.tienda || 'Tienda', ruta: '/tienda' },
    cursos: { activa: true, etiquetaMenu: nav.cursos || 'Cursos', ruta: '/cursos' },
    aula: { activa: true, etiquetaMenu: nav.aula || 'Aula virtual', ruta: '/aula' },
    fundacion: { activa: true, etiquetaMenu: nav.fundacion || 'CEA', ruta: '/fundacion' },
    consultaCertificados: {
      activa: true,
      etiquetaMenu: nav.consultaCertificados || 'Certificados',
      ruta: '/consulta-certificados',
    },
    cursosConduccion: {
      activa: true,
      etiquetaMenu: nav.cursosConduccion || 'Cursos conducción',
      ruta: '/cursos-conduccion',
    },
    blog: { activa: true, etiquetaMenu: nav.blog || 'Blog', ruta: '/blog' },
    galeria: { activa: true, etiquetaMenu: nav.galeria || 'Galería', ruta: '/galeria' },
    acerca: { activa: true, etiquetaMenu: nav.acerca || 'Acerca de', ruta: '/acerca' },
  };
}

/** Nombre por defecto del desarrollador del sistema (pie de página del portal). */
const DESARROLLADOR_SISTEMA_DEFAULT = 'Walter Alexander Aguilar';

const SITE_DEFAULTS = {
  tema: {
    colorPrimario: '#3b82f6',
    colorPrimarioOscuro: '#1d4ed8',
    colorAcento: '#22d3ee',
    colorFondo: '#0b1224',
    colorSuperficie: '#121c33',
    colorTexto: '#eef3ff',
    colorTextoSecundario: '#9fb0d0',
    fuente: 'Plus Jakarta Sans',
    fuenteTitulos: '',
    urlHero: '',
    heroEstilo: 'starfield',
  },
  marca: {
    /** Texto al lado del logo en el menú superior (independiente del nombre largo / franja naranja). */
    textoJuntoLogo: '',
    textoCopyright: '',
    ocultarMarcaDesarrollador: true,
    textoPieDesarrollador: '',
  },
  home: {
    orden: [...HOME_SECCIONES_ORDEN],
    secciones: Object.fromEntries(HOME_SECCIONES_ORDEN.map((k) => [k, true])),
  },
};

module.exports = {
  DESARROLLADOR_SISTEMA_DEFAULT,
  SITE_DEFAULTS,
  HOME_SECCIONES_ORDEN,
  HOME_SECCIONES_LABELS,
  paginasDefault,
};
