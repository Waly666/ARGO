import { PortalConfig } from './models';
import { buildPortalThemeCssVars, resolvePortalHeroEstilo } from './portal-theme-css.util';

const CACHE_VERSION = 1;

export interface PortalThemeCachePayload {
  v: number;
  vars: Record<string, string>;
  heroEstilo?: string;
  nombreCea?: string;
}

export function portalThemeCacheKey(hostname = ''): string {
  const host = (hostname || (typeof location !== 'undefined' ? location.hostname : '')).trim();
  return `argo.portal.theme.${host || 'default'}`;
}

export function readPortalThemeCache(hostname?: string): PortalThemeCachePayload | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(portalThemeCacheKey(hostname));
    if (!raw) return null;
    const data = JSON.parse(raw) as PortalThemeCachePayload;
    if (!data || data.v !== CACHE_VERSION || !data.vars) return null;
    return data;
  } catch {
    return null;
  }
}

export function applyPortalThemeCache(data: PortalThemeCachePayload | null, root?: HTMLElement): void {
  if (!data?.vars || typeof document === 'undefined') return;
  const el = root ?? document.documentElement;
  for (const [key, val] of Object.entries(data.vars)) {
    if (val) el.style.setProperty(key, val);
  }
  if (data.heroEstilo) el.dataset['heroEstilo'] = data.heroEstilo;
}

export function persistPortalThemeCache(config: PortalConfig | null): void {
  if (typeof localStorage === 'undefined' || !config?.site?.tema) return;
  const tema = config.site.tema;
  const payload: PortalThemeCachePayload = {
    v: CACHE_VERSION,
    vars: buildPortalThemeCssVars(tema),
    heroEstilo: resolvePortalHeroEstilo(tema),
    nombreCea: config.nombreCea?.trim() || undefined,
  };
  try {
    localStorage.setItem(portalThemeCacheKey(), JSON.stringify(payload));
  } catch {
    /* quota / modo privado */
  }
}

export function markPortalBooting(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.add('portal-booting');
  document.documentElement.classList.remove('portal-ready');
}

export function markPortalReady(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('portal-booting');
  document.documentElement.classList.add('portal-ready');
}
