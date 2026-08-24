/** Permisos amplios que conceden acciones más específicas (compatibilidad con roles ya guardados). */
const LEGACY_PERMISO_EXPANSION: Record<string, string[]> = {
  'config.usuarios': [
    'config.usuarios.ver',
    'config.usuarios.crear',
    'config.usuarios.editar',
    'config.usuarios.eliminar',
  ],
};

export function permisoConcedido(permisos: string[], clave: string): boolean {
  if (!permisos.length) return false;
  if (permisos.includes('*')) return true;
  if (permisos.includes(clave)) return true;
  for (const [legacy, concedidos] of Object.entries(LEGACY_PERMISO_EXPANSION)) {
    if (permisos.includes(legacy) && concedidos.includes(clave)) return true;
  }
  return false;
}

export function permisoConcedeAlguno(permisos: string[], claves: string | string[]): boolean {
  const keys = Array.isArray(claves) ? claves : [claves];
  return keys.some((k) => permisoConcedido(permisos, k));
}
