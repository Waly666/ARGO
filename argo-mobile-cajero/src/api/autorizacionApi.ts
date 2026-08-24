import { apiFetch } from './client';
import type { ModuloCrud } from '../utils/crudPermiso';

export type SolicitarEliminacionDto = {
  modulo: ModuloCrud;
  idEntidad: string;
  resumen: string;
  motivo?: string | null;
  detalle?: Record<string, unknown>;
};

export async function solicitarEliminacion(dto: SolicitarEliminacionDto): Promise<unknown> {
  return apiFetch('/autorizaciones/solicitar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
}
