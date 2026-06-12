/** Página institucional (Fundación / Empresa) — espejo de aulaVirtualFundacionDefaults.js */

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
    imagenAlt: string;
    imagenCaption: string;
    btnSitioUrl: string;
    btnSitioLabel: string;
    btnCursosLabel: string;
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

export const FUNDACION_LANDING_DEFAULTS: PortalFundacionLanding = {
  hero: {
    kicker: '🛣️ Seguridad vial con calidez humana',
    titulo: '',
    lead:
      'Llevamos la educación vial al campo y al aula virtual. En Villavicencio, el Meta y Colombia trabajamos para que más personas circulen con seguridad.',
    imagenUrl: '/images/fundacion-equipo.png',
    imagenAlt: 'Equipo institucional en campo',
    imagenCaption: 'Nuestro equipo en acción',
    btnSitioUrl: 'https://finstruvial.com.co/',
    btnSitioLabel: 'Sitio institucional ↗',
    btnCursosLabel: 'Ver cursos virtuales',
  },
  quienes: {
    kicker: 'Conócenos',
    titulo: '¿Quiénes somos?',
    lead:
      'Somos la Fundación Finstruvial: educamos, acompañamos y asesoramos en seguridad vial para que más personas lleguen bien a casa.',
    destacados: [
      { icon: '📍', label: 'Sede', text: 'Villavicencio, Meta' },
      { icon: '🇨🇴', label: 'Cobertura', text: 'Colombia' },
      { icon: '🎓', label: 'Formación', text: 'Aula virtual + campo' },
      { icon: '🛣️', label: 'Enfoque', text: 'Tránsito y transporte' },
    ],
    bloques: [
      {
        icon: '💛',
        titulo: 'Salvar vidas en la vía',
        texto:
          'Promovemos una movilidad responsable, humana y sostenible. Con capacitación, campañas y acompañamiento técnico buscamos que cada actor vial transite con más conciencia.',
      },
      {
        icon: '📚',
        titulo: 'Experiencia con respaldo legal',
        texto:
          'Nuestro trabajo se apoya en la Ley 769 de 2002, la Ley 1503 de 2011 y el Plan Nacional de Seguridad Vial 2022–2031.',
      },
      {
        icon: '🏫',
        titulo: 'Un solo ecosistema educativo',
        texto:
          'El instituto técnico y el aula virtual ofrecen formación en sitio, consultoría para empresas e instituciones, y herramientas para decisiones con datos.',
      },
    ],
    enlaceUrl: 'https://finstruvial.com.co/',
    enlaceLabel: 'Más en nuestro sitio web ↗',
  },
  mision:
    'La Fundación Finstruvial es una organización sin ánimo de lucro que promueve y dinamiza procesos educativos mediante la formación en normas de tránsito, transporte y seguridad vial de forma ágil y eficaz.\n\nGarantiza servicios de calidad para el sector transporte y organismos de tránsito, con un equipo humano y logístico altamente calificado.',
  vision:
    'Ser reconocidos nacional e internacionalmente por la promoción de la seguridad vial y el fortalecimiento de las competencias laborales en conducción segura, prevención de accidentes y apropiación de las normas de tránsito.',
  compromiso: {
    kicker: '💛 En la vía, la vida primero',
    titulo: 'Nuestro compromiso',
    texto:
      'Creemos en el poder de la innovación para salvar vidas. Trabajamos en soluciones que mejoran la movilidad, reducen los siniestros y promueven una cultura vial más segura.\n\nAcompañamos a entidades públicas y privadas en planes de seguridad vial, movilidad sostenible, capacitación y campañas de sensibilización.',
  },
  lineas: {
    kicker: 'Lo que ofrecemos',
    titulo: 'Líneas de trabajo',
    lead: 'Capacitación, consultoría y herramientas para empresas, entidades y comunidad.',
    items: [
      {
        icon: '🎓',
        title: 'Capacitación y aula virtual',
        text: 'Cursos presenciales y virtuales que fortalecen competencias en seguridad vial y transporte.',
      },
      {
        icon: '📋',
        title: 'Consultoría en seguridad vial',
        text: 'PESV, PLSV, planes de movilidad, manejo de tránsito y asesoría normativa.',
      },
      {
        icon: '📊',
        title: 'Estudios técnicos',
        text: 'Análisis de accidentalidad, inventarios viales y diagnósticos para la toma de decisiones.',
      },
      {
        icon: '🚦',
        title: 'Campañas y sensibilización',
        text: 'Educación vial en campo, actividades experienciales y cultura de prevención.',
      },
    ],
  },
  cta: {
    kicker: '🎓 Aprende con nosotros',
    titulo: '¡Empieza tu capacitación!',
    texto:
      'Cursos virtuales, programas técnicos y certificación en seguridad vial — estudia a tu ritmo desde donde estés.',
    btnRegistro: 'Crear cuenta',
    btnServicios: 'Servicios para empresas',
  },
  contacto: {
    kicker: '📍 Escríbenos',
    titulo: 'Hablemos',
    lead: 'Con gusto te atendemos.',
    sedeNota: 'Frente al Acueducto Municipal',
  },
};

export function mergeFundacionLanding(
  raw?: Partial<PortalFundacionLanding> | null,
): PortalFundacionLanding {
  const d = FUNDACION_LANDING_DEFAULTS;
  if (!raw) return JSON.parse(JSON.stringify(d)) as PortalFundacionLanding;
  return {
    hero: { ...d.hero, ...raw.hero },
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
