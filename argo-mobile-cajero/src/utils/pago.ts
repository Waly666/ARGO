import type { CatalogoItem, LiquidacionItem } from '../api/domain';

export const TARIFA_VIRTUAL = 4;
export const TIPO_PAGO_EFECTIVO = '1';

export type SoportePago = { uri: string; name: string; type: string };

export function esTarifaVirtualMatricula(tarifa?: number | null): boolean {
  return Number(tarifa) === TARIFA_VIRTUAL;
}

export function esLiquidacionVirtual(it?: {
  esVirtual?: boolean;
  tarifaMatricula?: number | null;
}): boolean {
  return !!it?.esVirtual || esTarifaVirtualMatricula(it?.tarifaMatricula ?? null);
}

export function idTipoPagoItem(t: CatalogoItem): string {
  return String(t.idTipoPago ?? t.codigo ?? t.id ?? t._id ?? '').trim();
}

export function etiquetaTipoPago(t: CatalogoItem): string {
  const d = String(t.descripcion ?? t.nombre ?? '').trim();
  const id = idTipoPagoItem(t);
  if (d) return /^\d+\)/.test(d) ? d : id ? `${id}) ${d}` : d;
  return id || 'Pago';
}

/** Misma regla que el frontend: efectivo por etiqueta / código EF / id 1. */
export function esEfectivoTipoPago(idTipoPago: string, tipos: CatalogoItem[]): boolean {
  const id = String(idTipoPago || '').trim();
  if (!id) return true;
  const t = tipos.find((x) => idTipoPagoItem(x) === id);
  const label = (t ? etiquetaTipoPago(t) : id).toLowerCase();
  const cod = String(t?.codigo ?? '').trim().toUpperCase();
  if (cod === 'EF' || id === TIPO_PAGO_EFECTIVO) return true;
  if (label.includes('efect') || /\bef\b/.test(label) || label === 'ef') return true;
  if (t) return false;
  // Sin catálogo: solo id 1 se trata como efectivo.
  return id === TIPO_PAGO_EFECTIVO;
}

export function etiquetaCuenta(c: CatalogoItem): string {
  const nom = String(c.nombre ?? c.descripcion ?? '').trim();
  const banco = String(c.banco ?? '').trim();
  const id = String(c.idCuentaBancaria ?? c.codigo ?? c._id ?? '').trim();
  if (nom && banco) return `${nom} · ${banco}`;
  return nom || banco || id || 'Cuenta';
}

export function idCuentaItem(c: CatalogoItem): string {
  return String(c.idCuentaBancaria ?? c.codigo ?? c._id ?? '').trim();
}

export function validarPagoIntangible(input: {
  idTipoPago: string;
  tipos: CatalogoItem[];
  idCuentaBancaria: string;
  numComprobante: string;
  soporteUri: string | null;
}): { ok: boolean; message?: string } {
  if (!input.idTipoPago) {
    return { ok: false, message: 'Seleccione el tipo de pago.' };
  }
  if (esEfectivoTipoPago(input.idTipoPago, input.tipos)) return { ok: true };
  if (!input.idCuentaBancaria) {
    return { ok: false, message: 'Seleccione la cuenta bancaria donde ingresa el pago.' };
  }
  if (!String(input.numComprobante || '').trim()) {
    return {
      ok: false,
      message: 'No se puede procesar el pago: indique el número de comprobante o referencia.',
    };
  }
  if (!input.soporteUri) {
    return {
      ok: false,
      message:
        'No se puede procesar el pago: adjunte el pantallazo o imagen del movimiento (voucher, transferencia, cheque, etc.).',
    };
  }
  return { ok: true };
}

export function forzarValorVirtualItem(
  item: LiquidacionItem,
  valor: number,
): number {
  if (!esLiquidacionVirtual(item)) return valor;
  return Number(item.saldo) || 0;
}

export function mensajeErrorApi(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/428|CAJA_CERRADA|caja en esta sede/i.test(m)) {
    return 'Debe abrir su caja en esta sede antes de cobrar (menú Caja).';
  }
  if (/SEDE_REQUERIDA|428/i.test(m)) {
    return 'No hay sede activa. Cierre sesión e ingrese de nuevo.';
  }
  return m || 'Operación no completada.';
}
