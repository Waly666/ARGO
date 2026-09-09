/**
 * Actualiza landing.primerosAuxilios en Mongo con el guion SEO v2.
 * Uso: node scripts/migrate-primeros-auxilios-guion.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const {
  mergePrimerosAuxiliosLanding,
  primerosAuxiliosNecesitaActualizarGuion,
} = require('../src/constants/aulaVirtualPrimerosAuxiliosDefaults');

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/argo';
  await mongoose.connect(uri);
  const col = mongoose.connection.collection('config');
  const doc = await col.findOne({ clave: 'aula_virtual' });
  if (!doc) {
    console.log('No hay configuración aula_virtual en config.');
    await mongoose.disconnect();
    return;
  }
  const prev = doc.landing?.primerosAuxilios;
  if (!primerosAuxiliosNecesitaActualizarGuion(prev || {})) {
    console.log('primerosAuxilios ya está en guion v2. h1:', prev?.h1);
    await mongoose.disconnect();
    return;
  }
  const merged = mergePrimerosAuxiliosLanding(prev);
  await col.updateOne({ clave: 'aula_virtual' }, { $set: { 'landing.primerosAuxilios': merged } });
  console.log('Migrado primerosAuxilios → guion v2');
  console.log('h1:', merged.h1);
  console.log('confianzaTitulo:', merged.confianzaTitulo);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
