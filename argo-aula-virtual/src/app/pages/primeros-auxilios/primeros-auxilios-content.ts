/** Página /curso-primeros-auxilios — contenido editable desde el ERP. */

import {
  SERVIAL_ENLACES_PRIMEROS_AUXILIOS,
  SERVIAL_ENLACES_TITULO,
} from '../../core/constants/portal-enlaces-relacionados-servial';
import {
  mergeEnlacesRelacionados,
  PortalEnlaceRelacionado,
} from '../../core/portal-enlace-relacionado.util';

export interface PaImagen {
  id: string;
  etiqueta: string;
  url: string;
  urlAbsoluta?: string;
  alt: string;
  /** Solo ERP: prompt para generar la foto. No se muestra en el portal. */
  promptImagen: string;
}

export interface PaPilar {
  icono: string;
  titulo: string;
  texto: string;
}

export interface PaAprendizaje {
  numero: string;
  titulo: string;
  texto: string;
}

export interface PaModalidad {
  kicker: string;
  titulo: string;
  lead: string;
  idealPara: string[];
  incluye: string[];
  ctaTexto: string;
  ctaUrl: string;
  imagenId: string;
}

export interface PaPaso {
  titulo: string;
  texto: string;
}

export interface PaAudiencia {
  icono: string;
  titulo: string;
}

export interface PaTestimonio {
  texto: string;
  autor: string;
  estrellas: number;
}

export interface PaFaq {
  pregunta: string;
  respuesta: string;
}

export interface PaHomeItem {
  numero: number;
  icon: string;
  acento: 'blue' | 'teal' | 'orange' | 'green' | 'purple';
  titulo: string;
  texto: string;
}

export interface PaCertificacion {
  duracion: string;
  modalidad: string;
  evaluacion: string;
  certificado: string;
  vigencia: string;
  entidad: string;
}

export const PRIMEROS_AUXILIOS_GUION_VERSION = 2;

export interface PortalPrimerosAuxiliosLanding {
  guionVersion?: number;
  kicker: string;
  titulo: string;
  tituloLinea2: string;
  subtitulo: string;
  h1: string;
  heroLead: string;
  /** Programa virtual del catálogo al que apunta «Inscríbete». */
  idProgramaVinculado: string;
  nombreProgramaVinculado: string;
  ctaInscribirseTexto: string;
  ctaInscribirseUrl: string;
  ctaEmpresaTexto: string;
  ctaEmpresaUrl: string;
  ctaWhatsappTexto: string;
  ctaInicioTexto: string;
  ctaUrl: string;
  homeItems: PaHomeItem[];
  confianzaTitulo: string;
  confianzaTexto: string;
  pilares: PaPilar[];
  queEsTitulo: string;
  queEsTexto: string;
  cicloPasos: string[];
  cicloFrase: string;
  aprenderasTitulo: string;
  aprendizajes: PaAprendizaje[];
  fraseAprendizaje: string;
  modalidadesTitulo: string;
  virtual: PaModalidad;
  presencial: PaModalidad;
  regionalTitulo: string;
  regionalTexto: string;
  municipios: string[];
  empresasTitulo: string;
  empresasTexto: string;
  empresasTipos: string[];
  empresasCtaTitulo: string;
  empresasCtaTexto: string;
  empresasCtaBoton: string;
  empresasCtaUrl: string;
  pesvTitulo: string;
  pesvLead: string;
  pesvItems: string[];
  pesvEnlaceTexto: string;
  pesvEnlaceUrl: string;
  metodologiaTitulo: string;
  metodologiaPasos: PaPaso[];
  audienciaTitulo: string;
  audiencias: PaAudiencia[];
  beneficiosTitulo: string;
  beneficios: string[];
  certificacionTitulo: string;
  certificacionTexto: string;
  certificacion: PaCertificacion;
  instructoresTitulo: string;
  instructoresTexto: string;
  instructoresItems: string[];
  testimoniosTitulo: string;
  testimonios: PaTestimonio[];
  faqTitulo: string;
  faq: PaFaq[];
  ctaFinalTitulo: string;
  ctaFinalLead: string;
  ctaFinalTexto: string;
  ctaFinalUbicacion: string;
  ctaFinalFrase: string;
  footerSeoLine: string;
  enlacesRelacionadosTitulo: string;
  enlacesRelacionados: PortalEnlaceRelacionado[];
  imagenes: PaImagen[];
}

export function promptFotoHorizontal(escena: string): string {
  return [
    'Imagen fotográfica horizontal 16:9 (1920×1080), ultra realista.',
    escena.trim(),
    'Luz natural. Villavicencio, Meta, Llanos Orientales, Colombia.',
    'Personas adultas latinoamericanas auténticas.',
    'Sin texto sobre la imagen, sin logos, sin marcas comerciales, sin marca de agua.',
  ].join(' ');
}

