const { MERCANCIAS_PELIGROSAS_DOCUMENTOS_GRUPOS } = require('./aulaVirtualMercanciasPeligrosasDocumentos');
const ENLACE_PORTAL_MINTRANSPORTE_MP =
  'https://www.mintransporte.gov.co/normatividad/proyectos-de-normatividad/mercancias-peligrosas/';























const MERCANCIAS_PELIGROSAS_DEFAULTS = {
  kicker: 'Transporte seguro',
  titulo: 'Mercancías peligrosas',
  tituloLinea2: 'en Colombia',
  subtitulo: 'Normativa • Seguridad • Transporte • Responsabilidades',
  heroLead:
    'Conoce la normativa que regula su transporte y las responsabilidades de quienes participan en la cadena.',
  heroParrafos: [
    'Las mercancías peligrosas requieren controles especiales debido a los riesgos que pueden representar para las personas, los bienes, la infraestructura y el medio ambiente.',
    'En Colombia, el transporte terrestre de mercancías peligrosas por carretera cuenta con una regulación específica que establece requisitos técnicos y de seguridad.',
    'Nuestro objetivo: explicar esta normativa de una manera sencilla, organizada y fácil de consultar.',
  ],
  ctaNormativaTexto: 'Conocer la normativa',
  ctaClasificacionTexto: 'Ver clasificación',
  ctaFaqTexto: 'Preguntas frecuentes',
  ctaInicioTexto: 'Ver información completa',
  ctaUrl: '/mercancias-peligrosas',
  enlaceCursoUrl: '',
  enlaceCursoEtiqueta: 'Ir al curso de capacitación',
  homeItems: [
    {
      numero: 1,
      icon: 'document',
      acento: 'teal',
      titulo: 'Normativa colombiana',
      texto: 'Decreto 1079, NTCs y lineamientos del Ministerio de Transporte para transporte terrestre.',
    },
    {
      numero: 2,
      icon: 'shield',
      acento: 'blue',
      titulo: 'Clasificación y seguridad',
      texto: 'Las 9 clases ONU, identificación, documentación y responsabilidades en toda la cadena.',
    },
    {
      numero: 3,
      icon: 'download',
      acento: 'green',
      titulo: 'Material descargable',
      texto: '4 PDFs de normativa: decreto de carga, resolución SGA, Código Nacional de Tránsito y acuerdo UNECE.',
    },
  ],
  fechaActualizacion: '31 de agosto de 2026',
  enlaceOficialUrl: ENLACE_PORTAL_MINTRANSPORTE_MP,
  enlaceOficialEtiqueta: 'Consultar normativa oficial en MinTransporte',
  fraseFinal: 'Conocer la normativa también es una forma de prevenir.',
  disclaimer:
    'Esta página tiene fines educativos e informativos. La información presentada no sustituye la consulta de la legislación vigente ni la asesoría de profesionales o autoridades competentes. Antes de utilizar esta información para una operación real, verifique la normativa vigente directamente en las fuentes oficiales del Ministerio de Transporte.',
  nav: [
    { id: 'inicio', label: 'Inicio' },
    { id: 'que-son', label: '¿Qué son?' },
    { id: 'normativa', label: 'Normativa' },
    { id: 'clasificacion', label: 'Clasificación' },
    { id: 'responsabilidades', label: 'Responsabilidades' },
    { id: 'documentacion', label: 'Documentación' },
    { id: 'seguridad', label: 'Seguridad' },
    { id: 'faq', label: 'Preguntas frecuentes' },
    { id: 'fuentes', label: 'Fuentes oficiales' },
    { id: 'documentos', label: 'Documentos PDF' },
  ],
  imagenes: [
    { id: 'hero', etiqueta: 'Banner principal', url: '', alt: 'Transporte de mercancías peligrosas' },
    { id: 'que-son', etiqueta: 'Sección ¿Qué son?', url: '', alt: 'Identificación de mercancías peligrosas' },
    { id: 'normativa', etiqueta: 'Sección normativa', url: '', alt: 'Marco normativo del sector transporte' },
    { id: 'clasificacion', etiqueta: 'Sección clasificación', url: '', alt: 'Clasificación de mercancías peligrosas' },
    { id: 'seguridad', etiqueta: 'Sección seguridad', url: '', alt: 'Seguridad en el transporte' },
  ],
  queSonTitulo: '¿Qué son las mercancías peligrosas?',
  queSonDefinicion:
    'De acuerdo con el Decreto 1079 de 2015, las mercancías peligrosas son materiales que, durante actividades como fabricación, manejo, transporte, almacenamiento o uso, pueden generar riesgos para la salud de las personas o causar daños materiales.',
  queSonRiesgos: [
    'Inflamables',
    'Explosivas',
    'Corrosivas',
    'Tóxicas',
    'Asfixiantes',
    'Irritantes',
    'Infecciosas',
    'Radiactivas',
    'Otras características peligrosas',
  ],
  queSonPorQue:
    'Porque el transporte de estas mercancías requiere que los riesgos sean identificados y comunicados correctamente. La normativa busca disminuir la posibilidad de accidentes y proteger:',
  queSonProtege: ['Personas', 'Medio ambiente', 'Infraestructura', 'Vehículos', 'Comunidades'],
  normativaTitulo: 'Marco normativo',
  normativaLead:
    'La principal referencia normativa para el transporte terrestre automotor de mercancías peligrosas por carretera se encuentra en el Decreto 1079 de 2015, Decreto Único Reglamentario del Sector Transporte. El Ministerio de Transporte señala que el antiguo Decreto 1609 de 2002 fue compilado en la Sección 8 del Capítulo 7, Título 1, Parte 2, Libro 2 del Decreto 1079 de 2015.',
  normativaDecretoTitulo: 'Decreto 1079 de 2015',
  normativaDecretoTexto:
    'Establece el marco reglamentario del sector transporte y contiene la regulación relacionada con el transporte terrestre automotor de mercancías peligrosas por carretera.',
  normativaNtcs: [
    { codigo: 'NTC 1692', titulo: 'Clasificación, marcado, etiquetado y rotulado.', texto: '' },
    { codigo: 'NTC 4435', titulo: 'Hojas de seguridad para materiales.', texto: '' },
    { codigo: 'NTC 4532', titulo: 'Tarjetas de emergencia para el transporte de materiales.', texto: '' },
  ],
  actualizacionTitulo: 'Actualización normativa',
  actualizacionAviso: 'La normativa puede cambiar. Verifique siempre la versión vigente antes de una operación real.',
  actualizacionTexto:
    'El Ministerio de Transporte publicó en julio de 2026 un proyecto de decreto destinado a sustituir la sección del Decreto 1079 relacionada con el transporte terrestre automotor de mercancías peligrosas por carretera.',
  clasificacionTitulo: 'Clasificación de las mercancías peligrosas',
  clasificacionLead:
    'Las mercancías peligrosas se organizan internacionalmente en diferentes clases según el tipo de peligro que presentan.',
  clases: [
    { numero: 1, titulo: 'Explosivos', texto: 'Mercancías con riesgos relacionados con propiedades explosivas.' },
    { numero: 2, titulo: 'Gases', texto: 'Mercancías en forma gaseosa con distintos tipos de peligro.' },
    { numero: 3, titulo: 'Líquidos inflamables', texto: 'Líquidos con peligro de inflamación bajo determinadas condiciones.' },
    { numero: 4, titulo: 'Sólidos inflamables', texto: 'Sólidos y sustancias con riesgos de inflamabilidad o reacción.' },
    { numero: 5, titulo: 'Sustancias comburentes y peróxidos', texto: 'Riesgos de oxidación o reacciones químicas.' },
    { numero: 6, titulo: 'Sustancias tóxicas e infecciosas', texto: 'Riesgos para la salud o peligro infeccioso.' },
    { numero: 7, titulo: 'Materiales radiactivos', texto: 'Riesgo asociado a radiación ionizante.' },
    { numero: 8, titulo: 'Sustancias corrosivas', texto: 'Efectos corrosivos sobre materiales o tejidos.' },
    { numero: 9, titulo: 'Sustancias y objetos diversos', texto: 'Otros peligros no incluidos en clases anteriores.' },
  ],
  identificacionTitulo: 'Identificación y rotulado',
  identificacionLead:
    'La NTC 1692 establece criterios de clasificación, marcado, etiquetado y rotulado de mercancías peligrosas y de las unidades de transporte.',
  identificacionBeneficios: [
    'Reconocer el tipo de peligro',
    'Comunicar información importante',
    'Facilitar la gestión del riesgo',
    'Apoyar la respuesta ante emergencias',
    'Reducir errores durante el transporte',
  ],
  documentacionTitulo: 'Documentación',
  documentacionLead:
    'La documentación es una parte fundamental del sistema de seguridad y permite conocer características y riesgos de la mercancía.',
  documentacionItems: [
    'Documentos de transporte',
    'Información de identificación',
    'Hojas de seguridad',
    'Tarjetas de emergencia',
    'Información de clasificación',
    'Información requerida por las autoridades',
  ],
  hojaSeguridadTitulo: 'Hojas de seguridad — NTC 4435',
  hojaSeguridadTexto:
    'Proporcionan información sobre características y riesgos de los materiales para consulta por quienes corresponda.',
  hojaSeguridadAviso:
    'La hoja de seguridad no reemplaza la capacitación ni la normativa de transporte. Es una herramienta dentro del sistema de gestión del riesgo.',
  tarjetaEmergenciaTitulo: 'Tarjetas de emergencia — NTC 4532',
  tarjetaEmergenciaTexto:
    'Establecen criterios para preparar tarjetas con información clara para el transporte de materiales peligrosos.',
  tarjetaEmergenciaFuncion: 'Comunicar información de seguridad relevante ante una situación de emergencia.',
  responsabilidadesTitulo: 'Responsabilidades en la cadena',
  responsabilidadesLead: 'La seguridad es responsabilidad de toda la cadena; no solo del conductor.',
  actores: [
    {
      rol: 'Generador o remitente',
      texto: 'Debe proporcionar información adecuada sobre la mercancía y cumplir obligaciones de preparación y entrega.',
    },
    {
      rol: 'Empresa de transporte',
      texto: 'Debe cumplir condiciones legales y de seguridad aplicables al servicio.',
    },
    {
      rol: 'Conductor',
      texto: 'Debe cumplir requisitos para conducir vehículos que transportan mercancías peligrosas y contar con capacitación exigida.',
    },
    {
      rol: 'Destinatario',
      texto: 'Participa en la cadena y debe cumplir obligaciones de recepción y manejo de la mercancía.',
    },
  ],
  capacitacionTitulo: 'Capacitación de conductores',
  capacitacionTexto:
    'El Ministerio de Transporte relaciona la Resolución 1223 de 2014 con el curso básico obligatorio, modificada por las Resoluciones 2328 y 5747 de 2016. También dispone del SISCONMP para información de conductores.',
  capacitacionMensaje: 'La capacitación es un componente esencial de la prevención de riesgos.',
  vehiculosTitulo: 'Vehículos y seguridad',
  vehiculosLead:
    'Los vehículos y unidades de transporte deben cumplir condiciones técnicas y de seguridad de la normativa correspondiente.',
  vehiculosAspectos: [
    'Condiciones del vehículo',
    'Identificación y señalización',
    'Equipamiento requerido',
    'Documentación',
    'Medidas de prevención y respuesta',
  ],
  gestionTitulo: 'Gestión del riesgo',
  gestionLead: 'Prevenir es la prioridad: identificar situaciones de riesgo y reducir probabilidad o consecuencias.',
  gestionPasos: [
    { titulo: 'Identificar', texto: 'Conocer qué mercancía se transporta y qué peligros presenta.' },
    { titulo: 'Informar', texto: 'Garantizar comunicación correcta de la información necesaria.' },
    { titulo: 'Cumplir', texto: 'Aplicar requisitos legales y técnicos correspondientes.' },
    { titulo: 'Capacitar', texto: 'Asegurar que quienes intervienen conozcan sus responsabilidades.' },
    { titulo: 'Prevenir', texto: 'Adoptar medidas para disminuir los riesgos.' },
    { titulo: 'Responder', texto: 'Contar con procedimientos para situaciones de emergencia.' },
  ],
  gestionCierre:
    'El Ministerio de Transporte presenta la gestión del riesgo como elemento fundamental para reducir accidentes y daños.',
  internacionalTitulo: 'Normativa internacional',
  internacionalTexto:
    'La regulación colombiana tiene como referencia las Recomendaciones de las Naciones Unidas (Reglamentación Modelo / Libro Naranja), lo que permite estructura común en clasificación, identificación, etiquetado, embalaje y documentación.',
  internacionalAspectos: [
    'Clasificación',
    'Identificación',
    'Etiquetado y rotulado',
    'Embalaje',
    'Documentación',
  ],
  modosTitulo: 'Diferentes modos de transporte',
  modosLead: 'Cada modalidad puede estar sujeta a requisitos específicos según el Ministerio de Transporte.',
  modos: [
    { icono: 'truck', titulo: 'Terrestre', texto: 'Carretera y otros sistemas terrestres.' },
    { icono: 'train', titulo: 'Férreo', texto: 'Transporte mediante ferrocarril.' },
    { icono: 'ship', titulo: 'Marítimo', texto: 'Transporte por vía marítima.' },
    { icono: 'water', titulo: 'Fluvial', texto: 'Vías navegables interiores.' },
    { icono: 'plane', titulo: 'Aéreo', texto: 'Transporte mediante aeronaves.' },
  ],
  emergenciaTitulo: '¿Qué hacer ante una emergencia?',
  emergenciaRegla:
    'No intervenir directamente si no se cuenta con capacitación y autorización para hacerlo.',
  emergenciaTexto:
    'La respuesta debe estar a cargo de personas capacitadas y organismos competentes. La documentación ayuda a conocer los riesgos asociados.',
  emergenciaPasos: [
    'Mantener la distancia',
    'Evitar exponerse',
    'Informar a servicios de emergencia',
    'Seguir instrucciones de las autoridades',
  ],
  mitos: [
    { mito: 'Solo el conductor es responsable.', realidad: 'La seguridad involucra a diferentes actores de la cadena.' },
    {
      mito: 'Todas las mercancías peligrosas tienen el mismo riesgo.',
      realidad: 'Existen diferentes clases de peligro según las características de cada mercancía.',
    },
    {
      mito: 'La señalización es solo un requisito visual.',
      realidad: 'La identificación comunica información esencial sobre el peligro.',
    },
    {
      mito: 'La normativa solo aplica al vehículo.',
      realidad: 'La regulación contempla distintos aspectos y responsabilidades en toda la cadena.',
    },
  ],
  faq: [
    {
      pregunta: '¿Qué norma principal regula el transporte terrestre?',
      respuesta:
        'El marco principal está en el Decreto 1079 de 2015, que compila la regulación del sector transporte y la sección de mercancías peligrosas por carretera.',
    },
    {
      pregunta: '¿Qué era el Decreto 1609 de 2002?',
      respuesta:
        'Reglamentó el transporte terrestre de mercancías peligrosas. Sus disposiciones fueron compiladas en el Decreto 1079 de 2015.',
    },
    {
      pregunta: '¿Qué es la NTC 1692?',
      respuesta: 'Norma Técnica Colombiana sobre definiciones, clasificación, marcado, etiquetado y rotulado.',
    },
    {
      pregunta: '¿Qué es la NTC 4532?',
      respuesta: 'Norma sobre elaboración de tarjetas de emergencia para transporte de materiales peligrosos.',
    },
    {
      pregunta: '¿Los conductores necesitan capacitación?',
      respuesta:
        'Sí. El Ministerio relaciona la Resolución 1223 de 2014 y modificaciones de 2016 con el curso básico obligatorio.',
    },
    {
      pregunta: '¿La normativa puede cambiar?',
      respuesta:
        'Sí. Consulte siempre la versión oficial vigente antes de decisiones operativas reales.',
    },
  ],
  glosario: [
    { titulo: 'Mercancía peligrosa', texto: 'Material con riesgos para personas, bienes o medio ambiente.' },
    { titulo: 'Clasificación', texto: 'Identificación de la clase de peligro de una mercancía.' },
    { titulo: 'Etiquetado', texto: 'Información gráfica sobre determinados peligros.' },
    { titulo: 'Rotulado', texto: 'Identificación en mercancías y unidades de transporte según requisitos.' },
    { titulo: 'Tarjeta de emergencia', texto: 'Información relevante para emergencias durante el transporte.' },
    { titulo: 'Hoja de seguridad', texto: 'Documento con características y riesgos de un material.' },
  ],
  fuentesTitulo: 'Fuentes oficiales',
  fuentesLead: 'Consulte siempre la fuente original del Ministerio de Transporte.',
  fuentes: [
    {
      titulo: 'Portal de Mercancías Peligrosas',
      url: ENLACE_PORTAL_MINTRANSPORTE_MP,
      etiqueta: 'Consultar portal MinTransporte',
    },
    {
      titulo: 'Decreto 1079 de 2015',
      url: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?id=83981',
      etiqueta: 'Consultar Decreto 1079',
    },
  ],
  documentosTitulo: 'Material descargable',
  documentosLead:
    'Normativa y marco legal en PDF: decreto de transporte de carga, resolución SGA, Código Nacional de Tránsito y acuerdo UNECE.',
  documentosGrupos: JSON.parse(JSON.stringify(MERCANCIAS_PELIGROSAS_DOCUMENTOS_GRUPOS)),
};

