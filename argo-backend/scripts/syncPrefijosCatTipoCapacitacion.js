/**
 * Rellena catTipoCapacitacion.prefijoCodigo (LIC, NCL, CUR, DIP, JOR, TEC, RSV, …) según etiqueta.
 * Idempotente: no sobrescribe prefijos ya válidos de 3 letras.
 */
require('dotenv').config();
const { connectDB } = require('../src/config/db');
const { models } = require('../src/models/catalogos');
const {
  normalizarPrefijoCodigo,
  prefijoCodigoPorEtiquetaTipCap,
  invalidarCacheTipCap,
} = require('../src/services/tipoCapacitacionMatch');

async function main() {
  await connectDB();
  const col = models.catTipoCapacitacion;
  const rows = await col.find({}).lean();
  let updated = 0;
  for (const r of rows) {
    if (normalizarPrefijoCodigo(r.prefijoCodigo)) continue;
    const label = String(r.tipoCap || r.descripcion || r.nombre || '').trim();
    const pref = prefijoCodigoPorEtiquetaTipCap(label);
    if (!pref) continue;
    await col.updateOne({ _id: r._id }, { $set: { prefijoCodigo: pref } });
    const id = r.idTipCap ?? r.id ?? r._id;
    console.log(`  · ${id}: ${pref} ← ${label || '(sin etiqueta)'}`);
    updated += 1;
  }
  invalidarCacheTipCap();
  console.log(`[syncPrefijosCatTipoCapacitacion] ${updated} registro(s) actualizado(s) de ${rows.length}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
