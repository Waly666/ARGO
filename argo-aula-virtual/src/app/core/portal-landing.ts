import {
  BENEFICIOS_CURSOS,
  CARRERAS_TECNICAS,
  FAQ_CURSOS,
  OFERTAS,
  PASOS_PROGRAMAS,
  PILARES,
  SERVICIOS_EMPRESA,
  TESTIMONIOS,
  VALORES,
} from '../pages/home/home-content';

export interface PortalLandingConfig {
  instBarTag: string;
  quoteText: string;
  metaDescription: string;
  metaKeywords: string;
  ofertas: { titulo: string; lead: string; items: { icon: string; title: string; text?: string }[] };
  beneficios: {
    kicker: string;
    titulo: string;
    lead: string;
    items: { icon: string; title: string; text?: string }[];
  };
  servicios: { titulo: string; items: { icon: string; title: string }[] };
  valores: { titulo: string; lead: string; items: { title: string; text: string }[] };
  testimonios: {
    kicker: string;
    titulo: string;
    lead: string;
    items: { nombre: string; rol: string; texto: string }[];
  };
  pasos: {
    kicker: string;
    titulo: string;
    lead: string;
    items: { paso: string; title: string; text: string }[];
  };
  faq: {
    kicker: string;
    titulo: string;
    lead: string;
    contactoTexto: string;
    items: { pregunta: string; respuesta: string }[];
  };
  cursos: { kicker: string; titulo: string; emptyTitulo: string; emptyTexto: string };
  carreras: {
    kicker: string;
    titulo: string;
    lead: string;
    items: { titulo: string; cno: string; horas: number; semestres: number; jornadas: string }[];
  };
  pilares: { capacitacion: string[]; campanas: string[] };
  footerServicios: string[];
}

export const PORTAL_LANDING_FALLBACK: PortalLandingConfig = {
  instBarTag: 'Cursos y programas de capacitación virtual en Colombia',
  quoteText:
    'Cursos y programas virtuales que transforman la seguridad vial: estudie hoy, certifique mañana.',
  metaDescription: '',
  metaKeywords: '',
  ofertas: {
    titulo: '¿Qué ofrecemos en el aula virtual?',
    lead: 'Cursos virtuales y programas de capacitación en seguridad vial para personas, empresas e instituciones.',
    items: [...OFERTAS],
  },
  beneficios: {
    kicker: 'Resultados',
    titulo: 'Lo que logra con nuestros cursos y programas',
    lead: 'Formación práctica, certificación y flexibilidad para avanzar sin frenar su día a día.',
    items: [...BENEFICIOS_CURSOS],
  },
  servicios: { titulo: 'Todo lo que necesita tu empresa en seguridad vial', items: [...SERVICIOS_EMPRESA] },
  valores: { titulo: '¡Somos tu mejor opción!', lead: '', items: [...VALORES] },
  testimonios: {
    kicker: 'Confianza',
    titulo: 'Quienes ya cursan nuestros programas',
    lead: 'Experiencias reales de estudiantes y empresas que eligieron la capacitación virtual.',
    items: [...TESTIMONIOS],
  },
  pasos: {
    kicker: 'Empiece hoy',
    titulo: 'Cómo acceder a cursos y programas',
    lead: 'Tres pasos para matricularse en el aula virtual y comenzar su capacitación.',
    items: [...PASOS_PROGRAMAS],
  },
  faq: {
    kicker: 'Ayuda',
    titulo: 'Preguntas frecuentes sobre cursos y programas',
    lead: 'Resolvemos las dudas más comunes antes de matricularse en el aula virtual.',
    contactoTexto: '¿Aún tiene dudas sobre un curso o programa?',
    items: [...FAQ_CURSOS],
  },
  cursos: {
    kicker: 'Catálogo en línea',
    titulo: 'Cursos y programas virtuales disponibles',
    emptyTitulo: 'Próximamente nuevos cursos y programas',
    emptyTexto: 'Estamos publicando más programas de capacitación virtual. Vuelva pronto o contáctenos.',
  },
  carreras: {
    kicker: 'Titulación',
    titulo: 'Carreras técnicas en seguridad vial',
    lead: 'Técnico laboral por competencias — información de referencia.',
    items: [...CARRERAS_TECNICAS],
  },
  pilares: { capacitacion: [...PILARES.capacitacion], campanas: [...PILARES.campanas] },
  footerServicios: [
    'Capacitación',
    'PESV',
    'Campañas de seguridad vial',
    'Carreras técnicas',
    'Estudios de tránsito',
    'Planes de movilidad sostenible y segura',
  ],
};

export function mergePortalLanding(raw?: Partial<PortalLandingConfig> | null): PortalLandingConfig {
  const d = PORTAL_LANDING_FALLBACK;
  if (!raw) return JSON.parse(JSON.stringify(d)) as PortalLandingConfig;
  return {
    ...d,
    ...raw,
    ofertas: { ...d.ofertas, ...raw.ofertas, items: raw.ofertas?.items?.length ? raw.ofertas.items : d.ofertas.items },
    beneficios: {
      ...d.beneficios,
      ...raw.beneficios,
      items: raw.beneficios?.items?.length ? raw.beneficios.items : d.beneficios.items,
    },
    servicios: {
      ...d.servicios,
      ...raw.servicios,
      items: raw.servicios?.items?.length ? raw.servicios.items : d.servicios.items,
    },
    valores: {
      ...d.valores,
      ...raw.valores,
      items: raw.valores?.items?.length ? raw.valores.items : d.valores.items,
    },
    testimonios: {
      ...d.testimonios,
      ...raw.testimonios,
      items: raw.testimonios?.items?.length ? raw.testimonios.items : d.testimonios.items,
    },
    pasos: {
      ...d.pasos,
      ...raw.pasos,
      items: raw.pasos?.items?.length ? raw.pasos.items : d.pasos.items,
    },
    faq: {
      ...d.faq,
      ...raw.faq,
      items: raw.faq?.items?.length ? raw.faq.items : d.faq.items,
    },
    cursos: { ...d.cursos, ...raw.cursos },
    carreras: {
      ...d.carreras,
      ...raw.carreras,
      items: raw.carreras?.items?.length ? raw.carreras.items : d.carreras.items,
    },
    pilares: {
      capacitacion: raw.pilares?.capacitacion?.length ? raw.pilares.capacitacion : d.pilares.capacitacion,
      campanas: raw.pilares?.campanas?.length ? raw.pilares.campanas : d.pilares.campanas,
    },
    footerServicios: raw.footerServicios?.length ? raw.footerServicios : d.footerServicios,
  };
}