function mergeImagenes(raw, fb) {
  const src = Array.isArray(raw) ? raw : [];
  return fb.map((item, i) => {
    const r = src.find((x) => x.id === item.id) || src[i];
    return {
      id: item.id,
      etiqueta: r?.etiqueta?.trim() || item.etiqueta,
      url: r?.url?.trim() || item.url,
      urlAbsoluta: r?.urlAbsoluta?.trim() || item.urlAbsoluta,
      alt: r?.alt?.trim() || item.alt,
    };
  });
}

const HOME_ITEM_3_TEXTO_LEGACY =
  '26 PDFs de apoyo: normativa, SGA, emergencias y cartillas por clase.';

function mergeHomeItems(raw, fallback) {
  const items = (Array.isArray(raw) && raw.length ? raw : fallback).map((item) => ({ ...item }));
  const defaultItem3 = fallback.find((item) => item.numero === 3);
  const idx = items.findIndex((item) => item.numero === 3);
  if (idx >= 0 && defaultItem3 && items[idx].texto?.trim() === HOME_ITEM_3_TEXTO_LEGACY) {
    items[idx] = { ...items[idx], texto: defaultItem3.texto };
  }
  return items;
}

function mergeDocumentosGrupos(raw, fallback) {
  if (!Array.isArray(raw) || !raw.length) return fallback;
  return raw;
}

