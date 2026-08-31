/** Página /trabajo-en-alturas — contenido editable desde el ERP. */

import {
  mergePromoHeroPillars,
  mergePromoHeroStats,
  mergePromoHeroTheme,
  PROMO_HERO_PILARES_TA,
  PortalPromoHeroPillar,
  PortalPromoHeroTheme,
} from '../../core/constants/portal-promo-hero-fields.util';
import {
  TRABAJO_EN_ALTURAS_DOCUMENTOS_GRUPOS,
  TaDocumento,
  TaDocumentoGrupo,
} from './trabajo-en-alturas-documentos';

export type { TaDocumento, TaDocumentoGrupo };

const THUMB = (n: number) =>
  `/images/trabajo-en-alturas/clases/clase-${String(n).padStart(2, '0')}-thumb.jpg`;

export interface TaImagen {
  id: string;
  etiqueta: string;
  url: string;
  urlAbsoluta?: string;
  alt: string;
}

export interface TaNavItem {
  id: string;
  label: string;
}

export interface TaModulo {
  numero: number;
  titulo: string;
  resumen: string;
  thumbUrl: string;
}

export interface TaFaq {
  pregunta: string;
  respuesta: string;
}

export interface TaHomeItem {
  numero: number;
  icon: string;
  acento: 'blue' | 'teal' | 'orange' | 'green' | 'purple';
  titulo: string;
  texto: string;
}

export interface TaArticuloNormativo {
  articulo: string;
  titulo: string;
  texto: string;
}

export interface TaOperacionSector {
  titulo: string;
  texto: string;
}

export interface PortalTrabajoEnAlturasLanding {
  kicker: string;
  titulo: string;
  tituloLinea2: string;
  subtitulo: string;
  heroLead: string;
  heroParrafos: string[];
  heroPillarsLabel: string;
  heroPillars: PortalPromoHeroPillar[];
  heroStats: string[];
  backLabel: string;
  theme: PortalPromoHeroTheme;
  mostrarBadgeVirtual: boolean;
  virtualBadgeLabel: string;
  enlaceCursoUrl: string;
  enlaceCursoEtiqueta: string;
  ctaNormativaTexto: string;
  ctaDocumentosTexto: string;
  ctaFaqTexto: string;
  ctaInicioTexto: string;
  ctaUrl: string;
  homeItems: TaHomeItem[];
  fechaActualizacion: string;
  fraseFinal: string;
  disclaimer: string;
  nav: TaNavItem[];
  imagenes: TaImagen[];
  introTitulo: string;
  introTexto: string;
  introRiesgos: string[];
  introAudiencia: string[];
  objetivosTitulo: string;
  objetivoGeneral: string;
  objetivosEspecificos: string[];
  normativaTitulo: string;
  normativaLead: string;
  normativaDestacados: { etiqueta: string; valor: string; detalle: string }[];
  normativaAspectos: string[];
  normativaResolucionTitulo: string;
  normativaResolucionTexto: string;
  normativaArticulos: TaArticuloNormativo[];
  responsabilidadesEmpleador: string[];
  responsabilidadesTrabajador: string[];
  sectorTitulo: string;
  sectorLead: string;
  sectorOperaciones: TaOperacionSector[];
  modulosTitulo: string;
  modulosLead: string;
  modulos: TaModulo[];
  tresCTitulo: string;
  tresCLead: string;
  tresCItems: { titulo: string; texto: string }[];
  metodologiaTitulo: string;
  metodologiaLead: string;
  metodologiaItems: { titulo: string; texto: string }[];
  evaluacionTitulo: string;
  evaluacionLead: string;
  evaluacionDetalles: string[];
  documentosTitulo: string;
  documentosLead: string;
  documentosGrupos: TaDocumentoGrupo[];
  faq: TaFaq[];
}

