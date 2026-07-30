/**
 * Verifica cobertura de colecciones de modelos vs módulos de reset parcial.
 * Uso: node scripts/check-colecciones-reset.js
 * Exit 1 si hay huecos (salvo --warn).
 */
const { inventarioColeccionesModelos } = require('../src/services/respaldos');
const { MODULOS_RESET } = require('../src/constants/modulosResetEmpresa');
const { CONSERVAR_EN_RESET, COLECCIONES_ESPECIALES } = require('../src/constants/cicloVidaColecciones');

const warnOnly = process.argv.includes('--warn');

const enModulos = new Set();
for (const m of MODULOS_RESET) {
  for (const c of m.colecciones || []) enModulos.add(c);
}

const especial = new Set([...COLECCIONES_ESPECIALES]);
const modelos = inventarioColeccionesModelos();

const faltan = modelos
  .filter((c) => !enModulos.has(c) && !CONSERVAR_EN_RESET.has(c) && !especial.has(c))
  .sort();

console.log(`Modelos/colecciones inventariadas: ${modelos.length}`);
console.log(`En reset parcial: ${enModulos.size}`);
console.log(`Conservar en reset: ${CONSERVAR_EN_RESET.size}`);

if (faltan.length) {
  console.log('\nSin cobertura en reset parcial (se limpian solo en reset completo):');
  faltan.forEach((c) => console.log(`  - ${c}`));
  if (!warnOnly) process.exit(1);
} else {
  console.log('\nOK: todas las colecciones de modelo están cubiertas o se conservan.');
}

process.exit(0);
