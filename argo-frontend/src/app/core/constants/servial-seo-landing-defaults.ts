import type { PortalTemaLike } from '../utils/portal-theme-css-base.util';
import { portafolioServiciosEsServial } from '../utils/portafolio-servicios.util';
import {
  MANEJO_DEFENSIVO_LANDING,
  type PortalManejoDefensivoLanding,
} from './manejo-defensivo-landing-defaults';
import {
  MERCANCIAS_PELIGROSAS_LANDING_DEFAULTS,
  type PortalMercanciasPeligrosasLanding,
} from './mercancias-peligrosas-landing-defaults';
import {
  TRABAJO_EN_ALTURAS_LANDING,
  type PortalTrabajoEnAlturasLanding,
} from './trabajo-en-alturas-landing-defaults';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const SERVIAL_MANEJO_DEFENSIVO_LANDING: PortalManejoDefensivoLanding = {
  ...clone(MANEJO_DEFENSIVO_LANDING),
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
  certificacion: {
    ...MANEJO_DEFENSIVO_LANDING.certificacion,
    entidad: 'Servial Colombia — Instituto de Educación para el Trabajo y el Desarrollo Humano',
  },
  ctaFinalUbicacion: 'Servial Colombia · Villavicencio · Meta · Colombia',
  footerSeoLine:
    'Servial Colombia | Manejo defensivo | CEA Villavicencio | Cursos libres | Seguridad vial | Sector transportador',
};

export const SERVIAL_MERCANCIAS_PELIGROSAS_LANDING: PortalMercanciasPeligrosasLanding = {
  ...clone(MERCANCIAS_PELIGROSAS_LANDING_DEFAULTS),
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

export const SERVIAL_TRABAJO_EN_ALTURAS_LANDING: PortalTrabajoEnAlturasLanding = {
  ...clone(TRABAJO_EN_ALTURAS_LANDING),
  theme: 'gold',
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

export function manejoDefensivoDefaultsForTema(
  tema?: PortalTemaLike | null,
): PortalManejoDefensivoLanding {
  return portafolioServiciosEsServial(tema) ? SERVIAL_MANEJO_DEFENSIVO_LANDING : MANEJO_DEFENSIVO_LANDING;
}

export function mercanciasPeligrosasDefaultsForTema(
  tema?: PortalTemaLike | null,
): PortalMercanciasPeligrosasLanding {
  return portafolioServiciosEsServial(tema)
    ? SERVIAL_MERCANCIAS_PELIGROSAS_LANDING
    : MERCANCIAS_PELIGROSAS_LANDING_DEFAULTS;
}

export function trabajoEnAlturasDefaultsForTema(
  tema?: PortalTemaLike | null,
): PortalTrabajoEnAlturasLanding {
  return portafolioServiciosEsServial(tema) ? SERVIAL_TRABAJO_EN_ALTURAS_LANDING : TRABAJO_EN_ALTURAS_LANDING;
}
