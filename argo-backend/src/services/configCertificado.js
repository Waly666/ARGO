const Config = require('../models/Config');
const { normalizePlantillaPorTipo } = require('./clasificacionCertificado');

const CLAVE = 'certificado';

const DEFAULTS = {
  clave: CLAVE,
  nombreInstitucion: 'ARGO — Centro de Formación en Conducción',
  ciudad: '',
  nombreDirector: 'Director',
  nombreInstructor: 'Instructor',
  urlFirmaDirector: '',
  urlFirmaInstructor: '',
  prefijoCertificado: 'CERT',
  consecutivoCertificado: 0,
  /** QR global en todos los certificados emitidos */
  mostrarQr: true,
  qrPosicion: 'inferior_izquierda',
  qrTamanoPx: 72,
  /** Plantilla por tipo y orientación: { curso: { vertical, horizontal }, ... } */
  plantillaPorTipo: normalizePlantillaPorTipo(null),
};

async function obtenerConfigCertificado() {
  let found = await Config.findOne({ clave: CLAVE }).lean();
  if (!found) found = (await Config.create({ ...DEFAULTS })).toObject();
  const merged = { ...DEFAULTS, ...found, clave: CLAVE };
  merged.plantillaPorTipo = normalizePlantillaPorTipo(merged.plantillaPorTipo);
  if (merged.mostrarQr == null) merged.mostrarQr = true;
  if (!merged.qrPosicion) merged.qrPosicion = 'inferior_izquierda';
  merged.qrTamanoPx = Math.min(120, Math.max(48, parseInt(merged.qrTamanoPx, 10) || 72));
  return merged;
}

async function siguienteCodigoCertificado() {
  let doc = await Config.findOne({ clave: CLAVE });
  if (!doc) {
    doc = await Config.create({ ...DEFAULTS, consecutivoCertificado: 1 });
  } else {
    doc.consecutivoCertificado = (doc.consecutivoCertificado || 0) + 1;
    await doc.save();
  }
  const n = doc.consecutivoCertificado || 1;
  const pref = (doc.prefijoCertificado || 'CERT').trim();
  return `${pref}-${String(n).padStart(6, '0')}`;
}

module.exports = { CLAVE, DEFAULTS, obtenerConfigCertificado, siguienteCodigoCertificado };
