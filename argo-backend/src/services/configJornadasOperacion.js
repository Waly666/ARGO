const Config = require('../models/Config');
const { ensureConfigDocument } = require('./configEnsure');

const CLAVE = 'jornadas-operacion';

const DEFAULTS = {
  /** Permite operar jornadas/clases en fechas distintas al día programado (carga histórica, correcciones). */
  operacionFueraDeDiaHabilitada: false,
};

async function obtenerConfigJornadasOperacion() {
  const doc = await ensureConfigDocument(CLAVE, DEFAULTS);
  return {
    operacionFueraDeDiaHabilitada: doc.operacionFueraDeDiaHabilitada === true,
  };
}

async function actualizarConfigJornadasOperacion(patch = {}) {
  const actual = await obtenerConfigJornadasOperacion();
  const next = {
    operacionFueraDeDiaHabilitada:
      patch.operacionFueraDeDiaHabilitada !== undefined
        ? patch.operacionFueraDeDiaHabilitada === true ||
          patch.operacionFueraDeDiaHabilitada === 'true'
        : actual.operacionFueraDeDiaHabilitada,
  };
  await Config.findOneAndUpdate(
    { clave: CLAVE },
    { $set: { clave: CLAVE, ...next } },
    { upsert: true },
  );
  return next;
}

module.exports = {
  CLAVE,
  DEFAULTS,
  obtenerConfigJornadasOperacion,
  actualizarConfigJornadasOperacion,
};
