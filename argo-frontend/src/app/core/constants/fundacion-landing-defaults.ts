/** Página institucional del CEA — espejo de aulaVirtualFundacionDefaults.js */

import {
  mergePromoHeroPillars,
  PROMO_HERO_PILARES_INSTITUCION,
  PortalPromoHeroPillar,
} from './portal-promo-hero-fields.util';

export interface FundacionDestacado {
  icon: string;
  label: string;
  text: string;
}

export interface FundacionBloque {
  icon: string;
  titulo: string;
  texto: string;
}

export interface FundacionServicioItem {
  icon: string;
  title: string;
  text: string;
}

export interface PortalFundacionLanding {
  hero: {
    kicker: string;
    titulo: string;
    lead: string;
    imagenUrl: string;
    imagenUrlAbsoluta?: string;
    imagenAlt: string;
    imagenCaption: string;
    btnSitioUrl: string;
    btnSitioLabel: string;
    btnCursosLabel: string;
    pillarsLabel: string;
    pillars: PortalPromoHeroPillar[];
    mostrarBadgeVirtual: boolean;
    virtualBadgeLabel: string;
  };
  quienes: {
    kicker: string;
    titulo: string;
    lead: string;
    destacados: FundacionDestacado[];
    bloques: FundacionBloque[];
    enlaceUrl: string;
    enlaceLabel: string;
  };
  mision: string;
  vision: string;
  compromiso: { kicker: string; titulo: string; texto: string };
  lineas: {
    kicker: string;
    titulo: string;
    lead: string;
    items: FundacionServicioItem[];
  };
  cta: {
    kicker: string;
    titulo: string;
    texto: string;
    btnRegistro: string;
    btnServicios: string;
  };
  contacto: { kicker: string; titulo: string; lead: string; sedeNota: string };
}

const CEA_NOMBRE = 'Centro de Enseñanza Automovilística';

