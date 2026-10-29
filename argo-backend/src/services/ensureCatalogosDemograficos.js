const { models } = require('../models/catalogos');
const {
  GENERO_DEF,
  IDENTIDAD_GENERO_DEF,
  ORIENTACION_SEXUAL_DEF,
} = require('../constants/catalogosDemograficos');

async function ensureIfEmpty(nombre, rows) {
  const col = models[nombre];
  if (!col || !rows?.length) return 0;
  const n = await col.countDocuments();
  if (n > 0) return n;
  await col.insertMany(rows);
  return rows.length;
}

/** Catálogos demográficos vacíos en Mongo (p. ej. VPS sin seed) → datos base ARGO. */
async function ensureCatalogosDemograficos(nombre) {
  if (nombre === 'genero') return ensureIfEmpty('genero', GENERO_DEF);
  if (nombre === 'identidadGenero') return ensureIfEmpty('identidadGenero', IDENTIDAD_GENERO_DEF);
  if (nombre === 'orientacionSexual') return ensureIfEmpty('orientacionSexual', ORIENTACION_SEXUAL_DEF);
  return 0;
}

module.exports = { ensureCatalogosDemograficos };
