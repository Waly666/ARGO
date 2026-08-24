import type { IngresoRow } from '../api/domain';

export function esIngresoAnulado(p: IngresoRow): boolean {
  if (p.anulado === true) return true;
  return String(p.estado || '').trim().toUpperCase() === 'ANULADO';
}
