import { PORTAL_PAGINA_RUTAS, PortalPaginaKey, PortalSiteConfig } from '../constants/portal-site-defaults';
import {
  finstruvialServicioRouteSegmentFrom,
  FINSTRUVIAL_SERVICIO_SLUGS,
  FinstruvialServicioSlug,
} from '../constants/finstruvial-servicios.constants';
import type { PortalFinstruvialServiciosConfig } from '../constants/finstruvial-servicio-landing.types';

/** Segmentos reservados del portal (auth, API, etc.) — no usar como slug de página. */
export const PORTAL_RESERVED_SLUGS = new Set([
  'login',
  'registro',
  'api',
  'uploads',
  'documents',
  'images',
  'apk',
]);

/** Normaliza un segmento de URL (sin barras). */
export function normalizePortalPageSlug(raw: string): string {
  return String(raw ?? '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function portalPageDefaultRoute(key: PortalPaginaKey): string {
  return PORTAL_PAGINA_RUTAS[key];
}

export function portalPageSlugSegment(key: PortalPaginaKey, ruta?: string): string {
  if (key === 'home') return '';
  const seg = normalizePortalPageSlug(String(ruta ?? '').replace(/^\//, ''));
  if (seg) return seg;
  return normalizePortalPageSlug(portalPageDefaultRoute(key).replace(/^\//, ''));
}

/** Ruta pública absoluta (con / inicial) de una página del constructor. */
export function portalPageRoute(site: Partial<PortalSiteConfig> | null | undefined, key: PortalPaginaKey): string {
  if (key === 'home') return '/';
  const custom = site?.paginas?.[key]?.ruta?.trim();
  if (custom) {
    const seg = normalizePortalPageSlug(custom.replace(/^\//, ''));
    if (seg) return `/${seg}`;
  }
  return portalPageDefaultRoute(key);
}

export function portalPageRouteFromSlug(key: PortalPaginaKey, slug: string): string {
  if (key === 'home') return '/';
  const normalized = normalizePortalPageSlug(slug);
  const fb = portalPageDefaultRoute(key).replace(/^\//, '');
  return `/${normalized || normalizePortalPageSlug(fb)}`;
}

export function finstruvialServiciosHubRoute(site?: Partial<PortalSiteConfig> | null): string {
  return portalPageRoute(site, 'servicios');
}

export function finstruvialServiciosHubPrefix(site?: Partial<PortalSiteConfig> | null): string {
  return finstruvialServiciosHubRoute(site).replace(/\/+$/, '') || '/servicios';
}

export function finstruvialServicioPublicRouteWithSite(
  slug: FinstruvialServicioSlug,
  routeSegment: string | undefined,
  site?: Partial<PortalSiteConfig> | null,
): string {
  const hub = finstruvialServiciosHubPrefix(site);
  const seg = finstruvialServicioRouteSegmentFrom(slug, routeSegment);
  return `${hub}/${seg}`;
}

export interface PortalSlugCollision {
  segment: string;
  owner: string;
}

/** Detecta slugs duplicados entre páginas del menú y líneas FINSTRUVIAL activas. */
export function portalSlugCollisions(
  site: Partial<PortalSiteConfig> | null | undefined,
  finstruvial?: PortalFinstruvialServiciosConfig | null,
): PortalSlugCollision[] {
  const index = new Map<string, string>();
  const dupes: PortalSlugCollision[] = [];

  const register = (segment: string, owner: string) => {
    const seg = normalizePortalPageSlug(segment);
    if (!seg || seg === '') return;
    const prev = index.get(seg);
    if (prev && prev !== owner) dupes.push({ segment: seg, owner });
    else index.set(seg, owner);
  };

  for (const key of Object.keys(PORTAL_PAGINA_RUTAS) as PortalPaginaKey[]) {
    if (key === 'home') continue;
    register(portalPageSlugSegment(key, site?.paginas?.[key]?.ruta), key);
  }

  if (finstruvial) {
    for (const slug of FINSTRUVIAL_SERVICIO_SLUGS) {
      const p = finstruvial.paginas?.[slug];
      if (p?.activa === false) continue;
      register(
        finstruvialServicioRouteSegmentFrom(slug, p?.routeSegment),
        `servicio:${slug}`,
      );
    }
  }

  return dupes;
}

export function portalPageSlugReserved(segment: string): boolean {
  const seg = normalizePortalPageSlug(segment);
  return !seg || PORTAL_RESERVED_SLUGS.has(seg);
}

function normalizePortalPath(path: string): string {
  const raw = String(path ?? '').trim();
  if (!raw) return '/';
  const withoutQuery = raw.split('?')[0].split('#')[0];
  const withSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  return withSlash.replace(/\/+$/, '') || '/';
}

export function buildPortalRouteIndex(
  site?: Partial<PortalSiteConfig> | null,
): Map<string, PortalPaginaKey> {
  const index = new Map<string, PortalPaginaKey>();
  for (const key of Object.keys(PORTAL_PAGINA_RUTAS) as PortalPaginaKey[]) {
    const ruta = portalPageRoute(site, key);
    const base = normalizePortalPath(ruta);
    index.set(base, key);
    const defaultBase = normalizePortalPath(portalPageDefaultRoute(key));
    if (defaultBase !== base) index.set(defaultBase, key);
  }
  return index;
}

/** URL del botón del bloque de curso en el inicio: vacío → slug ERP; con valor → la URL del editor tal cual. */
export function homeCursoCtaUrl(
  site: Partial<PortalSiteConfig> | null | undefined,
  paginaKey: PortalPaginaKey,
  ctaUrl?: string | null,
): string {
  const custom = String(ctaUrl ?? '').trim();
  if (!custom) return portalPageRoute(site, paginaKey);
  if (/^https?:\/\//i.test(custom)) return custom;
  return normalizePortalPath(custom);
}

export function mergeHomeCursoCtaUrl(
  src: { ctaUrl?: string | null } | null | undefined,
  fallback: string,
): string {
  if (src && Object.prototype.hasOwnProperty.call(src, 'ctaUrl')) {
    return String(src.ctaUrl ?? '').trim();
  }
  return fallback;
}
