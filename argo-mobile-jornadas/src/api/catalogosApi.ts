import { apiFetch } from './client';

export type MunicipioDivipola = {
  codMunicipio: string;
  nombreMunicipio: string;
  nombreDepto: string;
  label: string;
};

export type ColegioDivipola = {
  codigoEstablecimiento: string;
  nombreEstablecimiento: string;
  codMunicipio: string;
  nombreMunicipio?: string;
  label: string;
};

export type EstamentoPublico = {
  idEstamento: string;
  nombre: string;
  tipo?: string;
  codMunicipio?: string;
  nombreMunicipio?: string;
  label: string;
};

export function buscarMunicipiosDivipola(q: string, limit = 20) {
  const params = new URLSearchParams({
    q: q.trim(),
    limit: String(limit),
  });
  return apiFetch<MunicipioDivipola[]>(`/catalogos/divipola/buscar?${params.toString()}`);
}

export function buscarColegios(codMunicipio: string, q = '', limit = 40) {
  const params = new URLSearchParams({
    limit: String(limit),
  });
  if (String(codMunicipio || '').trim()) {
    params.set('codMunicipio', String(codMunicipio).trim());
  }
  if (q.trim()) params.set('q', q.trim());
  return apiFetch<ColegioDivipola[]>(`/catalogos/colegios/buscar?${params.toString()}`);
}

export function buscarEstamentosPublicos(codMunicipio = '', q = '', limit = 40) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (codMunicipio.trim()) params.set('codMunicipio', codMunicipio.trim());
  if (q.trim()) params.set('q', q.trim());
  return apiFetch<EstamentoPublico[]>(
    `/catalogos/estamentos-publicos/buscar?${params.toString()}`,
  );
}