export const TRABAJO_EN_ALTURAS_MODULOS: TaModulo[] = [
  { numero: 1, titulo: 'Introducción sector transportador', resumen: 'Riesgos únicos del sector transportador y enfoque operativo.', thumbUrl: THUMB(1) },
  { numero: 2, titulo: 'Objetivos del curso', resumen: 'Objetivo general y específicos del Trabajador Autorizado.', thumbUrl: THUMB(2) },
  { numero: 3, titulo: 'Marco jurídico', resumen: 'Resolución 4272 de 2021, SG-SST y sanciones.', thumbUrl: THUMB(3) },
  { numero: 4, titulo: 'Definiciones', resumen: 'Terminología oficial Resolución 4272 Art. 3.', thumbUrl: THUMB(4) },
  { numero: 5, titulo: 'Generalidades', resumen: 'Prevención colectiva vs protección individual.', thumbUrl: THUMB(5) },
  { numero: 6, titulo: 'Clasificación', resumen: 'Cuatro grupos técnicos y distancia de caída.', thumbUrl: THUMB(6) },
  { numero: 7, titulo: 'Campos de acción', resumen: 'Operaciones del sector transportador y riesgos.', thumbUrl: THUMB(7) },
  { numero: 8, titulo: 'Estadísticas', resumen: 'Panorama OIT, Colombia y causas de caídas.', thumbUrl: THUMB(8) },
  { numero: 9, titulo: 'Conceptos técnicos', resumen: 'Fundamentos técnicos para el operario.', thumbUrl: THUMB(9) },
  { numero: 10, titulo: 'Equipo de protección individual', resumen: 'Casco, arnés, conectores, mosquetones y cuerdas.', thumbUrl: THUMB(10) },
  { numero: 11, titulo: 'Categorización EPI', resumen: 'Categorías I, II y III según gravedad del riesgo.', thumbUrl: THUMB(11) },
  { numero: 12, titulo: 'Sistemas de ascensión', resumen: 'Escaleras, andamios, PEMP y cuerdas.', thumbUrl: THUMB(12) },
  { numero: 13, titulo: 'Regla de las 3 C', resumen: 'Compatibilidad, continuidad e inspección.', thumbUrl: THUMB(13) },
  { numero: 14, titulo: 'El descenso', resumen: 'Tres grupos de sistemas de descenso y evacuación.', thumbUrl: THUMB(14) },
  { numero: 15, titulo: 'Descendedores industriales', resumen: "I'D S, RIG y SPARROW — fichas técnicas.", thumbUrl: THUMB(15) },
  { numero: 16, titulo: 'Bloqueadores anticaídas', resumen: 'Arrestadores en líneas rígidas y flexibles.', thumbUrl: THUMB(16) },
  { numero: 17, titulo: 'Consecuencias fisiológicas', resumen: 'Trauma, desaceleración y síndrome del arnés.', thumbUrl: THUMB(17) },
  { numero: 18, titulo: 'Los anclajes', resumen: 'Resistencia, clasificación EN 795 y dirección de fuerzas.', thumbUrl: THUMB(18) },
  { numero: 19, titulo: 'SPCC', resumen: 'Medidas pasivas/activas y líneas de vida.', thumbUrl: THUMB(19) },
  { numero: 20, titulo: 'Acceso a carrotanques', resumen: 'Procedimiento y riesgos en cisternas.', thumbUrl: THUMB(20) },
];

