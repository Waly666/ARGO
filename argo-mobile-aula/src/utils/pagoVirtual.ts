import type { CursoVirtual, EstadoInscripcionVirtual } from '../api/types';

export type ModoPagoCurso = 'pagado' | 'bloqueado' | 'opcional' | 'sin_deuda';

/** Misma regla que el portal web: matriculado con liquidación y saldo pendiente. */
export function pagoPendiente(ins: EstadoInscripcionVirtual): boolean {
  return !!(ins.matriculado && ins.pago && !ins.pago.pagado);
}

export function esPagoBloqueado(
  ins: EstadoInscripcionVirtual,
  curso: Pick<CursoVirtual, 'requierePagoParaCursar'>,
): boolean {
  return !!(
    ins.accesoBloqueadoPago ||
    ins.curso.requierePagoParaCursar ||
    curso.requierePagoParaCursar
  );
}

/** Botón Wompi — alineado a curso-detalle del portal web. */
export function puedeMostrarPagoWompi(
  ins: EstadoInscripcionVirtual,
  curso: Pick<CursoVirtual, 'requierePagoParaCursar'>,
  pasarelaActiva: boolean,
): boolean {
  if (!pasarelaActiva || !ins.matriculado || ins.pago?.pagado) return false;
  if (esPagoBloqueado(ins, curso)) return true;
  return pagoPendiente(ins);
}

/** ¿Hay saldo o certificado pendiente de pago? */
export function tienePagoPendiente(
  ins: EstadoInscripcionVirtual,
  curso: Pick<CursoVirtual, 'requierePagoParaCursar' | 'tarifaVirtual'>,
): boolean {
  if (ins.pago?.pagado) return false;
  if (ins.certificadoPendientePago) return true;
  if (ins.accesoBloqueadoPago) return true;
  if (ins.curso.requierePagoParaCursar || curso.requierePagoParaCursar) return true;
  if (ins.pago?.tieneLiquidacion && !ins.pago.pagado) return true;
  if (pagoPendiente(ins)) return true;
  if ((curso.tarifaVirtual ?? ins.curso.tarifaVirtual ?? 0) > 0 && ins.matriculado) return true;
  return false;
}

export function modoPagoInscripcion(
  ins: EstadoInscripcionVirtual,
  curso: Pick<CursoVirtual, 'requierePagoParaCursar' | 'tarifaVirtual'>,
): ModoPagoCurso {
  if (ins.pago?.pagado) return 'pagado';
  if (esPagoBloqueado(ins, curso)) return 'bloqueado';
  if (tienePagoPendiente(ins, curso)) return 'opcional';
  return 'sin_deuda';
}

/** @deprecated use puedeMostrarPagoWompi */
export function puedeMostrarPagoEnLinea(
  ins: EstadoInscripcionVirtual,
  curso: Pick<CursoVirtual, 'requierePagoParaCursar' | 'tarifaVirtual'>,
): boolean {
  return tienePagoPendiente(ins, curso);
}

export function montoPagoCurso(
  ins: EstadoInscripcionVirtual,
  curso: Pick<CursoVirtual, 'tarifaVirtual'>,
): number {
  return ins.pago?.saldo ?? curso.tarifaVirtual ?? ins.curso.tarifaVirtual ?? 0;
}
