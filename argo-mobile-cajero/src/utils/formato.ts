export function fmtMoney(n?: number | null): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    Number(n) || 0,
  );
}

export function fmtFecha(s?: string | null, withTime = true): string {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
}

export function iniciales(nombre?: string, numDoc?: number | string): string {
  const n = String(nombre || numDoc || '?').trim();
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (n[0] || '?').toUpperCase();
}
