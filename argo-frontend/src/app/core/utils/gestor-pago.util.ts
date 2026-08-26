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

/** Usuario con rol gestor comercial (vinculado o no al catálogo). */
export function esUsuarioGestorComercial(user?: UsuarioGestorPago | null): boolean {
  if (!user) return false;
  const r = String(user.rol || '')
    .trim()
    .toLowerCase();
  return r === 'gestor';
}

export function esTipoPagoTransferenciaCatalogo(t: Record<string, unknown>): boolean {
  const cod = String(t['codigo'] ?? '')
    .trim()
    .toUpperCase();
  const id = String(t['idTipoPago'] ?? t['id'] ?? t['_id'] ?? '').trim();
  if (cod === 'TR' || id === '2') return true;
  const label = normalizar(String(t['descripcion'] ?? t['nombre'] ?? ''));
  if (/nequi|davi|tarj|cheq|efect|linea|credito|debito/.test(label)) return false;
  return /transf|consign|pse/.test(label);
}

/** Solo transferencia bancaria para gestores. */
export function filtrarTiposPagoGestor<T extends Record<string, unknown>>(tipos: T[]): T[] {
  const tr = (tipos || []).filter((t) => esTipoPagoTransferenciaCatalogo(t));
  if (tr.length) return tr;
  const fallback = (tipos || []).find((t) => String(t['idTipoPago'] ?? '') === '2');
  return fallback ? [fallback] : [];
}

export function idTipoPagoTransferenciaDefault(tipos: Record<string, unknown>[]): string {
  const lista = filtrarTiposPagoGestor(tipos);
  const t = lista[0];
  if (!t) return '';
  return String(t['idTipoPago'] ?? t['codigo'] ?? t['id'] ?? '').trim();
}

export const MENSAJE_PAGO_GESTOR_TRANSFERENCIA =
  'Como gestor comercial, los pagos deben registrarse únicamente por transferencia a las cuentas de la empresa, indicando cuenta destino, referencia y soporte del movimiento.';
