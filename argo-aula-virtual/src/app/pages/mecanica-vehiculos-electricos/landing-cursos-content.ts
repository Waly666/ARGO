/** Landing de cursos: contenido editable para anunciar el curso que se esté promocionando. */

export type LcZonaImagen = 'hero-desktop' | 'hero-mobile' | 'lateral' | 'ancho' | 'galeria';

export interface LcBloque {
  titulo: string;
  texto: string;
}

export interface LcDato {
  titulo: string;
  texto: string;
  /** Si tiene valor, la tarjeta muestra el precio en grande. */
  precio: string;
}

export interface LcModulo {
  numero: string;
  titulo: string;
  texto: string;
}

export interface LcFaq {
  pregunta: string;
  respuesta: string;
}

export interface LcImagen {
  id: string;
  etiqueta: string;
  zona: LcZonaImagen;
  url: string;
  urlAbsoluta?: string;
  alt: string;
}

export interface PortalLandingCursos {
  h1: string;
  bandTexto: string;
  habilidadesKicker: string;
  habilidadesTitulo: string;
  habilidadesLead: string;
  habilidades: LcBloque[];
  programaKicker: string;
  programaTitulo: string;
  programaLead: string;
  modulos: LcModulo[];
  extras: LcBloque[];
  audienciaKicker: string;
  audienciaTitulo: string;
  audienciaParrafos: string[];
  audienciaNota: string;
  datosKicker: string;
  datosTitulo: string;
  datos: LcDato[];
  faqKicker: string;
  faqTitulo: string;
  faq: LcFaq[];
  ctaKicker: string;
  ctaTitulo: string;
  ctaTexto: string;
  ctaComprarTexto: string;
  ctaComprarUrl: string;
  ctaAsesorTexto: string;
  imagenes: LcImagen[];
}

export const LC_ZONAS: { id: LcZonaImagen; label: string }[] = [
  { id: 'hero-desktop', label: 'Banner de escritorio' },
  { id: 'hero-mobile', label: 'Banner de móvil' },
  { id: 'lateral', label: 'Foto al lado del texto' },
  { id: 'ancho', label: 'Vehículo en carga' },
  { id: 'galeria', label: 'Galería' },
];

const IMAGENES: LcImagen[] = [
  {
    id: 'hero-desktop',
    etiqueta: 'Banner de escritorio',
    zona: 'hero-desktop',
    url: '/assets/mecanica-ev/hero-desktop.webp',
    alt: 'Curso de mecánica básica de vehículos híbridos y eléctricos. 40 horas, modalidad virtual, aula, APK y certificado. Por solo 200.000 pesos.',
  },
  {
    id: 'hero-mobile',
    etiqueta: 'Banner de móvil',
    zona: 'hero-mobile',
    url: '/assets/mecanica-ev/hero-mobile.webp',
    alt: 'Curso de mecánica básica de vehículos híbridos y eléctricos. 40 horas, modalidad virtual, aula, APK y certificado. Por solo 200.000 pesos.',
  },
  {
    id: 'formacion',
    etiqueta: 'Foto de formación',
    zona: 'lateral',
    url: '',
    alt: 'Dos técnicos en un taller de formación revisan un diagrama y una pantalla de diagnóstico junto a un vehículo eléctrico.',
  },
  {
    id: 'carga',
    etiqueta: 'Vehículo en carga',
    zona: 'ancho',
    url: '',
    alt: 'Vehículo eléctrico conectado a un cargador público, de día.',
  },
];