export function promptGraficoHorizontal(escena: string): string {
  return [
    'Infografía horizontal 16:9 (1920×1080), diseño limpio y profesional.',
    escena.trim(),
    'Paleta azul marino profundo, acento dorado y un toque de rojo.',
    'Sin marcas, sin logos, sin marca de agua, sin texto ilegible de relleno.',
  ].join(' ');
}

const IMG = (
  id: string,
  etiqueta: string,
  alt: string,
  promptImagen: string,
): PaImagen => ({ id, etiqueta, url: '', alt, promptImagen });

export const PRIMEROS_AUXILIOS_IMAGENES: PaImagen[] = [
  IMG(
    'hero',
    'Hero — curso en Villavicencio',
    'Curso de Primeros Auxilios en Villavicencio Meta',
    'Imagen fotográfica horizontal 16:9 (1920×1080), ultra realista. Instructor de primeros auxilios y participantes adultos en un centro de capacitación en Villavicencio, Meta, Colombia; ambiente profesional de curso de emergencias. Luz natural. Sin texto sobre la imagen, sin logos, sin marcas comerciales, sin marca de agua.',
  ),
  IMG(
    'infografia',
    'Infografía — cadena de supervivencia',
    'Cadena de supervivencia en curso de Primeros Auxilios',
    'Infografía horizontal 16:9 (1920×1080), diseño limpio y profesional. Cadena de supervivencia en primeros auxilios: reconocer, llamar, RCP, desfibrilación. Paleta azul marino profundo, acento dorado y un toque de rojo. Sin marcas, sin logos, sin marca de agua.',
  ),
  IMG(
    'aprendizaje',
    'RCP — práctica',
    'Curso de RCP y Primeros Auxilios en Villavicencio',
    'Imagen fotográfica horizontal 16:9 (1920×1080), ultra realista. Práctica de RCP con maniquí en un curso de primeros auxilios; instructor y participante adulto en Villavicencio, Meta, Colombia. Luz natural. Sin texto, sin logos, sin marcas.',
  ),
  IMG(
    'virtual',
    'Modalidad virtual',
    'Curso virtual de Primeros Auxilios en Colombia',
    'Imagen fotográfica horizontal 16:9 (1920×1080), ultra realista. Adulto tomando un curso virtual de primeros auxilios en portátil, en casa u oficina en Colombia; pantalla con clase genérica sin texto legible. Luz natural. Sin logos.',
  ),
  IMG(
    'presencial',
    'Modalidad presencial',
    'Curso de Primeros Auxilios en Villavicencio Meta',
    'Imagen fotográfica horizontal 16:9 (1920×1080), ultra realista. Aula de capacitación presencial en primeros auxilios: instructor frente a grupo de adultos con material didáctico en Villavicencio, Meta, Colombia. Sin logos.',
  ),
  IMG(
    'regional',
    'Llanos Orientales',
    'Capacitación en Primeros Auxilios en los Llanos Orientales',
    'Imagen fotográfica horizontal 16:9 (1920×1080), ultra realista. Paisaje de los Llanos Orientales de Colombia con carretera y cielo amplio; sensación de capacitación en emergencias en la región. Sin texto, sin logos.',
  ),
  IMG(
    'empresas',
    'Capacitación empresarial',
    'Capacitación de Primeros Auxilios para empresas en Villavicencio',
    'Imagen fotográfica horizontal 16:9 (1920×1080), ultra realista. Capacitación empresarial en primeros auxilios: grupo de trabajadores adultos en salón o patio industrial en Villavicencio, Meta; uniformes discretos sin logos.',
  ),
  IMG(
    'metodologia',
    'Modalidad mixta',
    'Curso de Primeros Auxilios en Meta Colombia',
    'Imagen fotográfica horizontal 16:9 (1920×1080), ultra realista. Participante combinando estudio en portátil con práctica presencial de primeros auxilios con instructor en Villavicencio, Meta. Sin logos.',
  ),
  IMG(
    'beneficios',
    'Atención de emergencias',
    'Atención inicial de emergencias en curso de Primeros Auxilios',
    'Imagen fotográfica horizontal 16:9 (1920×1080), ultra realista. Instructor demostrando valoración inicial de emergencia a participantes en curso de primeros auxilios; ambiente formativo profesional en Colombia. Sin logos.',
  ),
  IMG(
    'certificado',
    'Certificación',
    'Certificación del curso de Primeros Auxilios',
    'Imagen fotográfica horizontal 16:9 (1920×1080), ultra realista. Persona adulta sosteniendo certificado genérico de capacitación en primeros auxilios, sin nombres ni logos reales; ambiente institucional sobrio en Colombia.',
  ),
  IMG(
    'instructor',
    'Instructor',
    'Instructor de Primeros Auxilios en Villavicencio',
    'Imagen fotográfica horizontal 16:9 (1920×1080), ultra realista. Instructor de primeros auxilios explicando RCP en aula de capacitación en Villavicencio, Meta; gesto claro, vestimenta profesional. Sin logos.',
  ),
  IMG(
    'cierre',
    'Cierre',
    'Curso de Primeros Auxilios Villavicencio Meta Colombia',
    'Imagen fotográfica horizontal 16:9 (1920×1080), ultra realista. Grupo de participantes tras capacitación en primeros auxilios, ambiente positivo y profesional en Villavicencio, Meta, Colombia. Sin logos.',
  ),
];

