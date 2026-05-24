const Config = require('../models/Config');
const { normalizePlantillaPorTipo } = require('./clasificacionCertificado');
const { normalizeLayoutPorTipo } = require('./certificadoLayout');

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
  /** Posición/estilo de campos por tipo y orientación */
  layoutPorTipo: normalizeLayoutPorTipo(null),
};

async function obtenerConfigCertificado() {
  let found = await Config.findOne({ clave: CLAVE }).lean();
  if (!found) found = (await Config.create({ ...DEFAULTS })).toObject();
  const merged = { ...DEFAULTS, ...found, clave: CLAVE };
  merged.plantillaPorTipo = normalizePlantillaPorTipo(merged.plantillaPorTipo);
  merged.layoutPorTipo = normalizeLayoutPorTipo(merged.layoutPorTipo);
  if (merged.mostrarQr == null) merged.mostrarQr = true;
  if (!merged.qrPosicion) merged.qrPosicion = 'inferior_izquierda';
  merged.qrTamanoPx = Math.min(140, Math.max(40, parseInt(merged.qrTamanoPx, 10) || 72));
  return merged;
}

async function siguienteCodigoCertificado() {
  const { consecutivoCertificado: _omit, ...defaultsInsert } = DEFAULTS;
  const updated = await Config.findOneAndUpdate(
    { clave: CLAVE },
    {
      $inc: { consecutivoCertificado: 1 },
      $setOnInsert: { ...defaultsInsert, clave: CLAVE },
    },
    { new: true, upsert: true },
  );
  const n = updated.consecutivoCertificado || 1;
  const pref = (updated.prefijoCertificado || DEFAULTS.prefijoCertificado).trim();
  return `${pref}-${String(n).padStart(6, '0')}`;
}

module.exports = { CLAVE, DEFAULTS, obtenerConfigCertificado, siguienteCodigoCertificado };
