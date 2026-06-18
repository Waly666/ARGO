import { getUploadsBaseUrl } from '../config/apiBase';

function extractUploadsPath(raw: string): string | null {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) {
    const m = raw.match(/\/uploads\/(.+)$/i);
    return m ? m[1] : null;
  }
  if (raw.startsWith('/uploads/')) return raw.slice('/uploads/'.length);
  if (raw.startsWith('uploads/')) return raw.slice('uploads/'.length);
  return raw.replace(/^\/+/, '') || null;
}

/** URL absoluta para imágenes del portal y portadas de cursos. */
export function resolveUploadUrl(raw?: string | null): string | null {
  const r = String(raw || '').trim();
  if (!r) return null;
  if (/^https?:\/\//i.test(r)) return r;
  const path = extractUploadsPath(r);
  if (!path) return null;
  const base = getUploadsBaseUrl().replace(/\/+$/, '');
  return `${base}/${path}`.replace(/([^:]\/)\/+/g, '$1');
}

/** URL absoluta del player HTML del curso virtual. */
export function resolvePlayerUrl(raw?: string | null): string | null {
  const r = String(raw || '').trim();
  if (!r) return null;
  if (/^https?:\/\//i.test(r)) return r;
  const path = extractUploadsPath(r);
  if (path) {
    const base = getUploadsBaseUrl().replace(/\/+$/, '');
    return `${base}/${path}`;
  }
  if (r.startsWith('/')) {
    const origin = getUploadsBaseUrl().replace(/\/uploads\/?$/i, '');
    return `${origin}${r}`;
  }
  return r;
}
