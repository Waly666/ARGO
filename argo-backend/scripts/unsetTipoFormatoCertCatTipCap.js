/** Quita tipoFormatoCert del catálogo catTipoCapacitacion (formato solo en programa). */
require('dotenv').config();
const { connectDB } = require('../src/config/db');
const { models } = require('../src/models/catalogos');

async function main() {
  await connectDB();
  const r = await models.catTipoCapacitacion.updateMany(
    { tipoFormatoCert: { $exists: true } },
    { $unset: { tipoFormatoCert: '' } },
  );
  console.log(`[unsetTipoFormatoCertCatTipCap] ${r.modifiedCount} documento(s) actualizado(s).`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
