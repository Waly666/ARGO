/**
 * Esquemas de captura Fase 1 — campos para generar documentos PESV.
 * Alineado a pack Res. 40595; se refinan con los .docx del cliente.
 */

const VARIANT_LABELS = {
  velocidad: 'Gestión de la velocidad segura',
  fatiga: 'Prevención de fatiga y somnolencia',
  distraccion: 'Gestión de distracciones',
  alcohol: 'Cero tolerancia — alcohol y SPA',
  vulnerables: 'Actores viales vulnerables',
  difusion: 'Difusión de programas críticos',
  habitos: 'Hábitos seguros en la vía',
  responsabilidades: 'Responsabilidades comportamiento seguro',
  eval_competencias: 'Evaluación anual de competencias',
  eval_conductores: 'Evaluación de conductores',
  actas_seguimiento: 'Actas de seguimiento dirección',
  linea_base: 'Línea base PESV',
  difusion_objetivos: 'Difusión de objetivos',
  competencias: 'Competencias por cargo',
  comunicacion: 'Comunicación documentada',
  vias_internas: 'Vías internas administradas',
  protocolo_vias: 'Protocolo vías internas',
  siniestros_vias: 'Siniestros en vías internas',
  riesgos_accesos: 'Riesgos accesos e intersecciones',
  autoridades: 'Articulación autoridades tránsito',
  viajes_misionales: 'Planificación viajes misionales',
  gestion_cambio: 'Gestión del cambio',
  contratistas: 'Contratistas en el PESV',
  terceros: 'Terceros en el PESV',
  supervision: 'Supervisión contratistas/terceros',
  contratistas_extra: 'Contratistas — ítem adicional',
  procedimiento: 'Procedimiento inspección preoperacional',
  control_documental: 'Control documental PESV',
  informe: 'Informe auditoría interna',
  plan_accion: 'Plan de acción post auditoría',
};

const CAMPOS_ORGANIZACION = [
  { key: 'razonSocial', label: 'Razón social', tipo: 'text', requerido: true },
  { key: 'nit', label: 'NIT', tipo: 'text', requerido: true },
  { key: 'representanteLegal', label: 'Representante legal', tipo: 'text', requerido: true },
  { key: 'ciudad', label: 'Ciudad / sede principal', tipo: 'text' },
];

function seccion(id, titulo, campos) {
  return { id, titulo, campos };
}

function filas(key, label, columnas) {
  return { key, label, tipo: 'tabla', columnas, filas: [] };
}

