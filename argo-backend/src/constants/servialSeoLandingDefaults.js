const { portafolioServiciosEsServial } = require('./aulaVirtualPortafolioServicios');

const SERVIAL_MD_PATCH = {
  theme: 'gold',
  kicker: 'Servial Colombia · CEA · Villavicencio · Meta',
  subtitulo: 'Curso libre virtual y presencial — Servial Colombia',
  heroLead:
    'Fortalece tus competencias para anticipar riesgos, tomar decisiones seguras y prevenir siniestros viales. Capacitación de Servial Colombia para conductores, motociclistas, empresas transportadoras y responsables de seguridad vial en Villavicencio, Meta, Llanos Orientales y toda Colombia.',
  confianzaTitulo: 'Capacitación Servial orientada a la prevención real del riesgo vial',
  confianzaTexto:
    'En Servial Colombia el manejo defensivo integra experiencia de CEA, cursos libres y acompañamiento a empresas del sector transporte. Aprende a identificar peligros, anticiparte a otros actores viales y decidir con menor riesgo en carretera y ciudad.',
  regionalTexto:
    'Desde Villavicencio, Servial Colombia atiende conductores y flotas del Meta y los Llanos Orientales. Nuestro programa se adapta a entornos urbanos, vías secundarias y operación logística del sector transportador.',
  empresasTexto:
    'Empresas de transporte, logística y contratistas que operan vehículos en Servial Colombia pueden estructurar capacitación de manejo defensivo alineada con su operación, tamaño de flota y programas de seguridad vial.',
  empresasCtaBoton: 'Solicitar propuesta con Servial',
  instructoresTexto:
    'Servial Colombia cuenta con instructores certificados en seguridad vial, formación de conductores y acompañamiento a empresas del sector transporte en Villavicencio y el Meta.',
  ctaFinalUbicacion: 'Servial Colombia · Villavicencio · Meta · Colombia',
  footerSeoLine:
    'Servial Colombia | Manejo defensivo | CEA Villavicencio | Cursos libres | Seguridad vial | Sector transportador',
};

const SERVIAL_MP_PATCH = {
  kicker: 'SERVIAL COLOMBIA · Sector transportador',
  subtitulo: 'Normativa · Transporte terrestre · Seguridad · Servial Colombia',
  theme: 'gold',
  heroLead:
    'Guía y curso de mercancías peligrosas para conductores, auxiliares y empresas del sector transporte. Conoce la normativa colombiana y las responsabilidades en la cadena logística con el respaldo de Servial Colombia.',
  heroParrafos: [
    'El transporte terrestre de mercancías peligrosas exige controles estrictos por los riesgos para las personas, la infraestructura y el medio ambiente.',
    'En Colombia, conductores y empresas transportadoras deben cumplir el Decreto 1079, las NTC y los lineamientos del Ministerio de Transporte.',
    'Servial Colombia organiza esta información para equipos de operación, logística y seguridad vial que necesitan consultarla con claridad.',
  ],
  homeItems: [
    {
      numero: 1,
      icon: 'document',
      acento: 'blue',
      titulo: 'Normativa para transporte',
      texto: 'Decreto 1079, NTC y requisitos del Ministerio de Transporte aplicables a operadores de carga.',
    },
    {
      numero: 2,
      icon: 'shield',
      acento: 'orange',
      titulo: 'Clasificación ONU',
      texto: 'Las 9 clases, señalización, documentación y responsabilidades en la cadena logística.',
    },
    {
      numero: 3,
      icon: 'download',
      acento: 'teal',
      titulo: 'Material de consulta',
      texto: 'PDFs de normativa y recursos descargables para equipos de flota y cumplimiento.',
    },
  ],
  fraseFinal: 'En el sector transportador, conocer la normativa también es prevenir.',
};

const SERVIAL_TA_PATCH = {
  theme: 'gold',
  heroLead:
    'Guía informativa de Servial Colombia sobre trabajo en alturas en el sector transportador: marco legal, obligaciones SG-SST, Trabajador Autorizado y documentación de consulta para operaciones en tractocamiones, planchones y carrocerías.',
  heroParrafos: [
    'La Resolución 4272 de 2021 regula actividades a partir de 2,0 metros. En logística y transporte, techos de vehículos, tolvas y cisternas requieren controles adicionales por superficies irregulares y exposición al clima.',
    'Servial Colombia orienta a empresas y trabajadores del sector transporte en prevención, uso de EPI y cumplimiento normativo antes de ejecutar trabajo en alturas.',
  ],
  homeItems: [
    {
      numero: 1,
      icon: 'document',
      acento: 'orange',
      titulo: 'Resolución 4272 de 2021',
      texto: 'Altura mínima 2,0 m, Trabajador Autorizado y certificación con vigencia de 3 años.',
    },
    {
      numero: 2,
      icon: 'shield-check',
      acento: 'blue',
      titulo: 'SG-SST en transporte',
      texto: 'Obligaciones del empleador y del trabajador en patios logísticos y operación de carga.',
    },
    {
      numero: 3,
      icon: 'download',
      acento: 'teal',
      titulo: 'Normativa descargable',
      texto: 'Resolución 4272, Ley 1562 y manuales técnicos de referencia en PDF.',
    },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const SERVIAL_PA_PATCH = {
  theme: 'gold',
};

function manejoDefensivoDefaultsForTema(tema) {
  const { MANEJO_DEFENSIVO_DEFAULTS } = require('./aulaVirtualManejoDefensivoDefaults');
  if (!portafolioServiciosEsServial(tema)) return MANEJO_DEFENSIVO_DEFAULTS;
  const base = clone(MANEJO_DEFENSIVO_DEFAULTS);
  return {
    ...base,
    ...SERVIAL_MD_PATCH,
    certificacion: {
      ...base.certificacion,
      entidad: 'Servial Colombia — Instituto de Educación para el Trabajo y el Desarrollo Humano',
    },
  };
}

function mercanciasPeligrosasDefaultsForTema(tema) {
  const { MERCANCIAS_PELIGROSAS_DEFAULTS } = require('./aulaVirtualMercanciasPeligrosasDefaults');
  if (!portafolioServiciosEsServial(tema)) return MERCANCIAS_PELIGROSAS_DEFAULTS;
  return { ...clone(MERCANCIAS_PELIGROSAS_DEFAULTS), ...SERVIAL_MP_PATCH };
}

function trabajoEnAlturasDefaultsForTema(tema) {
  const { TRABAJO_EN_ALTURAS_DEFAULTS } = require('./aulaVirtualTrabajoEnAlturasDefaults');
  if (!portafolioServiciosEsServial(tema)) return TRABAJO_EN_ALTURAS_DEFAULTS;
  return { ...clone(TRABAJO_EN_ALTURAS_DEFAULTS), ...SERVIAL_TA_PATCH };
}

function primerosAuxiliosDefaultsForTema(tema) {
  const { PRIMEROS_AUXILIOS_DEFAULTS } = require('./aulaVirtualPrimerosAuxiliosDefaults');
  if (!portafolioServiciosEsServial(tema)) return PRIMEROS_AUXILIOS_DEFAULTS;
  return { ...clone(PRIMEROS_AUXILIOS_DEFAULTS), ...SERVIAL_PA_PATCH };
}

module.exports = {
  manejoDefensivoDefaultsForTema,
  mercanciasPeligrosasDefaultsForTema,
  trabajoEnAlturasDefaultsForTema,
  primerosAuxiliosDefaultsForTema,
};
