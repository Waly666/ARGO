/**
 * Reemplaza enlaces relacionados de Servial en examen teórico (Finstruvial).
 * Ejecutar solo en la base de datos de Finstruvial:
 *   node scripts/fix-examen-teorico-enlaces-finstruvial.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const FINSTRUVIAL_ENLACES = {
  enlacesRelacionadosTitulo: 'Formación relacionada',
  enlacesRelacionados: [
    {
      texto: '¿Necesitas formación para tu licencia?',
      etiqueta: 'Ver cursos disponibles',
      url: '/cursos',
    },
    {
      texto: '¿Buscas técnicas de conducción preventiva?',
      etiqueta: 'Curso de Manejo Defensivo',
      url: '/curso-manejo-defensivo',
    },
    {
      texto: '¿Prefieres formación virtual?',
      etiqueta: 'Acceder al Aula Virtual',
      url: '/servicios/aula-virtual',
    },
  ],
};

function esContenidoServial(et) {
  if (!et || typeof et !== 'object') return false;
  if (/servial/i.test(String(et.enlacesRelacionadosTitulo ?? ''))) return true;
  return (et.enlacesRelacionados || []).some(
    (e) =>
      /servial|villavicencio|servial\.com/i.test(String(e?.etiqueta ?? '')) ||
      /servial\.com/i.test(String(e?.url ?? '')),
  );
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/argo';
  await mongoose.connect(uri);
  const col = mongoose.connection.collection('config');
  const doc = await col.findOne({ clave: 'aula_virtual' });
  const et = doc?.landing?.examenTeorico;
  if (!et) {
    console.log('No hay landing.examenTeorico.');
    await mongoose.disconnect();
    return;
  }
  if (!esContenidoServial(et)) {
    console.log('Los enlaces de examen teórico no parecen de Servial; no se modificó nada.');
    await mongoose.disconnect();
    return;
  }
  await col.updateOne(
    { clave: 'aula_virtual' },
    {
      $set: {
        'landing.examenTeorico.enlacesRelacionadosTitulo': FINSTRUVIAL_ENLACES.enlacesRelacionadosTitulo,
        'landing.examenTeorico.enlacesRelacionados': FINSTRUVIAL_ENLACES.enlacesRelacionados,
      },
    },
  );
  console.log('Enlaces relacionados de examen teórico actualizados para Finstruvial.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
