/**
 * Plan de municipios del contrato de jornadas:
 * { orden, codMunicipio, municipio, depto, numJornadas, jornadasPorDia, clasesPorJornada, fechas? }.
 */
const { fechaCalendarioIso } = require('../utils/fechaCalendario');

function clampPorDia(v) {
  return Math.max(1, Math.min(20, parseInt(v, 10) || 1));
}

function clampClasesPorJornada(v) {
  return Math.max(0, Math.min(20, parseInt(v, 10) || 0));
}

function normalizarMunicipiosPlan(raw, clasesFallback) {
  const fallback =
    clasesFallback == null || clasesFallback === ''
      ? 1
      : clampClasesPorJornada(clasesFallback);
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (let i = 0; i < raw.length; i += 1) {
    const row = raw[i];
    if (!row || typeof row !== 'object') continue;
    const codMunicipio = String(row.codMunicipio || '').trim();
    const municipio = String(row.municipio || row.nombreMunicipio || '')
      .trim()
      .toUpperCase();
    if (!codMunicipio && !municipio) continue;
    const numJornadas = Math.max(0, parseInt(row.numJornadas ?? row.jornadas, 10) || 0);
    if (numJornadas < 1) continue;
    const hasClases = row.clasesPorJornada != null || row.clases != null;
    const item = {
      orden: out.length + 1,
      codMunicipio,
      municipio,
      depto: String(row.depto || row.nombreDepto || '')
        .trim()
        .toUpperCase(),
      numJornadas,
      jornadasPorDia: clampPorDia(row.jornadasPorDia ?? row.porDia ?? 1),
      clasesPorJornada: hasClases
        ? clampClasesPorJornada(row.clasesPorJornada ?? row.clases)
        : fallback,
    };
    const ini = fechaCalendarioIso(row.fechaInicJornadas);
    const fin = fechaCalendarioIso(row.fechaFinJornadas);
    if (ini) item.fechaInicJornadas = ini;
    if (fin) item.fechaFinJornadas = fin;
    out.push(item);
  }
  return out;
}

function totalJornadasDesdePlan(plan) {
  const rows = normalizarMunicipiosPlan(plan);
  return rows.reduce((s, r) => s + (r.numJornadas || 0), 0);
}

function totalClasesDesdePlan(plan) {
  const rows = normalizarMunicipiosPlan(plan);
  return rows.reduce((s, r) => s + (r.numJornadas || 0) * (r.clasesPorJornada || 0), 0);
}

/**
 * Valor representativo de clases/jornada para el KPI global del contrato.
 * Si todas las filas coinciden, esa cifra; si no, promedio ponderado.
 */
function clasesPorJornadaDesdePlan(plan) {
  const rows = normalizarMunicipiosPlan(plan);
  if (!rows.length) return null;
  const vals = rows.map((r) => r.clasesPorJornada);
  const first = vals[0];
  if (vals.every((v) => v === first)) return first;
  const totalJ = rows.reduce((s, r) => s + (r.numJornadas || 0), 0);
  const totalC = totalClasesDesdePlan(rows);
  if (totalJ < 1) return first;
  return clampClasesPorJornada(Math.round(totalC / totalJ));
}

/**
 * Cuántas jornadas ya existen por municipio (cod preferente, si no nombre).
 */
function contarJornadasPorMunicipio(jornadas) {
  const map = new Map();
  for (const j of jornadas || []) {
    const key = keyMunicipioPlan(j);
    if (!key || key === '__sin__') continue;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

function keyMunicipioPlan(row) {
  const cod = String(row?.codMunicipio || '').trim();
  if (cod) return `cod:${cod}`;
  const nom = String(row?.municipio || '')
    .trim()
    .toUpperCase();
  return nom ? `nom:${nom}` : '__sin__';
}

function clasesPorJornadaParaJornada(jornada, contrato) {
  const fallback = clampClasesPorJornada(contrato?.clasesPorJornada ?? 0);
  const plan = normalizarMunicipiosPlan(contrato?.municipiosPlan, fallback);
  if (plan.length) {
    const key = keyMunicipioPlan(jornada);
    const row = plan.find((r) => keyMunicipioPlan(r) === key);
    if (row) return row.clasesPorJornada;
  }
  return fallback;
}

/**
 * Cola de cupos faltantes por municipio, en el orden del plan.
 * Cada cupo lleva jornadasPorDia y clasesPorJornada del municipio.
 * @returns {{ plan: object, cupos: Array<{municipio,depto,codMunicipio,jornadasPorDia,clasesPorJornada}> }}
 */
function cuposFaltantesPlan(planRaw, jornadasExistentes, clasesFallback) {
  const plan = normalizarMunicipiosPlan(planRaw, clasesFallback);
  const counts = contarJornadasPorMunicipio(jornadasExistentes);
  const cupos = [];
  for (const row of plan) {
    const key = keyMunicipioPlan(row);
    const ya = counts.get(key) || 0;
    const faltan = Math.max(0, row.numJornadas - ya);
    for (let i = 0; i < faltan; i += 1) {
      cupos.push({
        municipio: row.municipio,
        depto: row.depto,
        codMunicipio: row.codMunicipio,
        jornadasPorDia: row.jornadasPorDia,
        clasesPorJornada: row.clasesPorJornada,
        fechaInicJornadas: row.fechaInicJornadas,
        fechaFinJornadas: row.fechaFinJornadas,
      });
    }
  }
  return { plan, cupos };
}

module.exports = {
  normalizarMunicipiosPlan,
  totalJornadasDesdePlan,
  totalClasesDesdePlan,
  clasesPorJornadaDesdePlan,
  clasesPorJornadaParaJornada,
  contarJornadasPorMunicipio,
  keyMunicipioPlan,
  cuposFaltantesPlan,
  clampPorDia,
  clampClasesPorJornada,
};
