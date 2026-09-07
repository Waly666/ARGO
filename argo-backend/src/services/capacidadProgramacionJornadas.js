const { esDiaProgramable } = require('../constants/jornadaCapacitacion');
const { parseFechaCalendario, fechaCalendarioIso } = require('../utils/fechaCalendario');
const { normalizarMunicipiosPlan } = require('../constants/municipiosPlanContrato');

const MODO_GLOBAL = 'global';
const MODO_MUNICIPIO = 'municipio';

function flagsCalendario(c) {
  return {
    incluiSab: !!c?.incluiSab,
    incluiDom: !!c?.incluiDom,
    incluiFest: !!c?.incluiFest,
  };
}

function diasNecesarios(numJornadas, porDia) {
  const n = Math.max(0, parseInt(numJornadas, 10) || 0);
  const p = Math.max(1, Math.min(20, parseInt(porDia, 10) || 1));
  if (n < 1) return 0;
  return Math.ceil(n / p);
}

function contarDiasProgramables(inicio, fin, flags) {
  const a = parseFechaCalendario(inicio);
  const b = parseFechaCalendario(fin);
  if (!a || !b || b.getTime() < a.getTime()) return 0;
  let n = 0;
  const cur = new Date(a.getTime());
  let guard = 0;
  while (cur.getTime() <= b.getTime() && guard < 2000) {
    guard += 1;
    if (esDiaProgramable(cur, flags)) n += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return n;
}

function planTieneFechasCompletas(plan) {
  if (!plan.length) return false;
  return plan.every((r) => {
    const a = fechaCalendarioIso(r.fechaInicJornadas);
    const b = fechaCalendarioIso(r.fechaFinJornadas);
    return !!a && !!b;
  });
}

function inferirModoProgramacionJornadas(contrato) {
  const raw = String(contrato?.programacionJornadasModo || '')
    .trim()
    .toLowerCase();
  if (raw === MODO_MUNICIPIO || raw === MODO_GLOBAL) return raw;
  const plan = normalizarMunicipiosPlan(contrato?.municipiosPlan);
  if (plan.length && planTieneFechasCompletas(plan)) return MODO_MUNICIPIO;
  return MODO_GLOBAL;
}

function intervalosSeSolapan(a1, a2, b1, b2) {
  return a1 <= b2 && b1 <= a2;
}

function throw400(message) {
  const err = new Error(message);
  err.status = 400;
  throw err;
}

function marcoFechasDesdePlan(plan) {
  let min = '';
  let max = '';
  for (const r of plan) {
    const a = fechaCalendarioIso(r.fechaInicJornadas);
    const b = fechaCalendarioIso(r.fechaFinJornadas);
    if (a && (!min || a < min)) min = a;
    if (b && (!max || b > max)) max = b;
  }
  return { fechaInicJornadas: min || null, fechaFinJornadas: max || null };
}

function labelMun(row) {
  return String(row.municipio || row.codMunicipio || 'Municipio').trim();
}

function capacidadFila(row, flags) {
  const ini = fechaCalendarioIso(row.fechaInicJornadas);
  const fin = fechaCalendarioIso(row.fechaFinJornadas);
  const needed = diasNecesarios(row.numJornadas, row.jornadasPorDia);
  const habiles = ini && fin ? contarDiasProgramables(ini, fin, flags) : 0;
  const porDia = Math.max(1, Math.min(20, parseInt(row.jornadasPorDia, 10) || 1));
  return {
    needed,
    habiles,
    capacidad: habiles * porDia,
    ok: habiles >= needed && needed > 0 ? true : habiles >= needed,
    ini,
    fin,
  };
}

/**
 * @param {object} contrato
 * @param {{ exigirFechas?: boolean }} [opts]
 * exigirFechas: en generar faltantes siempre true; al guardar, true si hay plan o modo municipio.
 */
function validarProgramacionContrato(contrato, { exigirFechas = true } = {}) {
  const modo = inferirModoProgramacionJornadas(contrato);
  const flags = flagsCalendario(contrato);
  const plan = normalizarMunicipiosPlan(contrato.municipiosPlan);

  if (modo === MODO_MUNICIPIO) {
    if (!plan.length) {
      throw400('En modo por municipio agregue al menos un municipio al plan.');
    }
    for (const row of plan) {
      const ini = fechaCalendarioIso(row.fechaInicJornadas);
      const fin = fechaCalendarioIso(row.fechaFinJornadas);
      if (!ini || !fin) {
        throw400(
          `En modo por municipio, «${labelMun(row)}» debe tener fecha de inicio y fecha fin.`,
        );
      }
      if (fin < ini) {
        throw400(
          `En «${labelMun(row)}» la fecha fin debe ser igual o posterior al inicio.`,
        );
      }
      const cap = capacidadFila(row, flags);
      if (cap.habiles < cap.needed) {
        throw400(
          `El calendario de «${labelMun(row)}» no alcanza: necesita ${cap.needed} día(s) hábil(es) ` +
            `(${row.numJornadas} jornada(s) a ${row.jornadasPorDia} por día) y solo hay ${cap.habiles} ` +
            `entre ${ini} y ${fin}. Amplíe el rango o active sábados, domingos o festivos.`,
        );
      }
    }
    for (let i = 0; i < plan.length; i += 1) {
      for (let j = i + 1; j < plan.length; j += 1) {
        const a1 = fechaCalendarioIso(plan[i].fechaInicJornadas);
        const a2 = fechaCalendarioIso(plan[i].fechaFinJornadas);
        const b1 = fechaCalendarioIso(plan[j].fechaInicJornadas);
        const b2 = fechaCalendarioIso(plan[j].fechaFinJornadas);
        if (a1 && a2 && b1 && b2 && intervalosSeSolapan(a1, a2, b1, b2)) {
          throw400(
            `Las ventanas de «${labelMun(plan[i])}» y «${labelMun(plan[j])}» se cruzan. ` +
              'En modo por municipio las fechas no pueden solaparse (un municipio por día).',
          );
        }
      }
    }
    return { modo, plan, marco: marcoFechasDesdePlan(plan), flags };
  }

  const ini = fechaCalendarioIso(contrato.fechaInicJornadas);
  const fin = fechaCalendarioIso(contrato.fechaFinJornadas);
  if (exigirFechas) {
    if (!ini) throw400('Indique la fecha de inicio de jornadas del contrato.');
    if (!fin) throw400('Indique la fecha fin de jornadas del contrato.');
  }
  if (ini && fin) {
    if (fin < ini) {
      throw400('La fecha fin de jornadas debe ser igual o posterior al inicio.');
    }
    const habiles = contarDiasProgramables(ini, fin, flags);
    let needed = 0;
    if (plan.length) {
      needed = plan.reduce((s, r) => s + diasNecesarios(r.numJornadas, r.jornadasPorDia), 0);
    } else {
      const n = Math.max(0, parseInt(contrato.numerojornadas, 10) || 0);
      const porDia = Math.max(1, Math.min(20, parseInt(contrato.jornadasPorDia, 10) || 1));
      needed = diasNecesarios(n, porDia);
    }
    if (needed > 0 && habiles < needed) {
      throw400(
        `El calendario del contrato no alcanza: necesita ${needed} día(s) hábil(es) y solo hay ${habiles} ` +
          `entre ${ini} y ${fin}. Amplíe la fecha fin, reduzca el plan o active sábados, domingos o festivos.`,
      );
    }
  } else if (exigirFechas) {
    throw400('Indique inicio y fin de jornadas del contrato.');
  }
  return { modo, plan, marco: { fechaInicJornadas: ini || null, fechaFinJornadas: fin || null }, flags };
}

function camposProgramacionEnDto(dto) {
  const keys = [
    'municipiosPlan',
    'programacionJornadasModo',
    'fechaInicJornadas',
    'fechaFinJornadas',
    'incluiSab',
    'incluiDom',
    'incluiFest',
    'numerojornadas',
    'jornadasPorDia',
    'clasesPorJornada',
  ];
  return keys.some((k) => dto[k] !== undefined);
}

module.exports = {
  MODO_GLOBAL,
  MODO_MUNICIPIO,
  flagsCalendario,
  diasNecesarios,
  contarDiasProgramables,
  inferirModoProgramacionJornadas,
  marcoFechasDesdePlan,
  capacidadFila,
  validarProgramacionContrato,
  camposProgramacionEnDto,
  planTieneFechasCompletas,
};
