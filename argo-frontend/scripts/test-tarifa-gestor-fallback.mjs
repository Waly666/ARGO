/**
 * Verifica paridad frontend con backend (tarifa gestor/empresa → tarifa 1).
 * Ejecutar desde argo-frontend: node scripts/test-tarifa-gestor-fallback.mjs
 */

const TARIFA_GESTOR = 5;
const TARIFA_EMPRESA = 6;

function num(v) {
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function valorTarifa1Servicio(serv, prog) {
  if (serv?.tarifa1 != null && serv.tarifa1 !== '') {
    const v = num(serv.tarifa1);
    if (v > 0) return v;
  }
  if (prog?.tarifa1 != null && prog.tarifa1 !== '') {
    const v = num(prog.tarifa1);
    if (v > 0) return v;
  }
  return num(prog?.valorMatricula);
}

function valorTarifaServicio(serv, tarifa, prog) {
  const t = Number(tarifa);
  if (t === TARIFA_GESTOR) {
    const v = num(serv?.tarifaGestor);
    if (v > 0) return v;
    return valorTarifa1Servicio(serv, prog);
  }
  if (t === TARIFA_EMPRESA) {
    const v = num(serv?.tarifaEmpresa);
    if (v > 0) return v;
    return valorTarifa1Servicio(serv, prog);
  }
  if (serv) {
    const key = `tarifa${t}`;
    const v = serv[key];
    if (v != null && v !== '') {
      const n = num(v);
      if (n > 0) return n;
    }
  }
  return valorTarifa1Servicio(serv, prog);
}

const prog = { valorMatricula: 1_200_000, tarifa1: 1_200_000 };
const casos = [
  { nombre: 'gestor=0 → tarifa1', serv: { tarifaGestor: 0, tarifa1: 1_200_000 }, tarifa: TARIFA_GESTOR, esperado: 1_200_000 },
  { nombre: 'gestor=0, tarifa1 vacío → valorMatricula', serv: { tarifaGestor: 0, tarifa1: '' }, tarifa: TARIFA_GESTOR, esperado: 1_200_000 },
  { nombre: 'empresa=0 → tarifa1', serv: { tarifaEmpresa: 0, tarifa1: 950_000 }, tarifa: TARIFA_EMPRESA, esperado: 950_000 },
];

let ok = 0;
let fail = 0;
for (const c of casos) {
  const got = valorTarifaServicio(c.serv, c.tarifa, prog);
  const pass = got === c.esperado;
  console.log(`${pass ? 'OK' : 'FAIL'} | ${c.nombre} => ${got}`);
  pass ? (ok += 1) : (fail += 1);
}
console.log(`Resultado: ${ok} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
