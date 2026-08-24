import { ModuloCrud, tieneAccionModulo } from './crudPermiso';

export type { AccionCrud, ModuloCrud } from './crudPermiso';
export { tieneAccionModulo } from './crudPermiso';

export function puedeEliminarModulo(permisos: string[], modulo: ModuloCrud): boolean {
  return tieneAccionModulo(permisos, modulo, 'eliminar');
}

export function puedeSolicitarEliminacion(permisos: string[], modulo: ModuloCrud): boolean {
  if (puedeEliminarModulo(permisos, modulo)) return false;
  return tieneAccionModulo(permisos, modulo, 'ver') || tieneAccionModulo(permisos, modulo, 'editar');
}

export function mostrarAccionEliminar(permisos: string[], modulo: ModuloCrud): boolean {
  return puedeEliminarModulo(permisos, modulo) || puedeSolicitarEliminacion(permisos, modulo);
}

export function etiquetaBotonEliminar(permisos: string[], modulo: ModuloCrud): string {
  return puedeEliminarModulo(permisos, modulo) ? 'Reversar' : 'Solicitar anulación';
}
