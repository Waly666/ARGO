import { environment } from '../../environments/environment';

/** Convierte ruta de uploads del API a URL absoluta del portal (8085). */
export function resolveUploadUrl(raw?: string | null): string | null {
  const r = String(raw || '').trim();
  if (!r) return null;

  const uploadsBase = environment.uploadsUrl.replace(/\/+$/, '');

  if (/^https?:\/\//i.test(r)) {
    const m = r.match(/\/uploads\/(.+)$/i);
    return m ? `${uploadsBase}/${m[1]}` : r;
  }

  if (r.startsWith('/uploads/')) {
    return `${uploadsBase}${r.slice('/uploads'.length)}`;
  }

  return `${uploadsBase}/${r.replace(/^\/+/, '')}`;
}
