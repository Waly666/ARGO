/** Contenido institucional de la Fundación Finstruvial — referencia: https://finstruvial.com.co/ */

export const FUNDACION_SITIO_URL = 'https://finstruvial.com.co/';

export const FUNDACION_CONTACTO = {
  telefono: '313 3921011',
  email: 'finstruvial1@gmail.com',
  direccion: 'Carrera 19c #38-22, Villavicencio, Meta',
  sedeNota: 'Frente al Acueducto Municipal',
};

export const FUNDACION_QUIENES_LEAD =
  'Somos la Fundación Finstruvial: educamos, acompañamos y asesoramos en seguridad vial para que más personas lleguen bien a casa.';

export const FUNDACION_QUIENES_DESTACADOS = [
  { icon: '📍', label: 'Sede', text: 'Villavicencio, Meta' },
  { icon: '🇨🇴', label: 'Cobertura', text: 'Colombia' },
  { icon: '🎓', label: 'Formación', text: 'Aula virtual + campo' },
  { icon: '🛣️', label: 'Enfoque', text: 'Tránsito y transporte' },
];

export const FUNDACION_QUIENES_BLOQUES = [
  {
    icon: '💛',
    titulo: 'Salvar vidas en la vía',
    texto:
      'Promovemos una movilidad responsable, humana y sostenible. Con capacitación, campañas y acompañamiento técnico buscamos que cada actor vial —conductor, peatón, ciclista o empresa— transite con más conciencia.',
  },
  {
    icon: '📚',
    titulo: 'Experiencia con respaldo legal',
    texto:
      'Nuestro trabajo se apoya en la Ley 769 de 2002, la Ley 1503 de 2011 y el Plan Nacional de Seguridad Vial 2022–2031, en línea con las políticas de la ONU y la OMS para reducir la siniestralidad.',
  },
  {
    icon: '🏫',
    titulo: 'Un solo ecosistema educativo',
    texto:
      'El instituto técnico y el aula virtual hacen parte de la misma familia Finstruvial: formación en sitio, consultoría para empresas e instituciones, y herramientas como PERIDATA para decisiones con datos.',
  },
];

export const FUNDACION_MISION = `La Fundación Finstruvial es una organización sin ánimo de lucro que promueve y dinamiza procesos educativos mediante la formación en normas de tránsito, transporte y seguridad vial de forma ágil y eficaz.

Garantiza servicios de calidad para el sector transporte y organismos de tránsito, con un equipo humano y logístico altamente calificado para responder a las necesidades del contexto y aportar al desarrollo de competencias básicas y laborales de nuestros usuarios.`;

export const FUNDACION_VISION = `La Fundación Finstruvial será reconocida nacional e internacionalmente, en el año 2030, por ser una entidad pionera en la promoción de la seguridad vial y el fortalecimiento de las competencias laborales en cada uno de los procesos relacionados con la conducción segura, la prevención de accidentes y la apropiación de las normas de tránsito.`;

export const FUNDACION_COMPROMISO = `En la Fundación Finstruvial creemos en el poder de la innovación para salvar vidas. Trabajamos en soluciones concretas que mejoran la movilidad, reducen los siniestros y promueven una cultura vial más segura en las carreteras de Colombia.

Acompañamos a entidades públicas y privadas en el diseño de soluciones efectivas: planes locales y estratégicos de seguridad vial, movilidad sostenible, capacitación, campañas de sensibilización, estudios técnicos y herramientas como PERIDATA.`;

export const FUNDACION_SERVICIOS_DESTACADOS = [
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
    title: 'PERIDATA y estudios técnicos',
    text: 'Análisis de accidentalidad, inventarios viales y diagnósticos para la toma de decisiones.',
  },
  {
    icon: '🚦',
    title: 'Campañas y sensibilización',
    text: 'Educación vial en campo, actividades experienciales y cultura de prevención.',
  },
];

/** Contenido editable vía ERP (landing.fundacion). */
export const FUNDACION_LANDING_DEFAULTS = {
  hero: {
    kicker: '🛣️ Seguridad vial con calidez humana',
    titulo: '',
    lead:
      'Llevamos la educación vial al campo y al aula virtual. En Villavicencio, el Meta y Colombia trabajamos para que más personas circulen con seguridad.',
    imagenUrl: '/images/fundacion-equipo.png',
    imagenAlt: 'Equipo institucional en campo',
    imagenCaption: 'Nuestro equipo en acción',
    btnSitioUrl: FUNDACION_SITIO_URL,
    btnSitioLabel: 'Sitio institucional ↗',
    btnCursosLabel: 'Ver cursos virtuales',
  },
  quienes: {
    kicker: 'Conócenos',
    titulo: '¿Quiénes somos?',
    lead: FUNDACION_QUIENES_LEAD,
    destacados: [...FUNDACION_QUIENES_DESTACADOS],
    bloques: FUNDACION_QUIENES_BLOQUES.map((b) => ({ ...b })),
    enlaceUrl: FUNDACION_SITIO_URL,
    enlaceLabel: 'Más en nuestro sitio web ↗',
  },
  mision: FUNDACION_MISION,
  vision: FUNDACION_VISION,
  compromiso: {
    kicker: '💛 En la vía, la vida primero',
    titulo: 'Nuestro compromiso',
    texto: FUNDACION_COMPROMISO,
  },
  lineas: {
    kicker: 'Lo que ofrecemos',
    titulo: 'Líneas de trabajo',
    lead: 'Capacitación, consultoría y herramientas para empresas, entidades y comunidad.',
    items: [...FUNDACION_SERVICIOS_DESTACADOS],
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
    sedeNota: FUNDACION_CONTACTO.sedeNota,
  },
};
