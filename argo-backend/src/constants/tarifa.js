/** Tarifas 1–3: presencial / app web. Tarifa 4: educación virtual (portal aula virtual). */
const TARIFA_VIRTUAL = 4;

const TARIFAS_PRESENCIAL = [1, 2, 3];

function esTarifaVirtual(tarifa) {
  return Number(tarifa) === TARIFA_VIRTUAL;
}

module.exports = {
  TARIFA_VIRTUAL,
  TARIFAS_PRESENCIAL,
  esTarifaVirtual,
};
