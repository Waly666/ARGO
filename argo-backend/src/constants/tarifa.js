/** Tarifas 1–3: presencial / app web. Tarifa 4: educación virtual (portal aula virtual). */
const TARIFA_VIRTUAL = 4;
/** Refrendación / renovación de certificados no formales (mismo que tarifa presencial 3). */
const TARIFA_REVALIDACION = 3;
/** Matrícula por gestor (tramitador que trae alumnos). */
const TARIFA_GESTOR = 5;
/** Matrícula por empresa que trae alumnos. */
const TARIFA_EMPRESA = 6;

const TARIFAS_PRESENCIAL = [1, 2, 3];
const TARIFAS_COMERCIALES = [TARIFA_GESTOR, TARIFA_EMPRESA];

function esTarifaVirtual(tarifa) {
  return Number(tarifa) === TARIFA_VIRTUAL;
}

function esTarifaGestor(tarifa) {
  return Number(tarifa) === TARIFA_GESTOR;
}

function esTarifaEmpresa(tarifa) {
  return Number(tarifa) === TARIFA_EMPRESA;
}

function esTarifaComercial(tarifa) {
  const t = Number(tarifa);
  return t === TARIFA_GESTOR || t === TARIFA_EMPRESA;
}

module.exports = {
  TARIFA_VIRTUAL,
  TARIFA_REVALIDACION,
  TARIFA_GESTOR,
  TARIFA_EMPRESA,
  TARIFAS_PRESENCIAL,
  TARIFAS_COMERCIALES,
  esTarifaVirtual,
  esTarifaGestor,
  esTarifaEmpresa,
  esTarifaComercial,
};
