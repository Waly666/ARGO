/**
 * Elimina de landing.galeria.fotos las entradas huérfanas (archivo no en disco)
 * y duplicados de la misma imagen/video.
 *
 * Uso:
 *   node scripts/limpiar-galeria-portal.js [--dry-run]
 */
require('dotenv').config();

const { connectDB } = require('../src/config/db');
const { obtenerConfigAula, guardarConfigAula } = require('../src/services/aulaVirtualPortal');
const { mergeLanding } = require('../src/services/aulaVirtualPortalLanding');
const { sanearGaleriaFotos } = require('../src/services/aulaVirtualGaleriaFotos');

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  await connectDB();

  const aula = await obtenerConfigAula();
  const landing = mergeLanding(aula.landing);
  const antes = landing.galeria?.fotos || [];
  const despues = sanearGaleriaFotos(antes, { soloExistentes: true });

  console.log(`Galería: ${antes.length} → ${despues.length} (${antes.length - despues.length} eliminadas)`);

  if (!antes.length) {
    console.log('Nada que limpiar.');
    process.exit(0);
  }

  if (dryRun) {
    console.log('Modo --dry-run: no se guardaron cambios.');
    process.exit(0);
  }

  landing.galeria = { ...landing.galeria, fotos: despues };
  await guardarConfigAula({ landing }, { nombre: 'limpiar-galeria-script' });
  console.log('Listo: configuración actualizada.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
