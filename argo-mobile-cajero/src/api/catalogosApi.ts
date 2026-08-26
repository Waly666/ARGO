import { apiFetch } from './client';
import type { CatalogoItem } from './domain';
import {
  DISCAPACIDADES_DEF,
  ESTADOS_CIVIL_DEF,
  ESTRATOS_DEF,
  GENEROS_DEF,
  JORNADAS_DEF,
  MULTICULTURALIDAD_DEF,
  NIVEL_FORMACION_DEF,
  OCUPACIONES_DEF,
  REGIMEN_SALUD_DEF,
  TIPOS_DOC_DEF,
  TIPO_SANGRE_DEF,
  catalogoConFallback,
} from '../utils/alumnoCatalogo';

export type MunicipioItem = {
  codMunicipio: string;
  nombreMunicipio: string;
  codDepto?: string;
  nombreDepto?: string;
  label: string;
};

export async function listarCatalogo(name: string): Promise<CatalogoItem[]> {
  return apiFetch<CatalogoItem[]>(`/catalogos/${encodeURIComponent(name)}`);
}

async function catalogo(name: string, fallback: CatalogoItem[]): Promise<CatalogoItem[]> {
  try {
    const rows = await listarCatalogo(name);
    return catalogoConFallback(rows, fallback);
  } catch {
    return fallback;
  }
}

export async function fetchTiposDoc(): Promise<CatalogoItem[]> {
  return catalogo('catTipoDoc', TIPOS_DOC_DEF);
}

export async function fetchRegimenesSalud(): Promise<CatalogoItem[]> {
  return catalogo('catRegimenSalud', REGIMEN_SALUD_DEF);
}

export async function fetchCatalogosAlumno(): Promise<{
  tiposDoc: CatalogoItem[];
  generos: CatalogoItem[];
  tiposSangre: CatalogoItem[];
  jornadas: CatalogoItem[];
  estadosCivil: CatalogoItem[];
  estratos: CatalogoItem[];
  regimenesSalud: CatalogoItem[];
  nivelesFormacion: CatalogoItem[];
  ocupaciones: CatalogoItem[];
  discapacidades: CatalogoItem[];
  multiCulturalidades: CatalogoItem[];
}> {
  // Mismos nombres que argo-frontend (datos-principales): catálogos en BD, no listas fijas.
  const [
    tiposDoc,
    generos,
    tiposSangre,
    jornadas,
    estadosCivil,
    estratos,
    regimenesSalud,
    nivelesFormacion,
    ocupaciones,
    discapacidades,
    multiCulturalidades,
  ] = await Promise.all([
    catalogo('catTipoDoc', TIPOS_DOC_DEF),
    catalogo('genero', GENEROS_DEF),
    catalogo('tipoSangre', TIPO_SANGRE_DEF),
    catalogo('jornada', JORNADAS_DEF),
    catalogo('estadoCivil', ESTADOS_CIVIL_DEF),
    catalogo('estrato', ESTRATOS_DEF),
    catalogo('catRegimenSalud', REGIMEN_SALUD_DEF),
    catalogo('nivelFormacion', NIVEL_FORMACION_DEF),
    catalogo('ocupacion', OCUPACIONES_DEF),
    catalogo('discapacidad', DISCAPACIDADES_DEF),
    catalogo('multiCulturalidad', MULTICULTURALIDAD_DEF),
  ]);
  return {
    tiposDoc,
    generos,
    tiposSangre,
    jornadas,
    estadosCivil,
    estratos,
    regimenesSalud,
    nivelesFormacion,
    ocupaciones,
    discapacidades,
    multiCulturalidades,
  };
}

export async function buscarMunicipios(
  q: string,
  limit = 20,
  codDepto = '',
): Promise<MunicipioItem[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (q.trim()) params.set('q', q.trim());
  if (String(codDepto || '').trim()) params.set('codDepto', String(codDepto).trim());
  // Cascada: q vacío lista municipios del departamento.
  if (!q.trim() && !String(codDepto || '').trim()) return [];
  return apiFetch<MunicipioItem[]>(`/catalogos/divipola/buscar?${params.toString()}`);
}

