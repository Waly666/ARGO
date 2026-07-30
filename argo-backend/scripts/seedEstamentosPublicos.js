/**
 * Siembra estamentos públicos base (nacionales + algunos por municipio).
 * Uso: node scripts/seedEstamentosPublicos.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const { models: cat } = require('../src/models/catalogos');

const SEED = [
  { idEstamento: 'EST-NAL-ALC', nombre: 'ALCALDÍA MUNICIPAL', tipo: 'GOBIERNO', nacional: true },
  { idEstamento: 'EST-NAL-POL', nombre: 'POLICÍA NACIONAL', tipo: 'SEGURIDAD', nacional: true },
  { idEstamento: 'EST-NAL-TRA', nombre: 'TRÁNSITO Y TRANSPORTE', tipo: 'TRÁNSITO', nacional: true },
  { idEstamento: 'EST-NAL-BOM', nombre: 'CUERPO DE BOMBEROS', tipo: 'EMERGENCIAS', nacional: true },
  { idEstamento: 'EST-NAL-EJE', nombre: 'EJÉRCITO NACIONAL', tipo: 'SEGURIDAD', nacional: true },
  { idEstamento: 'EST-NAL-HOS', nombre: 'HOSPITAL / ESE', tipo: 'SALUD', nacional: true },
  { idEstamento: 'EST-NAL-SEC', nombre: 'SECRETARÍA DE EDUCACIÓN', tipo: 'EDUCACIÓN', nacional: true },
];

async function main() {
  await connectDB();
  let n = 0;
  for (const s of SEED) {
    const doc = {
      ...s,
      codMunicipio: '',
      nombreMunicipio: '',
      activo: true,
    };
    const r = await cat.estamentosPublicos.updateOne(
      { idEstamento: s.idEstamento },
      { $set: doc },
      { upsert: true },
    );
    if (r.upsertedCount || r.modifiedCount) n += 1;
  }
  console.log(`Estamentos listos (${n} escritos / ${SEED.length} en seed)`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
