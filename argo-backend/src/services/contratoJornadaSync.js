const mongoose = require('mongoose');
const Contratacion = require('../models/Contratacion');
const JornadaCap = require('../models/JornadaCap');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const { calcNumeObjeJornada } = require('./programacionJornadas');

/**
 * Sincroniza contadores del contrato con la realidad en BD:
 * - numerojornadas = cantidad de jornadas existentes
 * - numeObjeJornada = alumnos ÷ jornadas
 * - clasesPorJornada = máximo de clases en cualquier jornada del contrato
 */
async function syncContadoresContrato(idContratoRaw) {
  if (!idContratoRaw) return null;
  const idContrato =
    idContratoRaw instanceof mongoose.Types.ObjectId
      ? idContratoRaw
      : new mongoose.Types.ObjectId(String(idContratoRaw));

  const contrato = await Contratacion.findById(idContrato);
  if (!contrato) return null;

  const numerojornadas = await JornadaCap.countDocuments({ idContrato });
  const numeObjeJornada = calcNumeObjeJornada(contrato.numeroAlumnos, numerojornadas);

  const jornadaIds = await JornadaCap.find({ idContrato }).distinct('_id');
  let clasesPorJornada = 0;
  if (jornadaIds.length) {
    const agg = await ClaseJornadaCap.aggregate([
      { $match: { idJornada: { $in: jornadaIds } } },
      { $group: { _id: '$idJornada', total: { $sum: 1 } } },
      { $group: { _id: null, maxClases: { $max: '$total' } } },
    ]);
    clasesPorJornada = Math.max(0, parseInt(agg[0]?.maxClases, 10) || 0);
  }

  contrato.numerojornadas = numerojornadas;
  contrato.numeObjeJornada = numeObjeJornada;
  contrato.clasesPorJornada = clasesPorJornada;
  contrato.jornadasGeneradas = numerojornadas > 0;
  await contrato.save();

  if (numeObjeJornada > 0 && numerojornadas > 0) {
    await JornadaCap.updateMany({ idContrato }, { $set: { numeObjeJornada } });
  }

  return contrato.toObject ? contrato.toObject() : contrato;
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
