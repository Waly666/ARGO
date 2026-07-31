/**
 * Rellena codigoJornada = {codContrato}-{últimas 6 del _id} en jornadasCap.
 * Uso: node scripts/migrarCodigoJornada.js
 * Simulación: node scripts/migrarCodigoJornada.js --dry-run
 * Forzar recálculo: node scripts/migrarCodigoJornada.js --force
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { migrarCodigoJornada } = require('../src/services/migrarCodigoJornada');

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/argo';
  await mongoose.connect(uri);
  const r = await migrarCodigoJornada({ dryRun, force });
  console.log(
    `Listo. Revisados: ${r.total}, actualizados: ${r.actualizados}, sin contrato: ${r.sinContrato}${dryRun ? ' (dry-run)' : ''}.`,
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
