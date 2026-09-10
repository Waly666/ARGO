import type { PortalTemaLike } from '../portal-theme-css.util';
import { portafolioServiciosEsServial } from '../portafolio-servicios.util';
import {
  MANEJO_DEFENSIVO_LANDING,
  type PortalManejoDefensivoLanding,
} from '../../pages/manejo-defensivo/manejo-defensivo-content';
import {
  PRIMEROS_AUXILIOS_LANDING,
  type PortalPrimerosAuxiliosLanding,
} from '../../pages/primeros-auxilios/primeros-auxilios-content';
import {
  SERVIAL_ENLACES_MANEJO_DEFENSIVO,
  SERVIAL_ENLACES_PRIMEROS_AUXILIOS,
  SERVIAL_ENLACES_TITULO,
} from './portal-enlaces-relacionados-servial';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const SERVIAL_MANEJO_DEFENSIVO_LANDING: PortalManejoDefensivoLanding = {
  ...clone(MANEJO_DEFENSIVO_LANDING),
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
  certificacion: {
    ...MANEJO_DEFENSIVO_LANDING.certificacion,
    entidad: 'Servial Colombia — Instituto de Educación para el Trabajo y el Desarrollo Humano',
  },
  ctaFinalUbicacion: 'Servial Colombia · Villavicencio · Meta · Colombia',
  footerSeoLine:
    'Servial Colombia | Manejo defensivo | CEA Villavicencio | Cursos libres | Seguridad vial | Sector transportador',
  enlacesRelacionadosTitulo: SERVIAL_ENLACES_TITULO,
  enlacesRelacionados: SERVIAL_ENLACES_MANEJO_DEFENSIVO.map((e) => ({ ...e })),
};

export const SERVIAL_PRIMEROS_AUXILIOS_LANDING: PortalPrimerosAuxiliosLanding = {
  ...clone(PRIMEROS_AUXILIOS_LANDING),
  theme: 'gold',
  enlacesRelacionadosTitulo: SERVIAL_ENLACES_TITULO,
  enlacesRelacionados: SERVIAL_ENLACES_PRIMEROS_AUXILIOS.map((e) => ({ ...e })),
};

export function manejoDefensivoDefaultsForTema(
  tema?: PortalTemaLike | null,
): PortalManejoDefensivoLanding {
  return portafolioServiciosEsServial(tema) ? SERVIAL_MANEJO_DEFENSIVO_LANDING : MANEJO_DEFENSIVO_LANDING;
}

export function primerosAuxiliosDefaultsForTema(
  tema?: PortalTemaLike | null,
): PortalPrimerosAuxiliosLanding {
  return portafolioServiciosEsServial(tema) ? SERVIAL_PRIMEROS_AUXILIOS_LANDING : PRIMEROS_AUXILIOS_LANDING;
}
