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

/** Etiqueta corta para listados (ej. "34 a."). */
export function etiquetaEdad(fechaNac?: string | Date | null): string {
  const e = calcularEdad(fechaNac);
  return e == null ? '—' : `${e} a.`;
}
