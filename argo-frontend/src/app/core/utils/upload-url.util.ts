import { environment } from '../../../environments/environment';

/** Ruta relativa /uploads/… para iframe del paquete HTML (mismo patrón que el portal). */
export function resolveUploadsPath(raw?: string | null): string | null {
  const uploadsPath = extractUploadsPath(String(raw || '').trim());
  if (!uploadsPath) return null;
  return `/uploads/${uploadsPath}`.replace(/\/+/g, '/');
}

/**
 * URL del iframe del paquete HTML (vista previa ERP).
 * Siempre apunta al backend que sirve /uploads (Express), nunca a :4200 del ERP
 * (si no, Angular devuelve el login de la SPA).
 */
export function resolvePlayerIframeUrl(raw?: string | null): string | null {
  let r = String(raw || '').trim();
  if (!r) return null;
  if (/^https?:\/\//i.test(r)) {
    r = rewriteErpHostToBackendUploads(r);
  }
  return resolveUploadUrl(r);
}

/** URL absoluta del paquete en el host de uploads (p. ej. :3000/uploads/…/index.html). */
export function resolveUploadUrl(raw?: string | null): string | null {
  const r = String(raw || '').trim();
  if (!r) return null;
  const normalized = /^https?:\/\//i.test(r) ? rewriteErpHostToBackendUploads(r) : r;
  const inner = extractUploadsPath(normalized);
  if (!inner) {
    if (/^https?:\/\//i.test(normalized) && normalized.includes('/uploads/')) {
      return normalized;
    }
    return null;
  }
  const base = String(environment.uploadsUrl || '').replace(/\/+$/, '');
  if (!base || base.startsWith('/')) {
    return null;
  }
  return `${base}/${inner}`.replace(/([^:]\/)\/+/g, '$1');
}

/** Si la URL absoluta apunta al ERP (:4200), reescribir al backend de archivos (:3000). */
function rewriteErpHostToBackendUploads(raw: string): string {
  try {
    const u = new URL(raw);
    const idx = u.pathname.indexOf('/uploads/');
    const erpDev = u.port === '4200' || u.port === '4300';
    if (!erpDev || idx < 0) return raw;
    const uploadsBase = String(environment.uploadsUrl || '').replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(uploadsBase)) return raw;
    return `${uploadsBase}${u.pathname.slice(idx + '/uploads'.length)}`;
  } catch {
    return raw;
  }
}

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