export const PRIMEROS_AUXILIOS_LANDING: PortalPrimerosAuxiliosLanding = {
  "guionVersion": 2,
  "kicker": "27 horas • 9 módulos • 17 videos • Virtual • Presencial • Mixto",
  "titulo": "Primeros Auxilios",
  "tituloLinea2": "Saber qué hacer cambia la respuesta.",
  "subtitulo": "RCP, trauma, vía aérea y atención inicial de emergencias en Villavicencio, Meta y Colombia",
  "h1": "Curso de Primeros Auxilios Virtual y Presencial en Villavicencio, Meta y Colombia",
  "idProgramaVinculado": "",
  "nombreProgramaVinculado": "",
  "heroLead": "Aprende a reconocer emergencias, priorizar riesgos y actuar de forma organizada mediante una formación de 27 horas en RCP, trauma, vía aérea y atención inicial de emergencias. Nuestro Curso de Primeros Auxilios en Villavicencio está diseñado para personas, trabajadores, conductores, brigadistas, empresas y organizaciones. El programa puede realizarse en modalidad virtual, presencial o mixta, con cobertura presencial principalmente en Villavicencio y el Meta y acceso virtual para participantes de los Llanos Orientales y diferentes regiones de Colombia.",
  "ctaInscribirseTexto": "Inscribirme al curso",
  "ctaInscribirseUrl": "/cursos",
  "ctaEmpresaTexto": "Capacitación para empresas",
  "ctaEmpresaUrl": "/acerca",
  "ctaWhatsappTexto": "Hablar por WhatsApp",
  "ctaInicioTexto": "Conoce el curso de Primeros Auxilios",
  "ctaUrl": "/curso-primeros-auxilios",
  "homeItems": [
    {
      "numero": 1,
      "icon": "heart-pulse",
      "acento": "teal",
      "titulo": "27 horas en 9 módulos",
      "texto": "Formación estructurada en RCP, trauma, vía aérea y atención inicial de emergencias con 17 videos y evaluaciones."
    },
    {
      "numero": 2,
      "icon": "document",
      "acento": "blue",
      "titulo": "Virtual, presencial o mixto",
      "texto": "Accede desde cualquier región de Colombia o capacítate presencialmente en Villavicencio y el Meta."
    },
    {
      "numero": 3,
      "icon": "users",
      "acento": "green",
      "titulo": "Personas y empresas",
      "texto": "Dirigido a trabajadores, conductores, brigadistas, instituciones educativas y organizaciones del sector público y privado."
    }
  ],
  "confianzaTitulo": "Curso de Primeros Auxilios en Villavicencio y Meta",
  "confianzaTexto": "La formación presencial está dirigida especialmente a participantes y organizaciones de Villavicencio y diferentes municipios del Meta. El programa puede desarrollarse para personas particulares, empresas, trabajadores, brigadistas, conductores, instituciones educativas, entidades públicas y organizaciones privadas. Según programación y cobertura, pueden desarrollarse capacitaciones en diferentes municipios del departamento.",
  "pilares": [
    {
      "icono": "⏱",
      "titulo": "27 horas",
      "texto": "9 módulos de formación estructurada."
    },
    {
      "icono": "💻",
      "titulo": "Virtual",
      "texto": "Acceso desde cualquier región de Colombia."
    },
    {
      "icono": "👨‍🏫",
      "titulo": "Presencial",
      "texto": "Prácticas y acompañamiento en Villavicencio y Meta."
    },
    {
      "icono": "🔀",
      "titulo": "Mixto",
      "texto": "Combina aprendizaje virtual con actividades presenciales."
    }
  ],
  "queEsTitulo": "Formación en emergencias para personas y empresas",
  "queEsTexto": "Nuestro Curso de Primeros Auxilios en Villavicencio está diseñado para personas, trabajadores, conductores, brigadistas, empresas y organizaciones que desean fortalecer sus conocimientos para responder ante situaciones de emergencia. El programa puede realizarse en modalidad virtual, presencial o mixta, con cobertura presencial principalmente en Villavicencio y el Meta y acceso virtual para participantes de los Llanos Orientales y diferentes regiones de Colombia.",
  "cicloPasos": [
    "Reconocer",
    "Priorizar",
    "Organizar",
    "Actuar"
  ],
  "cicloFrase": "Saber qué hacer cambia la respuesta cuando cada segundo cuenta.",
  "aprenderasTitulo": "Curso Virtual de Primeros Auxilios en Colombia",
  "aprendizajes": [
    {
      "numero": "01",
      "titulo": "RCP",
      "texto": "Reanimación cardiopulmonar, paro cardiorrespiratorio y cadena de supervivencia."
    },
    {
      "numero": "02",
      "titulo": "Trauma",
      "texto": "Valoración inicial y manejo seguro de lesiones traumáticas."
    },
    {
      "numero": "03",
      "titulo": "Vía aérea",
      "texto": "Apertura y protección de la vía aérea en situaciones críticas."
    },
    {
      "numero": "04",
      "titulo": "Emergencias cardiovasculares",
      "texto": "Reconocimiento y respuesta ante eventos cardíacos agudos."
    },
    {
      "numero": "05",
      "titulo": "Emergencias respiratorias",
      "texto": "Atención inicial ante dificultad respiratoria y obstrucción."
    },
    {
      "numero": "06",
      "titulo": "Emergencias neurológicas",
      "texto": "Signos de alerta y actuación ante eventos neurológicos agudos."
    },
    {
      "numero": "07",
      "titulo": "Quemaduras",
      "texto": "Clasificación y atención inicial de lesiones por calor."
    },
    {
      "numero": "08",
      "titulo": "Intoxicaciones",
      "texto": "Reconocimiento y respuesta ante exposición a sustancias tóxicas."
    },
    {
      "numero": "09",
      "titulo": "Atención inicial de emergencias",
      "texto": "Organización de la respuesta hasta la llegada de ayuda especializada."
    }
  ],
  "fraseAprendizaje": "Todo dentro de una estructura de 9 módulos y 27 horas de formación.",
  "modalidadesTitulo": "Elige cómo realizar tu Curso de Primeros Auxilios",
  "virtual": {
    "kicker": "💻 Virtual para Colombia",
    "titulo": "Accede desde cualquier región del país",
    "lead": "Acceso a contenidos, videos, escenarios, retos y evaluaciones desde diferentes regiones del país.",
    "idealPara": [
      "Participantes fuera de Villavicencio",
      "Empresas con personal en varias ciudades",
      "Brigadistas y trabajadores en campo",
      "Organizaciones de los Llanos Orientales"
    ],
    "incluye": [
      "9 módulos y 27 horas de formación",
      "17 videos y contenidos interactivos",
      "Escenarios y retos de aprendizaje",
      "Evaluaciones de conocimiento",
      "Acceso desde cualquier región de Colombia"
    ],
    "ctaTexto": "Curso virtual",
    "ctaUrl": "/cursos",
    "imagenId": "virtual"
  },
  "presencial": {
    "kicker": "👨‍🏫 Presencial en Villavicencio y Meta",
    "titulo": "Prácticas con acompañamiento del instructor",
    "lead": "Prácticas, demostraciones, análisis de casos y acompañamiento directo del instructor en Villavicencio y municipios del Meta según programación.",
    "idealPara": [
      "Personas de Villavicencio",
      "Empresas del Meta",
      "Brigadas y equipos de trabajo",
      "Instituciones educativas y entidades públicas"
    ],
    "incluye": [
      "Demostraciones prácticas",
      "Análisis de casos reales",
      "Acompañamiento del instructor",
      "Actividades de simulación",
      "Capacitación empresarial in situ"
    ],
    "ctaTexto": "Capacitación presencial en Villavicencio",
    "ctaUrl": "/acerca",
    "imagenId": "presencial"
  },
  "regionalTitulo": "Capacitación en Primeros Auxilios para los Llanos Orientales",
  "regionalTexto": "La ubicación estratégica de Villavicencio permite proyectar programas de capacitación hacia diferentes zonas de los Llanos Orientales, atendiendo las necesidades de empresas y organizaciones que requieren fortalecer su preparación frente a emergencias. La modalidad virtual amplía esta posibilidad para participantes que no pueden desplazarse hasta Villavicencio.",
  "municipios": [
    "Villavicencio",
    "Acacías",
    "Restrepo",
    "Cumaral",
    "Granada",
    "Puerto López",
    "Puerto Gaitán",
    "Llanos Orientales",
    "Meta",
    "Colombia"
  ],
  "empresasTitulo": "Curso de Primeros Auxilios para Empresas en Villavicencio y Meta",
  "empresasTexto": "Las empresas pueden solicitar capacitaciones adaptadas a sus trabajadores y características operacionales. La formación puede resultar especialmente útil para organizaciones que requieren fortalecer la preparación frente a emergencias en el entorno laboral.",
  "empresasTipos": [
    "Empresas de transporte",
    "Logística",
    "Construcción",
    "Servicios",
    "Instituciones educativas",
    "Entidades públicas",
    "Personal operativo",
    "Brigadas",
    "Personal de Seguridad y Salud en el Trabajo",
    "Organizaciones con trabajadores en campo"
  ],
  "empresasCtaTitulo": "¿Necesitas capacitar a tu equipo?",
  "empresasCtaTexto": "Podemos estructurar una propuesta empresarial adaptada a tu organización en Villavicencio, el Meta y otras zonas según cobertura.",
  "empresasCtaBoton": "Solicitar propuesta empresarial",
  "empresasCtaUrl": "/acerca",
  "pesvTitulo": "Curso de RCP y Primeros Auxilios en Villavicencio",
  "pesvLead": "Uno de los componentes centrales del programa es la reanimación cardiopulmonar – RCP. El participante estudia conceptos relacionados con paro cardiorrespiratorio, cadena de supervivencia, compresiones torácicas, ventilaciones, desfibrilación y reconocimiento de situaciones críticas. Este contenido forma parte integral del Curso de Primeros Auxilios en Villavicencio y Meta.",
  "pesvItems": [
    "Paro cardiorrespiratorio",
    "Cadena de supervivencia",
    "Compresiones torácicas",
    "Ventilaciones",
    "Desfibrilación",
    "Reconocimiento de situaciones críticas"
  ],
  "pesvEnlaceTexto": "",
  "pesvEnlaceUrl": "",
  "metodologiaTitulo": "Modalidad mixta",
  "metodologiaPasos": [
    {
      "titulo": "Combina aprendizaje virtual con actividades prácticas presenciales",
      "texto": "La modalidad mixta integra contenidos en línea, videos, escenarios y evaluaciones con sesiones presenciales de práctica, demostración y acompañamiento del instructor en Villavicencio y el Meta según programación."
    }
  ],
  "audienciaTitulo": "¿A quién está dirigido el curso?",
  "audiencias": [
    {
      "icono": "👤",
      "titulo": "Personas particulares"
    },
    {
      "icono": "🏢",
      "titulo": "Empresas y organizaciones"
    },
    {
      "icono": "👷",
      "titulo": "Trabajadores"
    },
    {
      "icono": "🦺",
      "titulo": "Brigadistas"
    },
    {
      "icono": "🚗",
      "titulo": "Conductores"
    },
    {
      "icono": "🎓",
      "titulo": "Instituciones educativas"
    },
    {
      "icono": "🏛",
      "titulo": "Entidades públicas"
    },
    {
      "icono": "🤝",
      "titulo": "Organizaciones privadas"
    }
  ],
  "beneficiosTitulo": "Contenidos del programa",
  "beneficios": [
    "RCP y cadena de supervivencia",
    "Trauma y valoración inicial",
    "Manejo de la vía aérea",
    "Emergencias cardiovasculares y respiratorias",
    "Emergencias neurológicas",
    "Quemaduras e intoxicaciones",
    "Atención inicial de emergencias",
    "27 horas en 9 módulos con 17 videos"
  ],
  "certificacionTitulo": "Intensidad y estructura del programa",
  "certificacionTexto": "El programa tiene una intensidad total de 27 horas distribuidas en 9 módulos, con contenidos en modalidad virtual, presencial o mixta según la programación acordada.",
  "certificacion": {
    "duracion": "27 horas en 9 módulos",
    "modalidad": "Virtual • Presencial • Mixto",
    "evaluacion": "Evaluaciones y retos de aprendizaje según el programa",
    "certificado": "Según condiciones del programa y cumplimiento de requisitos",
    "vigencia": "Consulte vigencia según normativa aplicable",
    "entidad": "Institución formadora"
  },
  "instructoresTitulo": "Formación con acompañamiento especializado",
  "instructoresTexto": "El programa se desarrolla con instructores capacitados en primeros auxilios, RCP y atención inicial de emergencias, con metodología orientada a la práctica y la toma de decisiones en situaciones reales.",
  "instructoresItems": [
    "Instructores certificados en primeros auxilios",
    "Metodología práctica y participativa",
    "Análisis de casos y simulación",
    "Acompañamiento en modalidad presencial y mixta"
  ],
  "testimoniosTitulo": "",
  "testimonios": [],
  "faqTitulo": "Preguntas frecuentes sobre el Curso de Primeros Auxilios",
  "faq": [
    {
      "pregunta": "¿Dónde puedo hacer un Curso de Primeros Auxilios en Villavicencio?",
      "respuesta": "El programa puede desarrollarse presencialmente en Villavicencio según programación y también dispone de modalidad virtual."
    },
    {
      "pregunta": "¿Existe un Curso de Primeros Auxilios virtual en Colombia?",
      "respuesta": "Sí. La modalidad virtual permite acceder al programa desde diferentes ciudades y departamentos de Colombia."
    },
    {
      "pregunta": "¿Hay capacitación de Primeros Auxilios para empresas en el Meta?",
      "respuesta": "Sí. Pueden desarrollarse jornadas empresariales en Villavicencio y otros municipios del Meta según cobertura y programación."
    },
    {
      "pregunta": "¿El curso incluye RCP?",
      "respuesta": "Sí. El programa incluye contenidos relacionados con RCP, paro cardiorrespiratorio y cadena de supervivencia."
    },
    {
      "pregunta": "¿Cuánto dura el curso?",
      "respuesta": "El programa tiene una intensidad total de 27 horas distribuidas en 9 módulos."
    },
    {
      "pregunta": "¿El Curso de Primeros Auxilios está disponible para los Llanos Orientales?",
      "respuesta": "Sí. La modalidad virtual permite atender participantes de diferentes municipios de los Llanos Orientales, mientras que la modalidad presencial se programa según ubicación y cobertura."
    }
  ],
  "ctaFinalTitulo": "Curso de Primeros Auxilios en Villavicencio, Meta y Colombia",
  "ctaFinalLead": "Prepárate para reconocer lo urgente, organizar tu respuesta y tomar mejores decisiones cuando cada segundo cuenta.",
  "ctaFinalTexto": "27 horas • 9 módulos • Virtual • Presencial • Mixto",
  "ctaFinalUbicacion": "Villavicencio • Meta • Llanos Orientales • Colombia",
  "ctaFinalFrase": "Formación en Primeros Auxilios • RCP • Atención Inicial de Emergencias • Capacitación Empresarial",
  "footerSeoLine": "Curso de Primeros Auxilios en Villavicencio • Curso de Primeros Auxilios Meta • Curso Virtual de Primeros Auxilios Colombia • RCP • Atención Inicial de Emergencias • Capacitación Empresarial",
  "enlacesRelacionadosTitulo": "Formación relacionada en SERVIAL",
  "enlacesRelacionados": [
    {
      "texto": "¿Necesitas formación para conductores?",
      "etiqueta": "Cursos de conducción en Villavicencio",
      "url": "/cursos-conduccion"
    },
    {
      "texto": "¿Prefieres formación virtual?",
      "etiqueta": "Acceder al Aula Virtual",
      "url": "/servicios/aula-virtual"
    }
  ],
  imagenes: PRIMEROS_AUXILIOS_IMAGENES.map((img) => ({ ...img })),
};