const FORMULARIOS = {
  cert_1565: {
    titulo: 'Certificación del representante legal — Res. 1565/2014',
    descripcion:
      'Documento en el que el representante legal certifica que el PESV está implementado conforme a la Resolución 1565 de 2014. No es un documento de Supertransporte.',
    secciones: [
      seccion('org', 'Organización', CAMPOS_ORGANIZACION),
      seccion('cert', 'Certificación de cumplimiento', [
        {
          key: 'declaracionConformidad',
          label: 'Texto de conformidad (PESV implementado según Res. 1565/2014)',
          tipo: 'textarea',
          requerido: true,
        },
        { key: 'fechaExpedicion', label: 'Fecha de la certificación', tipo: 'date', requerido: true },
        { key: 'lugarExpedicion', label: 'Lugar de expedición', tipo: 'text' },
        { key: 'nombreFirma', label: 'Nombre quien firma (representante legal)', tipo: 'text', requerido: true },
        { key: 'cargoFirma', label: 'Cargo', tipo: 'text', requerido: true },
        { key: 'numeroCertificado', label: 'Consecutivo interno (opcional)', tipo: 'text' },
        { key: 'observaciones', label: 'Observaciones', tipo: 'textarea' },
      ]),
    ],
  },
  cert_40595: {
    titulo: 'Certificación del representante legal — Res. 40595/2022',
    descripcion:
      'Documento en el que el representante legal da conformidad al PESV en desarrollo o implementado según la Resolución 40595 de 2022.',
    secciones: [
      seccion('org', 'Organización', CAMPOS_ORGANIZACION),
      seccion('cert', 'Certificación de cumplimiento', [
        {
          key: 'declaracionConformidad',
          label: 'Texto de conformidad (Res. 40595/2022)',
          tipo: 'textarea',
          requerido: true,
        },
        { key: 'estadoPesv', label: 'Estado que certifica', tipo: 'select', opciones: ['Implementado', 'En desarrollo'], requerido: true },
        { key: 'fechaExpedicion', label: 'Fecha de la certificación', tipo: 'date', requerido: true },
        { key: 'lugarExpedicion', label: 'Lugar de expedición', tipo: 'text' },
        { key: 'nombreFirma', label: 'Nombre quien firma (representante legal)', tipo: 'text', requerido: true },
        { key: 'cargoFirma', label: 'Cargo', tipo: 'text', requerido: true },
        { key: 'numeroCertificado', label: 'Consecutivo interno (opcional)', tipo: 'text' },
        { key: 'observaciones', label: 'Observaciones', tipo: 'textarea' },
      ]),
    ],
  },
  lider_pesv: {
    titulo: 'Designación líder PESV',
    secciones: [
      seccion('org', 'Organización', CAMPOS_ORGANIZACION),
      seccion('lider', 'Líder PESV', [
        { key: 'nombreLider', label: 'Nombre completo', tipo: 'text', requerido: true },
        { key: 'cargoLider', label: 'Cargo', tipo: 'text', requerido: true },
        { key: 'correoLider', label: 'Correo', tipo: 'text' },
        { key: 'telefonoLider', label: 'Teléfono', tipo: 'text' },
        { key: 'fechaNombramiento', label: 'Fecha nombramiento', tipo: 'date', requerido: true },
        { key: 'articulacionSgSst', label: 'Articulación con SG-SST (cómo se vincula)', tipo: 'textarea', requerido: true },
        { key: 'facultadesDecision', label: 'Facultades / poder de decisión', tipo: 'textarea' },
      ]),
    ],
  },
  '03': {
    titulo: 'Acta — Comité de Seguridad Vial',
    secciones: [
      seccion('org', 'Organización', CAMPOS_ORGANIZACION),
      seccion('comite', 'Comité', [
        { key: 'fechaConformacion', label: 'Fecha conformación', tipo: 'date', requerido: true },
        { key: 'presidenteComite', label: 'Presidente / líder comité', tipo: 'text', requerido: true },
        { key: 'secretarioComite', label: 'Secretario técnico', tipo: 'text' },
        filas('integrantes', 'Integrantes del comité', [
          { key: 'nombre', label: 'Nombre' },
          { key: 'cargo', label: 'Cargo' },
          { key: 'representacion', label: 'Representación (dirección, operación, SST…)' },
        ]),
        { key: 'funcionesComite', label: 'Funciones del comité', tipo: 'textarea' },
        { key: 'periodicidadReunion', label: 'Periodicidad de reunión', tipo: 'text' },
      ]),
    ],
  },
  '02': {
    titulo: 'Política de Seguridad Vial',
    secciones: [
      seccion('org', 'Organización', CAMPOS_ORGANIZACION),
      seccion('politica', 'Contenido política', [
        { key: 'fechaAprobacion', label: 'Fecha aprobación alta dirección', tipo: 'date', requerido: true },
        { key: 'alcance', label: 'Alcance (quiénes aplica)', tipo: 'textarea', requerido: true },
        { key: 'compromisoDireccion', label: 'Compromiso de la dirección', tipo: 'textarea', requerido: true },
        { key: 'objetivoGeneral', label: 'Objetivo general de la política', tipo: 'textarea', requerido: true },
        { key: 'lineamientoVelocidad', label: 'Lineamiento velocidad segura', tipo: 'textarea' },
        { key: 'lineamientoAlcohol', label: 'Lineamiento alcohol, drogas y SPA', tipo: 'textarea' },
        { key: 'lineamientoCinturon', label: 'Cinturón y elementos protección', tipo: 'textarea' },
        { key: 'lineamientoCelular', label: 'Uso de celular y distracciones', tipo: 'textarea' },
        { key: 'lineamientoFatiga', label: 'Jornadas, fatiga y pausas', tipo: 'textarea' },
        { key: 'mecanismosCumplimiento', label: 'Mecanismos de cumplimiento y sanciones', tipo: 'textarea' },
      ]),
    ],
  },
  diagnostico_sv: {
    titulo: 'Diagnóstico de seguridad vial',
    secciones: [
      seccion('org', 'Organización', CAMPOS_ORGANIZACION),
      seccion('diag', 'Diagnóstico', [
        { key: 'fechaDiagnostico', label: 'Fecha del diagnóstico', tipo: 'date', requerido: true },
        { key: 'metodologia', label: 'Metodología utilizada', tipo: 'textarea', requerido: true },
        { key: 'contextoOperacion', label: 'Contexto operación (flota, rutas, conductores)', tipo: 'textarea', requerido: true },
        { key: 'hallazgosPrincipales', label: 'Hallazgos principales', tipo: 'textarea', requerido: true },
        { key: 'oportunidadesMejora', label: 'Oportunidades de mejora', tipo: 'textarea' },
        filas('indicadoresLineaBase', 'Indicadores línea base', [
          { key: 'indicador', label: 'Indicador' },
          { key: 'valor', label: 'Valor / periodo' },
          { key: 'fuente', label: 'Fuente dato' },
        ]),
      ]),
    ],
  },
  procedimiento_riesgos: {
    titulo: 'Procedimiento evaluación y control de riesgos viales',
    secciones: [
      seccion('proc', 'Procedimiento', [
        { key: 'objetivo', label: 'Objetivo', tipo: 'textarea', requerido: true },
        { key: 'alcance', label: 'Alcance', tipo: 'textarea', requerido: true },
        { key: 'responsable', label: 'Responsable del proceso', tipo: 'text', requerido: true },
        { key: 'frecuenciaEvaluacion', label: 'Frecuencia de evaluación', tipo: 'text' },
        { key: 'pasosEvaluacion', label: 'Pasos del procedimiento', tipo: 'textarea', requerido: true },
        { key: 'criteriosAceptacion', label: 'Criterios de aceptación / tolerancia', tipo: 'textarea' },
        { key: 'registros', label: 'Registros generados', tipo: 'textarea' },
      ]),
    ],
  },
  '07': {
    titulo: 'Matriz de riesgos viales',
    secciones: [
      seccion('matriz', 'Matriz (genera Excel)', [
        filas('riesgos', 'Riesgos viales', [
          { key: 'proceso', label: 'Proceso / actividad' },
          { key: 'peligro', label: 'Peligro' },
          { key: 'riesgo', label: 'Riesgo vial' },
          { key: 'probabilidad', label: 'Probabilidad (1-5)' },
          { key: 'consecuencia', label: 'Consecuencia (1-5)' },
          { key: 'nivel', label: 'Nivel riesgo' },
          { key: 'controles', label: 'Controles existentes' },
          { key: 'controlesPropuestos', label: 'Controles propuestos' },
          { key: 'responsable', label: 'Responsable' },
          { key: 'fechaSeguimiento', label: 'Fecha seguimiento' },
        ]),
      ]),
    ],
  },
  '08': {
    titulo: 'Plan anual de trabajo PESV',
    secciones: [
      seccion('plan', 'Plan anual', [
        { key: 'vigenciaPlan', label: 'Año vigencia plan', tipo: 'number', requerido: true },
        { key: 'objetivoAnual', label: 'Objetivo anual', tipo: 'textarea', requerido: true },
        filas('actividades', 'Cronograma actividades', [
          { key: 'actividad', label: 'Actividad' },
          { key: 'paso40595', label: 'Paso PESV ref.' },
          { key: 'responsable', label: 'Responsable' },
          { key: 'mesInicio', label: 'Mes inicio' },
          { key: 'mesFin', label: 'Mes fin' },
          { key: 'recursos', label: 'Recursos' },
          { key: 'indicador', label: 'Indicador seguimiento' },
        ]),
      ]),
    ],
  },
  '10': {
    titulo: 'Plan anual capacitación vial',
    secciones: [
      seccion('cap', 'Capacitación', [
        { key: 'vigencia', label: 'Año', tipo: 'number', requerido: true },
        filas('cursos', 'Actividades de formación', [
          { key: 'tema', label: 'Tema / módulo' },
          { key: 'publico', label: 'Público objetivo' },
          { key: 'horas', label: 'Horas' },
          { key: 'mes', label: 'Mes programado' },
          { key: 'modalidad', label: 'Modalidad' },
          { key: 'responsable', label: 'Responsable' },
        ]),
      ]),
    ],
  },
  emergencias: {
    titulo: 'Plan preparación y respuesta emergencias viales',
    secciones: [
      seccion('em', 'Emergencias', [
        { key: 'objetivo', label: 'Objetivo', tipo: 'textarea', requerido: true },
        { key: 'escenarios', label: 'Escenarios atendidos', tipo: 'textarea', requerido: true },
        { key: 'equipoRespuesta', label: 'Equipo de respuesta', tipo: 'textarea' },
        filas('contactos', 'Contactos de emergencia', [
          { key: 'entidad', label: 'Entidad' },
          { key: 'telefono', label: 'Teléfono' },
          { key: 'observacion', label: 'Observación' },
        ]),
        { key: 'recursos', label: 'Recursos (botiquín, extintor, etc.)', tipo: 'textarea' },
        { key: 'simulacros', label: 'Simulacros / fechas', tipo: 'textarea' },
      ]),
    ],
  },
  investigacion: {
    titulo: 'Metodología investigación accidentes',
    secciones: [
      seccion('inv', 'Investigación', [
        { key: 'objetivo', label: 'Objetivo', tipo: 'textarea', requerido: true },
        { key: 'alcance', label: 'Alcance (tipos de eventos)', tipo: 'textarea', requerido: true },
        { key: 'pasosInvestigacion', label: 'Pasos de investigación', tipo: 'textarea', requerido: true },
        { key: 'roles', label: 'Roles y responsables', tipo: 'textarea' },
        { key: 'formatoRegistro', label: 'Formato / registro usado', tipo: 'textarea' },
        { key: 'plazoCierre', label: 'Plazos de cierre e informe', tipo: 'textarea' },
      ]),
    ],
  },
  '13': {
    titulo: 'Inspección preoperacional',
    secciones: [
      seccion('insp', 'Inspección', [
        { key: 'objetivo', label: 'Objetivo del procedimiento', tipo: 'textarea', requerido: true },
        { key: 'responsableVerificacion', label: 'Responsable verificación', tipo: 'text' },
        { key: 'frecuencia', label: 'Frecuencia (diaria, por turno…)', tipo: 'text', requerido: true },
        filas('itemsChecklist', 'Ítems mínimos checklist', [
          { key: 'item', label: 'Ítem' },
          { key: 'criterio', label: 'Criterio sí/no' },
        ]),
        { key: 'accionesNoConforme', label: 'Acciones si no conforme', tipo: 'textarea' },
      ]),
    ],
  },
  '14': {
    titulo: 'Plan mantenimiento preventivo vehículos',
    secciones: [
      seccion('mant', 'Mantenimiento', [
        { key: 'politicaMantenimiento', label: 'Política / objetivo', tipo: 'textarea', requerido: true },
        filas('programa', 'Programa por vehículo / tipo', [
          { key: 'placaOTipo', label: 'Placa o tipo vehículo' },
          { key: 'actividad', label: 'Actividad mantenimiento' },
          { key: 'frecuenciaKm', label: 'Frecuencia (km)' },
          { key: 'frecuenciaTiempo', label: 'Frecuencia (tiempo)' },
          { key: 'responsable', label: 'Responsable' },
        ]),
      ]),
    ],
  },
  '19': {
    titulo: 'Registro e indicadores mínimos PESV',
    secciones: [
      seccion('ind', 'Indicadores', [
        { key: 'periodicidadMedicion', label: 'Periodicidad medición', tipo: 'text', requerido: true },
        filas('indicadores', 'Indicadores', [
          { key: 'codigo', label: 'Código (6.x, 8.x…)' },
          { key: 'nombre', label: 'Nombre indicador' },
          { key: 'formula', label: 'Fórmula / fuente' },
          { key: 'meta', label: 'Meta anual' },
          { key: 'responsable', label: 'Responsable' },
        ]),
      ]),
    ],
  },
  auditoria: {
    titulo: 'Auditoría interna PESV',
    secciones: [
      seccion('aud', 'Auditoría', [
        { key: 'objetivo', label: 'Objetivo auditoría', tipo: 'textarea', requerido: true },
        { key: 'alcance', label: 'Alcance', tipo: 'textarea', requerido: true },
        { key: 'criterios', label: 'Criterios (40595, política…)', tipo: 'textarea', requerido: true },
        { key: 'frecuencia', label: 'Frecuencia mínima', tipo: 'text' },
        { key: 'ultimaAuditoria', label: 'Fecha última auditoría', tipo: 'date' },
        { key: 'auditorLider', label: 'Auditor líder', tipo: 'text' },
        { key: 'hallazgosResumen', label: 'Resumen hallazgos (si aplica)', tipo: 'textarea' },
      ]),
    ],
  },
  siniestralidad: {
    titulo: 'Registro estadístico siniestralidad',
    secciones: [
      seccion('sin', 'Registro (Excel)', [
        filas('eventos', 'Eventos / siniestros', [
          { key: 'fecha', label: 'Fecha' },
          { key: 'tipo', label: 'Tipo / nivel pérdida' },
          { key: 'placa', label: 'Placa' },
          { key: 'conductor', label: 'Conductor' },
          { key: 'descripcion', label: 'Descripción breve' },
          { key: 'acciones', label: 'Acciones' },
        ]),
      ]),
    ],
  },
  '25-31': {
    titulo: 'Programa gestión riesgos críticos',
    secciones: [
      seccion('prog', 'Programa', [
        { key: 'nombrePrograma', label: 'Nombre del programa', tipo: 'text', requerido: true },
        { key: 'objetivo', label: 'Objetivo', tipo: 'textarea', requerido: true },
        { key: 'alcance', label: 'Alcance', tipo: 'textarea', requerido: true },
        { key: 'responsable', label: 'Responsable', tipo: 'text', requerido: true },
        { key: 'lineamientoPolitica', label: 'Lineamiento / política específica', tipo: 'textarea', requerido: true },
        { key: 'actividades', label: 'Actividades del programa', tipo: 'textarea', requerido: true },
        { key: 'recursos', label: 'Recursos', tipo: 'textarea' },
        filas('indicadoresPrograma', 'Indicadores del programa', [
          { key: 'indicador', label: 'Indicador' },
          { key: 'meta', label: 'Meta' },
          { key: 'frecuencia', label: 'Frecuencia medición' },
        ]),
      ]),
    ],
  },
  '04': {
    titulo: 'Objetivos, metas e indicadores PESV',
    secciones: [
      seccion('obj', 'Objetivos', [
        { key: 'vigencia', label: 'Vigencia', tipo: 'number', requerido: true },
        filas('objetivos', 'Objetivos y metas', [
          { key: 'objetivo', label: 'Objetivo' },
          { key: 'meta', label: 'Meta' },
          { key: 'indicador', label: 'Indicador' },
          { key: 'responsable', label: 'Responsable' },
        ]),
        { key: 'mecanismosDifusion', label: 'Cómo se difunde al personal', tipo: 'textarea' },
      ]),
    ],
  },
  '05': {
    titulo: 'Autodiagnóstico / línea base (documento)',
    secciones: [
      seccion('base', 'Línea base', [
        { key: 'fecha', label: 'Fecha', tipo: 'date', requerido: true },
        { key: 'resumenNivel', label: 'Nivel PESV (copiar de autodiagnóstico ARGO)', tipo: 'text' },
        { key: 'misionalidad', label: 'Misionalidad 1 o 2', tipo: 'text' },
        { key: 'totalVehiculos', label: 'Total vehículos', tipo: 'number' },
        { key: 'totalConductores', label: 'Total conductores', tipo: 'number' },
        { key: 'conclusiones', label: 'Conclusiones línea base', tipo: 'textarea', requerido: true },
      ]),
    ],
  },
  '06': {
    titulo: 'Caracterización / vías / contexto',
    secciones: [
      seccion('car', 'Caracterización', [
        { key: 'descripcion', label: 'Descripción del tema / alcance documento', tipo: 'textarea', requerido: true },
        { key: 'procedimiento', label: 'Procedimiento o protocolo', tipo: 'textarea', requerido: true },
        { key: 'responsable', label: 'Responsable', tipo: 'text' },
        { key: 'registros', label: 'Registros / evidencias operativas', tipo: 'textarea' },
      ]),
    ],
  },
  derivado_flota: {
    titulo: 'Datos desde flota ARGO',
    descripcion: 'Este documento se alimenta de vehículos e inspecciones. Confirme revisión.',
    secciones: [
      seccion('flota', 'Confirmación', [
        { key: 'revisadoFlota', label: 'Revisé vehículos e inspecciones en ARGO', tipo: 'boolean' },
        { key: 'observaciones', label: 'Observaciones', tipo: 'textarea' },
      ]),
    ],
  },
};

