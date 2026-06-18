import type { CursoVirtual } from '../api/types';

export function pctCurso(c: CursoVirtual): number {
  return c.progreso?.pctCompletitud ?? 0;
}

export function cursoCompletado(c: CursoVirtual): boolean {
  const p = pctCurso(c);
  return p >= 100 || !!c.progreso?.aprobado;
}

export function cursoEnProgreso(c: CursoVirtual): boolean {
  const p = pctCurso(c);
  return p > 0 && !cursoCompletado(c);
}

export function puedeCursar(c: CursoVirtual): boolean {
  if (c.puedeCursar === false) return false;
  if (c.accesoBloqueadoPago) return false;
  if (c.requierePagoParaCursar && c.pago && !c.pago.pagado) return false;
  return !!c.tienePaquete;
}

export function fmtFecha(f?: string | null): string {
  if (!f) return '—';
  const d = new Date(f);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', { dateStyle: 'medium' });
}
