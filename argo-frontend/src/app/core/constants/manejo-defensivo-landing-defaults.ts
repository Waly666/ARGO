/** Página /curso-manejo-defensivo — contenido editable desde el ERP. */

import { mergeEnlacesRelacionados, PortalEnlaceRelacionado } from '../portal-enlace-relacionado.util';

export interface MdImagen {
  id: string;
  etiqueta: string;
  url: string;
  urlAbsoluta?: string;
  alt: string;
  /** Solo ERP: prompt para generar la foto. No se muestra en el portal. */
  promptImagen: string;
}

export interface MdPilar {
  icono: string;
  titulo: string;
  texto: string;
}

export interface MdAprendizaje {
  numero: string;
  titulo: string;
  texto: string;
}

export interface MdModalidad {
  kicker: string;
  titulo: string;
  lead: string;
  idealPara: string[];
  incluye: string[];
  ctaTexto: string;
  ctaUrl: string;
  imagenId: string;
}

export interface MdPaso {
  titulo: string;
  texto: string;
}

export interface MdAudiencia {
  icono: string;
  titulo: string;
}

export interface MdTestimonio {
  texto: string;
  autor: string;
  estrellas: number;
}

export interface MdFaq {
  pregunta: string;
  respuesta: string;
}

export interface MdHomeItem {
  numero: number;
  icon: string;
  acento: 'blue' | 'teal' | 'orange' | 'green' | 'purple';
  titulo: string;
  texto: string;
}

export interface MdCertificacion {
  duracion: string;
  modalidad: string;
  evaluacion: string;
  certificado: string;
  vigencia: string;
  entidad: string;
}

export interface PortalManejoDefensivoLanding {
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
  homeItems: MdHomeItem[];
  confianzaTitulo: string;
  confianzaTexto: string;
  pilares: MdPilar[];
  queEsTitulo: string;
  queEsTexto: string;
  cicloPasos: string[];
  cicloFrase: string;
  aprenderasTitulo: string;
  aprendizajes: MdAprendizaje[];
  fraseAprendizaje: string;
  modalidadesTitulo: string;
  virtual: MdModalidad;
  presencial: MdModalidad;
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
  metodologiaPasos: MdPaso[];
  audienciaTitulo: string;
  audiencias: MdAudiencia[];
  beneficiosTitulo: string;
  beneficios: string[];
  certificacionTitulo: string;
  certificacionTexto: string;
  certificacion: MdCertificacion;
  instructoresTitulo: string;
  instructoresTexto: string;
  instructoresItems: string[];
  testimoniosTitulo: string;
  testimonios: MdTestimonio[];
  faqTitulo: string;
  faq: MdFaq[];
  ctaFinalTitulo: string;
  ctaFinalLead: string;
  ctaFinalTexto: string;
  ctaFinalUbicacion: string;
  ctaFinalFrase: string;
  footerSeoLine: string;
  enlacesRelacionadosTitulo: string;
  enlacesRelacionados: PortalEnlaceRelacionado[];
  imagenes: MdImagen[];
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
): MdImagen => ({ id, etiqueta, url: '', alt, promptImagen });

