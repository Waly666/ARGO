/** Edad en años cumplidos a partir de fecha de nacimiento. */
export function calcularEdad(
  fechaNac?: string | Date | null,
  ref: Date = new Date(),
): number | null {
  if (!fechaNac) return null;
  const d = typeof fechaNac === 'string' ? new Date(fechaNac) : fechaNac;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  let edad = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) edad -= 1;
  if (edad < 0 || edad > 130) return null;
  return edad;
}

/**
 * Grupos de edad (Colombia), rangos exclusivos:
 * primera infancia 0–5, infancia/niñez 6–13, juventud 14–28 (Ley 1622),
 * adultez 29–59, personas mayores 60+.
 */
export const RANGOS_EDAD = [
  { key: 'primera_infancia', label: 'Primera infancia (0–5)', min: 0, max: 5 },
  { key: 'infancia', label: 'Infancia / niñez (6–13)', min: 6, max: 13 },
  { key: 'juventud', label: 'Juventud (14–28)', min: 14, max: 28 },
  { key: 'adultez', label: 'Adultez (29–59)', min: 29, max: 59 },
  { key: 'vejez', label: 'Personas mayores (60+)', min: 60, max: 200 },
] as const;

export function grupoEdadDef(edad: number | null | undefined) {
  if (edad == null || !Number.isFinite(edad)) return null;
  return RANGOS_EDAD.find((x) => edad >= x.min && edad <= x.max) || null;
}

export function grupoEdadLabel(edad: number | null | undefined): string {
  const r = grupoEdadDef(edad);
  return r ? r.label : '';
}

/** Etiqueta corta para listados (ej. "34 a."). */
export function etiquetaEdad(fechaNac?: string | Date | null): string {
  const e = calcularEdad(fechaNac);
  return e == null ? '—' : `${e} a.`;
}
