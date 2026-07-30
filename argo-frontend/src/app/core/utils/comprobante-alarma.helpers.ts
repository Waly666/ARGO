import type { MovimientoAlarmaHoy } from '../services/alumno.service';
import { requiereReferenciaPago } from './referencia-pago.util';

export function etiquetaTipoPagoComprobante(m: {
  formaPago?: string | null;
  tipoPago?: string | null;
}): string {
  return String(m.formaPago || m.tipoPago || '').trim();
}

export function partesEtiquetaComprobanteAlarma(
  m: MovimientoAlarmaHoy,
  tipo: 'ingreso' | 'egreso',
  fmtSaldo: (n: number) => string,
  opts?: { incluirDetalle?: boolean },
): string[] {
  const refRecibo = m.numRecibo || (tipo === 'ingreso' ? 'Ingreso' : 'Egreso');
  const tipoPago = etiquetaTipoPagoComprobante(m);
  const partes: string[] = [refRecibo, fmtSaldo(m.valor)];
  if (tipoPago) partes.push(tipoPago);
  const refPago = String(m.numComprobante || '').trim();
  if (refPago && requiereReferenciaPago(tipoPago || m.formaPago)) {
    partes.push(`Ref ${refPago}`);
  }
  if (opts?.incluirDetalle !== false && m.detalle) partes.push(m.detalle);
  return partes.filter(Boolean);
}

/** Etiqueta corta para chips de listado (sin concepto/detalle largo). */
export function etiquetaCortaComprobanteAlarma(
  m: MovimientoAlarmaHoy,
  tipo: 'ingreso' | 'egreso',
  fmtSaldo: (n: number) => string,
): string {
  return partesEtiquetaComprobanteAlarma(m, tipo, fmtSaldo, { incluirDetalle: false }).join(' · ');
}

export function tituloComprobanteAlarma(
  m: MovimientoAlarmaHoy,
  tipo: 'ingreso' | 'egreso',
  fmtSaldo: (n: number) => string,
): string {
  const base = tipo === 'ingreso' ? 'Comprobante de ingreso hoy' : 'Comprobante de egreso hoy';
  return [base, ...partesEtiquetaComprobanteAlarma(m, tipo, fmtSaldo)].join(' · ');
}
