const Config = require('../models/Config');

const CLAVE = 'recibo';

const DEFAULTS = {
  clave: CLAVE,
  nombreEmpresa: 'ARGO — Centro de Formación en Conducción',
  nit: '',
  direccion: '',
  ciudad: '',
  telefono: '',
  email: '',
  urlLogo: '',
  /** Facturación electrónica / facturas */
  prefijoFactura: 'FV',
  consecutivoFactura: 0,
  /** Comprobantes de ingreso (pagos de alumnos) */
  prefijoComprobanteIngreso: 'CI',
  consecutivoComprobanteIngreso: 0,
  /** Comprobantes de egreso */
  prefijoComprobanteEgreso: 'CE',
  consecutivoComprobanteEgreso: 0,
  slogan1: '',
  mensajeEncabezado: 'COMPROBANTE DE INGRESO',
  mensajePie:
    'Documento soporte de pago. No sustituye factura electrónica. Conserve este comprobante.',
  anchoReciboMm: 80,
  mostrarQr: true,
};

/** Migra campos legacy (prefijoRecibo era para facturas, no comprobantes) */
function normalizar(doc) {
  const raw = { ...DEFAULTS, ...doc, clave: CLAVE };
  if (doc.prefijoRecibo != null && doc.prefijoFactura == null) {
    raw.prefijoFactura = String(doc.prefijoRecibo).trim() || DEFAULTS.prefijoFactura;
  }
  if (doc.consecutivoRecibo != null && doc.consecutivoFactura == null) {
    raw.consecutivoFactura = Number(doc.consecutivoRecibo) || 0;
  }
  const enc = String(raw.mensajeEncabezado || '').trim().toUpperCase();
  if (enc === 'COMPROBANTE DE EGRESO' || enc.includes('EGRESO')) {
    raw.mensajeEncabezado = 'COMPROBANTE DE INGRESO';
  }
  return raw;
}

async function obtenerConfigRecibo() {
  const found = await Config.findOne({ clave: CLAVE }).lean();
  if (!found) {
    return normalizar((await Config.create({ ...DEFAULTS })).toObject());
  }
  return normalizar(found);
}

async function reservarConsecutivo(campoConsecutivo, prefijo) {
  let doc = await Config.findOne({ clave: CLAVE });
  if (!doc) {
    doc = await Config.create({ ...DEFAULTS, [campoConsecutivo]: 1 });
  } else {
    doc[campoConsecutivo] = (doc[campoConsecutivo] || 0) + 1;
    await doc.save();
  }
  const n = doc[campoConsecutivo] || 1;
  const pref = (doc[prefijo] || '').trim() || 'DOC';
  return `${pref}-${String(n).padStart(6, '0')}`;
}

/** Número para comprobante de ingreso (pagos) */
async function siguienteNumComprobanteIngreso() {
  const cfg = await obtenerConfigRecibo();
  await Config.findOne({ clave: CLAVE }); // ensure exists
  return reservarConsecutivo('consecutivoComprobanteIngreso', 'prefijoComprobanteIngreso');
}

/** Número para comprobante de egreso */
async function siguienteNumComprobanteEgreso() {
  return reservarConsecutivo('consecutivoComprobanteEgreso', 'prefijoComprobanteEgreso');
}

/** Número para factura (módulo de facturación) */
async function siguienteNumFactura() {
  return reservarConsecutivo('consecutivoFactura', 'prefijoFactura');
}

/** @deprecated usar siguienteNumComprobanteIngreso */
async function siguienteNumRecibo() {
  return siguienteNumComprobanteIngreso();
}

module.exports = {
  CLAVE,
  DEFAULTS,
  normalizar,
  obtenerConfigRecibo,
  siguienteNumComprobanteIngreso,
  siguienteNumComprobanteEgreso,
  siguienteNumFactura,
  siguienteNumRecibo,
};
