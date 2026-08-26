import { tieneAlarma, tienePermiso } from './permisos';
import { esAlarmaMovilCajero } from '../services/alertRuntime';

/** Usuario administrador: permisos totales o rol admin. */
export function esUsuarioAdmin(user?: {
  rol?: string | null;
  permisos?: string[];
} | null): boolean {
  if (!user) return false;
  if (tienePermiso(user.permisos, '*')) return true;
  const rol = String(user.rol || '').trim().toLowerCase();
  return rol === 'admin' || rol === 'administrador';
}

/**
 * Alarma habilitada en app móvil Cajero:
 * - Está en catálogo Android del servidor
 * - El rol del usuario la tiene activa (config Roles → Alarmas)
 * - La regla global está activa (Config → Alertas)
 */
export function alarmaHabilitadaMovil(
  user: { alarmas?: string[] } | null | undefined,
  key: string,
  activaGlobal: boolean,
): boolean {
  if (!esAlarmaMovilCajero(key)) return false;
  if (!activaGlobal) return false;
  if (!tieneAlarma(user?.alarmas, key)) return false;
  return true;
}
