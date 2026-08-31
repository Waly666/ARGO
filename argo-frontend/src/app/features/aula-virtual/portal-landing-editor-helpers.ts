/** Utilidades compartidas para editores de páginas del portal (arrays, listas). */

export function addStringItem(list: string[], value = ''): void {
  list.push(value);
}

export function removeStringItem(list: string[], index: number): void {
  list.splice(index, 1);
}

export function moveStringItem(list: string[], index: number, dir: -1 | 1): void {
  const next = index + dir;
  if (next < 0 || next >= list.length) return;
  const [item] = list.splice(index, 1);
  list.splice(next, 0, item);
}

export function addFaqItem(list: { pregunta: string; respuesta: string }[]): void {
  list.push({ pregunta: '', respuesta: '' });
}

export function removeAt<T>(list: T[], index: number): void {
  list.splice(index, 1);
}

export function addNavItem(list: { id: string; label: string }[]): void {
  list.push({ id: `seccion-${list.length + 1}`, label: 'Nueva sección' });
}

export const PORTAL_EDITOR_ACENTOS = ['blue', 'teal', 'orange', 'green', 'purple'] as const;
