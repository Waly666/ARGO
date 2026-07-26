export type SortDir = 'asc' | 'desc';

export function readSortPrefs<T extends string>(
  key: string,
  defaultCol: T,
  defaultDir: SortDir = 'desc',
): { col: T; dir: SortDir } {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { col: defaultCol, dir: defaultDir };
    const parsed = JSON.parse(raw) as { col?: string; dir?: string };
    const col = (parsed.col as T) || defaultCol;
    const dir: SortDir = parsed.dir === 'asc' ? 'asc' : parsed.dir === 'desc' ? 'desc' : defaultDir;
    return { col, dir };
  } catch {
    return { col: defaultCol, dir: defaultDir };
  }
}

export function saveSortPrefs(key: string, col: string, dir: SortDir): void {
  try {
    localStorage.setItem(key, JSON.stringify({ col, dir }));
  } catch {
    /* ignore */
  }
}

export function cmpText(a: unknown, b: unknown, dir: SortDir): number {
  const sa = String(a ?? '').trim().toLocaleLowerCase('es');
  const sb = String(b ?? '').trim().toLocaleLowerCase('es');
  const r = sa.localeCompare(sb, 'es', { sensitivity: 'base', numeric: true });
  return dir === 'asc' ? r : -r;
}

export function cmpNum(a: unknown, b: unknown, dir: SortDir): number {
  const na = Number(a);
  const nb = Number(b);
  const va = Number.isFinite(na) ? na : 0;
  const vb = Number.isFinite(nb) ? nb : 0;
  const r = va - vb;
  return dir === 'asc' ? r : -r;
}

export function cmpDate(a: unknown, b: unknown, dir: SortDir): number {
  const ta = a ? new Date(String(a)).getTime() : 0;
  const tb = b ? new Date(String(b)).getTime() : 0;
  const va = Number.isFinite(ta) ? ta : 0;
  const vb = Number.isFinite(tb) ? tb : 0;
  const r = va - vb;
  return dir === 'asc' ? r : -r;
}