function mergeMercanciasPeligrosasLanding(
  raw,
) {
  const d = MERCANCIAS_PELIGROSAS_DEFAULTS;
  const src = raw && typeof raw === 'object' ? raw : {};
  const str = (v, fb) => String(v ?? fb).trim() || fb;
  const arr = (v, fb) => (Array.isArray(v) && v.length ? v : fb);

  return {
    ...d,
    kicker: str(src.kicker, d.kicker),
    titulo: str(src.titulo, d.titulo),
    tituloLinea2: str(src.tituloLinea2, d.tituloLinea2),
    subtitulo: str(src.subtitulo, d.subtitulo),
    heroLead: str(src.heroLead, d.heroLead),
    heroParrafos: arr(src.heroParrafos, d.heroParrafos),
    enlaceCursoUrl: str(src.enlaceCursoUrl, d.enlaceCursoUrl),
    enlaceCursoEtiqueta: str(src.enlaceCursoEtiqueta, d.enlaceCursoEtiqueta),
    ctaNormativaTexto: str(src.ctaNormativaTexto, d.ctaNormativaTexto),
    ctaClasificacionTexto: str(src.ctaClasificacionTexto, d.ctaClasificacionTexto),
    ctaFaqTexto: str(src.ctaFaqTexto, d.ctaFaqTexto),
    ctaInicioTexto: str(src.ctaInicioTexto, d.ctaInicioTexto),
    ctaUrl: str(src.ctaUrl, d.ctaUrl) || d.ctaUrl,
    homeItems: mergeHomeItems(src.homeItems, d.homeItems),
    fechaActualizacion: str(src.fechaActualizacion, d.fechaActualizacion),
    enlaceOficialUrl: str(src.enlaceOficialUrl, d.enlaceOficialUrl),
    enlaceOficialEtiqueta: str(src.enlaceOficialEtiqueta, d.enlaceOficialEtiqueta),
    fraseFinal: str(src.fraseFinal, d.fraseFinal),
    disclaimer: str(src.disclaimer, d.disclaimer),
    nav: arr(src.nav, d.nav),
    imagenes: mergeImagenes(src.imagenes, d.imagenes),
    queSonTitulo: str(src.queSonTitulo, d.queSonTitulo),
    queSonDefinicion: str(src.queSonDefinicion, d.queSonDefinicion),
    queSonRiesgos: arr(src.queSonRiesgos, d.queSonRiesgos),
    queSonPorQue: str(src.queSonPorQue, d.queSonPorQue),
    queSonProtege: arr(src.queSonProtege, d.queSonProtege),
    normativaTitulo: str(src.normativaTitulo, d.normativaTitulo),
    normativaLead: str(src.normativaLead, d.normativaLead),
    normativaDecretoTitulo: str(src.normativaDecretoTitulo, d.normativaDecretoTitulo),
    normativaDecretoTexto: str(src.normativaDecretoTexto, d.normativaDecretoTexto),
    normativaNtcs: arr(src.normativaNtcs, d.normativaNtcs),
    actualizacionTitulo: str(src.actualizacionTitulo, d.actualizacionTitulo),
    actualizacionTexto: str(src.actualizacionTexto, d.actualizacionTexto),
    actualizacionAviso: str(src.actualizacionAviso, d.actualizacionAviso),
    clasificacionTitulo: str(src.clasificacionTitulo, d.clasificacionTitulo),
    clasificacionLead: str(src.clasificacionLead, d.clasificacionLead),
    clases: arr(src.clases, d.clases),
    identificacionTitulo: str(src.identificacionTitulo, d.identificacionTitulo),
    identificacionLead: str(src.identificacionLead, d.identificacionLead),
    identificacionBeneficios: arr(src.identificacionBeneficios, d.identificacionBeneficios),
    documentacionTitulo: str(src.documentacionTitulo, d.documentacionTitulo),
    documentacionLead: str(src.documentacionLead, d.documentacionLead),
    documentacionItems: arr(src.documentacionItems, d.documentacionItems),
    hojaSeguridadTitulo: str(src.hojaSeguridadTitulo, d.hojaSeguridadTitulo),
    hojaSeguridadTexto: str(src.hojaSeguridadTexto, d.hojaSeguridadTexto),
    hojaSeguridadAviso: str(src.hojaSeguridadAviso, d.hojaSeguridadAviso),
    tarjetaEmergenciaTitulo: str(src.tarjetaEmergenciaTitulo, d.tarjetaEmergenciaTitulo),
    tarjetaEmergenciaTexto: str(src.tarjetaEmergenciaTexto, d.tarjetaEmergenciaTexto),
    tarjetaEmergenciaFuncion: str(src.tarjetaEmergenciaFuncion, d.tarjetaEmergenciaFuncion),
    responsabilidadesTitulo: str(src.responsabilidadesTitulo, d.responsabilidadesTitulo),
    responsabilidadesLead: str(src.responsabilidadesLead, d.responsabilidadesLead),
    actores: arr(src.actores, d.actores),
    capacitacionTitulo: str(src.capacitacionTitulo, d.capacitacionTitulo),
    capacitacionTexto: str(src.capacitacionTexto, d.capacitacionTexto),
    capacitacionMensaje: str(src.capacitacionMensaje, d.capacitacionMensaje),
    vehiculosTitulo: str(src.vehiculosTitulo, d.vehiculosTitulo),
    vehiculosLead: str(src.vehiculosLead, d.vehiculosLead),
    vehiculosAspectos: arr(src.vehiculosAspectos, d.vehiculosAspectos),
    gestionTitulo: str(src.gestionTitulo, d.gestionTitulo),
    gestionLead: str(src.gestionLead, d.gestionLead),
    gestionPasos: arr(src.gestionPasos, d.gestionPasos),
    gestionCierre: str(src.gestionCierre, d.gestionCierre),
    internacionalTitulo: str(src.internacionalTitulo, d.internacionalTitulo),
    internacionalTexto: str(src.internacionalTexto, d.internacionalTexto),
    internacionalAspectos: arr(src.internacionalAspectos, d.internacionalAspectos),
    modosTitulo: str(src.modosTitulo, d.modosTitulo),
    modosLead: str(src.modosLead, d.modosLead),
    modos: arr(src.modos, d.modos),
    emergenciaTitulo: str(src.emergenciaTitulo, d.emergenciaTitulo),
    emergenciaRegla: str(src.emergenciaRegla, d.emergenciaRegla),
    emergenciaTexto: str(src.emergenciaTexto, d.emergenciaTexto),
    emergenciaPasos: arr(src.emergenciaPasos, d.emergenciaPasos),
    mitos: arr(src.mitos, d.mitos),
    faq: arr(src.faq, d.faq),
    glosario: arr(src.glosario, d.glosario),
    fuentesTitulo: str(src.fuentesTitulo, d.fuentesTitulo),
    fuentesLead: str(src.fuentesLead, d.fuentesLead),
    fuentes: arr(src.fuentes, d.fuentes),
    documentosTitulo: str(src.documentosTitulo, d.documentosTitulo),
    documentosLead: str(src.documentosLead, d.documentosLead),
    documentosGrupos: mergeDocumentosGrupos(src.documentosGrupos, d.documentosGrupos),
  };
}

module.exports = { MERCANCIAS_PELIGROSAS_DEFAULTS, mergeMercanciasPeligrosasLanding };
