/**
 * Verifica paridad móvil con backend (tarifa gestor/empresa → tarifa 1).
 * Ejecutar: node scripts/test-tarifa-gestor-fallback.mjs
 */

const TARIFA_GESTOR = 5;
const TARIFA_EMPRESA = 6;
const TARIFA_VIRTUAL = 4;

function num(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v) || 0;
  return Number(v) || 0;
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
  if (t === TARIFA_VIRTUAL) return num(serv?.tarifaVirtual);
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
  const key = `tarifa${t}`;
  const v = serv?.[key];
  if (v != null && v !== '') {
    const n = num(v);
    if (n > 0) return n;
  }
  return valorTarifa1Servicio(serv, prog);
}

function calcularValorMatricula(prog, servicios, tarifa) {
  if (!prog) return 0;
  const idP = String(prog.idPrograma ?? prog.idProg ?? prog._id);
  const porProg = servicios.filter((s) => String(s.idProg) === idP);
  if (tarifa === TARIFA_VIRTUAL) {
    return porProg.reduce((acc, s) => acc + num(s.tarifaVirtual), 0);
  }
  let base = 0;
  const sem = Number(prog.semestres);
  if (Number.isFinite(sem) && sem >= 1 && porProg.length > 0) {
    base = porProg.reduce((acc, s) => {
      if (tarifa === TARIFA_GESTOR || tarifa === TARIFA_EMPRESA) {
        return acc + valorTarifaServicio(s, tarifa, prog);
      }
      const key = `tarifa${tarifa}`;
      const v = s[key];
      if (v != null && v !== '') return acc + num(v);
      return acc + num(s.tarifa1);
    }, 0);
  } else {
    const serv = porProg[0];
    if (serv) {
      if (tarifa === TARIFA_GESTOR || tarifa === TARIFA_EMPRESA) {
        base = valorTarifaServicio(serv, tarifa, prog);
      } else {
        const key = `tarifa${tarifa}`;
        const v = serv[key];
        if (v != null && v !== '') base = num(v);
        else base = num(prog.valorMatricula);
      }
    } else if (tarifa === TARIFA_GESTOR || tarifa === TARIFA_EMPRESA) {
      base = valorTarifaServicio(null, tarifa, prog);
    } else {
      base = num(prog.valorMatricula);
    }
  }
  return base;
}

const prog = { idPrograma: '101', semestres: 1, valorMatricula: 1_200_000, tarifa1: 1_200_000 };
const servicios = [{ idProg: '101', tarifaGestor: 0, tarifa1: 1_200_000 }];

const casos = [
  {
    nombre: 'valorTarifaServicio gestor=0',
    fn: () => valorTarifaServicio(servicios[0], TARIFA_GESTOR, prog),
    esperado: 1_200_000,
  },
  {
    nombre: 'calcularValorMatricula gestor sin servicio en lista',
    fn: () => calcularValorMatricula(prog, [], TARIFA_GESTOR),
    esperado: 1_200_000,
  },
  {
    nombre: 'calcularValorMatricula gestor con servicio',
    fn: () => calcularValorMatricula(prog, servicios, TARIFA_GESTOR),
    esperado: 1_200_000,
  },
  {
    nombre: 'calcularValorMatricula empresa=0',
    fn: () =>
      calcularValorMatricula(
        prog,
        [{ idProg: '101', tarifaEmpresa: 0, tarifa1: 950_000 }],
        TARIFA_EMPRESA,
      ),
    esperado: 950_000,
  },
  {
    nombre: '2 semestres gestor=0 suma tarifa1',
    fn: () =>
      calcularValorMatricula(
        { ...prog, semestres: 2 },
        [
          { idProg: '101', tarifaGestor: 0, tarifa1: 600_000 },
          { idProg: '101', tarifaGestor: 0, tarifa1: 600_000 },
        ],
        TARIFA_GESTOR,
      ),
    esperado: 1_200_000,
  },
];

let ok = 0;
let fail = 0;
for (const c of casos) {
  const got = c.fn();
  const pass = got === c.esperado;
  console.log(`${pass ? 'OK' : 'FAIL'} | ${c.nombre} => ${got}${pass ? '' : ` (esperado ${c.esperado})`}`);
  pass ? (ok += 1) : (fail += 1);
}
console.log(`Resultado: ${ok} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
