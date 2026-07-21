export function tienePermiso(permisos: string[] | undefined, clave: string | string[]): boolean {
  const keys = Array.isArray(clave) ? clave : [clave];
  const p = permisos || [];
  if (!p.length) return false;
  if (p.includes('*')) return true;
  return keys.some((k) => p.includes(k));
}

export function puedeOperarJornadas(permisos?: string[]): boolean {
  return tienePermiso(permisos, ['jornadas.operar', 'jornadas.gestionar']);
}

/** Admin / gestor: editar ubicación y coordenadas de la jornada. */
export function puedeGestionarJornadas(
  permisos?: string[],
  rol?: string,
  rolNombre?: string,
): boolean {
  if (tienePermiso(permisos, ['*', 'jornadas.gestionar'])) return true;
  const r = String(rol || '').trim().toLowerCase();
  if (r === 'admin' || r === 'administrador') return true;
  const rn = String(rolNombre || '').trim().toLowerCase();
  if (rn.includes('admin')) return true;
  return false;
}
