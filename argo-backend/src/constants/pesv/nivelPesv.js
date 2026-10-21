/**
 * Cálculo de nivel PESV (Básico / Estándar / Avanzado) según Res. 40595/2022 — simplificado.
 * Ajuste umbrales si la organización valida tablas oficiales distintas.
 */

const NIVELES = ['basico', 'estandar', 'avanzado'];

function calcularNivelPesv({ misionalidad, totalVehiculos, totalConductores }) {
  const v = Math.max(0, Number(totalVehiculos) || 0);
  const c = Math.max(0, Number(totalConductores) || 0);
  const m = Number(misionalidad) === 1 ? 1 : 2;

  if (m === 1) {
    if (v >= 201 || c >= 201) return 'avanzado';
    if (v >= 11 || c >= 11) return 'estandar';
    return 'basico';
  }
  if (v >= 51 || c >= 51) return 'avanzado';
  if (v >= 6 || c >= 6) return 'estandar';
  return 'basico';
}

function etiquetaNivel(nivel) {
  const map = {
    basico: 'Básico',
    estandar: 'Estándar',
    avanzado: 'Avanzado',
  };
  return map[nivel] || nivel;
}

module.exports = {
  NIVELES,
  calcularNivelPesv,
  etiquetaNivel,
};
