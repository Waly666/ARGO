/**
 * Documentos institucionales PESV (pack alineado Res. 40595 / SISI).
 * ARGO captura datos → genera PDF/Excel → el usuario sube el archivo a SISI/CCPS.
 */

const MODO_DOCUMENTO = {
  GENERADO_ARGO: 'generado_argo',
  EXCEL_GENERADO: 'excel_generado',
  /** Certificación de cumplimiento firmada por el representante legal (ítems 1–2). */
  CERT_REPRESENTANTE_LEGAL: 'cert_representante_legal',
  /** @deprecated alias — mismo valor que CERT_REPRESENTANTE_LEGAL */
  EXTERNO_ST: 'cert_representante_legal',
  DERIVADO_FLOTA: 'derivado_flota',
  NA: 'na',
};

/** Plantillas editables en ARGO (id = referencia pack / maestro). */
const PLANTILLAS_PESV = {
  '02': { titulo: 'Política de Seguridad Vial', salida: 'pdf' },
  '03': { titulo: 'Acta Comité de Seguridad Vial', salida: 'pdf' },
  '04': { titulo: 'Objetivos e indicadores', salida: 'pdf' },
  '05': { titulo: 'Autodiagnóstico de nivel', salida: 'pdf' },
  '06': { titulo: 'Caracterización', salida: 'pdf' },
  '07': { titulo: 'Matriz de riesgos viales', salida: 'xlsx' },
  '08': { titulo: 'Plan anual de trabajo PESV', salida: 'pdf' },
  '10': { titulo: 'Plan de capacitación vial', salida: 'pdf' },
  '13': { titulo: 'Inspección preoperacional', salida: 'pdf' },
  '14': { titulo: 'Plan de mantenimiento vehículos', salida: 'pdf' },
  '19': { titulo: 'Tablero / registro de indicadores', salida: 'pdf' },
  '25-31': { titulo: 'Programas gestión riesgos críticos', salida: 'pdf' },
  lider_pesv: { titulo: 'Designación líder PESV', salida: 'pdf' },
  diagnostico_sv: { titulo: 'Diagnóstico seguridad vial', salida: 'pdf' },
  procedimiento_riesgos: { titulo: 'Procedimiento evaluación de riesgos', salida: 'pdf' },
  emergencias: { titulo: 'Plan emergencias viales', salida: 'pdf' },
  investigacion: { titulo: 'Metodología investigación accidentes', salida: 'pdf' },
  auditoria: { titulo: 'Procedimiento auditoría interna', salida: 'pdf' },
  siniestralidad: { titulo: 'Registro estadístico siniestralidad', salida: 'xlsx' },
};

/** Por ítem Fase 1 SISI: cómo se obtiene el documento en ARGO. */
const ITEM_DOCUMENTO = {
  1: {
    modo: MODO_DOCUMENTO.CERT_REPRESENTANTE_LEGAL,
    tituloDocumento: 'Certificación del representante legal — Res. 1565/2014',
    nota: 'Conformidad de la empresa sobre PESV implementado según Res. 1565/2014 (firma del representante legal).',
  },
  2: {
    modo: MODO_DOCUMENTO.CERT_REPRESENTANTE_LEGAL,
    tituloDocumento: 'Certificación del representante legal — Res. 40595/2022',
    nota: 'Conformidad sobre PESV en desarrollo o implementado según Res. 40595/2022 (representante legal).',
  },
  3: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: 'lider_pesv' },
  4: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '03' },
  5: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '02' },
  6: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '04', variant: 'actas_seguimiento' },
  7: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '05', variant: 'linea_base' },
  8: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: 'diagnostico_sv' },
  9: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: 'procedimiento_riesgos' },
  10: { modo: MODO_DOCUMENTO.EXCEL_GENERADO, plantillaId: '07' },
  11: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '04', variant: 'difusion_objetivos' },
  12: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '04' },
  13: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '25-31', variant: 'velocidad' },
  14: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '25-31', variant: 'fatiga' },
  15: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '25-31', variant: 'distraccion' },
  16: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '25-31', variant: 'alcohol' },
  17: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '25-31', variant: 'vulnerables' },
  18: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '25-31', variant: 'difusion' },
  19: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '08' },
  20: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '04', variant: 'competencias' },
  21: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '10' },
  22: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '25-31', variant: 'habitos' },
  23: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '25-31', variant: 'responsabilidades' },
  24: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '25-31', variant: 'eval_competencias' },
  25: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '25-31', variant: 'eval_conductores' },
  26: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: 'emergencias' },
  27: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: 'investigacion' },
  28: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '06', variant: 'vias_internas' },
  29: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '06', variant: 'protocolo_vias' },
  30: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '06', variant: 'siniestros_vias' },
  31: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '06', variant: 'riesgos_accesos' },
  32: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '06', variant: 'autoridades' },
  33: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '08', variant: 'viajes_misionales' },
  34: { modo: MODO_DOCUMENTO.DERIVADO_FLOTA, nota: 'Indicadores desde inspección ARGO' },
  35: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '13', variant: 'procedimiento' },
  36: { modo: MODO_DOCUMENTO.DERIVADO_FLOTA, plantillaId: '13', variant: 'formato' },
  37: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '14' },
  38: { modo: MODO_DOCUMENTO.DERIVADO_FLOTA, plantillaId: '14', variant: 'hoja_vida' },
  39: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '08', variant: 'gestion_cambio' },
  40: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '08', variant: 'contratistas' },
  41: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '08', variant: 'terceros' },
  42: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '08', variant: 'supervision' },
  43: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '08', variant: 'contratistas_extra' },
  44: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '19', variant: 'control_documental' },
  45: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '19' },
  46: { modo: MODO_DOCUMENTO.EXCEL_GENERADO, plantillaId: 'siniestralidad' },
  47: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: 'auditoria' },
  48: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: 'auditoria', variant: 'informe' },
  49: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: 'auditoria', variant: 'plan_accion' },
  50: { modo: MODO_DOCUMENTO.GENERADO_ARGO, plantillaId: '04', variant: 'comunicacion' },
};

function metaDocumentoItem(itemNo) {
  const m = ITEM_DOCUMENTO[itemNo] || { modo: MODO_DOCUMENTO.GENERADO_ARGO };
  const plantilla = m.plantillaId ? PLANTILLAS_PESV[m.plantillaId] : null;
  return {
    ...m,
    tituloDocumento: m.tituloDocumento || plantilla?.titulo || m.nota || 'Documento PESV',
    salida: plantilla?.salida || (m.modo === MODO_DOCUMENTO.EXCEL_GENERADO ? 'xlsx' : 'pdf'),
  };
}

module.exports = {
  MODO_DOCUMENTO,
  PLANTILLAS_PESV,
  ITEM_DOCUMENTO,
  metaDocumentoItem,
};
