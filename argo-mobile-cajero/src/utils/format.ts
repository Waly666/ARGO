export function formatMoney(value: number | null | undefined): string {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumDoc(value: number | string): string {
  return String(value ?? '').replace(/\D/g, '');
}

export function nombreCompleto(parts: {
  nombre1?: string;
  nombre2?: string;
  apellido1?: string;
  apellido2?: string;
  nombreCompleto?: string;
  nombres?: string;
}): string {
  if (parts.nombreCompleto?.trim()) return parts.nombreCompleto.trim();
  if (parts.nombres?.trim()) return parts.nombres.trim();
  return [parts.nombre1, parts.nombre2, parts.apellido1, parts.apellido2]
    .filter(Boolean)
    .join(' ')
    .trim();
}
