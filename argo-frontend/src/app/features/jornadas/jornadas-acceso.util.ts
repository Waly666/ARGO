/** Acceso restringido: solo clases de hoy / ejecución / portal — no hub de contratación. */
export function esInstructorJornadasRestringido(
  tienePermiso: (clave: string | string[]) => boolean,
  rol?: string | null,
): boolean {
  // Primero los permisos: quien gestiona o registra alumnos entra al hub
  // aunque el código/nombre del rol diga «instructor».
  if (tienePermiso(['*', 'jornadas.gestionar', 'jornadas.registrar_alumnos'])) return false;

  const r = String(rol || '')
    .trim()
    .toLowerCase();
  if (r === 'instructor' || /(^|[_-])instructor(es)?($|[_-])/.test(r)) return true;
  return tienePermiso('jornadas.operar') && !tienePermiso('jornadas.gestionar');
}
