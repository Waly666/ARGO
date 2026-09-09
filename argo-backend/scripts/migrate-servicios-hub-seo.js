/**
 * Actualiza SEO de /servicios (serviciosHub) en Mongo.
 * Uso: node scripts/migrate-servicios-hub-seo.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { SEO_SERVICIOS_HUB } = require('../src/constants/aulaVirtualServialServiciosHubSeo');

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
  const prev = doc.landing?.site?.seo?.serviciosHub;
  if (prev?.titulo?.includes('Villavicencio') && prev?.titulo?.includes('SERVIAL')) {
    console.log('SEO serviciosHub ya actualizado:', prev.titulo);
  } else {
    await col.updateOne(
      { clave: 'aula_virtual' },
      { $set: { 'landing.site.seo.serviciosHub': SEO_SERVICIOS_HUB } },
    );
    console.log('Actualizado SEO serviciosHub');
    console.log('titulo:', SEO_SERVICIOS_HUB.titulo);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
