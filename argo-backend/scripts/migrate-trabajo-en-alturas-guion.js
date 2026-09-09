/**
 * Actualiza landing.trabajoEnAlturas y SEO en Mongo con el guion SEO v1.
 * Uso: node scripts/migrate-trabajo-en-alturas-guion.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const {
  mergeTrabajoEnAlturasLanding,
  trabajoEnAlturasNecesitaActualizarGuion,
} = require('../src/constants/aulaVirtualTrabajoEnAlturasDefaults');

const SEO_TA = {
  titulo: 'Curso de Trabajo en Alturas en Villavicencio | SERVIAL Colombia',
  descripcion:
    'Curso de trabajo seguro en alturas en Villavicencio, Meta. Capacitación para trabajadores y empresas con SERVIAL Colombia, conforme a la normativa vigente. Atención en los Llanos Orientales.',
  keywords:
    'curso trabajo en alturas Villavicencio, trabajo seguro en alturas Villavicencio, curso de alturas Meta, capacitación trabajo en alturas Colombia, curso trabajador autorizado alturas, reentrenamiento trabajo en alturas, curso coordinador trabajo en alturas, Resolución 4272 de 2021, capacitación alturas Llanos Orientales, SERVIAL Colombia',
};

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
  const prev = doc.landing?.trabajoEnAlturas;
  const update = {};
  if (trabajoEnAlturasNecesitaActualizarGuion(prev || {})) {
    const merged = mergeTrabajoEnAlturasLanding(prev);
    update['landing.trabajoEnAlturas'] = merged;
    console.log('Migrado trabajoEnAlturas → guion v1');
    console.log('titulo:', merged.titulo);
  } else {
    console.log('trabajoEnAlturas ya está en guion v1. titulo:', prev?.titulo);
  }
  const seoPrev = doc.landing?.site?.seo?.trabajoEnAlturas;
  if (!seoPrev?.titulo?.includes('Villavicencio')) {
    update['landing.site.seo.trabajoEnAlturas'] = SEO_TA;
    console.log('Actualizado SEO trabajoEnAlturas');
  }
  if (Object.keys(update).length) {
    await col.updateOne({ clave: 'aula_virtual' }, { $set: update });
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