export const LANDING_CURSOS_DEFAULT: PortalLandingCursos = {
  h1: 'Mecánica básica de vehículos híbridos y eléctricos',
  bandTexto: 'Antes de abrir un híbrido o un eléctrico se aprende a leer',
  habilidadesKicker: 'Lo que trabaja el curso',
  habilidadesTitulo: 'Habilidades que se practican en las clases',
  habilidadesLead: 'Cada punto sale del programa del curso. No es una lista de cargos ni una promesa de empleo.',
  habilidades: [
    { titulo: 'Ordenar el caso por el síntoma', texto: 'Sesenta fallas ordenadas por síntoma, con semáforo de riesgo y la secuencia mirar, leer, medir y decidir.' },
    { titulo: 'Reconocer la alta tensión', texto: 'Equipo de protección, desconexión, ausencia de tensión, bloqueo y el momento en que el caso se debe derivar. El manual del vehículo manda sobre el video y sobre la costumbre del taller.' },
    { titulo: 'Leer la batería por bloques', texto: 'Arquitectura del paquete, lectura con escáner y diferencia entre bloques, para no cambiar todo el conjunto por el título de un código.' },
    { titulo: 'Seguir el recorrido de la energía', texto: 'Inversor, motores-generadores, convertidor de 12 V, aislamiento e interlock. Qué se puede leer y qué se deja quieto mientras los capacitores sigan cargados.' },
    { titulo: 'Medir con el instrumento que corresponde', texto: 'Multímetro de categoría adecuada, megóhmetro, escáner, pinza y datos en vivo. Medir de más, o con el equipo equivocado, se trata como un error, igual que adivinar.' },
    { titulo: 'Cerrar el trabajo por escrito', texto: 'Entrevista, inspección, datos en vivo, informe, cotización y constancia. Si hace falta, el vehículo se entrega a quien sí puede intervenirlo.' },
  ],
  programaKicker: 'Contenido',
  programaTitulo: 'Diez clases y tres piezas de consulta',
  programaLead: 'El curso también incluye un compendio de normativa colombiana, una biblioteca de 21 documentos y una evaluación final.',
  modulos: [
    { numero: '01', titulo: 'Mapa del técnico', texto: 'Sesenta fallas ordenadas por síntoma, con semáforo de riesgo y la secuencia mirar, leer, medir y decidir.' },
    { numero: '02', titulo: 'Seguridad en alta tensión', texto: 'Reconocer la alta tensión, equipo de protección, desconexión, ausencia de tensión, bloqueo y cuándo derivar.' },
    { numero: '03', titulo: 'La batería, módulo por módulo', texto: 'Arquitectura del paquete, lectura con escáner, diferencia entre bloques y cuándo no se cambia todo.' },
    { numero: '04', titulo: 'Inversor, convertidor y motores', texto: 'Recorrido de la energía, inversor, motores-generadores, convertidor de 12 V, aislamiento e interlock.' },
    { numero: '05', titulo: 'Herramientas y datos en vivo', texto: 'Multímetro de categoría adecuada, megóhmetro, escáner, pinza y el puesto de trabajo por etapas.' },
    { numero: '06', titulo: 'Carga y cargadores', texto: 'Cómo carga el vehículo, conectores, señal piloto, cargador a bordo y fallas leídas por síntoma. Corriente alterna y corriente continua.' },
    { numero: '07', titulo: '12 V, freno regenerativo y climatización', texto: 'Batería auxiliar, puente seguro, freno regenerativo, dirección eléctrica y aire con compresor de alta tensión.' },
    { numero: '08', titulo: 'Del síntoma a la falla', texto: 'Veinte casos de estudio, leídos por síntoma, código, hallazgo y decisión. Son ejemplos ilustrativos: el manual del vehículo confirma.' },
    { numero: '09', titulo: 'Kit del taller', texto: 'Entrevista, inspección, orden, datos en vivo, informe, cotización, constancia y derivación.' },
    { numero: '10', titulo: 'Tipos de vehículo', texto: 'Híbrido suave (MHEV), híbrido (HEV), enchufable (PHEV), eléctrico de batería (BEV) y autonomía extendida (REEV). También la red de 48 V y la idea de un transeje híbrido.' },
  ],
  extras: [
    { titulo: 'Normativa', texto: 'Compendio sobre vehículos eléctricos en Colombia: circulación, clasificación, carga, incentivos y enlaces a normas oficiales. Sirve para consultar; no reemplaza el texto vigente de cada norma.' },
    { titulo: 'Biblioteca', texto: 'Veintiún documentos para abrir o descargar, entre ellos fichas de rescate y manuales de consulta. Si el manual del vehículo que está en el taller dice otra cosa, manda ese manual.' },
    { titulo: 'Evaluación final', texto: 'El curso y las evaluaciones se hacen en el aula virtual. La final es una ruleta con 15 retos de los diez módulos. Hace falta aprobar cada clase para abrirla. Cada acierto suma 2 puntos y, con racha de 3 o más, se suman 3 puntos extra. La aprobación está en 22 puntos.' },
  ],
  audienciaKicker: 'Participantes',
  audienciaTitulo: '¿Para quién es este curso?',
  audienciaParrafos: [
    'El material está escrito para quien va a recibir o revisar un híbrido o un eléctrico y necesita un orden antes de medir: el síntoma, el semáforo y el límite de la intervención.',
    'Sirve para separar tecnologías que no se diagnostican igual: híbrido suave, híbrido, enchufable, eléctrico de batería y autonomía extendida. También para quien quiere practicar la lectura de carga, batería auxiliar, freno regenerativo y climatización.',
  ],
  audienciaNota: 'No hay requisitos de ingreso. Es un curso no formal: no se pide edad, título, licencia ni experiencia previa.',
  datosKicker: 'Inscripción',
  datosTitulo: 'Modalidad, duración, precio y fechas',
  datos: [
    { titulo: 'Modalidad', texto: 'Virtual. El curso y las evaluaciones se hacen en el aula virtual. La APK es una aplicación offline para consultar el material en cualquier momento, incluso sin internet.', precio: '' },
    { titulo: 'Duración', texto: '40 horas. El recorrido incluye las diez clases, la normativa, la biblioteca y la evaluación final.', precio: '' },
    { titulo: 'Precio', texto: 'Pesos colombianos. Incluye el aula virtual, la APK offline y el certificado, que se entrega al pagar.', precio: '$200.000' },
    { titulo: 'Fechas', texto: 'No hay una fecha de inicio. Las clases son virtuales y se gestionan de forma individual, no por cohortes.', precio: '' },
  ],
  faqKicker: 'Preguntas frecuentes',
  faqTitulo: 'Respuestas con lo que sí está definido',
  faq: [
    { pregunta: '¿Cuál es el nombre del curso?', respuesta: 'En los materiales se llama Mecánica básica de vehículos híbridos y eléctricos. Lo ofrece {empresa}. Cubre eléctricos de batería e híbridos.' },
    { pregunta: '¿Qué incluye el pago de $200.000?', respuesta: 'El acceso al aula virtual, donde se hace el curso y las evaluaciones, y una APK offline para consultar el material en cualquier momento, incluso sin internet. Al pagar, el alumno recibe el certificado.' },
    { pregunta: '¿Cuánto dura y cuándo empieza?', respuesta: 'Dura 40 horas y es virtual. No hay fecha de inicio ni grupos: cada persona avanza por su cuenta. El curso y las evaluaciones se hacen en el aula; la APK sirve para consultar el material sin internet.' },
    { pregunta: '¿Entrega certificado?', respuesta: 'Sí. Al pagar, el alumno recibe el certificado. El curso y las evaluaciones se hacen en el aula virtual.' },
    { pregunta: '¿El curso reemplaza el manual del vehículo?', respuesta: 'No. El manual del fabricante manda sobre cualquier ejemplo, sobre el video y sobre la costumbre del taller.' },
    { pregunta: '¿Hay un instructor nombrado en los materiales?', respuesta: 'El instructor es del equipo de instructores de la institución {empresa}.' },
    { pregunta: '¿Dónde contactar?', respuesta: 'Teléfono {telefono}. {direccion}. Para pagar, regístrate en el aula virtual.' },
  ],
  ctaKicker: 'Compra',
  ctaTitulo: 'Regístrate en el aula y paga el curso',
  ctaTexto: 'El pago se hace en el aula virtual, después de crear la cuenta. El curso y las evaluaciones se hacen ahí. La APK es offline, para consultar el material incluso sin internet. Al pagar, el alumno recibe el certificado.',
  ctaComprarTexto: 'Registrarme y pagar',
  ctaComprarUrl: '/registro',
  ctaAsesorTexto: 'Hablar con un asesor',
  imagenes: IMAGENES.map((img) => ({ ...img })),
};

