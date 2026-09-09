/**
 * Rellena enlacesRelacionados en landings SEO Servial si están vacíos.
 * Uso: node scripts/migrate-enlaces-relacionados-servial.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const ENLACES = {
  cursosConduccion: {
    enlacesRelacionadosTitulo: 'Formación relacionada en SERVIAL',
    enlacesRelacionados: [
      { texto: '¿Necesitas capacitación complementaria para conductores?', etiqueta: 'Ver Curso de Manejo Defensivo', url: '/curso-manejo-defensivo' },
      { texto: '¿Prefieres formación virtual?', etiqueta: 'Acceder al Aula Virtual de SERVIAL', url: '/servicios/aula-virtual' },
      { texto: 'Consulta el estado de la normativa del examen teórico.', etiqueta: 'Ver información del examen teórico', url: '/examen-teorico' },
    ],
  },
  manejoDefensivo: {
    enlacesRelacionadosTitulo: 'Formación relacionada en SERVIAL',
    enlacesRelacionados: [
      { texto: '¿Necesitas realizar la capacitación para tu licencia?', etiqueta: 'Conoce nuestros cursos de conducción en Villavicencio', url: '/cursos-conduccion' },
      { texto: '¿Quieres conocer el proceso para obtener tu licencia?', etiqueta: 'Consulta los requisitos para la licencia de conducción', url: 'https://servial.com.co/licencias-de-conduccion/' },
      { texto: '¿Prefieres formación virtual?', etiqueta: 'Explorar el Aula Virtual', url: '/servicios/aula-virtual' },
    ],
  },
  examenTeorico: {
    enlacesRelacionadosTitulo: 'Formación relacionada en SERVIAL',
    enlacesRelacionados: [
      { texto: '¿Necesitas realizar la capacitación?', etiqueta: 'Conoce nuestros cursos de conducción en Villavicencio', url: '/cursos-conduccion' },
      { texto: '¿Quieres conocer el proceso para obtener tu licencia?', etiqueta: 'Consulta los requisitos para la licencia de conducción', url: 'https://servial.com.co/licencias-de-conduccion/' },
    ],
  },
  trabajoEnAlturas: {
    enlacesRelacionadosTitulo: 'Formación relacionada en SERVIAL',
    enlacesRelacionados: [
      { texto: '¿Necesitas otros cursos de seguridad vial?', etiqueta: 'Ver Curso de Manejo Defensivo', url: '/curso-manejo-defensivo' },
      { texto: '¿Necesitas formación para conductores?', etiqueta: 'Cursos de conducción en Villavicencio', url: '/cursos-conduccion' },
      { texto: '¿Prefieres formación virtual?', etiqueta: 'Acceder al Aula Virtual', url: '/servicios/aula-virtual' },
    ],
  },
  mercanciasPeligrosas: {
    enlacesRelacionadosTitulo: 'Formación relacionada en SERVIAL',
    enlacesRelacionados: [
      { texto: '¿Necesitas formación complementaria para conductores?', etiqueta: 'Ver Curso de Manejo Defensivo', url: '/curso-manejo-defensivo' },
      { texto: '¿Prefieres formación virtual?', etiqueta: 'Explorar el Aula Virtual', url: '/servicios/aula-virtual' },
    ],
  },
  primerosAuxilios: {
    enlacesRelacionadosTitulo: 'Formación relacionada en SERVIAL',
    enlacesRelacionados: [
      { texto: '¿Necesitas formación para conductores?', etiqueta: 'Cursos de conducción en Villavicencio', url: '/cursos-conduccion' },
      { texto: '¿Prefieres formación virtual?', etiqueta: 'Acceder al Aula Virtual', url: '/servicios/aula-virtual' },
    ],
  },
};

const AULA_VIRTUAL_ENLACES = {
  enlacesRelacionadosTitulo: 'Formación relacionada en SERVIAL',
  enlacesRelacionados: [
    { texto: '¿Necesitas formación presencial para tu licencia?', etiqueta: 'Cursos de conducción en Villavicencio', url: '/cursos-conduccion' },
    { texto: '¿Buscas técnicas de conducción preventiva?', etiqueta: 'Curso de Manejo Defensivo', url: '/curso-manejo-defensivo' },
    { texto: '¿Quieres conocer el proceso para obtener tu licencia?', etiqueta: 'Requisitos para la licencia de conducción', url: 'https://servial.com.co/licencias-de-conduccion/' },
  ],
};

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/argo';
  await mongoose.connect(uri);
  const col = mongoose.connection.collection('config');
  const doc = await col.findOne({ clave: 'aula_virtual' });
  if (!doc?.landing) {
    console.log('No hay landing aula_virtual.');
    await mongoose.disconnect();
    return;
  }

  const $set = {};
  for (const [key, payload] of Object.entries(ENLACES)) {
    const current = doc.landing[key]?.enlacesRelacionados;
    if (!Array.isArray(current) || !current.length) {
      $set[`landing.${key}.enlacesRelacionadosTitulo`] = payload.enlacesRelacionadosTitulo;
      $set[`landing.${key}.enlacesRelacionados`] = payload.enlacesRelacionados;
      console.log('Actualizado', key);
    }
  }

  const av = doc.landing?.finstruvialServicios?.paginas?.aulaVirtual;
  if (!av?.enlacesRelacionados?.length) {
    $set['landing.finstruvialServicios.paginas.aulaVirtual.enlacesRelacionadosTitulo'] =
      AULA_VIRTUAL_ENLACES.enlacesRelacionadosTitulo;
    $set['landing.finstruvialServicios.paginas.aulaVirtual.enlacesRelacionados'] =
      AULA_VIRTUAL_ENLACES.enlacesRelacionados;
    console.log('Actualizado finstruvialServicios.paginas.aulaVirtual');
  }

  if (Object.keys($set).length) {
    await col.updateOne({ clave: 'aula_virtual' }, { $set });
    console.log('Migración enlaces relacionados completada.');
  } else {
    console.log('Todos los enlaces relacionados ya estaban configurados.');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
