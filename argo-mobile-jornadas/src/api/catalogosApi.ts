import { apiFetch } from './client';

export type MunicipioDivipola = {
  codMunicipio: string;
  nombreMunicipio: string;
  codDepto?: string;
  nombreDepto: string;
  label: string;
};

export type DepartamentoDivipola = {
  codDepto: string;
  nombreDepto: string;
};

export type ColegioDivipola = {
  codigoEstablecimiento: string;
  nombreEstablecimiento: string;
  codMunicipio: string;
  nombreMunicipio?: string;
  nombreDepartamento?: string;
  nivelEducativo?: string | null;
  label: string;
  hint?: string;
};

export type EstamentoPublico = {
  idEstamento: string;
  nombre: string;
  tipo?: string;
  codMunicipio?: string;
  nombreMunicipio?: string;
  label: string;
};

export function listarDepartamentos() {
  return apiFetch<DepartamentoDivipola[]>(`/catalogos/divipola/departamentos`);
}

export function buscarMunicipiosDivipola(q: string, limit = 20, codDepto = '') {
  const params = new URLSearchParams({
    limit: String(limit),
  });
  if (q.trim()) params.set('q', q.trim());
  if (String(codDepto || '').trim()) params.set('codDepto', String(codDepto).trim());
  return apiFetch<MunicipioDivipola[]>(`/catalogos/divipola/buscar?${params.toString()}`);
}

export function buscarColegios(codMunicipio: string, q = '', limit = 40, nivel = '') {
  const params = new URLSearchParams({
    limit: String(limit),
  });
  if (String(codMunicipio || '').trim()) {
    params.set('codMunicipio', String(codMunicipio).trim());
  }
  if (q.trim()) params.set('q', q.trim());
  if (String(nivel || '').trim()) params.set('nivel', String(nivel).trim());
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

export type ClienteFacturacionLite = {
  _id: string;
  nombre: string;
  identificacion?: string;
  razonSocial?: string;
  nombres?: string;
};

/** Busca clientes FE (requiere permiso facturacion / alumnos.pagos / config.facturacion). */
export function buscarClientesFacturacion(q = '', limit = 40) {
  const params = new URLSearchParams({ q: q.trim() });
  return apiFetch<ClienteFacturacionLite[]>(`/clientes?${params.toString()}`).then((rows) =>
    (Array.isArray(rows) ? rows : [])
      .slice(0, limit)
      .map((r) => ({
        ...r,
        _id: String(r._id),
        nombre: String(r.nombre || r.razonSocial || r.nombres || '').trim(),
      }))
      .filter((r) => r._id && r.nombre),
  );
}
