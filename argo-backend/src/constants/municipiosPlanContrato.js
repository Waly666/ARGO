/**
 * Plan de municipios del contrato de jornadas:
 * lista ordenada { orden, codMunicipio, municipio, depto, numJornadas, jornadasPorDia }.
 */
function clampPorDia(v) {
  return Math.max(1, Math.min(20, parseInt(v, 10) || 1));
}

function normalizarMunicipiosPlan(raw) {
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
    out.push({
      orden: out.length + 1,
      codMunicipio,
      municipio,
      depto: String(row.depto || row.nombreDepto || '')
        .trim()
        .toUpperCase(),
      numJornadas,
      jornadasPorDia: clampPorDia(row.jornadasPorDia ?? row.porDia ?? 1),
    });
  }
  return out;
}

function totalJornadasDesdePlan(plan) {
  const rows = normalizarMunicipiosPlan(plan);
  return rows.reduce((s, r) => s + (r.numJornadas || 0), 0);
}

/**
 * Cuántas jornadas ya existen por municipio (cod preferente, si no nombre).
 */
function contarJornadasPorMunicipio(jornadas) {
  const map = new Map();
  for (const j of jornadas || []) {
    const cod = String(j.codMunicipio || '').trim();
    const nom = String(j.municipio || '')
      .trim()
      .toUpperCase();
    const key = cod || nom || '__sin__';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

function keyMunicipioPlan(row) {
  const cod = String(row?.codMunicipio || '').trim();
  if (cod) return cod;
  return String(row?.municipio || '')
    .trim()
    .toUpperCase();
}

/**
 * Cola de cupos faltantes por municipio, en el orden del plan.
 * Cada cupo lleva jornadasPorDia del municipio.
 * @returns {{ plan: object, cupos: Array<{municipio,depto,codMunicipio,jornadasPorDia}> }}
 */
function cuposFaltantesPlan(planRaw, jornadasExistentes) {
  const plan = normalizarMunicipiosPlan(planRaw);
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
      });
    }
  }
  return { plan, cupos };
}

module.exports = {
  normalizarMunicipiosPlan,
  totalJornadasDesdePlan,
  contarJornadasPorMunicipio,
  keyMunicipioPlan,
  cuposFaltantesPlan,
  clampPorDia,
};
