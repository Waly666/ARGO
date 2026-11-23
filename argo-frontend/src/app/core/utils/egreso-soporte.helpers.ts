import { esFormaPagoEfectivo } from './referencia-pago.util';

export function tieneSoporteEgreso(e?: { urlSoporte?: string | null } | null): boolean {
  return !!String(e?.urlSoporte || '').trim();
}

/** El efectivo no tiene consignación ni pantallazo. Un pago sin forma también se trata como efectivo. */
export function egresoEsEfectivo(e?: {
  formaPago?: string | null;
  idTipoPago?: string | number | null;
} | null): boolean {
  if (String(e?.idTipoPago ?? '').trim() === '1') return true;
  return esFormaPagoEfectivo(e?.formaPago);
}

/** Alarma solo si el egreso sigue vigente, no es efectivo y no tiene imagen. */
export function faltaSoporteEgreso(e?: {
  formaPago?: string | null;
  idTipoPago?: string | number | null;
  urlSoporte?: string | null;
  anulado?: boolean;
  estado?: string | null;
} | null): boolean {
  if (!e) return false;
  if (e.anulado === true) return false;
  if (String(e.estado || '').toUpperCase() === 'ANULADO') return false;
  if (egresoEsEfectivo(e)) return false;
  return !tieneSoporteEgreso(e);
}

export function tituloSoporteEgreso(e: {
  numRecibo?: string | null;
  concepto?: string;
  pagueA?: string | null;
}): string {
  const ref = e.numRecibo || e.concepto || e.pagueA || 'egreso';
  return `Sin soporte adjunto — ${ref}. Suba imagen de factura, voucher o comprobante.`;
}
