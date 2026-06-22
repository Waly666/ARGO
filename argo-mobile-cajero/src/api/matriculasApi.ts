import { apiFetch } from './client';
import { formatNumDoc } from '../utils/format';
import type { TarifaMatricula } from '../utils/matricula';

export async function crearMatricula(body: {
  numDoc: string | number;
  idPrograma: string;
  tarifa?: TarifaMatricula;
  email?: string;
  crearUsuarioPortal?: boolean;
}): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>('/matriculas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      numDoc: formatNumDoc(body.numDoc),
    }),
  });
}

export async function listarMatriculasAlumno(numDoc: string | number): Promise<unknown[]> {
  return apiFetch<unknown[]>(
    `/matriculas/alumno/${encodeURIComponent(formatNumDoc(numDoc))}`,
  );
}
