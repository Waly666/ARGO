const Config = require('../models/Config');
const { ensureConfigDocument } = require('./configEnsure');
const { normalizarRol } = require('../utils/roles');

const CLAVE = 'horarioOperacion';

const DEFAULTS = {
  clave: CLAVE,
  activo: false,
  zonaHoraria: 'America/Bogota',
  minutosGracia: 30,
  extenderSiCajaAbierta: true,
  mensajeFueraHorario:
    'El sistema no está disponible en este horario. Intente de nuevo dentro de la ventana de operación.',
  mensajeGracia:
    'El horario de operación ha finalizado. Termine su trabajo pendiente; la sesión se cerrará al terminar el período de gracia o al cerrar la caja.',
  reglasGenerales: [],
  reglasPorRol: [],
};

let cache = null;
let cacheAt = 0;
const TTL_MS = 15_000;

function normalizarDias(dias) {
  if (!Array.isArray(dias)) return [];
  return [...new Set(dias.map((d) => Number(d)).filter((d) => d >= 0 && d <= 6))].sort((a, b) => a - b);
}

function normalizarVentana(v, idx = 0) {
  const dias = normalizarDias(v?.dias);
  const horaInicio = String(v?.horaInicio || '').trim();
  const horaFin = String(v?.horaFin || '').trim();
  if (!dias.length || !/^\d{1,2}:\d{2}$/.test(horaInicio) || !/^\d{1,2}:\d{2}$/.test(horaFin)) {
    return null;
  }
  return {
    id: String(v?.id || `v${idx + 1}`),
    dias,
    horaInicio,
    horaFin,
  };
}

function normalizarReglasPorRol(rows) {
  if (!Array.isArray(rows)) return [];
  const out = [];
  rows.forEach((row, idx) => {
    const rol = normalizarRol(row?.rol);
    if (!rol) return;
    const ventana = normalizarVentana(row, idx);
    if (!ventana) return;
    out.push({ id: String(row?.id || `r${idx + 1}`), rol, ...ventana });
  });
  return out;
}

function normalizarConfig(body = {}) {
  const minutosGracia = Math.min(Math.max(Number(body.minutosGracia) || 30, 5), 180);
  return {
    activo: body.activo === true || body.activo === 'true',
    zonaHoraria: String(body.zonaHoraria || 'America/Bogota').trim() || 'America/Bogota',
    minutosGracia,
    extenderSiCajaAbierta: body.extenderSiCajaAbierta !== false && body.extenderSiCajaAbierta !== 'false',
    mensajeFueraHorario: String(body.mensajeFueraHorario || DEFAULTS.mensajeFueraHorario).trim(),
    mensajeGracia: String(body.mensajeGracia || DEFAULTS.mensajeGracia).trim(),
    reglasGenerales: (Array.isArray(body.reglasGenerales) ? body.reglasGenerales : [])
      .map((v, i) => normalizarVentana(v, i))
      .filter(Boolean),
    reglasPorRol: normalizarReglasPorRol(body.reglasPorRol),
  };
}

async function obtenerConfigHorarioOperacion() {
  const now = Date.now();
  if (cache && now - cacheAt < TTL_MS) return cache;
  await ensureConfigDocument(CLAVE, DEFAULTS);
  const doc = await Config.findOne({ clave: CLAVE }).lean();
  const cfg = normalizarConfig(doc || DEFAULTS);
  cache = cfg;
  cacheAt = now;
  return cfg;
}

function invalidarCacheHorarioOperacion() {
  cache = null;
  cacheAt = 0;
}

async function guardarConfigHorarioOperacion(body) {
  const cfg = normalizarConfig(body);
  await ensureConfigDocument(CLAVE, DEFAULTS);
  await Config.findOneAndUpdate(
    { clave: CLAVE },
    { $set: { ...cfg, clave: CLAVE } },
    { new: true, upsert: true },
  ).lean();
  invalidarCacheHorarioOperacion();
  return cfg;
}

module.exports = {
  CLAVE,
  DEFAULTS,
  obtenerConfigHorarioOperacion,
  guardarConfigHorarioOperacion,
  invalidarCacheHorarioOperacion,
  normalizarConfig,
};
