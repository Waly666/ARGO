import { apiFetch } from './client';
import type { AlumnoListItem, AlumnosListResponse } from './domain';
import { formatNumDoc } from '../utils/format';

export async function buscarAlumnos(opts?: {
  q?: string;
  skip?: number;
  limit?: number;
}): Promise<AlumnosListResponse> {
  const q = new URLSearchParams();
  if (opts?.q?.trim()) q.set('q', opts.q.trim());
  q.set('skip', String(opts?.skip ?? 0));
  q.set('limit', String(opts?.limit ?? 40));
  const qs = q.toString();
  return apiFetch<AlumnosListResponse>(`/alumnos?${qs}`);
}

export async function fetchAlumnoPorDoc(numDoc: string | number): Promise<AlumnoListItem> {
  return apiFetch<AlumnoListItem>(`/alumnos/doc/${encodeURIComponent(formatNumDoc(numDoc))}`);
}

export async function fetchAlumnoPorId(id: string): Promise<AlumnoListItem> {
  return apiFetch<AlumnoListItem>(`/alumnos/${encodeURIComponent(id)}`);
}
