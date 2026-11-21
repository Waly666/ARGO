const { models } = require('../models/catalogos');
const filas = require('../data/organismos-transito.json');

/** Carga el directorio solo si el catálogo está vacío. Los códigos ya vienen cruzados con DIVIPOLA. */
async function asegurarOrganismosTransito() {
  const existentes = await models.organismosTransito.countDocuments();
  if (existentes > 0) return existentes;
  if (!Array.isArray(filas) || !filas.length) return 0;
  await models.organismosTransito.collection.insertMany(filas);
  return filas.length;
}

module.exports = { asegurarOrganismosTransito };