export const FUNDACION_LANDING_DEFAULTS: PortalFundacionLanding = {
  hero: {
    kicker: '🚗 Centro de Enseñanza Automovilística',
    titulo: '',
    lead:
      'Cursos de conducción, licencias y aula virtual en Villavicencio, Meta. Formación certificada para obtener o refrendar su licencia de conducción.',
    imagenUrl: '/images/fundacion-equipo.png',
    imagenAlt: 'Equipo del centro de enseñanza automovilística',
    imagenCaption: 'Nuestro equipo en formación',
    btnSitioUrl: '/',
    btnSitioLabel: 'Ver inicio',
    btnCursosLabel: 'Ver cursos',
    pillarsLabel: 'Nuestro enfoque',
    pillars: PROMO_HERO_PILARES_INSTITUCION,
    mostrarBadgeVirtual: true,
    virtualBadgeLabel: 'VIRTUAL',
  },
  quienes: {
    kicker: 'Conócenos',
    titulo: '¿Quiénes somos?',
    lead: `Somos un ${CEA_NOMBRE}: formamos conductores responsables con cursos de conducción, licencias y capacitación en seguridad vial.`,
    destacados: [
      { icon: '📍', label: 'Sede', text: 'Villavicencio, Meta' },
      { icon: '🇨🇴', label: 'Cobertura', text: 'Colombia' },
      { icon: '🎓', label: 'Formación', text: 'Aula virtual + práctica' },
      { icon: '🛣️', label: 'Enfoque', text: 'Conducción y seguridad vial' },
    ],
    bloques: [
      {
        icon: '💛',
        titulo: 'Salvar vidas en la vía',
        texto:
          'Promovemos una conducción responsable y segura. Con capacitación teórica, práctica y acompañamiento buscamos que cada conductor transite con más conciencia.',
      },
      {
        icon: '📚',
        titulo: 'Formación con respaldo legal',
        texto:
          'Nuestros cursos cumplen con la Ley 769 de 2002 y el Decreto 1500: certificados expedidos por un Centro de Enseñanza Automovilística legalmente autorizado.',
      },
      {
        icon: '🏫',
        titulo: 'Un solo ecosistema educativo',
        texto:
          'Clases presenciales, prácticas en vía y aula virtual integrados para obtener o refrendar su licencia de conducción.',
      },
    ],
    enlaceUrl: '/',
    enlaceLabel: 'Volver al inicio',
  },
  mision: `Nuestro ${CEA_NOMBRE} promueve la formación en normas de tránsito, conducción segura y seguridad vial de forma ágil y eficaz.\n\nGarantizamos servicios de calidad para conductores y empresas, con instructores calificados y procesos alineados a la normativa nacional.`,
  vision:
    'Ser reconocidos en Villavicencio, el Meta y Colombia como referente en formación para conductores, prevención de accidentes y apropiación de las normas de tránsito.',
  compromiso: {
    kicker: '💛 En la vía, la vida primero',
    titulo: 'Nuestro compromiso',
    texto:
      'En nuestro CEA creemos que una buena formación salva vidas. Acompañamos a conductores y empresas con cursos de conducción, manejo defensivo, mecánica básica, primeros auxilios y programas virtuales de seguridad vial.',
  },
  lineas: {
    kicker: 'Lo que ofrecemos',
    titulo: 'Servicios del CEA',
    lead: 'Cursos de conducción, licencias y capacitación para conductores y empresas.',
    items: [
      {
        icon: '🏍️',
        title: 'Licencia categoría A2',
        text: 'Curso de conducción de motocicletas de cualquier cilindraje.',
      },
      {
        icon: '🚗',
        title: 'Licencia categoría B1',
        text: 'Vehículos de servicio particular: teoría, práctica y taller.',
      },
      {
        icon: '🚌',
        title: 'Licencias C1, C2 y C3',
        text: 'Servicio público, vehículos pesados y articulados.',
      },
      {
        icon: '💻',
        title: 'Aula virtual',
        text: 'Cursos y programas en línea con certificación en seguridad vial.',
      },
    ],
  },
  cta: {
    kicker: '🎓 Empiece hoy',
    titulo: '¡Obtenga su licencia de conducción!',
    texto:
      'Cursos presenciales, prácticas en vía y programas virtuales — estudie a su ritmo y certifique su formación.',
    btnRegistro: 'Crear cuenta',
    btnServicios: 'Ver servicios',
  },
  contacto: {
    kicker: '📍 Escríbenos',
    titulo: 'Hablemos',
    lead: 'Con gusto le atendemos.',
    sedeNota: '',
  },
};

export function mergeFundacionLanding(
  raw?: Partial<PortalFundacionLanding> | null,
): PortalFundacionLanding {
  const d = FUNDACION_LANDING_DEFAULTS;
  if (!raw) return JSON.parse(JSON.stringify(d)) as PortalFundacionLanding;
  return {
    hero: {
      ...d.hero,
      ...raw.hero,
      pillarsLabel: raw.hero?.pillarsLabel?.trim() || d.hero.pillarsLabel,
      pillars: mergePromoHeroPillars(raw.hero?.pillars, d.hero.pillars),
      mostrarBadgeVirtual: raw.hero?.mostrarBadgeVirtual !== false,
      virtualBadgeLabel: raw.hero?.virtualBadgeLabel?.trim() || d.hero.virtualBadgeLabel,
    },
    quienes: {
      ...d.quienes,
      ...raw.quienes,
      destacados: raw.quienes?.destacados?.length ? raw.quienes.destacados : d.quienes.destacados,
      bloques: raw.quienes?.bloques?.length ? raw.quienes.bloques : d.quienes.bloques,
    },
    mision: raw.mision?.trim() ? raw.mision : d.mision,
    vision: raw.vision?.trim() ? raw.vision : d.vision,
    compromiso: { ...d.compromiso, ...raw.compromiso },
    lineas: {
      ...d.lineas,
      ...raw.lineas,
      items: raw.lineas?.items?.length ? raw.lineas.items : d.lineas.items,
    },
    cta: { ...d.cta, ...raw.cta },
    contacto: { ...d.contacto, ...raw.contacto },
  };
}
