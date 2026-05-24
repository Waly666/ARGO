/** Muestra numDoc en inputs (sin puntos, sin notación científica). */
export function formatNumDoc(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  const digits = String(value).replace(/\D/g, '');
  return digits || String(value).trim();
}

/** Envía numDoc al API como número (6–11 dígitos). */
export function parseNumDocForApi(value: unknown): number | null {
  const digits = formatNumDoc(value);
  if (!digits) return null;
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (digits.length < 6 || digits.length > 11) return null;
  return n;
}
