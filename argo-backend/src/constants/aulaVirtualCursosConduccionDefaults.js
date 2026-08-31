const { PROMO_HERO_PILARES_INSTITUCION } = require('./portalPromoHeroFields');

/** Contenido por defecto de la página Cursos conducción del portal. */

const INVITACION_DEFAULTS = {
  kicker: 'Tu libertad al volante',
  titulo: '¡Da el primer paso hacia tu libertad!',
  lead:
    'Aprender a conducir no es solo obtener una licencia: es ganar independencia, confianza y nuevas oportunidades para moverte con seguridad.',
  institucion:
    'Te acompañamos para que aprendas a conducir de manera responsable, segura y con la preparación que necesitas ante el Ministerio de Transporte.',
  beneficios: [
    {
      icon: '💪',
      titulo: 'Confianza',
      texto: 'Avanza con instructores certificados y un plan de formación claro.',
    },
    {
      icon: '🛣️',
      titulo: 'Independencia',
      texto: 'Muévete con autonomía en la ciudad, el trabajo y tu día a día.',
    },
    {
      icon: '🚦',
      titulo: 'Seguridad vial',
      texto: 'Conduce con criterio, respeto por la norma y buenas prácticas.',
    },
  ],
  destacado: '¡No dejes para después lo que puede abrirte nuevas puertas hoy!',
  cierre: 'Inscríbete a tu curso de conducción y empieza a construir el camino hacia tu licencia.',
  firma: '¡Tu camino comienza aquí!',
  btnCursos: 'Ver cursos disponibles',
  btnRegistro: 'Crear cuenta gratis',
};

/** Espejo de LANDING_DEFAULTS.licencias (inline para evitar dependencia circular). */
const LICENCIAS_DEFAULTS = {
  kicker: 'Trámites y certificaciones',
  titulo: 'Elige tu licencia',
  lead: 'A continuación las licencias que puedes solicitar con nosotros',
  items: [
    {
      icon: '🏍️',
      codigo: 'A2',
      titulo: 'Categoría A2',
      incluye: [
        '25 Horas Teoría',
        '3 Horas Práctica en Taller',
        '15 Horas Práctica en Conducción',
        'Certificado escuela de conducción',
        'Examen médico',
        'Trámites y costos RUNT',
      ],
      licenciaLabel: 'Licencia A2',
      valor: 'Consulte valor en sede',
      btnTexto: 'Solicitar ahora',
      btnUrl: '/registro',
      destacada: false,
    },
    {
      icon: '🚗',
      codigo: 'B1',
      titulo: 'Categoría B1',
      incluye: [
        '25 Horas Teoría',
        '5 Horas Práctica en Taller',
        '20 Horas Práctica en Conducción',
        'Certificado escuela de conducción',
        'Examen médico',
        'Trámites y costos RUNT',
      ],
      licenciaLabel: 'Licencia B1',
      valor: 'Consulte valor en sede',
      btnTexto: 'Solicitar ahora',
      btnUrl: '/registro',
      destacada: false,
    },
    {
      icon: '🚌',
      codigo: 'C1',
      titulo: 'Categoría C1',
      incluye: [
        '30 Horas Teoría',
        '5 Horas Práctica en Taller',
        '30 Horas Práctica en Conducción',
        'Certificado escuela de conducción',
        'Examen médico',
        'Trámites y costos RUNT',
      ],
      licenciaLabel: 'Licencia C1',
      valor: 'Consulte valor en sede',
      btnTexto: 'Solicitar ahora',
      btnUrl: '/registro',
      destacada: false,
    },
    {
      icon: '🚛',
      codigo: 'C2',
      titulo: 'Categoría C2',
      incluye: [
        '20 Horas Teoría',
        '10 Horas Práctica en Taller',
        '14 Horas Práctica en Conducción',
        'Certificado escuela de conducción',
        'Examen médico',
        'Trámites y costos RUNT',
      ],
      licenciaLabel: 'Licencia C2',
      valor: 'Consulte valor en sede',
      btnTexto: 'Solicitar ahora',
      btnUrl: '/registro',
      destacada: true,
    },
  ],
};

const PUBLICIDAD_DEFAULTS = {
  activo: true,
  intervaloSegundos: 5,
  slides: [],
};

const CURSOS_CONDUCCION_DEFAULTS = {
  hero: {
    kicker: 'Cursos de conducción',
    imagenUrl: '',
    imagenAlt: 'Formación en conducción y categorías de licencia',
    pillarsLabel: 'Formación en conducción',
    pillars: PROMO_HERO_PILARES_INSTITUCION,
    mostrarBadgeVirtual: true,
    virtualBadgeLabel: 'VIRTUAL',
  },
  tituloPrincipal: 'CENTRO DE ENSEÑANZA AUTOMOVILÍSTICA',
  textoInstitucional:
    'Centro de Enseñanza Automovilística CEA, debidamente habilitado ante Ministerio de transporte.',
  resoluciones: [
    { titulo: 'Resolución 2267 de 06/08/2014 Mintransporte', archivoUrl: '', nombreArchivo: '' },
    { titulo: 'Resolución 2294 del 11/08/2014 Mintransporte', archivoUrl: '', nombreArchivo: '' },
  ],
  invitacion: JSON.parse(JSON.stringify(INVITACION_DEFAULTS)),
  licencias: JSON.parse(JSON.stringify(LICENCIAS_DEFAULTS)),
  publicidad: JSON.parse(JSON.stringify(PUBLICIDAD_DEFAULTS)),
};

module.exports = { CURSOS_CONDUCCION_DEFAULTS, INVITACION_DEFAULTS, PUBLICIDAD_DEFAULTS };