function str(v: unknown, fb: string): string {
  const t = String(v ?? '').trim();
  return t || fb;
}

function arr<T>(v: unknown, fb: T[]): T[] {
  return Array.isArray(v) && v.length ? (v as T[]) : fb;
}

function arrAllowEmpty<T>(v: unknown, fb: T[]): T[] {
  return Array.isArray(v) ? (v as T[]) : fb;
}

function mergeImagenes(raw: unknown, fb: PaImagen[]): PaImagen[] {
  const src = Array.isArray(raw) ? raw : [];
  return fb.map((item, i) => {
    const r = src.find((x: PaImagen) => x?.id === item.id) || src[i];
    return {
      id: item.id,
      etiqueta: str(r?.etiqueta, item.etiqueta),
      url: String(r?.url ?? item.url).trim(),
      urlAbsoluta: String(r?.urlAbsoluta ?? item.urlAbsoluta ?? '').trim(),
      alt: str(r?.alt, item.alt),
      promptImagen: str(r?.promptImagen, item.promptImagen),
    };
  });
}

function mergeModalidad(raw: unknown, fb: PaModalidad): PaModalidad {
  const src = raw && typeof raw === 'object' ? (raw as Partial<PaModalidad>) : {};
  return {
    kicker: str(src.kicker, fb.kicker),
    titulo: str(src.titulo, fb.titulo),
    lead: str(src.lead, fb.lead),
    idealPara: arr(src.idealPara, fb.idealPara),
    incluye: arr(src.incluye, fb.incluye),
    ctaTexto: str(src.ctaTexto, fb.ctaTexto),
    ctaUrl: str(src.ctaUrl, fb.ctaUrl),
    imagenId: str(src.imagenId, fb.imagenId),
  };
}

