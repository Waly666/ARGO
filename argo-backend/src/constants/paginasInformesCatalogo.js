/**
 * Catálogo de páginas de impresión / PDF configurables.
 * Cada informe tiene tamaño de página y márgenes en mm.
 */

const GRUPOS = [
  {
    id: 'comprobantes',
    label: 'Comprobantes y facturación',
    informes: [
      {
        key: 'comprobante_validadora',
        label: 'Comprobante térmico (ingreso / egreso)',
        size: 'termico_80',
        orientation: '',
        defaultMargins: { top: 4, right: 4, bottom: 4, left: 4 },
        hint: 'El ancho del cuerpo del recibo también puede depender de Configuración → Comprobantes de caja.',
      },
      {
        key: 'comprobante_media_carta',
        label: 'Comprobante media carta',
        size: 'media_carta',
        orientation: '',
        defaultMargins: { top: 7, right: 7, bottom: 7, left: 7 },
      },
      {
        key: 'factura_electronica',
        label: 'Factura electrónica / nota crédito',
        size: 'A4',
        orientation: 'portrait',
        defaultMargins: { top: 12, right: 12, bottom: 12, left: 12 },
      },
      {
        key: 'cuenta_cobro',
        label: 'Cuenta de cobro (contrato jornadas)',
        size: 'letter',
        orientation: '',
        defaultMargins: { top: 18, right: 16, bottom: 18, left: 16 },
      },
    ],
  },
  {
    id: 'jornadas',
    label: 'Jornadas de capacitación',
    informes: [
      {
        key: 'informe_contrato_jornadas',
        label: 'Informe PDF del contrato (dashboard)',
        size: 'A4',
        orientation: '',
        defaultMargins: { top: 12, right: 12, bottom: 12, left: 12 },
      },
      {
        key: 'informe_jornadas_listado',
        label: 'Informes de jornadas (listados)',
        size: 'A4',
        orientation: 'landscape',
        defaultMargins: { top: 10, right: 10, bottom: 10, left: 10 },
      },
      {
        key: 'etiqueta_qr_jornada',
        label: 'Etiquetas QR de alumnos',
        size: 'etiqueta_qr',
        orientation: '',
        defaultMargins: { top: 4, right: 4, bottom: 4, left: 4 },
        hint: 'La etiqueta individual sigue midiendo ~52×32 mm; aquí define la hoja de impresión.',
      },
    ],
  },
  {
    id: 'operacion',
    label: 'Caja, académicos y operación',
    informes: [
      {
        key: 'informe_caja',
        label: 'Informes de caja (cuadre / cierre)',
        size: 'A4',
        orientation: 'landscape',
        defaultMargins: { top: 10, right: 10, bottom: 10, left: 10 },
      },
      {
        key: 'informe_academico',
        label: 'Informes académicos (tablas)',
        size: 'letter',
        orientation: 'portrait',
        defaultMargins: { top: 12, right: 10, bottom: 12, left: 10 },
      },
      {
        key: 'inspeccion_vehiculo',
        label: 'Inspección preoperacional de vehículo',
        size: 'A4',
        orientation: 'portrait',
        defaultMargins: { top: 12, right: 12, bottom: 12, left: 12 },
      },
      {
        key: 'colilla_nomina',
        label: 'Colilla de pago (nómina)',
        size: 'A4',
        orientation: 'portrait',
        defaultMargins: { top: 12, right: 12, bottom: 12, left: 12 },
      },
    ],
  },
  {
    id: 'certificados',
    label: 'Certificados',
    informes: [
      {
        key: 'certificados',
        label: 'Certificados (impresión / PDF)',
        size: 'cert_horizontal',
        orientation: '',
        defaultMargins: { top: 0, right: 0, bottom: 0, left: 0 },
        hint: 'Si el diseño del certificado define otro tamaño, ese puede prevalecer al renderizar.',
      },
    ],
  },
];

/** id → valor CSS de size (sin orientación). */
const SIZE_PRESETS = [
  { id: 'A4', label: 'A4 (210×297 mm)', cssSize: 'A4', wMm: 210, hMm: 297 },
  { id: 'letter', label: 'Carta / letter (216×279 mm)', cssSize: 'letter', wMm: 216, hMm: 279 },
  { id: 'legal', label: 'Oficio / legal (216×356 mm)', cssSize: 'legal', wMm: 216, hMm: 356 },
  {
    id: 'media_carta',
    label: 'Media carta (140×216 mm)',
    cssSize: '140mm 216mm',
    wMm: 140,
    hMm: 216,
  },
  {
    id: 'termico_80',
    label: 'Térmico 80 mm',
    cssSize: '80mm auto',
    wMm: 80,
    hMm: 160,
  },
  {
    id: 'termico_58',
    label: 'Térmico 58 mm',
    cssSize: '58mm auto',
    wMm: 58,
    hMm: 140,
  },
  {
    id: 'etiqueta_qr',
    label: 'Etiqueta QR (52×32 mm)',
    cssSize: '52mm 32mm',
    wMm: 52,
    hMm: 32,
  },
  {
    id: 'cert_horizontal',
    label: 'Certificado horizontal (297×210 mm)',
    cssSize: '297mm 210mm',
    wMm: 297,
    hMm: 210,
  },
  {
    id: 'cert_vertical',
    label: 'Certificado vertical (210×297 mm)',
    cssSize: '210mm 297mm',
    wMm: 210,
    hMm: 297,
  },
];

const ORIENTACIONES = [
  { id: '', label: 'Automática / sin forzar' },
  { id: 'portrait', label: 'Vertical' },
  { id: 'landscape', label: 'Horizontal' },
];

function presetPorId(id) {
  return SIZE_PRESETS.find((p) => p.id === id) || null;
}

function catalogoMetadatos() {
  const out = [];
  for (const g of GRUPOS) {
    for (const inf of g.informes) {
      out.push({
        key: inf.key,
        label: inf.label,
        grupoId: g.id,
        grupoLabel: g.label,
        size: inf.size,
        orientation: inf.orientation || '',
        defaultMargins: { ...inf.defaultMargins },
        hint: inf.hint || '',
        sizeEditable: true,
        orientationEditable: true,
      });
    }
  }
  return out;
}

function metaPorClave(key) {
  return catalogoMetadatos().find((m) => m.key === key) || null;
}

module.exports = {
  GRUPOS,
  SIZE_PRESETS,
  ORIENTACIONES,
  catalogoMetadatos,
  metaPorClave,
  presetPorId,
};
