import { apiFetch } from './client';
import type { CatalogoItem } from './domain';

export async function listarCatalogo(name: string): Promise<CatalogoItem[]> {
  return apiFetch<CatalogoItem[]>(`/catalogos/${encodeURIComponent(name)}`);
}

export const TIPOS_PAGO_DEF: CatalogoItem[] = [
  { idTipoPago: '1', codigo: 'EF', descripcion: 'Efectivo' },
  { idTipoPago: '2', codigo: 'TR', descripcion: 'Transferencia' },
  { idTipoPago: '3', codigo: 'TC', descripcion: 'Tarjeta crédito' },
  { idTipoPago: '4', codigo: 'TD', descripcion: 'Tarjeta débito' },
  { idTipoPago: '5', codigo: 'CH', descripcion: 'Cheque' },
  { idTipoPago: '6', codigo: 'NE', descripcion: 'Nequi / Daviplata' },
];

export async function fetchTiposPago(): Promise<CatalogoItem[]> {
  try {
    const rows = await listarCatalogo('catTipoPago');
    return rows.length ? rows : TIPOS_PAGO_DEF;
  } catch {
    return TIPOS_PAGO_DEF;
  }
}

export async function fetchCuentasBancarias(): Promise<CatalogoItem[]> {
  try {
    return await listarCatalogo('cuentasBancarias');
  } catch {
    return [];
  }
}
