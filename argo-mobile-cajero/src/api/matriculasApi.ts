import { apiFetch } from './client';
import { formatNumDoc } from '../utils/format';

export async function crearMatricula(body: {
  numDoc: string | number;
  idPrograma: string;
  tarifa?: 1 | 2 | 3;
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
