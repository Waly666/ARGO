const Config = require('../models/Config');
const { ensureConfigDocument } = require('./configEnsure');
const { normalizarReglasReferidor, REGLAS_REFERIDOR_DEFAULT } = require('./envioCorreoAlumnoDestinos');

const CLAVE = 'envioCorreosAlumno';

const DEFAULTS = {
  clave: CLAVE,
  enviarCertificados: true,
  enviarComprobantesIngreso: true,
  referidorComercial: REGLAS_REFERIDOR_DEFAULT,
};

let cache = null;
let cacheAt = 0;
const TTL_MS = 30_000;

function normalizar(body = {}) {
  return {
    enviarCertificados: body.enviarCertificados !== false && body.enviarCertificados !== 'false',
    enviarComprobantesIngreso:
      body.enviarComprobantesIngreso !== false && body.enviarComprobantesIngreso !== 'false',
    referidorComercial: normalizarReglasReferidor(body.referidorComercial || REGLAS_REFERIDOR_DEFAULT),
  };
}

async function obtenerConfigEnvioCorreosAlumno() {
  const now = Date.now();
  if (cache && now - cacheAt < TTL_MS) return cache;
  await ensureConfigDocument(CLAVE, DEFAULTS);
  const doc = await Config.findOne({ clave: CLAVE }).lean();
  const cfg = normalizar(doc || DEFAULTS);
  cache = cfg;
  cacheAt = now;
  return cfg;
}

function invalidarCacheEnvioCorreosAlumno() {
  cache = null;
  cacheAt = 0;
}

async function guardarConfigEnvioCorreosAlumno(body) {
  const payload = normalizar(body);
  await ensureConfigDocument(CLAVE, DEFAULTS);
  const doc = await Config.findOneAndUpdate(
    { clave: CLAVE },
    { $set: payload },
    { new: true, upsert: true },
  ).lean();
  invalidarCacheEnvioCorreosAlumno();
  return normalizar(doc);
}

module.exports = {
  CLAVE,
  DEFAULTS,
  obtenerConfigEnvioCorreosAlumno,
  guardarConfigEnvioCorreosAlumno,
  invalidarCacheEnvioCorreosAlumno,
};
