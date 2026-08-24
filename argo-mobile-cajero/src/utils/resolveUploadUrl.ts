import { getApiBaseUrl } from '../config/apiBase';

/** Convierte ruta relativa de uploads del backend en URL absoluta para Image. */
export function resolveUploadUrl(rel?: string | null, apiBase?: string): string {
  const raw = String(rel ?? '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;

  const serverBase = (apiBase || getApiBaseUrl()).replace(/\/api\/?$/i, '');
  if (raw.startsWith('/')) return `${serverBase}${raw}`;
  return `${serverBase}/uploads/${raw.replace(/^uploads\//, '')}`;
}
