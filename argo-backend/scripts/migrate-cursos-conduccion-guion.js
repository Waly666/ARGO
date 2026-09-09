/**
 * Aplica guion SEO v1 a landing.cursosConduccion y SEO de página.
 * Uso: node scripts/migrate-cursos-conduccion-guion.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { SEO_CURSOS_CONDUCCION } = require('../src/constants/aulaVirtualCursosConduccionSeo');
const { CURSOS_CONDUCCION_GUION } = require('../src/constants/aulaVirtualCursosConduccionGuion');

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

  const prev = doc.landing?.cursosConduccion;
  const prevSeo = doc.landing?.site?.seo?.cursosConduccion;
  const needsGuion =
    Number(prev?.guionVersion) < 1 ||
    String(prev?.tituloPrincipal || '').includes('CENTRO DE ENSEÑANZA') ||
    (prev?.licencias?.items || []).some((i) => String(i.codigo || '').toUpperCase() === 'B1');
  const needsSeo = !prevSeo?.titulo?.includes('Cursos de Conducción en Villavicencio');

  if (!needsGuion && !needsSeo) {
    console.log('cursosConduccion ya actualizado (guion + SEO).');
    await mongoose.disconnect();
    return;
  }

  const $set = {};
  if (needsGuion) {
    const merged = { ...CURSOS_CONDUCCION_GUION };
    if (prev?.hero?.imagenUrl) {
      merged.hero = { ...merged.hero, imagenUrl: prev.hero.imagenUrl };
      if (prev.hero.imagenUrlAbsoluta) merged.hero.imagenUrlAbsoluta = prev.hero.imagenUrlAbsoluta;
    }
    if (prev?.publicidad?.slides?.length) {
      merged.publicidad = prev.publicidad;
    }
    if (prev?.resoluciones?.length) {
      merged.resoluciones = prev.resoluciones;
    }
    const precios = new Map(
      (prev?.licencias?.items || []).map((item) => [String(item.codigo || '').toUpperCase(), item.valor]),
    );
    merged.licencias.items = merged.licencias.items.map((item) => {
      const valor = precios.get(item.codigo);
      return valor?.trim() ? { ...item, valor: valor.trim() } : item;
    });
    $set['landing.cursosConduccion'] = merged;
    console.log('Actualizado landing.cursosConduccion guion v1');
  }
  if (needsSeo) {
    $set['landing.site.seo.cursosConduccion'] = SEO_CURSOS_CONDUCCION;
    console.log('Actualizado SEO cursosConduccion:', SEO_CURSOS_CONDUCCION.titulo);
  }

  await col.updateOne({ clave: 'aula_virtual' }, { $set });
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
