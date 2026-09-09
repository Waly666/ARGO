/** Edad en años cumplidos a partir de fecha de nacimiento. */
export function calcularEdad(
  fechaNac?: string | Date | null,
  ref: Date = new Date(),
): number | null {
  if (!fechaNac) return null;
  let d: Date;
  if (typeof fechaNac === 'string') {
    const m = fechaNac.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    d = m
      ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
      : new Date(fechaNac);
  } else {
    d = fechaNac;
  }
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  let edad = ref.getFullYear() - d.getFullYear();
  const mo = ref.getMonth() - d.getMonth();
  if (mo < 0 || (mo === 0 && ref.getDate() < d.getDate())) edad -= 1;
  if (edad < 0 || edad > 130) return null;
  return edad;
}

/**
 * Grupos de edad (Colombia):
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

export function edadCalculadaTexto(fechaNac?: string | Date | null): string {
  const n = calcularEdad(fechaNac);
  if (n == null) return '—';
  return `${n} ${n === 1 ? 'año' : 'años'}`;
}

export function grupoEdadCalculadoTexto(fechaNac?: string | Date | null): string {
  return grupoEdadLabel(calcularEdad(fechaNac)) || '—';
}
