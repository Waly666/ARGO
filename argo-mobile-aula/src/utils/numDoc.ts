/** Cédula / NUIP Colombia: 6–14 dígitos (mismo criterio que el frontend ARGO). */
export const NUM_DOC_MIN = 6;
export const NUM_DOC_MAX = 14;

export function digitsOnly(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

export function isValidNumDocDigits(digits: string): boolean {
  return digits.length >= NUM_DOC_MIN && digits.length <= NUM_DOC_MAX;
}

export function sanitizeNumDocInput(value: unknown): string {
  return digitsOnly(value).slice(0, NUM_DOC_MAX);
}
