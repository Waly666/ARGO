export function normalizarTextoBusqueda(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Filtra etiqueta de catálogo (tildes y prefijo por palabra, como el ERP). */
export function coincideBusquedaEtiqueta(label: string, q: string): boolean {
  const nq = normalizarTextoBusqueda(q.trim());
  if (!nq) return true;
  const nl = normalizarTextoBusqueda(label);
  if (nl.includes(nq)) return true;
  return nl.split(/[\s(/\-—–]+/).some((w) => w.startsWith(nq));
}

/** Filtra texto: cada palabra escrita debe aparecer en el blob (orden libre). */
export function coincideBusqueda(blob: string, q: string): boolean {
  const t = normalizarTextoBusqueda(q.trim());
  if (!t) return true;
  const hay = normalizarTextoBusqueda(blob);
  return t.split(/\s+/).every((token) => token.length > 0 && hay.includes(token));
}

export function normalizarBlob(parts: Array<string | number | null | undefined>): string {
  return parts
    .filter((p) => p != null && String(p).trim() !== '')
    .map((p) => String(p).trim())
    .join(' ');
}
