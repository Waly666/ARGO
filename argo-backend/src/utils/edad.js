/**
 * Edad en años cumplidos a partir de fecha de nacimiento.
 * @param {Date|string|null|undefined} fechaNac
 * @param {Date} [ref]
 * @returns {number|null}
 */
function calcularEdad(fechaNac, ref = new Date()) {
  if (!fechaNac) return null;
  const d = fechaNac instanceof Date ? fechaNac : new Date(fechaNac);
  if (Number.isNaN(d.getTime())) return null;
  let edad = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) edad -= 1;
  if (edad < 0 || edad > 130) return null;
  return edad;
}

/**
 * Grupos de edad para informes (Colombia), rangos exclusivos:
 * - Primera infancia 0–5
 * - Infancia / niñez 6–13 (cubre 6–12 y el año previo a juventud)
 * - Juventud 14–28 (Ley 1622 de 2013)
 * - Adultez 29–59
 * - Personas mayores 60+
 */
const RANGOS_EDAD = [
  { key: 'primera_infancia', label: 'Primera infancia (0–5)', min: 0, max: 5 },
  { key: 'infancia', label: 'Infancia / niñez (6–13)', min: 6, max: 13 },
  { key: 'juventud', label: 'Juventud (14–28)', min: 14, max: 28 },
  { key: 'adultez', label: 'Adultez (29–59)', min: 29, max: 59 },
  { key: 'vejez', label: 'Personas mayores (60+)', min: 60, max: 200 },
];

const SEXOS_INFORME = ['Masculino', 'Femenino', 'Otro', 'Sin dato'];

function rangoEdadDef(edad) {
  if (edad == null || !Number.isFinite(edad)) return null;
  return RANGOS_EDAD.find((x) => edad >= x.min && edad <= x.max) || null;
}

function rangoEdadLabel(edad) {
  const r = rangoEdadDef(edad);
  return r ? r.label : 'Sin dato';
}

module.exports = {
  calcularEdad,
  rangoEdadLabel,
  rangoEdadDef,
  RANGOS_EDAD,
  SEXOS_INFORME,
};
