/**
 * Clasificación PESV para esta instalación.
 * Misionalidad fija: actividad distinta al transporte terrestre automotor (Resolución 40595 de 2022).
 * Obligación desde 10 vehículos. El nivel usa solo la columna de vehículos:
 * 10–49 Básico, 50–99 Estándar, 100 o más Avanzado.
 */

const REGLA_CODIGO = '40595-m2-vehiculos-2022';
const MISIONALIDAD = 2;
const MISIONALIDAD_TEXTO = 'Actividad distinta al transporte terrestre automotor';
const DESDE_BASICO = 10;
const DESDE_ESTANDAR = 50;
const DESDE_AVANZADO = 100;

const NIVELES = ['basico', 'estandar', 'avanzado'];

function etiquetaNivel(nivel) {
  const map = {
    basico: 'Básico',
    estandar: 'Estándar',
    avanzado: 'Avanzado',
  };
  return map[nivel] || '';
}

function clasificarPesv(totalVehiculos) {
  const vehiculos = Math.max(0, Number(totalVehiculos) || 0);
  let nivel = null;
  if (vehiculos >= DESDE_AVANZADO) nivel = 'avanzado';
  else if (vehiculos >= DESDE_ESTANDAR) nivel = 'estandar';
  else if (vehiculos >= DESDE_BASICO) nivel = 'basico';
  const obligado = nivel != null;

  const nivelLabel = obligado ? etiquetaNivel(nivel) : 'No obligada';
  const resumen = obligado
    ? `Con ${vehiculos} vehículos debe presentar el PESV en nivel ${nivelLabel}.`
    : `Con ${vehiculos} vehículos no está obligada a presentar el PESV. El nivel Básico empieza en ${DESDE_BASICO}.`;

  return {
    reglaCodigo: REGLA_CODIGO,
    misionalidad: MISIONALIDAD,
    misionalidadTexto: MISIONALIDAD_TEXTO,
    umbralObligacion: DESDE_BASICO,
    totalVehiculos: vehiculos,
    obligado,
    nivel,
    nivelLabel,
    resumen,
  };
}

module.exports = {
  NIVELES,
  REGLA_CODIGO,
  MISIONALIDAD,
  MISIONALIDAD_TEXTO,
  DESDE_BASICO,
  DESDE_ESTANDAR,
  DESDE_AVANZADO,
  clasificarPesv,
  etiquetaNivel,
};
