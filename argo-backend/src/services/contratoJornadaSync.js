const mongoose = require('mongoose');
const Contratacion = require('../models/Contratacion');
const JornadaCap = require('../models/JornadaCap');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const { calcNumeObjeJornada } = require('./programacionJornadas');

/**
 * Sincroniza datos derivados del contrato sin pisar la planificación del usuario:
 * - numerojornadas, jornadasPorDia, clasesPorJornada = metas configuradas (no se modifican)
 * - numeObjeJornada = alumnos ÷ meta de jornadas
 * - jornadasGeneradas = hay al menos una jornada en BD
 */
async function syncContadoresContrato(idContratoRaw) {
  if (!idContratoRaw) return null;
  const idContrato =
    idContratoRaw instanceof mongoose.Types.ObjectId
      ? idContratoRaw
      : new mongoose.Types.ObjectId(String(idContratoRaw));

  const contrato = await Contratacion.findById(idContrato);
  if (!contrato) return null;

  const jornadasExistentes = await JornadaCap.countDocuments({ idContrato });
  const metaJornadas = Math.max(0, parseInt(contrato.numerojornadas, 10) || 0);
  const divisorMeta = metaJornadas > 0 ? metaJornadas : jornadasExistentes;
  const numeObjeJornada = calcNumeObjeJornada(contrato.numeroAlumnos, divisorMeta);

  contrato.numeObjeJornada = numeObjeJornada;
  contrato.jornadasGeneradas = jornadasExistentes > 0;
  await contrato.save();

  if (numeObjeJornada > 0 && jornadasExistentes > 0) {
    await JornadaCap.updateMany({ idContrato }, { $set: { numeObjeJornada } });
  }

  const plain = contrato.toObject ? contrato.toObject() : contrato;
  return { ...plain, jornadasExistentes };
}

/** Próximo índice libre en un día calendario para el contrato. */
async function siguienteIndiceEnDia(idContrato, fechaProgramacion) {
  const rows = await JornadaCap.find({ idContrato, fechaProgramacion })
    .select('indiceEnDia')
    .lean();
  const usados = new Set(rows.map((r) => Math.max(1, parseInt(r.indiceEnDia, 10) || 1)));
  for (let i = 1; i <= 20; i += 1) {
    if (!usados.has(i)) return i;
  }
  return rows.length + 1;
}

module.exports = {
  syncContadoresContrato,
  siguienteIndiceEnDia,
};
