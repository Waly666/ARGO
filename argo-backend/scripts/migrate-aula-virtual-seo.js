/**
 * Actualiza SEO de /servicios/aula-virtual (servicio_aulaVirtual) en Mongo.
 * Uso: node scripts/migrate-aula-virtual-seo.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { SEO_SERVICIO_AULA_VIRTUAL } = require('../src/constants/aulaVirtualServialServiciosHubSeo');

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
  const prev = doc.landing?.site?.seo?.servicio_aulaVirtual;
  if (prev?.titulo?.includes('Cursos Online') && prev?.titulo?.includes('SERVIAL')) {
    console.log('SEO servicio_aulaVirtual ya actualizado:', prev.titulo);
  } else {
    await col.updateOne(
      { clave: 'aula_virtual' },
      { $set: { 'landing.site.seo.servicio_aulaVirtual': SEO_SERVICIO_AULA_VIRTUAL } },
    );
    console.log('Actualizado SEO servicio_aulaVirtual');
    console.log('titulo:', SEO_SERVICIO_AULA_VIRTUAL.titulo);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
