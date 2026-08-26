import type { CatalogoItem } from '../api/domain';
import { idTipoPagoItem, etiquetaTipoPago } from './pago';

function normalizar(txt: string): string {
  return String(txt ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export interface UsuarioGestorPago {
  rol?: string | null;
  gestorComercial?: unknown | null;
}

export function esUsuarioGestorComercial(user?: UsuarioGestorPago | null): boolean {
  if (!user) return false;
  return String(user.rol || '')
    .trim()
    .toLowerCase() === 'gestor';
}

export function esTipoPagoTransferencia(t: CatalogoItem, idTipoPago?: string): boolean {
  const cod = String(t.codigo ?? '')
    .trim()
    .toUpperCase();
  const id = String(idTipoPago ?? idTipoPagoItem(t)).trim();
  if (cod === 'TR' || id === '2') return true;
  const label = normalizar(etiquetaTipoPago(t));
  if (/nequi|davi|tarj|cheq|efect|linea|credito|debito/.test(label)) return false;
  return /transf|consign|pse/.test(label);
}

export function filtrarTiposPagoGestor(tipos: CatalogoItem[]): CatalogoItem[] {
  const tr = (tipos || []).filter((t) => esTipoPagoTransferencia(t));
  if (tr.length) return tr;
  const fallback = (tipos || []).find((t) => idTipoPagoItem(t) === '2');
  return fallback ? [fallback] : [];
}

export function idTipoPagoTransferenciaDefault(tipos: CatalogoItem[]): string {
  const lista = filtrarTiposPagoGestor(tipos);
  return lista[0] ? idTipoPagoItem(lista[0]) : '';
}

export const MENSAJE_PAGO_GESTOR_TRANSFERENCIA =
  'Como gestor comercial, registre el pago solo por transferencia a las cuentas de la empresa, con referencia y soporte obligatorios.';
