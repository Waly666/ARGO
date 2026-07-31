const Contratacion = require('../models/Contratacion');
const JornadaCap = require('../models/JornadaCap');
const { buildCodigoJornada } = require('../utils/codigoJornada');

/**
 * Rellena codigoJornada en jornadas existentes (y corrige si falta o está vacío).
 * @param {{ dryRun?: boolean, force?: boolean }} opts
 *   force: recalcula aunque ya tenga código
 */
async function migrarCodigoJornada(opts = {}) {
  const dryRun = !!opts.dryRun;
  const force = !!opts.force;
  const filter = force
    ? {}
    : {
        $or: [
          { codigoJornada: { $exists: false } },
          { codigoJornada: null },
          { codigoJornada: '' },
        ],
      };

  const rows = await JornadaCap.find(filter).select('_id idContrato codigoJornada').lean();
  if (!rows.length) {
    return { total: 0, actualizados: 0, sinContrato: 0 };
  }

  const contratoIds = [...new Set(rows.map((j) => String(j.idContrato || '')).filter(Boolean))];
  const contratos = await Contratacion.find({ _id: { $in: contratoIds } })
    .select('_id codContrato')
    .lean();
  const codById = new Map(contratos.map((c) => [String(c._id), String(c.codContrato || '').trim()]));

  let actualizados = 0;
  let sinContrato = 0;
  const ops = [];

  for (const j of rows) {
    const cod = codById.get(String(j.idContrato || ''));
    if (cod == null && !codById.has(String(j.idContrato || ''))) {
      sinContrato += 1;
    }
    const codigoJornada = buildCodigoJornada(cod || '', j._id);
    if (!codigoJornada) continue;
    if (!force && String(j.codigoJornada || '').trim() === codigoJornada) continue;
    actualizados += 1;
    if (!dryRun) {
      ops.push({
        updateOne: {
          filter: { _id: j._id },
          update: { $set: { codigoJornada } },
        },
      });
    }
  }

  if (!dryRun && ops.length) {
    const chunk = 500;
    for (let i = 0; i < ops.length; i += chunk) {
      await JornadaCap.bulkWrite(ops.slice(i, i + chunk), { ordered: false });
    }
  }

  return { total: rows.length, actualizados, sinContrato };
}

module.exports = { migrarCodigoJornada };