export const MANEJO_DEFENSIVO_IMAGENES: MdImagen[] = [
  IMG(
    'hero',
    'Hero (conductor o instructor)',
    'Curso de manejo defensivo para conductores en Villavicencio Meta',
    promptFotoHorizontal(
      'Instructor de conducción y un conductor adulto junto a un automóvil en un centro de formación vial; atmósfera profesional de curso de manejo defensivo.',
    ),
  ),
  IMG(
    'infografia',
    'Infografía: observar → actuar',
    'Ciclo del manejo defensivo: observar, identificar, anticipar, decidir y actuar',
    promptGraficoHorizontal(
      'Ciclo del manejo defensivo en cinco pasos: observar, identificar, anticipar, decidir y actuar. Iconos simples, flechas claras, fondo oscuro.',
    ),
  ),
  IMG(
    'aprendizaje',
    'Imagen central de aprendizaje',
    'Identificación de riesgos en curso de conducción defensiva',
    promptFotoHorizontal(
      'Vista desde el asiento del conductor identificando riesgos en la vía: tráfico, motocicletas y peatones; manos en el volante, concentración.',
    ),
  ),
  IMG(
    'virtual',
    'Curso virtual',
    'Curso de manejo defensivo virtual en Colombia',
    promptFotoHorizontal(
      'Adulto tomando un curso de manejo defensivo en un portátil, en casa u oficina; en la pantalla se intuye una clase (sin texto legible).',
    ),
  ),
  IMG(
    'presencial',
    'Curso presencial',
    'Capacitación presencial de manejo defensivo en Villavicencio',
    promptFotoHorizontal(
      'Aula de capacitación presencial: instructor frente a un grupo de conductores adultos, pizarra o proyección, ambiente profesional.',
    ),
  ),
  IMG(
    'regional',
    'Enfoque regional',
    'Capacitación de manejo defensivo en Meta y Llanos Orientales',
    promptFotoHorizontal(
      'Carretera de los Llanos Orientales con cielo amplio y sabana; sensación de formación vial en Meta, Colombia.',
    ),
  ),
  IMG(
    'empresas',
    'Capacitación empresarial',
    'Capacitación empresarial en manejo defensivo y seguridad vial',
    promptFotoHorizontal(
      'Capacitación empresarial a conductores de flota: grupo de adultos en salón o patio de vehículos, uniformes discretos, sin logos.',
    ),
  ),
  IMG(
    'metodologia',
    'Metodología',
    'Metodología del curso de conducción defensiva',
    promptFotoHorizontal(
      'Taller práctico: instructor y alumnos analizando un caso de seguridad vial alrededor de una mesa, materiales didácticos genéricos.',
    ),
  ),
  IMG(
    'beneficios',
    'Beneficios',
    'Conductor aplicando percepción del riesgo en el curso de manejo defensivo',
    promptFotoHorizontal(
      'Conductor profesional aplicando percepción del riesgo, mirada atenta al entorno, vehículo en movimiento suave, día despejado.',
    ),
  ),
  IMG(
    'certificado',
    'Certificado',
    'Certificación del curso de manejo defensivo',
    promptFotoHorizontal(
      'Persona adulta sosteniendo un certificado de capacitación genérico (sin nombres ni logos reales), ambiente institucional sobrio.',
    ),
  ),
  IMG(
    'instructor',
    'Instructor',
    'Instructor de seguridad vial en curso de manejo defensivo',
    promptFotoHorizontal(
      'Instructor de seguridad vial explicando en un aula o junto a un vehículo, gesto claro, vestimenta profesional, plano horizontal.',
    ),
  ),
  IMG(
    'cierre',
    'Cierre',
    'Anticípate al riesgo. Conduce para proteger la vida.',
    promptFotoHorizontal(
      'Fotografía inspiradora de un conductor al atardecer en una vía de Meta; sensación de anticiparse al riesgo y proteger la vida.',
    ),
  ),
];

