import { apiFetch } from './client';

export type EstadoConsignacion = 'pendiente' | 'aprobada' | 'rechazada';

export type SolicitudConsignacion = {
  id: string;
  estado: EstadoConsignacion | string;
  numDoc?: number | string;
  nombreAlumno?: string;
  correo?: string;
  nombreCurso?: string;
  referenciaBancaria?: string;
  bancoNombre?: string;
  medioEtiqueta?: string;
  montoCop?: number;
  motivoRechazo?: string | null;
  fechaCreacion?: string;
  fechaRevision?: string | null;
  urlComprobante?: string;
  idIngreso?: string | null;
};

export async function listarSolicitudesConsignacion(
  estado: string = 'pendiente',
  q?: string,
): Promise<SolicitudConsignacion[]> {
  const p = new URLSearchParams();
  if (estado) p.set('estado', estado);
  if (q?.trim()) p.set('q', q.trim());
  const qs = p.toString();
  return apiFetch<SolicitudConsignacion[]>(`/pasarela/consignacion/solicitudes${qs ? `?${qs}` : ''}`);
}

export async function aprobarSolicitudConsignacion(
  id: string,
): Promise<{ message?: string; numRecibo?: string }> {
  return apiFetch(`/pasarela/consignacion/solicitudes/${encodeURIComponent(id)}/aprobar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

export async function rechazarSolicitudConsignacion(
  id: string,
  motivoRechazo: string,
): Promise<{ message?: string }> {
  return apiFetch(`/pasarela/consignacion/solicitudes/${encodeURIComponent(id)}/rechazar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivoRechazo }),
  });
}

/** Alias usado por el poller de alertas. */
export async function fetchConsignacionesPendientes(): Promise<SolicitudConsignacion[]> {
  return listarSolicitudesConsignacion('pendiente', undefined);
}
