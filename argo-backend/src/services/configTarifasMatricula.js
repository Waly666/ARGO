const { TARIFA_VIRTUAL } = require('../constants/tarifa');

/** Tarifas que el personal puede elegir al matricular (no incluye gestor/empresa automáticas). */
const TARIFAS_MATRICULA_SELECCIONABLES = [1, 2, 3, TARIFA_VIRTUAL];

const TARIFAS_MATRICULA_DEFAULT = [...TARIFAS_MATRICULA_SELECCIONABLES];

function normalizarTarifasMatriculaSeleccionables(raw) {
  if (!Array.isArray(raw) || !raw.length) return [...TARIFAS_MATRICULA_DEFAULT];
  const set = new Set();
  for (const item of raw) {
    const n = Number(item);
    if (TARIFAS_MATRICULA_SELECCIONABLES.includes(n)) set.add(n);
  }
  return set.size ? [...set].sort((a, b) => a - b) : [...TARIFAS_MATRICULA_DEFAULT];
}

function interseccionTarifasMatricula(programaTarifas, configTarifas) {
  const cfg = new Set(normalizarTarifasMatriculaSeleccionables(configTarifas));
  return (programaTarifas || [])
    .map((t) => Number(t))
    .filter((t) => cfg.has(t))
    .sort((a, b) => a - b);
}

async function obtenerTarifasMatriculaSeleccionables() {
  const { obtenerConfigRecibo } = require('./configRecibo');
  const doc = await obtenerConfigRecibo();
  return normalizarTarifasMatriculaSeleccionables(doc.tarifasMatriculaSeleccionables);
}

module.exports = {
  TARIFAS_MATRICULA_SELECCIONABLES,
  TARIFAS_MATRICULA_DEFAULT,
  normalizarTarifasMatriculaSeleccionables,
  interseccionTarifasMatricula,
  obtenerTarifasMatriculaSeleccionables,
};