function mergeCertificacion(raw: unknown, fb: PaCertificacion): PaCertificacion {
  const src = raw && typeof raw === 'object' ? (raw as Partial<PaCertificacion>) : {};
  return {
    duracion: str(src.duracion, fb.duracion),
    modalidad: str(src.modalidad, fb.modalidad),
    evaluacion: str(src.evaluacion, fb.evaluacion),
    certificado: str(src.certificado, fb.certificado),
    vigencia: str(src.vigencia, fb.vigencia),
    entidad: str(src.entidad, fb.entidad),
  };
}

function primerosAuxiliosNecesitaActualizarGuion(src: Partial<PortalPrimerosAuxiliosLanding>): boolean {
  const v = Number(src.guionVersion) || 0;
  if (v < PRIMEROS_AUXILIOS_GUION_VERSION) return true;
  const h1 = String(src.h1 || '').trim();
  if (h1 === 'Curso de Primeros Auxilios Virtual y Presencial') return true;
  const blob = [
    src.confianzaTitulo,
    src.confianzaTexto,
    src.queEsTexto,
    src.aprenderasTitulo,
    src.aprendizajes?.[0]?.titulo,
  ]
    .map((x) => String(x || ''))
    .join(' ');
  return /cada minuto cuenta|enfermedad repentina|conducci[oó]n defensiva|riesgo vial|percepci[oó]n del riesgo/i.test(blob);
}