export const TRABAJO_EN_ALTURAS_LANDING: PortalTrabajoEnAlturasLanding = {
  kicker: 'CEA SERVIAL COLOMBIA · Sector transportador',
  titulo: 'Trabajo Seguro',
  tituloLinea2: 'en Alturas',
  subtitulo: 'Normativa · Prevención · SG-SST · Sector transporte',
  heroLead:
    'Guía informativa sobre el marco legal del trabajo en alturas en Colombia, con énfasis en el sector transportador: definiciones, obligaciones, requisitos del Trabajador Autorizado y documentación de consulta.',
  heroParrafos: [
    'La Resolución 4272 de 2021 regula las actividades que se desarrollan a partir de 2,0 metros sobre el nivel de referencia. En logística y transporte, las operaciones en techos de tractocamiones, planchones, tolvas, cisternas y carrocerías exigen controles adicionales por superficies irregulares, móviles y expuestas al clima.',
    'Conocer la normativa, las responsabilidades del empleador y del trabajador, y los requisitos de los sistemas de protección contra caídas (SPCC) es la base para prevenir accidentes graves y fatales.',
  ],
  heroPillarsLabel: 'Contenidos del curso',
  heroPillars: PROMO_HERO_PILARES_TA,
  heroStats: ['Res. 4272 de 2021', '2,0 m'],
  backLabel: '← Volver al inicio',
  theme: 'violet',
  mostrarBadgeVirtual: true,
  virtualBadgeLabel: 'VIRTUAL',
  enlaceCursoUrl: '',
  enlaceCursoEtiqueta: 'Ir al curso interactivo',
  ctaNormativaTexto: 'Marco normativo',
  ctaDocumentosTexto: 'Descargar normativa',
  ctaFaqTexto: 'Preguntas frecuentes',
  ctaInicioTexto: 'Ver información completa',
  ctaUrl: '/trabajo-en-alturas',
  homeItems: [
    {
      numero: 1,
      icon: 'document',
      acento: 'purple',
      titulo: 'Resolución 4272 de 2021',
      texto: 'Altura mínima 2,0 m, requisitos del Trabajador Autorizado y vigencia de certificación de 3 años.',
    },
    {
      numero: 2,
      icon: 'shield-check',
      acento: 'blue',
      titulo: 'Obligaciones SG-SST',
      texto: 'Responsabilidades del empleador y del trabajador en prevención, capacitación y uso de EPI.',
    },
    {
      numero: 3,
      icon: 'download',
      acento: 'teal',
      titulo: 'Normativa descargable',
      texto: 'Resolución 4272, Ley 1562 de 2012 y manual técnico de referencia en PDF.',
    },
  ],
  fechaActualizacion: '31 de agosto de 2026',
  fraseFinal: 'Protégete a ti mismo, protege a tus compañeros. Trabaja seguro, regresa a casa.',
  disclaimer:
    'Esta página tiene fines educativos e informativos. No sustituye la capacitación certificada presencial ni la consulta de la normativa vigente. Antes de realizar trabajo en alturas, verifique los procedimientos de su empresa y las disposiciones oficiales del Ministerio de Trabajo.',
  nav: [
    { id: 'inicio', label: 'Inicio' },
    { id: 'introduccion', label: 'Definición' },
    { id: 'normativa', label: 'Normativa' },
    { id: 'objetivos', label: 'Responsabilidades' },
    { id: 'requisitos', label: 'Trabajador Autorizado' },
    { id: 'epi', label: 'EPI y SPCC' },
    { id: 'sector', label: 'Sector transporte' },
    { id: 'tres-c', label: 'Regla 3 C' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'faq', label: 'FAQ' },
  ],
  imagenes: [
    { id: 'hero', etiqueta: 'Imagen principal', url: '', alt: 'Trabajador en alturas sector transporte', },
    { id: 'intro', etiqueta: 'Sección introducción', url: '', alt: 'Operaciones en altura sector transportador', },
    { id: 'normativa', etiqueta: 'Sección normativa', url: '', alt: 'Marco jurídico trabajo en alturas', },
    { id: 'epi', etiqueta: 'Sección EPI', url: '', alt: 'Equipo de protección individual', },
  ],
  introTitulo: '¿Qué es el trabajo en alturas?',
  introTexto:
    'Según la Resolución 4272 de 2021, trabajo en alturas es toda labor en la que el trabajador, durante el desarrollo de sus actividades, puede caer a un nivel diferente. Aplica a partir de 2,0 metros sobre el nivel de referencia, salvo que el riesgo de caída sea evidente por debajo de esa altura.',
  introRiesgos: [
    'Caída a distinto nivel (principal causa de fatalidad)',
    'Superficies resbaladizas por lluvia, lodo o grasas',
    'Líneas eléctricas y partes energizadas',
    'Superficies móviles o inestables del vehículo',
    'Condiciones climáticas adversas (viento, calor)',
  ],
  introAudiencia: [
    'Conductores y operarios de cargue y descargue',
    'Mecánicos y personal de taller',
    'Personal de patio, logística y mantenimiento',
    'Coordinadores y supervisores de trabajo en alturas',
    'Empresas del sector transporte con operaciones en altura',
  ],
  objetivosTitulo: 'Responsabilidades legales',
  objetivoGeneral:
    'La Ley 1562 de 2012 y el Decreto 1072 de 2015 asignan obligaciones claras al empleador y al trabajador en el Sistema General de Riesgos Laborales. En trabajo en alturas, el incumplimiento puede derivar en sanciones, accidentes graves y responsabilidad civil y penal.',
  objetivosEspecificos: [],
  responsabilidadesEmpleador: [
    'Identificar, evaluar y controlar los riesgos de caída en el diagnóstico de condiciones de salud y seguridad en el trabajo',
    'Implementar medidas de prevención en la fuente y medidas de protección colectiva antes del EPI',
    'Garantizar capacitación certificada del Trabajador Autorizado y vigencia de 3 años',
    'Proveer EPI y SPCC certificados, en buen estado y acordes al riesgo',
    'Establecer permisos de trabajo, procedimientos escritos y plan de rescate',
    'Investigar incidentes y aplicar acciones correctivas documentadas',
  ],
  responsabilidadesTrabajador: [
    'Participar en la capacitación y acreditar competencias como Trabajador Autorizado',
    'Usar correctamente el EPI y los sistemas de protección contra caídas',
    'Inspeccionar equipos antes de cada uso y reportar condiciones inseguras',
    'Cumplir procedimientos, permisos de trabajo y señalización del área',
    'Aplicar la técnica de tres puntos de apoyo y la regla de las 3 C',
    'No realizar trabajo en alturas sin autorización, certificación vigente o condiciones seguras',
  ],
  normativaTitulo: 'Marco normativo colombiano',
  normativaLead:
    'El trabajo seguro en alturas se rige principalmente por la Resolución 4272 de 2021 del Ministerio de Trabajo, que deroga la Resolución 1409 de 2012. Se integra al SG-SST (Ley 1562 de 2012 y Decreto 1072 de 2015) y se complementa con normas técnicas internacionales de EPI y anclajes.',
  normativaDestacados: [
    { etiqueta: 'Altura mínima', valor: '2,0 m', detalle: 'A partir de esta altura aplica la regulación, salvo riesgo evidente de caída.' },
    { etiqueta: 'Certificación TA', valor: '3 años', detalle: 'Vigencia de la certificación del Trabajador Autorizado.' },
    { etiqueta: 'Norma principal', valor: 'Res. 4272', detalle: 'Reglamenta requisitos, competencias, EPI y procedimientos.' },
    { etiqueta: 'Sanciones', valor: 'Hasta 500 SMMLV', detalle: 'Multas y medidas como clausura temporal por incumplimiento.' },
  ],
  normativaResolucionTitulo: 'Resolución 4272 de 2021',
  normativaResolucionTexto:
    'Establece los requisitos mínimos de seguridad para el desarrollo de trabajo en alturas: definiciones, responsabilidades, competencias del Trabajador Autorizado, sistemas de protección, procedimientos, capacitación, certificación y seguimiento.',
  normativaArticulos: [
    {
      articulo: 'Art. 3',
      titulo: 'Definiciones clave',
      texto: 'Define trabajo en alturas, Trabajador Autorizado, coordinador, sistemas de acceso, restricción, detención de caídas y nivel de referencia.',
    },
    {
      articulo: 'Art. 5',
      titulo: 'Responsabilidad del empleador',
      texto: 'Obliga a identificar riesgos, implementar controles, capacitar, certificar, proveer EPI y mantener registros del programa.',
    },
    {
      articulo: 'Art. 6',
      titulo: 'Responsabilidad del trabajador',
      texto: 'Exige cumplir procedimientos, usar EPI, participar en capacitación y reportar condiciones inseguras.',
    },
    {
      articulo: 'Art. 10',
      titulo: 'Trabajador Autorizado',
      texto: 'Persona capacitada, evaluada y autorizada por escrito para ejecutar trabajo en alturas con conocimiento de riesgos y rescate.',
    },
    {
      articulo: 'Art. 14',
      titulo: 'Sistemas de protección',
      texto: 'Prioriza medidas de prevención en la fuente y protección colectiva; el EPI es el último nivel de control.',
    },
    {
      articulo: 'Art. 22',
      titulo: 'Capacitación y certificación',
      texto: 'Establece contenidos mínimos de formación, evaluación de competencias y vigencia de la certificación.',
    },
  ],
  normativaAspectos: [
    'Resolución 4272 de 2021 (deroga Resolución 1409 de 2012)',
    'Ley 1562 de 2012 — Sistema General de Riesgos Laborales',
    'Decreto 1072 de 2015 — SG-SST, capacitación y procedimientos',
    'Constitución Política Arts. 25 y 53 — derecho al trabajo en condiciones dignas',
    'Código Sustantivo del Trabajo — deber de protección y prevención',
    'Normas EN 361, EN 362, EN 355, EN 795 y referencia ANSI Z359',
  ],
  modulosTitulo: 'Mapa del curso — 20 módulos',
  modulosLead:
    'Cada módulo corresponde a un capítulo del manual 2026. Incluye contenido visual, evaluación y actividades interactivas.',
  modulos: JSON.parse(JSON.stringify(TRABAJO_EN_ALTURAS_MODULOS)),
  tresCTitulo: 'Regla de las 3 C',
  tresCLead:
    'Buena práctica técnica exigida antes de conectar el arnés: verificar compatibilidad, continuidad de protección y condición del equipo.',
  tresCItems: [
    { titulo: 'Compatibilidad', texto: 'El diámetro y la marca del bloqueador deben ser compatibles con la línea de vida o cuerda utilizada.' },
    { titulo: 'Continuidad', texto: 'Mantener protección anticaídas el 100% del tiempo hasta que ambos pies estén en superficie segura.' },
    { titulo: 'Condición', texto: 'Inspeccionar EPI libre de lodo, grasas, aceites, cortes o deformaciones antes de cada uso.' },
  ],
  metodologiaTitulo: 'Requisitos del Trabajador Autorizado',
  metodologiaLead:
    'La Resolución 4272 exige que quien ejecute trabajo en alturas sea un Trabajador Autorizado con competencias demostradas y certificación vigente.',
  metodologiaItems: [
    { titulo: 'Capacitación teórico-práctica', texto: 'Formación en normativa, identificación de riesgos, uso de EPI, procedimientos y rescate.' },
    { titulo: 'Evaluación de competencias', texto: 'Verificación de conocimientos y habilidades antes de la autorización formal.' },
    { titulo: 'Autorización escrita', texto: 'El empleador autoriza por escrito las tareas que el trabajador puede realizar.' },
    { titulo: 'Examen médico', texto: 'Aptitud médica para trabajo en alturas según protocolos del SG-SST.' },
    { titulo: 'Recertificación', texto: 'Renovación de la certificación cada 3 años o cuando cambien las condiciones de trabajo.' },
    { titulo: 'Plan de rescate', texto: 'Conocimiento del procedimiento de emergencia y tiempo de respuesta ante suspensión en arnés.' },
  ],
  evaluacionTitulo: 'Equipo de protección individual (EPI) y SPCC',
  evaluacionLead:
    'El EPI es el último nivel de control. Debe ser certificado, inspeccionado y usado según el riesgo. Las normas EN y ANSI definen requisitos de arneses, conectores, absorbedores y anclajes.',
  evaluacionDetalles: [
    'Arnés de cuerpo completo (EN 361): puntos de enganche dorsal y esternal según el sistema',
    'Conectores y mosquetones (EN 362): con seguro automático y resistencia certificada',
    'Absorbedores de energía y líneas de vida (EN 355): limitar la fuerza de impacto en caída',
    'Anclajes portátiles y fijos (EN 795): resistencia mínima según tipo de sistema',
    'Bloqueadores anticaídas deslizantes: compatibles con la cuerda o cable utilizado',
    'Inspección previa al uso y retiro inmediato si hay daño, exposición química o caída',
  ],
  sectorTitulo: 'Trabajo en alturas en el sector transportador',
  sectorLead:
    'Las operaciones sobre flotas de carga presentan riesgos particulares: superficies curvas, vibración, viento, pendientes y anclajes temporales. La normativa general aplica, pero el procedimiento debe adaptarse a cada tipo de operación.',
  sectorOperaciones: [
    { titulo: 'Cargue y descargue', texto: 'Acceso a planchones, techos de cabina y estructuras de amarre con riesgo de caída lateral.' },
    { titulo: 'Mantenimiento en taller', texto: 'Trabajo sobre carrocerías elevadas, tolvas y tanques con uso de andamios o plataformas.' },
    { titulo: 'Cisternas y carrotanques', texto: 'Acceso a bocas de inspección y lavado en espacios confinados con riesgo de caída interior.' },
    { titulo: 'Carpado y lona', texto: 'Operaciones sobre carga cubierta con restricción de movimiento y anclajes en campo.' },
    { titulo: 'Inspección en ruta', texto: 'Revisión de amarre y estructura en condiciones climáticas variables.' },
  ],
  documentosTitulo: 'Normativa y documentos de consulta',
  documentosLead: 'Textos oficiales y material técnico de referencia para consulta y descarga.',
  documentosGrupos: JSON.parse(JSON.stringify(TRABAJO_EN_ALTURAS_DOCUMENTOS_GRUPOS)),
  faq: [
    {
      pregunta: '¿A partir de qué altura aplica la normativa de trabajo en alturas?',
      respuesta:
        'La Resolución 4272 de 2021 define trabajo en alturas a partir de 2,0 metros sobre el nivel de referencia, salvo que exista riesgo evidente de caída por debajo de esa altura.',
    },
    {
      pregunta: '¿Cuánto dura la certificación del Trabajador Autorizado?',
      respuesta:
        'La certificación tiene vigencia de 3 años. Debe renovarse con capacitación y evaluación de competencias según los requisitos de la Resolución 4272.',
    },
    {
      pregunta: '¿Qué es un Trabajador Autorizado?',
      respuesta:
        'Persona que ha sido capacitada, evaluada y autorizada por escrito por el empleador para realizar trabajo en alturas, con conocimiento de riesgos, uso de EPI, procedimientos y plan de rescate.',
    },
    {
      pregunta: '¿Cuáles son las responsabilidades del empleador?',
      respuesta:
        'Identificar y controlar riesgos, implementar medidas de prevención y protección, capacitar y certificar trabajadores, proveer EPI adecuado, establecer procedimientos y plan de rescate, e investigar incidentes.',
    },
    {
      pregunta: '¿Qué normas técnicas internacionales aplican al EPI?',
      respuesta:
        'Entre otras: EN 361 (arnés de cuerpo completo), EN 362 (conectores), EN 355 (absorbedores de energía), EN 795 (anclajes) y las series ANSI Z359 de referencia.',
    },
    {
      pregunta: '¿Qué sanciones existen por incumplimiento?',
      respuesta:
        'El incumplimiento del SG-SST puede generar multas de 1 a 500 salarios mínimos mensuales legales vigentes, clausura temporal de hasta 120 días y otras medidas según la gravedad.',
    },
    {
      pregunta: '¿Se puede trabajar en alturas sin certificación?',
      respuesta:
        'No. La normativa exige que quien ejecute trabajo en alturas sea Trabajador Autorizado con certificación vigente, autorización escrita y condiciones seguras verificadas.',
    },
    {
      pregunta: '¿Qué particularidades tiene el sector transportador?',
      respuesta:
        'Superficies curvas y móviles de vehículos, operaciones en campo, exposición al clima, anclajes temporales y tareas de cargue, mantenimiento e inspección que requieren procedimientos específicos.',
    },
  ],
};

