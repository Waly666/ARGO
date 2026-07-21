import { apiFetch } from './client';

export type MunicipioDivipola = {
  codMunicipio: string;
  nombreMunicipio: string;
  nombreDepto: string;
  label: string;
};

export function buscarMunicipiosDivipola(q: string, limit = 20) {
  const params = new URLSearchParams({
    q: q.trim(),
    limit: String(limit),
  });
  return apiFetch<MunicipioDivipola[]>(`/catalogos/divipola/buscar?${params.toString()}`);
}