function mergePrimerosAuxiliosPreservandoUsuario(
  src: Partial<PortalPrimerosAuxiliosLanding>,
  d: PortalPrimerosAuxiliosLanding,
): PortalPrimerosAuxiliosLanding {
  const idProgramaVinculado = String(src.idProgramaVinculado ?? '').trim();
  const out: PortalPrimerosAuxiliosLanding = {
    ...JSON.parse(JSON.stringify(d)) as PortalPrimerosAuxiliosLanding,
    guionVersion: PRIMEROS_AUXILIOS_GUION_VERSION,
    idProgramaVinculado,
    nombreProgramaVinculado: String(src.nombreProgramaVinculado ?? '').trim(),
    imagenes: mergeImagenes(src.imagenes, d.imagenes),
  };
  if (idProgramaVinculado) {
    out.ctaInscribirseUrl = `/cursos/${idProgramaVinculado}`;
  } else if (String(src.ctaInscribirseUrl || '').trim()) {
    out.ctaInscribirseUrl = str(src.ctaInscribirseUrl, d.ctaInscribirseUrl);
  }
  return out;
}

export function mergePrimerosAuxiliosLanding(raw?: Partial<PortalPrimerosAuxiliosLanding> | null): PortalPrimerosAuxiliosLanding {
  const d = PRIMEROS_AUXILIOS_LANDING;
  const src = raw && typeof raw === 'object' ? raw : {};
  if (primerosAuxiliosNecesitaActualizarGuion(src)) {
    return mergePrimerosAuxiliosPreservandoUsuario(src, d);
  }
  return {
    ...d,
    guionVersion: PRIMEROS_AUXILIOS_GUION_VERSION,
    kicker: str(src.kicker, d.kicker),
    titulo: str(src.titulo, d.titulo),
    tituloLinea2: str(src.tituloLinea2, d.tituloLinea2),
    subtitulo: str(src.subtitulo, d.subtitulo),
    h1: str(src.h1, d.h1),
    idProgramaVinculado: String(src.idProgramaVinculado ?? '').trim(),
    nombreProgramaVinculado: String(src.nombreProgramaVinculado ?? '').trim(),
    heroLead: str(src.heroLead, d.heroLead),
    ctaInscribirseTexto: str(src.ctaInscribirseTexto, d.ctaInscribirseTexto),
    ctaInscribirseUrl: str(src.ctaInscribirseUrl, d.ctaInscribirseUrl),
    ctaEmpresaTexto: str(src.ctaEmpresaTexto, d.ctaEmpresaTexto),
    ctaEmpresaUrl: str(src.ctaEmpresaUrl, d.ctaEmpresaUrl),
    ctaWhatsappTexto: str(src.ctaWhatsappTexto, d.ctaWhatsappTexto),
    ctaInicioTexto: str(src.ctaInicioTexto, d.ctaInicioTexto),
    ctaUrl: str(src.ctaUrl, d.ctaUrl),
    homeItems: arr(src.homeItems, d.homeItems),
    confianzaTitulo: str(src.confianzaTitulo, d.confianzaTitulo),
    confianzaTexto: str(src.confianzaTexto, d.confianzaTexto),
    pilares: arr(src.pilares, d.pilares),
    queEsTitulo: str(src.queEsTitulo, d.queEsTitulo),
    queEsTexto: str(src.queEsTexto, d.queEsTexto),
    cicloPasos: arr(src.cicloPasos, d.cicloPasos),
    cicloFrase: str(src.cicloFrase, d.cicloFrase),
    aprenderasTitulo: str(src.aprenderasTitulo, d.aprenderasTitulo),
    aprendizajes: arr(src.aprendizajes, d.aprendizajes),
    fraseAprendizaje: str(src.fraseAprendizaje, d.fraseAprendizaje),
    modalidadesTitulo: str(src.modalidadesTitulo, d.modalidadesTitulo),
    virtual: mergeModalidad(src.virtual, d.virtual),
    presencial: mergeModalidad(src.presencial, d.presencial),
    regionalTitulo: str(src.regionalTitulo, d.regionalTitulo),
    regionalTexto: str(src.regionalTexto, d.regionalTexto),
    municipios: arr(src.municipios, d.municipios),
    empresasTitulo: str(src.empresasTitulo, d.empresasTitulo),
    empresasTexto: str(src.empresasTexto, d.empresasTexto),
    empresasTipos: arr(src.empresasTipos, d.empresasTipos),
    empresasCtaTitulo: str(src.empresasCtaTitulo, d.empresasCtaTitulo),
    empresasCtaTexto: str(src.empresasCtaTexto, d.empresasCtaTexto),
    empresasCtaBoton: str(src.empresasCtaBoton, d.empresasCtaBoton),
    empresasCtaUrl: str(src.empresasCtaUrl, d.empresasCtaUrl),
    pesvTitulo: str(src.pesvTitulo, d.pesvTitulo),
    pesvLead: str(src.pesvLead, d.pesvLead),
    pesvItems: arr(src.pesvItems, d.pesvItems),
    pesvEnlaceTexto: str(src.pesvEnlaceTexto, d.pesvEnlaceTexto),
    pesvEnlaceUrl: str(src.pesvEnlaceUrl, d.pesvEnlaceUrl),
    metodologiaTitulo: str(src.metodologiaTitulo, d.metodologiaTitulo),
    metodologiaPasos: arr(src.metodologiaPasos, d.metodologiaPasos),
    audienciaTitulo: str(src.audienciaTitulo, d.audienciaTitulo),
    audiencias: arr(src.audiencias, d.audiencias),
    beneficiosTitulo: str(src.beneficiosTitulo, d.beneficiosTitulo),
    beneficios: arr(src.beneficios, d.beneficios),
    certificacionTitulo: str(src.certificacionTitulo, d.certificacionTitulo),
    certificacionTexto: str(src.certificacionTexto, d.certificacionTexto),
    certificacion: mergeCertificacion(src.certificacion, d.certificacion),
    instructoresTitulo: str(src.instructoresTitulo, d.instructoresTitulo),
    instructoresTexto: str(src.instructoresTexto, d.instructoresTexto),
    instructoresItems: arr(src.instructoresItems, d.instructoresItems),
    testimoniosTitulo: str(src.testimoniosTitulo, d.testimoniosTitulo),
    testimonios: arrAllowEmpty(src.testimonios, d.testimonios),
    faqTitulo: str(src.faqTitulo, d.faqTitulo),
    faq: arr(src.faq, d.faq),
    ctaFinalTitulo: str(src.ctaFinalTitulo, d.ctaFinalTitulo),
    ctaFinalLead: str(src.ctaFinalLead, d.ctaFinalLead),
    ctaFinalTexto: str(src.ctaFinalTexto, d.ctaFinalTexto),
    ctaFinalUbicacion: str(src.ctaFinalUbicacion, d.ctaFinalUbicacion),
    ctaFinalFrase: str(src.ctaFinalFrase, d.ctaFinalFrase),
    footerSeoLine: str(src.footerSeoLine, d.footerSeoLine),
    enlacesRelacionadosTitulo: str(src.enlacesRelacionadosTitulo, d.enlacesRelacionadosTitulo),
    enlacesRelacionados: mergeEnlacesRelacionados(src.enlacesRelacionados, d.enlacesRelacionados),
    imagenes: mergeImagenes(src.imagenes, d.imagenes),
  };
}

export function imagenPrimerosAuxiliosPorId(
  landing: PortalPrimerosAuxiliosLanding,
  id: string,
): PaImagen | undefined {
  return landing.imagenes.find((i) => i.id === id);
}

/** Ruta del botón Inscríbete: ficha del programa vinculado o URL manual. */
export function urlInscripcionPrimerosAuxilios(landing: PortalPrimerosAuxiliosLanding): string {
  const id = landing.idProgramaVinculado?.trim();
  if (id) return `/cursos/${id}`;
  const raw = landing.ctaInscribirseUrl?.trim() || '/cursos';
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith('/') ? raw : `/${raw}`;
}

/** CTA de modalidad: si apunta al catálogo genérico, usa el programa vinculado. */
export function urlCtaModalidadPrimerosAuxilios(
  landing: PortalPrimerosAuxiliosLanding,
  ctaUrl: string | null | undefined,
): string {
  const raw = String(ctaUrl || '').trim();
  if (landing.idProgramaVinculado?.trim() && (!raw || raw === '/cursos')) {
    return urlInscripcionPrimerosAuxilios(landing);
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!raw) return '/cursos';
  return raw.startsWith('/') ? raw : `/${raw}`;
}
