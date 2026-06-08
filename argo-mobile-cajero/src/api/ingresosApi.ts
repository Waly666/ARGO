import { apiFetch } from './client';
import type { IngresoCrearDto, IngresoRow } from './domain';
import { formatNumDoc } from '../utils/format';

export async function crearIngreso(dto: IngresoCrearDto): Promise<IngresoRow> {
  return apiFetch<IngresoRow>('/ingresos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...dto, numDoc: formatNumDoc(dto.numDoc) }),
  });
}

export async function listarIngresosAlumno(numDoc: string | number): Promise<IngresoRow[]> {
  return apiFetch<IngresoRow[]>(
    `/ingresos/alumno/${encodeURIComponent(formatNumDoc(numDoc))}`,
  );
}

export function reciboIngresoHtmlPath(idIngreso: string): string {
  return `/ingresos/${encodeURIComponent(idIngreso)}/recibo/html?v=${Date.now()}`;
}
