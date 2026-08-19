const Config = require('../models/Config');
const { ensureConfigDocument } = require('./configEnsure');

const CLAVE = 'gestoresEmpresas';

const DEFAULTS = {
  clave: CLAVE,
  activo: false,
};

let cache = null;
let cacheAt = 0;
const TTL_MS = 30_000;

async function obtenerConfigGestoresEmpresas() {
  const now = Date.now();
  if (cache && now - cacheAt < TTL_MS) return cache;
  await ensureConfigDocument(CLAVE, DEFAULTS);
  const doc = await Config.findOne({ clave: CLAVE }).lean();
  const cfg = {
    activo: doc?.activo === true,
  };
  cache = cfg;
  cacheAt = now;
  return cfg;
}

function invalidarCacheGestoresEmpresas() {
  cache = null;
  cacheAt = 0;
}

async function guardarConfigGestoresEmpresas(body) {
  const activo = body?.activo === true || body?.activo === 'true';
  await ensureConfigDocument(CLAVE, DEFAULTS);
  const doc = await Config.findOneAndUpdate(
    { clave: CLAVE },
    { $set: { activo } },
    { new: true, upsert: true },
  ).lean();
  invalidarCacheGestoresEmpresas();
  return { activo: doc?.activo === true };
}

module.exports = {
  CLAVE,
  obtenerConfigGestoresEmpresas,
  guardarConfigGestoresEmpresas,
  invalidarCacheGestoresEmpresas,
};