function mergeImagenes(raw: TaImagen[] | undefined, fb: TaImagen[]): TaImagen[] {
  const src = Array.isArray(raw) ? raw : [];
  return fb.map((item, i) => {
    const r = src.find((x) => x.id === item.id) || src[i];
    return {
      ...item,
      etiqueta: r?.etiqueta?.trim() || item.etiqueta,
      url: r?.url?.trim() || item.url,
      urlAbsoluta: r?.urlAbsoluta?.trim() || item.urlAbsoluta || '',
      alt: r?.alt?.trim() || item.alt,
    };
  });
}

export function mergeTrabajoEnAlturasLanding(
  raw?: Partial<PortalTrabajoEnAlturasLanding> | null,
): PortalTrabajoEnAlturasLanding {
  const d = TRABAJO_EN_ALTURAS_LANDING;
  const src = raw && typeof raw === 'object' ? raw : {};
  const str = (v: unknown, fb: string) => String(v ?? fb).trim() || fb;
  const arr = <T>(v: T[] | undefined, fb: T[]) => (Array.isArray(v) && v.length ? v : fb);

  const merged = {
    ...d,
    kicker: str(src.kicker, d.kicker),
    titulo: str(src.titulo, d.titulo),
    tituloLinea2: str(src.tituloLinea2, d.tituloLinea2),
    subtitulo: str(src.subtitulo, d.subtitulo),
    heroLead: str(src.heroLead, d.heroLead),
    heroParrafos: arr(src.heroParrafos, d.heroParrafos),
    heroPillarsLabel: str(src.heroPillarsLabel, d.heroPillarsLabel),
    heroPillars: mergePromoHeroPillars(src.heroPillars, d.heroPillars),
    heroStats: mergePromoHeroStats(src.heroStats, d.heroStats),
    backLabel: str(src.backLabel, d.backLabel),
    theme: mergePromoHeroTheme(src.theme, d.theme),
    mostrarBadgeVirtual: src.mostrarBadgeVirtual !== false,
    virtualBadgeLabel: str(src.virtualBadgeLabel, d.virtualBadgeLabel),
    enlaceCursoUrl: str(src.enlaceCursoUrl, d.enlaceCursoUrl),
    enlaceCursoEtiqueta: str(src.enlaceCursoEtiqueta, d.enlaceCursoEtiqueta),
    ctaNormativaTexto: str(src.ctaNormativaTexto, d.ctaNormativaTexto),
    ctaDocumentosTexto: str(src.ctaDocumentosTexto, d.ctaDocumentosTexto),
    ctaFaqTexto: str(src.ctaFaqTexto, d.ctaFaqTexto),
    ctaInicioTexto: str(src.ctaInicioTexto, d.ctaInicioTexto),
    ctaUrl: str(src.ctaUrl, d.ctaUrl) || d.ctaUrl,
    homeItems: arr(src.homeItems, d.homeItems),
    fechaActualizacion: str(src.fechaActualizacion, d.fechaActualizacion),
    fraseFinal: str(src.fraseFinal, d.fraseFinal),
    disclaimer: str(src.disclaimer, d.disclaimer),
    nav: arr(src.nav, d.nav),
    imagenes: mergeImagenes(src.imagenes, d.imagenes),
    introTitulo: str(src.introTitulo, d.introTitulo),
    introTexto: str(src.introTexto, d.introTexto),
    introRiesgos: arr(src.introRiesgos, d.introRiesgos),
    introAudiencia: arr(src.introAudiencia, d.introAudiencia),
    objetivosTitulo: str(src.objetivosTitulo, d.objetivosTitulo),
    objetivoGeneral: str(src.objetivoGeneral, d.objetivoGeneral),
    objetivosEspecificos: arr(src.objetivosEspecificos, d.objetivosEspecificos),
    normativaTitulo: str(src.normativaTitulo, d.normativaTitulo),
    normativaLead: str(src.normativaLead, d.normativaLead),
    normativaDestacados: arr(src.normativaDestacados, d.normativaDestacados),
    normativaAspectos: arr(src.normativaAspectos, d.normativaAspectos),
    normativaResolucionTitulo: str(src.normativaResolucionTitulo, d.normativaResolucionTitulo),
    normativaResolucionTexto: str(src.normativaResolucionTexto, d.normativaResolucionTexto),
    normativaArticulos: arr(src.normativaArticulos, d.normativaArticulos),
    responsabilidadesEmpleador: arr(src.responsabilidadesEmpleador, d.responsabilidadesEmpleador),
    responsabilidadesTrabajador: arr(src.responsabilidadesTrabajador, d.responsabilidadesTrabajador),
    sectorTitulo: str(src.sectorTitulo, d.sectorTitulo),
    sectorLead: str(src.sectorLead, d.sectorLead),
    sectorOperaciones: arr(src.sectorOperaciones, d.sectorOperaciones),
    modulosTitulo: str(src.modulosTitulo, d.modulosTitulo),
    modulosLead: str(src.modulosLead, d.modulosLead),
    modulos: arr(src.modulos, d.modulos),
    tresCTitulo: str(src.tresCTitulo, d.tresCTitulo),
    tresCLead: str(src.tresCLead, d.tresCLead),
    tresCItems: arr(src.tresCItems, d.tresCItems),
    metodologiaTitulo: str(src.metodologiaTitulo, d.metodologiaTitulo),
    metodologiaLead: str(src.metodologiaLead, d.metodologiaLead),
    metodologiaItems: arr(src.metodologiaItems, d.metodologiaItems),
    evaluacionTitulo: str(src.evaluacionTitulo, d.evaluacionTitulo),
    evaluacionLead: str(src.evaluacionLead, d.evaluacionLead),
    evaluacionDetalles: arr(src.evaluacionDetalles, d.evaluacionDetalles),
    documentosTitulo: str(src.documentosTitulo, d.documentosTitulo),
    documentosLead: str(src.documentosLead, d.documentosLead),
    documentosGrupos: arr(src.documentosGrupos, d.documentosGrupos),
    faq: arr(src.faq, d.faq),
  };

  if (/gamificad|20 módulos|módulos gamificados|ruleta de 15 retos/i.test(
    `${merged.heroLead} ${merged.subtitulo} ${merged.homeItems.map((h) => h.titulo).join(' ')}`,
  )) {
    return {
      ...merged,
      ...TRABAJO_EN_ALTURAS_LANDING,
      imagenes: merged.imagenes,
      enlaceCursoUrl: merged.enlaceCursoUrl,
      enlaceCursoEtiqueta: merged.enlaceCursoEtiqueta,
    };
  }

  return merged;
}
