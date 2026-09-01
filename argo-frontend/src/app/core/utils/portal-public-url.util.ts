/** URL pública del portal aula (no el ERP app.*). */

function normalizarBase(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\/+$/, '');
}

function conBarraFinal(base: string): string {
  const b = normalizarBase(base);
  return b ? `${b}/` : '';
}

/** Convierte host del ERP (app.dominio) al del portal (dominio). */
function portalHostDesdeErp(hostname: string): string | null {
  const host = String(hostname || '').trim().toLowerCase();
  if (!host.startsWith('app.')) return null;
  return host.slice(4);
}

/**
 * Resuelve la URL del sitio público para vistas previa, SEO y enlaces «Abrir portal».
 * Prioridad: valor del API → derivar desde app.* → dev local :4202 → origin actual.
 */
export function resolvePortalPublicUrl(opts?: {
  configured?: string | null;
  erpOrigin?: string;
}): string {
  const configured = conBarraFinal(opts?.configured || '');
  if (configured) return configured;

  const origin =
    opts?.erpOrigin ||
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    'http://localhost:4202';

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return 'http://localhost:4202/';
  }

  const { hostname, protocol } = url;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:4202/`;
  }

  const portalHost = portalHostDesdeErp(hostname);
  if (portalHost) {
    return `${protocol}//${portalHost}/`;
  }

  return conBarraFinal(origin) || 'http://localhost:4202/';
}

export function portalPublicOrigin(configured?: string | null, erpOrigin?: string): string {
  try {
    return new URL(resolvePortalPublicUrl({ configured, erpOrigin })).origin;
  } catch {
    return 'https://ejemplo.edu.co';
  }
}
