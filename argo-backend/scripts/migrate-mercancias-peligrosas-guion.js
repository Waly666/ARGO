/**
 * Actualiza landing.mercanciasPeligrosas y SEO en Mongo con el guion SEO v1.
 * Uso: node scripts/migrate-mercancias-peligrosas-guion.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const {
  migrateMercanciasPeligrosasGuionSeoDefaults,
  mercanciasPeligrosasNecesitaActualizarGuion,
} = require('../src/constants/aulaVirtualMercanciasPeligrosasDefaults');

const SEO_MP = {
  titulo: 'Curso Mercancías Peligrosas Villavicencio | SERVIAL',
  descripcion:
    'Curso de mercancías peligrosas en Villavicencio, Meta. Capacitación para conductores y empresas con SERVIAL Colombia. Atención en los Llanos Orientales.',
  keywords: '',
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
  const prev = doc.landing?.mercanciasPeligrosas;
  const update = {};
  if (mercanciasPeligrosasNecesitaActualizarGuion(prev || {})) {
    const merged = migrateMercanciasPeligrosasGuionSeoDefaults(prev);
    update['landing.mercanciasPeligrosas'] = merged;
    console.log('Migrado mercanciasPeligrosas → guion v1');
    console.log('titulo:', merged.titulo);
  } else {
    console.log('mercanciasPeligrosas ya está en guion v1. titulo:', prev?.titulo);
  }
  const seoPrev = doc.landing?.site?.seo?.mercanciasPeligrosas;
  if (!seoPrev?.titulo?.includes('Villavicencio')) {
    update['landing.site.seo.mercanciasPeligrosas'] = SEO_MP;
    console.log('Actualizado SEO mercanciasPeligrosas');
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
