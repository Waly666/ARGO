const Config = require('../models/Config');
const { ensureConfigDocument } = require('./configEnsure');
const { SERVICIO_CAPACITACION_CONTRATO_ID } = require('../constants/servicioContratoCap');

const CLAVE = 'jornadas-operacion';

const DEFAULTS = {
  /** Permite operar jornadas/clases en fechas distintas al día programado (carga histórica, correcciones). */
  operacionFueraDeDiaHabilitada: false,
  /** Controla si el usuario puede elegir horario manual en formularios de clase. */
  mostrarSwitchHorarioManual: true,
  /** idServ del catálogo para comprobantes de ingreso y facturas de contratos de capacitación. */
  idServCapacitacionContrato: SERVICIO_CAPACITACION_CONTRATO_ID,
};

function normalizarIdServCapacitacionContrato(raw) {
  const id = String(raw ?? '').trim();
  if (!id) {
    const err = new Error(
      'Indique el idServ del servicio de capacitación para contratos (comprobantes y facturas).',
    );
    err.status = 400;
    err.code = 'SERVICIO_CAP_CONTRATO_ID_INVALIDO';
    throw err;
  }
  return id;
}

async function obtenerConfigJornadasOperacion() {
  const doc = await ensureConfigDocument(CLAVE, DEFAULTS);
  const idServ = String(doc.idServCapacitacionContrato ?? DEFAULTS.idServCapacitacionContrato).trim();
  return {
    operacionFueraDeDiaHabilitada: doc.operacionFueraDeDiaHabilitada === true,
    mostrarSwitchHorarioManual: doc.mostrarSwitchHorarioManual !== false,
    idServCapacitacionContrato: idServ || DEFAULTS.idServCapacitacionContrato,
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
    mostrarSwitchHorarioManual:
      patch.mostrarSwitchHorarioManual !== undefined
        ? patch.mostrarSwitchHorarioManual === true || patch.mostrarSwitchHorarioManual === 'true'
        : actual.mostrarSwitchHorarioManual,
    idServCapacitacionContrato:
      patch.idServCapacitacionContrato !== undefined
        ? normalizarIdServCapacitacionContrato(patch.idServCapacitacionContrato)
        : actual.idServCapacitacionContrato,
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
