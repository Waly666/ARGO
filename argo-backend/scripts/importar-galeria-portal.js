/**
 * Importa fotos/videos desde carpeta local hacia uploads/aula-virtual-galeria
 * y las registra en landing.galeria.fotos.
 *
 * Uso:
 *   node scripts/importar-galeria-portal.js [ruta-origen]
 *
 * Por defecto busca en:
 *   - ../argo-frontend/public/galeria
 *   - ../public/images/galeria
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { connectDB } = require('../src/config/db');

const { publicUrl, baseDir } = require('../src/middleware/upload');
const { obtenerConfigAula, guardarConfigAula } = require('../src/services/aulaVirtualPortal');
const { mergeLanding } = require('../src/services/aulaVirtualPortalLanding');
const { optimizarImagenArchivo } = require('../src/utils/optimizarImagen');

const EXT_OK = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm']);

function resolverOrigen(argvPath) {
  if (argvPath) return path.resolve(argvPath);
  const candidatos = [
    path.join(__dirname, '..', '..', 'argo-frontend', 'public', 'galeria'),
    path.join(__dirname, '..', '..', 'public', 'images', 'galeria'),
  ];
  for (const p of candidatos) {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return p;
  }
  return candidatos[0];
}

async function main() {
  await connectDB();
  const origen = resolverOrigen(process.argv[2]);
  if (!fs.existsSync(origen)) {
    console.error('No existe la carpeta de origen:', origen);
    process.exit(1);
  }

  const destDir = path.join(baseDir, 'aula-virtual-galeria');
  fs.mkdirSync(destDir, { recursive: true });

  const archivos = fs
    .readdirSync(origen)
    .filter((name) => EXT_OK.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'es'));

  if (!archivos.length) {
    console.log('No hay archivos de imagen o video en', origen);
    process.exit(0);
  }

  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing);
  const existentes = new Set((landing.galeria?.fotos || []).map((f) => path.basename(f.url)));
  const nuevas = [];

  for (const name of archivos) {
    if (existentes.has(name)) {
      console.log('Omitido (ya registrado):', name);
      continue;
    }
    const src = path.join(origen, name);
    const destName = `${Date.now()}_${Math.round(Math.random() * 1e6)}_${name.replace(/[^\w.\-]+/g, '_')}`;
    const dest = path.join(destDir, destName);
    fs.copyFileSync(src, dest);

    const ext = path.extname(destName).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      await optimizarImagenArchivo(dest, { maxWidth: 1920, maxHeight: 1920 });
    }

    const url = publicUrl('aula-virtual-galeria', destName);
    nuevas.push({
      id: `${Date.now()}_${Math.round(Math.random() * 1e6)}`,
      url,
      leyenda: '',
      tipo: ext === '.mp4' || ext === '.webm' ? 'video' : 'imagen',
      orden: (landing.galeria?.fotos?.length || 0) + nuevas.length,
    });
    console.log('Importado:', name, '→', url);
  }

  if (!nuevas.length) {
    console.log('Nada nuevo que importar.');
    process.exit(0);
  }

  landing.galeria = {
    ...landing.galeria,
    fotos: [...(landing.galeria?.fotos || []), ...nuevas],
  };

  await guardarConfigAula({ landing }, { nombre: 'importar-galeria-script' });
  console.log(`Listo: ${nuevas.length} archivo(s) agregados. Total galería: ${landing.galeria.fotos.length}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
