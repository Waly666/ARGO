/** Acceso restringido: solo clases de hoy / ejecución / portal — no hub de contratación. */
export function esInstructorJornadasRestringido(
  tienePermiso: (clave: string | string[]) => boolean,
  rol?: string | null,
): boolean {
  const r = String(rol || '')
    .trim()
    .toLowerCase();
  if (r === 'instructor' || /(^|[_-])instructor(es)?($|[_-])/.test(r)) return true;
  if (tienePermiso(['*', 'jornadas.gestionar', 'jornadas.registrar_alumnos'])) return false;
  return tienePermiso('jornadas.operar') && !tienePermiso('jornadas.gestionar');
}