const ZONAS = new Set<LcZonaImagen>(['hero-desktop', 'hero-mobile', 'lateral', 'ancho', 'galeria']);
const ZONA_POR_ID: Record<string, LcZonaImagen> = {
  'hero-desktop': 'hero-desktop',
  'hero-mobile': 'hero-mobile',
  formacion: 'lateral',
  carga: 'ancho',
};

function txt(v: unknown, fallback: string): string {
  if (v === undefined || v === null) return fallback;
  return String(v);
}

function bloques(raw: unknown, fb: LcBloque[]): LcBloque[] {
  if (!Array.isArray(raw)) return fb.map((x) => ({ ...x }));
  return raw.map((item) => ({
    titulo: txt((item as LcBloque)?.titulo, ''),
    texto: txt((item as LcBloque)?.texto, ''),
  }));
}

function datos(raw: unknown, fb: LcDato[]): LcDato[] {
  if (!Array.isArray(raw)) return fb.map((x) => ({ ...x }));
  return raw.map((item) => ({
    titulo: txt((item as LcDato)?.titulo, ''),
    texto: txt((item as LcDato)?.texto, ''),
    precio: txt((item as LcDato)?.precio, ''),
  }));
}

function modulos(raw: unknown, fb: LcModulo[]): LcModulo[] {
  if (!Array.isArray(raw)) return fb.map((x) => ({ ...x }));
  return raw.map((item, i) => ({
    numero: txt((item as LcModulo)?.numero, String(i + 1).padStart(2, '0')),
    titulo: txt((item as LcModulo)?.titulo, ''),
    texto: txt((item as LcModulo)?.texto, ''),
  }));
}

