const Contratacion = require('../models/Contratacion');
const JornadaCap = require('../models/JornadaCap');
const {
  ESTADO_JORNADA_EN_PROCESO,
  ESTADO_JORNADA_INACTIVO,
  ESTADO_JORNADA_FINALIZADO,
} = require('../constants/jornadaCapacitacion');
const { parseFechaCalendario, fechaCalendarioParaGuardar } = require('../utils/fechaCalendario');

const ESTADOS_CONTRATO = ['En Ejecución', 'Ejecutado'];

function normalizarEstadoContrato(valor) {
  const t = String(valor || '').trim();
  if (!t) return 'En Ejecución';
  const sinTildes = t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (sinTildes.includes('ejecutado') || sinTildes.includes('cerrado') || sinTildes.includes('finaliz')) {
    return 'Ejecutado';
  }
  if (sinTildes.includes('ejecucion') || sinTildes.includes('activo') || sinTildes.includes('proceso')) {
    return 'En Ejecución';
  }
  return ESTADOS_CONTRATO.includes(t) ? t : 'En Ejecución';
}

function contratoEstaEnEjecucion(estado) {
  return normalizarEstadoContrato(estado) === 'En Ejecución';
}

async function cerrarJornadasActivasContrato(idContrato) {
  const r = await JornadaCap.updateMany(
    {
      idContrato,
      estado: { $in: [ESTADO_JORNADA_EN_PROCESO, ESTADO_JORNADA_INACTIVO] },
    },
    { $set: { estado: ESTADO_JORNADA_FINALIZADO } },
  );
  return r.modifiedCount || 0;
}

function resolverFechaFinalizacion(valor) {
  if (valor != null && valor !== '') {
    const d = fechaCalendarioParaGuardar(valor);
    if (d) return d;
  }
  return parseFechaCalendario(new Date());
}

/**
 * Marca contrato como Ejecutado, registra fecha y cierra jornadas INACTIVO/EN PROCESO.
 */
async function finalizarContratoCap(contratoDoc, { fechaFinalizacion, userChangeRecord } = {}) {
  if (!contratoDoc) {
    const err = new Error('Contrato no encontrado');
    err.status = 404;
    throw err;
  }
  if (!contratoEstaEnEjecucion(contratoDoc.estado)) {
    const err = new Error('El contrato ya está finalizado.');
    err.status = 409;
    throw err;
  }

  contratoDoc.estado = 'Ejecutado';
  contratoDoc.fechaFinalizacion = resolverFechaFinalizacion(fechaFinalizacion);
  if (userChangeRecord) contratoDoc.userChangeRecord = userChangeRecord;
  await contratoDoc.save();

  const jornadasCerradas = await cerrarJornadasActivasContrato(contratoDoc._id);
  return { contrato: contratoDoc.toObject(), jornadasCerradas };
}

/**
 * Vuelve un contrato Ejecutado a «En Ejecución» para permitir matricular alumnos,
 * ajustar clases y emitir certificados pendientes. Las jornadas se re-sincronizan
 * por fecha (pasadas quedan FINALIZADO; la de hoy EN PROCESO).
 */
async function reactivarContratoCap(contratoDoc, { userChangeRecord } = {}) {
  if (!contratoDoc) {
    const err = new Error('Contrato no encontrado');
    err.status = 404;
    throw err;
  }
  if (contratoEstaEnEjecucion(contratoDoc.estado)) {
    const err = new Error('El contrato ya está en ejecución.');
    err.status = 409;
    throw err;
  }
  if (normalizarEstadoContrato(contratoDoc.estado) !== 'Ejecutado') {
    const err = new Error('Solo se pueden reactivar contratos finalizados (Ejecutado).');
    err.status = 409;
    throw err;
  }

  contratoDoc.estado = 'En Ejecución';
  contratoDoc.fechaFinalizacion = null;
  if (userChangeRecord) contratoDoc.userChangeRecord = userChangeRecord;
  await contratoDoc.save();

  const jornadas = await JornadaCap.find({ idContrato: contratoDoc._id }).select('_id').lean();
  let jornadasResincronizadas = 0;
  if (jornadas.length) {
    await JornadaCap.updateMany(
      { idContrato: contratoDoc._id },
      { $set: { estadoOperacionManual: false } },
    );
    const { sincronizarEstadoJornada } = require('./estadoJornadaCap');
    for (const j of jornadas) {
      await sincronizarEstadoJornada(j._id);
      jornadasResincronizadas += 1;
    }
  }

  return { contrato: contratoDoc.toObject(), jornadasResincronizadas };
}

module.exports = {
  ESTADOS_CONTRATO,
  normalizarEstadoContrato,
  contratoEstaEnEjecucion,
  cerrarJornadasActivasContrato,
  finalizarContratoCap,
  reactivarContratoCap,
};
