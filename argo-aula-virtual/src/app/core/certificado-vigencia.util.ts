import type { CertificadoConsultaItem } from './models';

function inicioDia(iso?: string | Date | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

export function certificadoConsultaVencido(row: CertificadoConsultaItem): boolean {
  if (row.vencido === true) return true;
  if (row.estadoVigencia === 'vencido') return true;
  const fv = inicioDia(row.fechaVence);
  const hoy = inicioDia(new Date());
  if (!fv || !hoy) return false;
  return fv.getTime() <= hoy.getTime();
}