function faqs(raw: unknown, fb: LcFaq[]): LcFaq[] {
  if (!Array.isArray(raw)) return fb.map((x) => ({ ...x }));
  return raw.map((item) => ({
    pregunta: txt((item as LcFaq)?.pregunta, ''),
    respuesta: txt((item as LcFaq)?.respuesta, ''),
  }));
}

function parrafos(raw: unknown, fb: string[]): string[] {
  if (!Array.isArray(raw)) return [...fb];
  return raw.map((item) => String(item ?? ''));
}

function normalizarImagen(item: Partial<LcImagen> | null | undefined, i: number): LcImagen {
  const id = String(item?.id || `img-${i + 1}`).trim();
  const zonaRaw = item?.zona as LcZonaImagen;
  const zona = ZONAS.has(zonaRaw) ? zonaRaw : ZONA_POR_ID[id] || 'galeria';
  return {
    id,
    etiqueta: txt(item?.etiqueta, 'Imagen'),
    zona,
    url: String(item?.url ?? '').trim(),
    urlAbsoluta: String(item?.urlAbsoluta ?? '').trim(),
    alt: txt(item?.alt, ''),
  };
}

function unirImagenes(srcList: unknown): LcImagen[] {
  const saved = (Array.isArray(srcList) ? srcList : []).map((item, i) => normalizarImagen(item, i));
  const byId = new Map(saved.map((img) => [img.id, img]));
  const base = IMAGENES.map((img) => {
    const hit = byId.get(img.id);
    if (!hit) return { ...img, urlAbsoluta: '' };
    return {
      ...img,
      ...hit,
      id: img.id,
      zona: hit.zona || img.zona,
      etiqueta: hit.etiqueta || img.etiqueta,
    };
  });
  const extras = saved.filter((img) => !IMAGENES.some((d) => d.id === img.id));
  return [...base, ...extras];
}

export function mergeLandingCursos(raw?: Partial<PortalLandingCursos> | null): PortalLandingCursos {
  const d = LANDING_CURSOS_DEFAULT;
  const src = raw && typeof raw === 'object' ? raw : null;
  if (!src) {
    return JSON.parse(JSON.stringify(d)) as PortalLandingCursos;
  }
  return {
    h1: txt(src.h1, d.h1),
    bandTexto: txt(src.bandTexto, d.bandTexto),
    habilidadesKicker: txt(src.habilidadesKicker, d.habilidadesKicker),
    habilidadesTitulo: txt(src.habilidadesTitulo, d.habilidadesTitulo),
    habilidadesLead: txt(src.habilidadesLead, d.habilidadesLead),
    habilidades: bloques(src.habilidades, d.habilidades),
    programaKicker: txt(src.programaKicker, d.programaKicker),
    programaTitulo: txt(src.programaTitulo, d.programaTitulo),
    programaLead: txt(src.programaLead, d.programaLead),
    modulos: modulos(src.modulos, d.modulos),
    extras: bloques(src.extras, d.extras),
    audienciaKicker: txt(src.audienciaKicker, d.audienciaKicker),
    audienciaTitulo: txt(src.audienciaTitulo, d.audienciaTitulo),
    audienciaParrafos: parrafos(src.audienciaParrafos, d.audienciaParrafos),
    audienciaNota: txt(src.audienciaNota, d.audienciaNota),
    datosKicker: txt(src.datosKicker, d.datosKicker),
    datosTitulo: txt(src.datosTitulo, d.datosTitulo),
    datos: datos(src.datos, d.datos),
    faqKicker: txt(src.faqKicker, d.faqKicker),
    faqTitulo: txt(src.faqTitulo, d.faqTitulo),
    faq: faqs(src.faq, d.faq),
    ctaKicker: txt(src.ctaKicker, d.ctaKicker),
    ctaTitulo: txt(src.ctaTitulo, d.ctaTitulo),
    ctaTexto: txt(src.ctaTexto, d.ctaTexto),
    ctaComprarTexto: txt(src.ctaComprarTexto, d.ctaComprarTexto),
    ctaComprarUrl: txt(src.ctaComprarUrl, d.ctaComprarUrl),
    ctaAsesorTexto: txt(src.ctaAsesorTexto, d.ctaAsesorTexto),
    imagenes: unirImagenes(src.imagenes),
  };
}
