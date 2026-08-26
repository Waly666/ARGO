/**
 * Verifica fallback tarifa gestor/empresa → tarifa 1.
 * Ejecutar: node scripts/test-tarifa-gestor-fallback.js
 */
const { valorTarifaServicio } = require('../src/services/programaServicio');

const T5 = 5;
const T6 = 6;
const prog = { valorMatricula: 1_200_000, tarifa1: 1_200_000 };

const casos = [
  {
    nombre: 'gestor=0, serv.tarifa1=1200000',
    serv: { tarifaGestor: 0, tarifa1: 1_200_000 },
    tarifa: T5,
    esperado: 1_200_000,
  },
  {
    nombre: 'gestor ausente, serv.tarifa1=1200000',
    serv: { tarifa1: 1_200_000 },
    tarifa: T5,
    esperado: 1_200_000,
  },
  {
    nombre: 'gestor=0, serv.tarifa1 vacío → prog.valorMatricula',
    serv: { tarifaGestor: 0, tarifa1: '' },
    tarifa: T5,
    esperado: 1_200_000,
  },
  {
    nombre: 'empresa=0, fallback tarifa1',
    serv: { tarifaEmpresa: 0, tarifa1: 950_000 },
    tarifa: T6,
    esperado: 950_000,
  },
  {
    nombre: 'gestor=1100000 explícito (no fallback)',
    serv: { tarifaGestor: 1_100_000, tarifa1: 1_200_000 },
    tarifa: T5,
    esperado: 1_100_000,
  },
  {
    nombre: 'sin servicio → prog.valorMatricula',
    serv: null,
    tarifa: T5,
    esperado: 1_200_000,
  },
  {
    nombre: 'semestre: gestor=0 suma tarifa1',
    serv: { tarifaGestor: 0, tarifa1: 600_000 },
    tarifa: T5,
    esperado: 600_000,
  },
];

let ok = 0;
let fail = 0;

for (const c of casos) {
  const got = valorTarifaServicio(c.serv, c.tarifa, prog);
  const pass = got === c.esperado;
  console.log(`${pass ? 'OK' : 'FAIL'} | ${c.nombre} => ${got}${pass ? '' : ` (esperado ${c.esperado})`}`);
  if (pass) ok += 1;
  else fail += 1;
}

console.log('---');
console.log(`Resultado: ${ok} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
