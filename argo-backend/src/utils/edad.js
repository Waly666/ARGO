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

const RANGOS_EDAD = [
  { label: '0–17', min: 0, max: 17 },
  { label: '18–25', min: 18, max: 25 },
  { label: '26–35', min: 26, max: 35 },
  { label: '36–45', min: 36, max: 45 },
  { label: '46–60', min: 46, max: 60 },
  { label: '61+', min: 61, max: 200 },
];

function rangoEdadLabel(edad) {
  if (edad == null || !Number.isFinite(edad)) return 'Sin dato';
  const r = RANGOS_EDAD.find((x) => edad >= x.min && edad <= x.max);
  return r ? r.label : 'Sin dato';
}

module.exports = {
  calcularEdad,
  rangoEdadLabel,
  RANGOS_EDAD,
};
