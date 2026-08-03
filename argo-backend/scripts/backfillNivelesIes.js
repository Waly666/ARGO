/**
 * Recalcula `nivelesEducativos` (y `nivelEducativo`) de las IES ya cargadas
 * a partir del carácter académico SNIES guardado en `tipoEstablecimiento`.
 *
 * Necesario porque una institución universitaria ofrece pregrado profesional
 * y tecnologías: con un solo nivel quedaba fuera del buscador.
 *
 * Uso: node scripts/backfillNivelesIes.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const { models: cat } = require('../src/models/catalogos');
const { nivelesIesDesdeCaracter, nivelIesPrincipal } = require('../src/constants/nivelesIes');

async function main() {
  await connectDB();
  const ies = await cat.colegios
    .find({ codigoEstablecimiento: /^IES-/i })
    .select('codigoEstablecimiento tipoEstablecimiento nivelEducativo nivelesEducativos')
    .lean();
  console.log(`${ies.length} IES en catálogo`);

  const ops = [];
  const resumen = {};
  for (const r of ies) {
    const niveles = nivelesIesDesdeCaracter(r.tipoEstablecimiento);
    const principal = nivelIesPrincipal(r.tipoEstablecimiento);
    const key = niveles.join('+');
    resumen[key] = (resumen[key] || 0) + 1;
    ops.push({
      updateOne: {
        filter: { _id: r._id },
        update: { $set: { nivelesEducativos: niveles, nivelEducativo: principal } },
      },
    });
  }
  console.log('Niveles resultantes:', resumen);

  if (!ops.length) {
    await mongoose.disconnect();
    return;
  }
  const CHUNK = 200;
  let escritos = 0;
  for (let i = 0; i < ops.length; i += CHUNK) {
    const r = await cat.colegios.bulkWrite(ops.slice(i, i + CHUNK), { ordered: false });
    escritos += r.modifiedCount || 0;
  }
  console.log(`Listo. Documentos actualizados: ${escritos}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
