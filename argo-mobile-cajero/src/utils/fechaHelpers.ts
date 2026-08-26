/** Utilidades calendario ARGO — fecha calendario local (sin UTC). */

export const MESES_CORTO = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const;

export const MESES_LARGO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

export const DIAS_CORTO = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'] as const;

export function ymdToday(): string {
  const d = new Date();
  return ymdFromParts(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function ymdFromParts(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

export function parseYmd(s: string | null | undefined): { y: number; m: number; d: number } | null {
  if (s == null || s === '') return null;
  const t = String(s).trim();
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const y = +iso[1];
    const m = +iso[2];
    const d = +iso[3];
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return { y, m, d };
  }
  const lat = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (lat) {
    const d = +lat[1];
    const m = +lat[2];
    const y = +lat[3];
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return { y, m, d };
  }
  return null;
}

export function formatYmdDisplay(ymd: string | null | undefined): string {
  const p = parseYmd(ymd);
  if (!p) return '';
  return `${String(p.d).padStart(2, '0')}/${String(p.m).padStart(2, '0')}/${p.y}`;
}

export function formatYmdLegible(ymd: string | null | undefined): string {
  const p = parseYmd(ymd);
  if (!p) return '';
  return `${p.d} ${MESES_LARGO[p.m - 1]} ${p.y}`;
}

export function compareYmd(a: string, b: string): number {
  return a.localeCompare(b);
}

export function isYmdInRange(ymd: string, min?: string | null, max?: string | null): boolean {
  if (min && compareYmd(ymd, min) < 0) return false;
  if (max && compareYmd(ymd, max) > 0) return false;
  return true;
}

/** Celdas del mes: null = vacío, number = día del mes. */
export function buildMonthGrid(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month - 1, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

export function listarAnios(min: number, max: number): number[] {
  const out: number[] = [];
  for (let y = max; y >= min; y--) out.push(y);
  return out;
}
