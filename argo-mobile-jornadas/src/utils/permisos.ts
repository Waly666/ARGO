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