export type DepartamentoItem = {
  codDepto?: string | number | null;
  nombreDepto?: string | null;
  _id?: string | number | null;
  nombre?: string | null;
};

export function mapDepartamentosOpciones(
  rows: DepartamentoItem[] | null | undefined,
): Array<{ value: string; label: string }> {
  const seen = new Set<string>();
  const out: Array<{ value: string; label: string }> = [];
  for (const d of rows || []) {
    const rawCod = d.codDepto ?? d._id;
    const cod = String(rawCod ?? '')
      .replace(/\D/g, '')
      .padStart(2, '0');
    if (!cod || cod === '00' || seen.has(cod)) continue;
    const label = String(d.nombreDepto ?? d.nombre ?? '').trim();
    if (!label) continue;
    seen.add(cod);
    out.push({ value: cod, label });
  }
  return out.sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export async function listarDepartamentos(): Promise<DepartamentoItem[]> {
  return apiFetch<DepartamentoItem[]>(`/catalogos/divipola/departamentos`);
}

export async function municipioPorCodigo(cod: string): Promise<MunicipioItem | null> {
  if (!cod.trim()) return null;
  try {
    return await apiFetch<MunicipioItem>(
      `/catalogos/divipola/municipio/${encodeURIComponent(cod.trim())}`,
    );
  } catch {
    return null;
  }
}

export const TIPOS_PAGO_DEF: CatalogoItem[] = [
  { idTipoPago: '1', codigo: 'EF', descripcion: 'Efectivo' },
  { idTipoPago: '2', codigo: 'TR', descripcion: 'Transferencia' },
  { idTipoPago: '3', codigo: 'TC', descripcion: 'Tarjeta crédito' },
  { idTipoPago: '4', codigo: 'TD', descripcion: 'Tarjeta débito' },
  { idTipoPago: '5', codigo: 'CH', descripcion: 'Cheque' },
  { idTipoPago: '6', codigo: 'NE', descripcion: 'Nequi / Daviplata' },
];

function esTipoPagoEnLineaItem(t: CatalogoItem): boolean {
  const id = String(t.idTipoPago ?? t.codigo ?? t.id ?? t._id ?? '')
    .trim()
    .toUpperCase();
  if (id === 'PL' || id === '7') return true;
  const desc = String(t.descripcion ?? t.nombre ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return /pago en linea/.test(desc);
}

/** Une catálogo API + defaults para no perder formas de pago (sin pasarela). */
export function mergeTiposPago(api: CatalogoItem[]): CatalogoItem[] {
  const byId = new Map<string, CatalogoItem>();
  for (const t of TIPOS_PAGO_DEF) {
    const id = String(t.idTipoPago ?? '').trim();
    if (id) byId.set(id, { ...t });
  }
  for (const t of api || []) {
    if (esTipoPagoEnLineaItem(t)) continue;
    const id = String(t.idTipoPago ?? t.codigo ?? t.id ?? t._id ?? '').trim();
    if (!id) continue;
    const prev = byId.get(id);
    byId.set(id, prev ? { ...prev, ...t, idTipoPago: id } : { ...t, idTipoPago: id });
  }
  return [...byId.values()].sort((a, b) =>
    String(a.idTipoPago).localeCompare(String(b.idTipoPago), undefined, { numeric: true }),
  );
}

export async function fetchTiposPago(): Promise<CatalogoItem[]> {
  try {
    const rows = await listarCatalogo('catTipoPago');
    return mergeTiposPago(rows);
  } catch {
    return [...TIPOS_PAGO_DEF];
  }
}

export async function fetchTiposCapacitacion(): Promise<CatalogoItem[]> {
  try {
    return await listarCatalogo('catTipoCapacitacion');
  } catch {
    return [];
  }
}

export async function fetchTiposServicio(): Promise<CatalogoItem[]> {
  try {
    return await listarCatalogo('catTipServicio');
  } catch {
    return [];
  }
}

export async function fetchCuentasBancarias(): Promise<CatalogoItem[]> {
  try {
    return await listarCatalogo('cuentasBancarias');
  } catch {
    return [];
  }
}