/** Variantes usan formulario base + título contextual */
const VARIANT_FORM_BASE = {
  '04': '04',
  '05': '05',
  '06': '06',
  '08': '08',
  '13': '13',
  '19': '19',
  auditoria: 'auditoria',
  '25-31': '25-31',
};

function capturaKeyFromMeta(meta, itemNo) {
  if (meta.modo === 'cert_representante_legal' || meta.modo === 'externo_st') {
    return itemNo === 1 ? 'cert_1565' : 'cert_40595';
  }
  if (meta.modo === 'derivado_flota') return 'derivado_flota';
  const pid = meta.plantillaId || 'generico';
  if (meta.variant && FORMULARIOS[`${pid}__${meta.variant}`]) return `${pid}__${meta.variant}`;
  if (VARIANT_FORM_BASE[pid]) return VARIANT_FORM_BASE[pid];
  if (FORMULARIOS[pid]) return pid;
  return `item_${itemNo}`;
}

function getFormularioDef(capturaKey, meta = {}) {
  let def = FORMULARIOS[capturaKey];
  if (!def && meta.variant && VARIANT_LABELS[meta.variant]) {
    const baseKey = VARIANT_FORM_BASE[meta.plantillaId];
    def = baseKey ? { ...FORMULARIOS[baseKey] } : null;
    if (def) {
      def = {
        ...def,
        titulo: `${def.titulo} — ${VARIANT_LABELS[meta.variant]}`,
        tituloVariante: VARIANT_LABELS[meta.variant],
      };
    }
  }
  if (!def) {
    def = {
      titulo: meta.tituloDocumento || 'Captura documento PESV',
      secciones: [
        seccion('gen', 'Información', [
          { key: 'contenido', label: 'Contenido del documento', tipo: 'textarea', requerido: true },
          { key: 'responsable', label: 'Responsable', tipo: 'text' },
        ]),
      ],
    };
  }
  return JSON.parse(JSON.stringify(def));
}

function listFormulariosFase1() {
  const { CATALOGO_FASE1 } = require('./catalogoFase1');
  const { metaDocumentoItem } = require('./catalogoDocumentos');
  return CATALOGO_FASE1.map((cat) => {
    const meta = metaDocumentoItem(cat.itemNo);
    const capturaKey = capturaKeyFromMeta(meta, cat.itemNo);
    return {
      itemNo: cat.itemNo,
      paso40595: cat.paso40595,
      pregunta: cat.pregunta,
      capturaKey,
      meta,
    };
  });
}

module.exports = {
  FORMULARIOS,
  VARIANT_LABELS,
  capturaKeyFromMeta,
  getFormularioDef,
  listFormulariosFase1,
};
