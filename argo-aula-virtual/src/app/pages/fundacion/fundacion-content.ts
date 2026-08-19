/** Contenido institucional del CEA — editable vía ERP (landing.fundacion). */

import { DEFAULT_CEA_CORTO, DEFAULT_CEA_NOMBRE } from '../../core/portal-brand-defaults';

export const FUNDACION_SITIO_URL = '/';

export const FUNDACION_CONTACTO = {
  telefono: '',
  email: '',
  direccion: 'Villavicencio, Meta',
  sedeNota: '',
};

export const FUNDACION_QUIENES_LEAD =
  `Somos un ${DEFAULT_CEA_NOMBRE}: formamos conductores responsables con cursos de conducción, licencias y capacitación en seguridad vial para que más personas lleguen bien a casa.`;

export const FUNDACION_QUIENES_DESTACADOS = [
  { icon: '📍', label: 'Sede', text: 'Villavicencio, Meta' },
  { icon: '🇨🇴', label: 'Cobertura', text: 'Colombia' },
  { icon: '🎓', label: 'Formación', text: 'Aula virtual + práctica' },
  { icon: '🛣️', label: 'Enfoque', text: 'Conducción y seguridad vial' },
];

export const FUNDACION_QUIENES_BLOQUES = [
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
      'Clases presenciales, prácticas en vía y aula virtual integrados para que obtenga o refrende su licencia de conducción con acompañamiento profesional.',
  },
];

export const FUNDACION_MISION = `Nuestro ${DEFAULT_CEA_NOMBRE} promueve la formación en normas de tránsito, conducción segura y seguridad vial de forma ágil y eficaz.

Garantizamos servicios de calidad para conductores y empresas, con instructores calificados y procesos alineados a la normativa nacional.`;

export const FUNDACION_VISION = `Ser reconocidos en Villavicencio, el Meta y Colombia como referente en formación para conductores, prevención de accidentes y apropiación de las normas de tránsito.`;

export const FUNDACION_COMPROMISO = `En nuestro ${DEFAULT_CEA_CORTO} creemos que una buena formación salva vidas. Trabajamos para que cada alumno obtenga su licencia con confianza, responsabilidad y respeto por la norma.

Acompañamos a conductores y empresas con cursos de conducción, manejo defensivo, mecánica básica, primeros auxilios y programas virtuales de seguridad vial.`;

export const FUNDACION_SERVICIOS_DESTACADOS = [
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
];

/** Contenido editable vía ERP (landing.fundacion). */
export const FUNDACION_LANDING_DEFAULTS = {
  hero: {
    kicker: '🚗 Centro de Enseñanza Automovilística',
    titulo: '',
    lead:
      'Cursos de conducción, licencias y aula virtual en Villavicencio, Meta. Formación certificada para obtener o refrendar su licencia de conducción.',
    imagenUrl: '/images/fundacion-equipo.png',
    imagenAlt: 'Equipo del centro de enseñanza automovilística',
    imagenCaption: 'Nuestro equipo en formación',
    btnSitioUrl: FUNDACION_SITIO_URL,
    btnSitioLabel: 'Ver inicio',
    btnCursosLabel: 'Ver cursos',
  },
  quienes: {
    kicker: 'Conócenos',
    titulo: '¿Quiénes somos?',
    lead: FUNDACION_QUIENES_LEAD,
    destacados: [...FUNDACION_QUIENES_DESTACADOS],
    bloques: FUNDACION_QUIENES_BLOQUES.map((b) => ({ ...b })),
    enlaceUrl: FUNDACION_SITIO_URL,
    enlaceLabel: 'Volver al inicio',
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
    titulo: 'Servicios del CEA',
    lead: 'Cursos de conducción, licencias y capacitación para conductores y empresas.',
    items: [...FUNDACION_SERVICIOS_DESTACADOS],
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
    sedeNota: FUNDACION_CONTACTO.sedeNota,
  },
};