export const MANEJO_DEFENSIVO_LANDING: PortalManejoDefensivoLanding = {
  kicker: 'Seguridad vial · Villavicencio · Meta · Colombia',
  titulo: 'Manejo Defensivo',
  tituloLinea2: 'Anticípate al riesgo',
  subtitulo: 'Curso virtual y presencial para conductores y empresas',
  h1: 'Curso de Manejo Defensivo Virtual y Presencial',
  idProgramaVinculado: '',
  nombreProgramaVinculado: '',
  heroLead:
    'Fortalece tus competencias para anticipar riesgos, tomar decisiones seguras y prevenir siniestros viales. Capacitación dirigida a conductores, motociclistas, empresas, organizaciones y responsables de seguridad vial en Villavicencio, Meta, Llanos Orientales y toda Colombia.',
  ctaInscribirseTexto: 'Inscríbete al curso',
  ctaInscribirseUrl: '/cursos',
  ctaEmpresaTexto: 'Solicita capacitación para tu empresa',
  ctaEmpresaUrl: '/acerca',
  ctaWhatsappTexto: 'Hablar por WhatsApp',
  ctaInicioTexto: 'Conoce el curso de manejo defensivo',
  ctaUrl: '/curso-manejo-defensivo',
  homeItems: [
    {
      numero: 1,
      icon: 'shield-check',
      acento: 'teal',
      titulo: 'Prevención real del riesgo',
      texto: 'Identificar peligros, anticiparse a otros actores viales y decidir para reducir la probabilidad de un siniestro.',
    },
    {
      numero: 2,
      icon: 'document',
      acento: 'blue',
      titulo: 'Virtual y presencial',
      texto: 'Formación en línea para toda Colombia y capacitación práctica en Villavicencio, Meta y los Llanos Orientales.',
    },
    {
      numero: 3,
      icon: 'users',
      acento: 'green',
      titulo: 'Personas y empresas',
      texto: 'Conductores, motociclistas, flotas y programas de seguridad vial empresarial, incluido el PESV cuando corresponda.',
    },
  ],
  confianzaTitulo: 'Capacitación orientada a la prevención real del riesgo vial',
  confianzaTexto:
    'El manejo defensivo va mucho más allá de conocer las normas de tránsito. Consiste en desarrollar la capacidad de identificar peligros, anticiparse a los errores de otros actores viales y tomar decisiones que reduzcan la probabilidad y gravedad de un siniestro. Nuestro curso integra conocimientos de seguridad vial, percepción del riesgo y comportamiento seguro para transformar la forma en que las personas conducen.',
  pilares: [
    { icono: '🛡', titulo: 'Prevención', texto: 'Reducir la probabilidad y la gravedad de un siniestro.' },
    { icono: '👁', titulo: 'Percepción del riesgo', texto: 'Ver con tiempo lo que otros aún no advierten.' },
    { icono: '🚘', titulo: 'Conducción segura', texto: 'Hábitos que protegen al conductor y a los demás.' },
    { icono: '🧠', titulo: 'Toma de decisiones', texto: 'Elegir la alternativa con menor riesgo.' },
  ],
  queEsTitulo: '¿Qué es el manejo defensivo y por qué es importante?',
  queEsTexto:
    'El manejo defensivo o conducción defensiva es una estrategia de conducción orientada a prevenir siniestros viales mediante la observación permanente del entorno, la anticipación de riesgos y la adopción de decisiones seguras. Un conductor defensivo no solamente cumple las normas: aprende a reconocer situaciones potencialmente peligrosas antes de que se conviertan en una emergencia.',
  cicloPasos: ['Observar', 'Identificar', 'Anticipar', 'Decidir', 'Actuar'],
  cicloFrase: 'Conductor defensivo = conductor que se anticipa al riesgo',
  aprenderasTitulo: '¿Qué aprenderás en el Curso de Manejo Defensivo?',
  aprendizajes: [
    {
      numero: '01',
      titulo: 'Percepción del riesgo',
      texto:
        'Identificar anticipadamente vehículos, peatones, motociclistas, ciclistas, condiciones de infraestructura y situaciones que pueden desencadenar un siniestro.',
    },
    {
      numero: '02',
      titulo: 'Gestión de la velocidad',
      texto: 'Comprender cómo la velocidad afecta el tiempo de reacción, la distancia de frenado y la gravedad de las lesiones.',
    },
    {
      numero: '03',
      titulo: 'Distancia de seguridad',
      texto: 'Aplicar criterios seguros de seguimiento que permitan disponer del tiempo necesario para reaccionar.',
    },
    {
      numero: '04',
      titulo: 'Observación y anticipación',
      texto: 'Desarrollar técnicas de exploración visual de la vía y reconocimiento temprano de amenazas.',
    },
    {
      numero: '05',
      titulo: 'Intersecciones y puntos de conflicto',
      texto: 'Reconocer riesgos asociados con cruces, giros, glorietas, convergencias y divergencias.',
    },
    {
      numero: '06',
      titulo: 'Adelantamientos seguros',
      texto: 'Evaluar visibilidad, velocidad, espacio disponible y comportamiento de otros vehículos antes de realizar una maniobra.',
    },
    {
      numero: '07',
      titulo: 'Conducción nocturna',
      texto: 'Gestionar adecuadamente visibilidad, iluminación, fatiga y velocidad.',
    },
    {
      numero: '08',
      titulo: 'Distracción',
      texto: 'Reconocer los riesgos generados por teléfonos celulares, dispositivos y otras fuentes de pérdida de atención.',
    },
    {
      numero: '09',
      titulo: 'Fatiga y somnolencia',
      texto: 'Identificar señales tempranas de fatiga y adoptar decisiones preventivas.',
    },
    {
      numero: '10',
      titulo: 'Lluvia y condiciones adversas',
      texto: 'Adaptar velocidad, distancia y maniobras ante lluvia, baja adherencia, poca visibilidad y otras condiciones ambientales.',
    },
    {
      numero: '11',
      titulo: 'Actores viales vulnerables',
      texto: 'Mejorar la convivencia segura con peatones, ciclistas y motociclistas.',
    },
    {
      numero: '12',
      titulo: 'Respuesta ante situaciones críticas',
      texto: 'Aprender principios preventivos para enfrentar acontecimientos inesperados sin incrementar el riesgo.',
    },
  ],
  fraseAprendizaje: 'Aprender a conducir defensivamente es aprender a leer el riesgo antes de que ocurra.',
  modalidadesTitulo: 'Elige cómo realizar tu Curso de Manejo Defensivo',
  virtual: {
    kicker: '💻 Curso virtual',
    titulo: 'Capacítate desde cualquier lugar de Colombia',
    lead: 'Ideal para conductores, motociclistas, empresas, trabajadores y organizaciones con personal en diferentes ciudades.',
    idealPara: [
      'Conductores',
      'Motociclistas',
      'Empresas',
      'Trabajadores',
      'Organizaciones con personal en diferentes ciudades',
      'Programas de formación empresarial',
    ],
    incluye: [
      'Acceso en línea',
      'Contenidos audiovisuales',
      'Evaluaciones',
      'Material didáctico',
      'Seguimiento de aprendizaje',
      'Certificación, cuando corresponda',
    ],
    ctaTexto: 'Quiero hacer el curso virtual',
    ctaUrl: '/cursos',
    imagenId: 'virtual',
  },
  presencial: {
    kicker: '👨‍🏫 Curso presencial',
    titulo: 'Formación práctica y participativa',
    lead: 'Disponible especialmente para organizaciones, empresas y grupos en Villavicencio, Meta, Llanos Orientales y otras ciudades de Colombia según programación.',
    idealPara: [
      'Villavicencio',
      'Meta',
      'Llanos Orientales',
      'Otras ciudades de Colombia según programación',
    ],
    incluye: [
      'Instructor',
      'Talleres',
      'Análisis de casos',
      'Percepción de peligros',
      'Evaluación de conocimientos',
      'Actividades prácticas',
      'Capacitación empresarial',
    ],
    ctaTexto: 'Solicitar capacitación presencial',
    ctaUrl: '/acerca',
    imagenId: 'presencial',
  },
  regionalTitulo: 'Curso de Manejo Defensivo en Villavicencio, Meta y los Llanos Orientales',
  regionalTexto:
    'Villavicencio es uno de los principales centros empresariales, logísticos y de transporte de los Llanos Orientales. Las dinámicas de movilidad de la región exigen conductores preparados para enfrentar diferentes entornos urbanos y carreteros. Nuestro programa puede orientarse a conductores y organizaciones de la región y de Colombia.',
  municipios: [
    'Villavicencio',
    'Acacías',
    'Restrepo',
    'Cumaral',
    'Puerto López',
    'Granada',
    'Puerto Gaitán',
    'otros municipios del Meta',
    'Llanos Orientales',
    'Colombia',
  ],
  empresasTitulo: 'Capacitación de Manejo Defensivo para Empresas',
  empresasTexto:
    'Las organizaciones que operan vehículos o cuentan con trabajadores que conducen necesitan fortalecer permanentemente sus competencias para la gestión del riesgo vial. El curso de manejo defensivo para empresas puede adaptarse a distintos sectores y tamaños de flota.',
  empresasTipos: [
    'Empresas de transporte',
    'Empresas de logística',
    'Contratistas',
    'Entidades públicas',
    'Empresas de servicios',
    'Organizaciones con flotas',
    'Motociclistas laborales',
    'Conductores comerciales',
    'Trabajadores que utilizan vehículos durante su jornada',
  ],
  empresasCtaTitulo: '¿Necesitas capacitar 10, 20, 50 o más conductores?',
  empresasCtaTexto: 'Podemos estructurar una capacitación ajustada a las características de tu organización.',
  empresasCtaBoton: 'Solicitar propuesta empresarial',
  empresasCtaUrl: '/acerca',
  pesvTitulo: 'Fortalece la gestión del riesgo vial de tu organización',
  pesvLead:
    'El curso puede incorporarse dentro de programas de capacitación en seguridad vial para conductores y de la gestión empresarial del riesgo.',
  pesvItems: [
    'Seguridad vial',
    'Prevención de riesgos',
    'Formación de conductores',
    'Conducción segura',
    'Gestión de flotas',
    'Cultura vial',
    'Actualización de competencias',
    'Acciones relacionadas con el Plan Estratégico de Seguridad Vial – PESV, cuando corresponda',
  ],
  pesvEnlaceTexto: 'Conoce nuestros servicios relacionados con el Plan Estratégico de Seguridad Vial – PESV.',
  pesvEnlaceUrl: '/servicios',
  metodologiaTitulo: 'Una metodología basada en situaciones reales de conducción',
  metodologiaPasos: [
    { titulo: 'Conocer', texto: 'Comprender los principios de seguridad vial.' },
    { titulo: 'Observar', texto: 'Aprender a explorar correctamente el entorno vial.' },
    { titulo: 'Identificar', texto: 'Reconocer peligros antes de que se materialicen.' },
    { titulo: 'Anticipar', texto: 'Prever posibles comportamientos de otros actores.' },
    { titulo: 'Decidir', texto: 'Seleccionar la alternativa con menor riesgo.' },
    { titulo: 'Actuar', texto: 'Ejecutar una maniobra segura.' },
  ],
  audienciaTitulo: '¿Quién puede realizar el Curso de Manejo Defensivo?',
  audiencias: [
    { icono: '🚗', titulo: 'Conductores particulares' },
    { icono: '🚚', titulo: 'Conductores de vehículos de carga' },
    { icono: '🚌', titulo: 'Conductores de transporte' },
    { icono: '🏍', titulo: 'Motociclistas' },
    { icono: '🚐', titulo: 'Conductores empresariales' },
    { icono: '🏢', titulo: 'Empresas y organizaciones' },
    { icono: '👷', titulo: 'Trabajadores que conducen por motivos laborales' },
    { icono: '🦺', titulo: 'Responsables de seguridad vial y SST' },
  ],
  beneficiosTitulo: 'Beneficios de aprender Manejo Defensivo',
  beneficios: [
    'Mejorar la percepción de peligros.',
    'Reconocer situaciones de alto riesgo.',
    'Adoptar decisiones preventivas.',
    'Gestionar adecuadamente la velocidad.',
    'Mejorar los hábitos de conducción.',
    'Fortalecer la cultura de seguridad vial.',
    'Reducir conductas inseguras.',
    'Proteger al conductor, pasajeros y demás actores viales.',
  ],
  certificacionTitulo: 'Certificación del Curso de Manejo Defensivo',
  certificacionTexto:
    'Al finalizar satisfactoriamente el proceso de formación y cumplir las condiciones establecidas para el programa, el participante podrá recibir la certificación correspondiente.',
  certificacion: {
    duracion: 'Indique la intensidad horaria real del programa',
    modalidad: 'Virtual / Presencial',
    evaluacion: 'Indique si aplica evaluación y sus condiciones',
    certificado: 'Indique las condiciones reales de certificación (asistencia, aprobación, etc.)',
    vigencia: 'Indique si aplica vigencia',
    entidad: 'Nombre de la institución que certifica',
  },
  instructoresTitulo: 'Formación orientada por especialistas en seguridad vial',
  instructoresTexto:
    'Presente aquí la experiencia real de la organización y de sus instructores. Complete formación, trayectoria y áreas de especialidad con información verificable.',
  instructoresItems: [
    'Formación en seguridad vial',
    'Experiencia profesional',
    'Áreas de especialidad',
    'Experiencia en capacitación',
    'Investigación y movilidad',
    'Gestión del riesgo',
  ],
  testimoniosTitulo: 'Personas y organizaciones que fortalecen su seguridad vial',
  testimonios: [],
  faqTitulo: 'Preguntas frecuentes sobre el Curso de Manejo Defensivo',
  faq: [
    {
      pregunta: '¿Qué es un curso de manejo defensivo?',
      respuesta:
        'Es una formación orientada a desarrollar conocimientos y habilidades para identificar peligros, anticiparse a situaciones críticas y adoptar decisiones de conducción más seguras.',
    },
    {
      pregunta: '¿El curso puede realizarse virtualmente?',
      respuesta:
        'Sí. El programa puede ofrecerse mediante modalidad virtual, permitiendo la participación de personas y organizaciones ubicadas en diferentes regiones de Colombia.',
    },
    {
      pregunta: '¿Hay curso presencial en Villavicencio?',
      respuesta:
        'Sí, cuando exista programación o se acuerde capacitación para empresas y grupos en Villavicencio y el Meta.',
    },
    {
      pregunta: '¿El curso está disponible para empresas?',
      respuesta:
        'Sí. Se pueden desarrollar jornadas de formación para conductores, trabajadores y organizaciones.',
    },
    {
      pregunta: '¿El curso sirve para motociclistas?',
      respuesta:
        'El programa puede incorporar contenidos específicos de percepción del riesgo y conducción segura dirigidos a motociclistas.',
    },
    {
      pregunta: '¿Dónde se realizan las capacitaciones?',
      respuesta:
        'La oferta presencial puede concentrarse en Villavicencio, Meta y los Llanos Orientales y ampliarse a otras ciudades de Colombia según disponibilidad.',
    },
    {
      pregunta: '¿Entregan certificado?',
      respuesta:
        'Indique aquí la condición real de certificación, requisitos de asistencia, evaluación y aprobación.',
    },
    {
      pregunta: '¿Cuánto dura el curso?',
      respuesta: 'Indique aquí la intensidad horaria real del programa.',
    },
  ],
  ctaFinalTitulo: 'La seguridad comienza antes de poner el vehículo en movimiento',
  ctaFinalLead: 'Conducir defensivamente significa aprender a anticiparse al riesgo y tomar decisiones que protejan la vida.',
  ctaFinalTexto: 'Realiza nuestro Curso de Manejo Defensivo Virtual o Presencial.',
  ctaFinalUbicacion: 'Villavicencio | Meta | Llanos Orientales | Colombia',
  ctaFinalFrase: 'Anticípate al riesgo. Conduce para proteger la vida.',
  footerSeoLine:
    'Cursos de Seguridad Vial | Manejo Defensivo | Capacitación Empresarial | PESV | Formación de Conductores',
  enlacesRelacionadosTitulo: 'Formación relacionada en SERVIAL',
  enlacesRelacionados: [],
  imagenes: MANEJO_DEFENSIVO_IMAGENES.map((img) => ({ ...img })),
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

function mergeImagenes(raw: unknown, fb: MdImagen[]): MdImagen[] {
  const src = Array.isArray(raw) ? raw : [];
  return fb.map((item, i) => {
    const r = src.find((x: MdImagen) => x?.id === item.id) || src[i];
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

function mergeModalidad(raw: unknown, fb: MdModalidad): MdModalidad {
  const src = raw && typeof raw === 'object' ? (raw as Partial<MdModalidad>) : {};
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

function mergeCertificacion(raw: unknown, fb: MdCertificacion): MdCertificacion {
  const src = raw && typeof raw === 'object' ? (raw as Partial<MdCertificacion>) : {};
  return {
    duracion: str(src.duracion, fb.duracion),
    modalidad: str(src.modalidad, fb.modalidad),
    evaluacion: str(src.evaluacion, fb.evaluacion),
    certificado: str(src.certificado, fb.certificado),
    vigencia: str(src.vigencia, fb.vigencia),
    entidad: str(src.entidad, fb.entidad),
  };
}

export function mergeManejoDefensivoLanding(raw?: Partial<PortalManejoDefensivoLanding> | null): PortalManejoDefensivoLanding {
  const d = MANEJO_DEFENSIVO_LANDING;
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    ...d,
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

export function imagenManejoDefensivoPorId(
  landing: PortalManejoDefensivoLanding,
  id: string,
): MdImagen | undefined {
  return landing.imagenes.find((i) => i.id === id);
}

/** Ruta del botón Inscríbete: ficha del programa vinculado o URL manual. */
export function urlInscripcionManejoDefensivo(landing: PortalManejoDefensivoLanding): string {
  const id = landing.idProgramaVinculado?.trim();
  if (id) return `/cursos/${id}`;
  const raw = landing.ctaInscribirseUrl?.trim() || '/cursos';
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith('/') ? raw : `/${raw}`;
}

/** CTA de modalidad: si apunta al catálogo genérico, usa el programa vinculado. */
export function urlCtaModalidadManejoDefensivo(
  landing: PortalManejoDefensivoLanding,
  ctaUrl: string | null | undefined,
): string {
  const raw = String(ctaUrl || '').trim();
  if (landing.idProgramaVinculado?.trim() && (!raw || raw === '/cursos')) {
    return urlInscripcionManejoDefensivo(landing);
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!raw) return '/cursos';
  return raw.startsWith('/') ? raw : `/${raw}`;
}
