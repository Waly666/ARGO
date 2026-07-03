import Constants from 'expo-constants';

export const SERVIDOR_API_STORAGE_KEY = 'argo_jor_servidor_api';

function trimSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

function isLanOrLocalhost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '10.0.2.2') return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

function applyDefaultBackendPort(u: string): string {
  try {
    const url = new URL(u);
    if (url.protocol !== 'http:') return u;
    if (url.port !== '') return u;
    if (!isLanOrLocalhost(url.hostname)) return u;
    url.port = '3000';
    return trimSlash(`${url.protocol}//${url.host}${url.pathname === '/' ? '' : url.pathname}`);
  } catch {
    return u;
  }
}

let runtimeApiBase: string | null = null;

export const DEFAULT_API_BASE = 'https://app.finstruvial.edu.co/api';

/** Servidores antiguos de desarrollo / otro dominio: se sustituyen por el dominio de producción. */
export function isLegacyDefaultServer(apiBase: string): boolean {
  try {
    const u = new URL(normalizeApiBaseUrl(apiBase));
    const h = u.hostname.toLowerCase();
    return (
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '10.0.2.2' ||
      h === 'infravial.cloud' ||
      h.endsWith('.local')
    );
  } catch {
    return false;
  }
}

export function normalizeApiBaseUrl(input: string): string {
  let u = input.trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) {
    // Dominios públicos → HTTPS; LAN/local → HTTP (puerto 3000 si aplica).
    const host = u.split('/')[0].split(':')[0];
    u = `${isLanOrLocalhost(host) ? 'http' : 'https'}://${u}`;
  }
  u = trimSlash(u);
  u = applyDefaultBackendPort(u);
  u = trimSlash(u);
  if (!/\/api$/i.test(u)) u = `${u}/api`;
  u = u.replace(/(\/api)+$/i, '/api');
  return trimSlash(u);
}

export function setRuntimeApiBase(apiBase: string | null): void {
  if (!apiBase?.trim()) {
    runtimeApiBase = null;
    return;
  }
  runtimeApiBase = normalizeApiBaseUrl(apiBase) || null;
}

export function getApiBaseUrl(): string {
  if (runtimeApiBase) return runtimeApiBase;
  const fromExtra = Constants.expoConfig?.extra?.apiBaseUrl;
  if (typeof fromExtra === 'string' && fromExtra.trim()) {
    return normalizeApiBaseUrl(fromExtra);
  }
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv?.trim()) return normalizeApiBaseUrl(fromEnv);
  return DEFAULT_API_BASE;
}

export function getUploadsBaseUrl(): string {
  return getApiBaseUrl().replace(/\/api\/?$/i, '/uploads');
}
