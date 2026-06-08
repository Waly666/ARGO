const Config = require('../models/Config');
const { normalizePlantillaPorTipo, TIPOS, TIPOS_VALIDOS } = require('./clasificacionCertificado');
const { normalizeLayoutPorTipo } = require('./certificadoLayout');

const CLAVE = 'certificado';

const DEFAULT_DIAS_AVISO_POR_VENCER = 15;
const DEFAULT_DIAS_AVISO_VENCIDO = 3;

/**
 * Formatos que NO se certifican automáticamente al pagar por defecto.
 * - Mercancías peligrosas: requiere acta/folio/RUNT, queda manual.
 * - Jornada Capacitación: se emite por asistencia (cierre de jornada), no por pago.
 */
const AUTO_CERT_DESACTIVADO_POR_DEFECTO = new Set([
  TIPOS.MERCANCIAS,
  TIPOS.JORNADA_CAPACITACION,
]);

function defaultAutoCertPorTipo() {
  const out = {};
  for (const t of TIPOS_VALIDOS) out[t] = !AUTO_CERT_DESACTIVADO_POR_DEFECTO.has(t);
  return out;
}

function toBool(v, fallback = false) {
  if (v === true || v === 'true' || v === 1 || v === '1') return true;
  if (v === false || v === 'false' || v === 0 || v === '0') return false;
  return fallback;
}

/** Mapa formato→bool: activa la certificación automática al pagar por formato. */
function normalizeAutoCertPorTipo(raw) {
  const base = defaultAutoCertPorTipo();
  if (!raw || typeof raw !== 'object') return base;
  for (const t of TIPOS_VALIDOS) {
    if (raw[t] !== undefined) base[t] = toBool(raw[t], base[t]);
  }
  return base;
}

/** Lista de tipos de capacitación (idTipCap o etiqueta) excluidos de la certificación automática. */
function normalizeTiposCapExcluidos(raw) {
  if (!Array.isArray(raw)) return [];
  const vistos = new Set();
  const out = [];
  for (const v of raw) {
    const s = String(v ?? '').trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (vistos.has(key)) continue;
    vistos.add(key);
    out.push(s);
  }
  return out;
}

function normalizeDiasAvisoCert(val, fallback, max = 365) {
  const n = parseInt(String(val ?? ''), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

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
  /** Días antes del vencimiento para la alarma «por vencer» (banner superior). */
  diasAvisoCertificadoPorVencer: DEFAULT_DIAS_AVISO_POR_VENCER,
  /** Días después del vencimiento para la alarma «vencidos» (banner superior). */
  diasAvisoCertificadoVencido: DEFAULT_DIAS_AVISO_VENCIDO,
  /** QR global en todos los certificados emitidos */
  mostrarQr: true,
  qrPosicion: 'inferior_izquierda',
  qrTamanoPx: 72,
  /** Plantilla por tipo y orientación: { curso: { vertical, horizontal }, ... } */
  plantillaPorTipo: normalizePlantillaPorTipo(null),
  /** Posición/estilo de campos por tipo y orientación */
  layoutPorTipo: normalizeLayoutPorTipo(null),
  /** Emitir certificado automáticamente cuando una liquidación queda en saldo 0 (interruptor maestro). */
  autoCertificadoAlPagar: true,
  /** Qué formatos se certifican automáticamente al pagar: { curso: true, mercancias_peligrosas: false, ... } */
  autoCertificadoPorTipo: defaultAutoCertPorTipo(),
  /** Tipos de capacitación (idTipCap o etiqueta) que NUNCA se certifican automáticamente. */
  autoCertificadoTiposCapExcluidos: [],
};

async function obtenerConfigCertificado() {
  let found = await Config.findOne({ clave: CLAVE }).lean();
  if (!found) found = (await Config.create({ ...DEFAULTS })).toObject();
  const merged = { ...DEFAULTS, ...found, clave: CLAVE };
  merged.plantillaPorTipo = normalizePlantillaPorTipo(merged.plantillaPorTipo);
  merged.layoutPorTipo = normalizeLayoutPorTipo(merged.layoutPorTipo);
  merged.autoCertificadoAlPagar = toBool(merged.autoCertificadoAlPagar, true);
  merged.autoCertificadoPorTipo = normalizeAutoCertPorTipo(merged.autoCertificadoPorTipo);
  merged.autoCertificadoTiposCapExcluidos = normalizeTiposCapExcluidos(
    merged.autoCertificadoTiposCapExcluidos,
  );
  if (merged.mostrarQr == null) merged.mostrarQr = true;
  if (!merged.qrPosicion) merged.qrPosicion = 'inferior_izquierda';
  merged.qrTamanoPx = Math.min(140, Math.max(40, parseInt(merged.qrTamanoPx, 10) || 72));
  merged.diasAvisoCertificadoPorVencer = normalizeDiasAvisoCert(
    merged.diasAvisoCertificadoPorVencer,
    DEFAULT_DIAS_AVISO_POR_VENCER,
    60,
  );
  merged.diasAvisoCertificadoVencido = normalizeDiasAvisoCert(
    merged.diasAvisoCertificadoVencido,
    DEFAULT_DIAS_AVISO_VENCIDO,
    30,
  );
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

module.exports = {
  CLAVE,
  DEFAULTS,
  DEFAULT_DIAS_AVISO_POR_VENCER,
  DEFAULT_DIAS_AVISO_VENCIDO,
  normalizeDiasAvisoCert,
  normalizeAutoCertPorTipo,
  normalizeTiposCapExcluidos,
  defaultAutoCertPorTipo,
  obtenerConfigCertificado,
  siguienteCodigoCertificado,
};
