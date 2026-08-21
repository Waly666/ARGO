import { environment } from '../../../environments/environment';

function resolveOne(raw: string): string | null {
  const s = String(raw || '').trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/uploads/')) {
    const base = environment.uploadsUrl.replace(/\/+$/, '');
    return `${base}${s.slice('/uploads'.length)}`;
  }
  if (s.startsWith('uploads/')) {
    const base = environment.uploadsUrl.replace(/\/+$/, '');
    return `${base}/${s.slice('uploads/'.length)}`;
  }
  return s;
}

/** Convierte rutas de subida (/uploads/...) en URL del API; deja /images/ u otras rutas del portal. */
export function resolveUploadAssetUrl(
  url?: string | null,
  absoluta?: string | null,
): string | null {
  return resolveOne(String(absoluta || '')) || resolveOne(String(url || ''));
}
