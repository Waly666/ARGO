/**
 * Rellena fechaVencimiento en certificados de jornada que no la tienen,
 * usando diasVencimiento del programa (igual que certificados normales).
 *
 * Uso: node scripts/backfillFechaVencimientoCertJornada.js
 * Simulación: node scripts/backfillFechaVencimientoCertJornada.js --dry-run
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Certificado = require('../src/models/Certificado');
const { buscarPrograma } = require('../src/services/programaServicio');

function calcularFechaVencimiento(fechaEmision, prog) {
  const fechaEm = fechaEmision ? new Date(fechaEmision) : null;
  if (!fechaEm || Number.isNaN(fechaEm.getTime())) return null;
  const dias = Number(prog?.diasVencimiento ?? prog?.vigenciaDias ?? 0);
  if (!Number.isFinite(dias) || dias <= 0) return null;
  return new Date(fechaEm.getTime() + dias * 24 * 60 * 60 * 1000);
}

async function backfill({ dryRun = false } = {}) {
  const certs = await Certificado.find({
    generadoAutoJornada: true,
    estado: { $ne: 'anulado' },
    $or: [{ fechaVencimiento: null }, { fechaVencimiento: { $exists: false } }],
  })
    .select('_id idProg fechaEmision codigoCert')
    .lean();

  let actualizados = 0;
  let sinPrograma = 0;
  let sinVigencia = 0;

  for (const c of certs) {
    const prog = c.idProg ? await buscarPrograma(c.idProg) : null;
    if (!prog) {
      sinPrograma += 1;
      continue;
    }
    const fechaVe = calcularFechaVencimiento(c.fechaEmision, prog);
    if (!fechaVe) {
      sinVigencia += 1;
      continue;
    }
    if (!dryRun) {
      await Certificado.updateOne({ _id: c._id }, { $set: { fechaVencimiento: fechaVe } });
    }
    actualizados += 1;
  }

  return {
    total: certs.length,
    actualizados,
    sinPrograma,
    sinVigencia,
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/argo';
  await mongoose.connect(uri);
  const r = await backfill({ dryRun });
  console.log(
    `Listo. Revisados: ${r.total}, actualizados: ${r.actualizados}, sin programa: ${r.sinPrograma}, sin vigencia (0 días): ${r.sinVigencia}${dryRun ? ' (dry-run)' : ''}.`,
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
