import { apiFetch } from './client';
import type { ModuloCrud } from '../utils/crudPermiso';

export type EstadoSolicitudAutorizacion =
  | 'pendiente'
  | 'autorizada'
  | 'rechazada'
  | 'ejecutada'
  | 'fallida'
  | 'caducada';

export type SolicitudAutorizacion = {
  idSolicitud: number;
  modulo: ModuloCrud | string;
  accion?: string;
  entidad?: string;
  idEntidad: string;
  idSede?: string | null;
  resumen?: string;
  detalle?: Record<string, unknown>;
  motivo?: string | null;
  estado: EstadoSolicitudAutorizacion | string;
  usuarioSolicita?: string | null;
  nombreSolicita?: string | null;
  fechaSolicitud?: string;
  nombreResuelve?: string | null;
  fechaResolucion?: string;
  motivoRechazo?: string | null;
  errorEjecucion?: string | null;
};

export type SolicitarEliminacionDto = {
  modulo: ModuloCrud;
  idEntidad: string;
  resumen: string;
  motivo?: string | null;
  detalle?: Record<string, unknown>;
};

export async function listarAutorizaciones(opts?: {
  estado?: string;
  modulo?: string;
  limit?: number;
}): Promise<SolicitudAutorizacion[]> {
  const p = new URLSearchParams();
  if (opts?.estado) p.set('estado', opts.estado);
  if (opts?.modulo) p.set('modulo', opts.modulo);
  if (opts?.limit) p.set('limit', String(opts.limit));
  const qs = p.toString();
  return apiFetch<SolicitudAutorizacion[]>(`/autorizaciones${qs ? `?${qs}` : ''}`);
}

export async function autorizarSolicitud(idSolicitud: number): Promise<unknown> {
  return apiFetch(`/autorizaciones/${idSolicitud}/autorizar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

export async function rechazarSolicitud(idSolicitud: number, motivo?: string): Promise<unknown> {
  return apiFetch(`/autorizaciones/${idSolicitud}/rechazar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(motivo ? { motivo } : {}),
  });
}

export async function solicitarEliminacion(dto: SolicitarEliminacionDto): Promise<unknown> {
  return apiFetch('/autorizaciones/solicitar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
}
