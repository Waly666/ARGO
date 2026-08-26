import { getApiBaseUrl } from '../config/apiBase';

/** URL absoluta para archivos en /uploads del backend. */
export function uploadsUrl(rel?: string | null): string {
  const r = String(rel || '').trim();
  if (!r) return '';
  if (/^https?:\/\//i.test(r)) return r;
  const base = getApiBaseUrl().replace(/\/api\/?$/i, '');
  return `${base}/uploads/${r.replace(/^\/+/, '')}`;
}
