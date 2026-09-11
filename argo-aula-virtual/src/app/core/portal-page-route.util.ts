import type { PortalConfig } from './models';
import {
  finstruvialServicioRouteSegmentFrom,
  FINSTRUVIAL_SERVICIO_SLUGS,
  FinstruvialServicioSlug,
} from './constants/finstruvial-servicios.constants';
import type { PortalPaginaKey } from './portal-site';

const PORTAL_PAGINA_RUTAS: Record<PortalPaginaKey, string> = {
  home: '/',
  tienda: '/tienda',
  cursos: '/cursos',
  aula: '/aula',
  fundacion: '/fundacion',
  acerca: '/acerca',
  consultaCertificados: '/consulta-certificados',
  cursosConduccion: '/cursos-conduccion',
  examenTeorico: '/examen-teorico',
  mercanciasPeligrosas: '/mercancias-peligrosas',
  trabajoEnAlturas: '/trabajo-en-alturas',
  manejoDefensivo: '/curso-manejo-defensivo',
  primerosAuxilios: '/curso-primeros-auxilios',
  servicios: '/servicios',
  jornadasCapacitacion: '/jornadas-capacitacion',
  evaluacionJornadas: '/evaluacion-jornadas',
  pqr: '/pqr',
  blog: '/blog',
  galeria: '/galeria',
};

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

/** URL del botón de un bloque de curso en el inicio: respeta slug ERP si ctaUrl está vacío o es la ruta antigua. */
export function homeCursoCtaUrl(
  config: PortalConfig | null | undefined,
  paginaKey: PortalPaginaKey,
  ctaUrl?: string | null,
): string {
  const custom = ctaUrl?.trim();
  const canonical = portalPageRoute(config, paginaKey);
  const legacy = portalPageDefaultRoute(paginaKey);
  if (!custom || custom === legacy) return canonical;
  return custom;
}

export function portalPageRoute(config: PortalConfig | null | undefined, key: PortalPaginaKey): string {
  if (key === 'home') return '/';
  const custom = config?.site?.paginas?.[key]?.ruta?.trim();
  if (custom) {
    const seg = normalizePortalPageSlug(custom.replace(/^\//, ''));
    if (seg) return `/${seg}`;
  }
  return portalPageDefaultRoute(key);
}

export function finstruvialServiciosHubRoute(config: PortalConfig | null | undefined): string {
  return portalPageRoute(config, 'servicios');
}

export function finstruvialServiciosHubPrefix(config: PortalConfig | null | undefined): string {
  return finstruvialServiciosHubRoute(config).replace(/\/+$/, '') || '/servicios';
}

export function finstruvialServicioPublicRouteWithConfig(
  slug: FinstruvialServicioSlug,
  routeSegment: string | undefined,
  config: PortalConfig | null | undefined,
): string {
  const hub = finstruvialServiciosHubPrefix(config);
  const seg = finstruvialServicioRouteSegmentFrom(slug, routeSegment);
  return `${hub}/${seg}`;
}

export function buildPortalRouteIndex(config: PortalConfig | null | undefined): Map<string, PortalPaginaKey> {
  const index = new Map<string, PortalPaginaKey>();
  for (const key of Object.keys(PORTAL_PAGINA_RUTAS) as PortalPaginaKey[]) {
    const ruta = portalPageRoute(config, key);
    const base = ruta.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
    index.set(base, key);
    const defaultBase = portalPageDefaultRoute(key).replace(/\/$/, '') || '/';
    if (defaultBase !== base) index.set(defaultBase, key);
  }
  return index;
}

export function clavePaginaPorRutaConConfig(
  path: string,
  config: PortalConfig | null | undefined,
): PortalPaginaKey | null {
  const clean = path.split('?')[0].split('#')[0];
  const base = clean.replace(/\/:[^/]+.*$/, '').replace(/\/$/, '') || '/';
  if (base === '/' || base === '') return 'home';
  if (base.startsWith('/cursos/')) return 'cursos';

  const hub = finstruvialServiciosHubRoute(config).replace(/\/$/, '') || '/servicios';
  if (base === hub || base.startsWith(`${hub}/`)) return 'servicios';

  const legacyHub = '/servicios';
  if (hub !== legacyHub && (base === legacyHub || base.startsWith(`${legacyHub}/`))) {
    return 'servicios';
  }

  if (base === '/blog' || base.startsWith('/blog/')) return 'blog';
  if (base === '/primeros-auxilios') return 'primerosAuxilios';

  const index = buildPortalRouteIndex(config);
  const hit = index.get(base);
  if (hit) return hit;

  for (const [ruta, key] of Object.entries(PORTAL_PAGINA_RUTAS)) {
    if (ruta !== '/' && base === ruta) return key as PortalPaginaKey;
  }
  return null;
}

export function finstruvialHubSegmentFromConfig(config: PortalConfig | null | undefined): string {
  return normalizePortalPageSlug(finstruvialServiciosHubRoute(config).replace(/^\//, '')) || 'servicios';
}

export function finstruvialLineRouteSegments(config: PortalConfig | null | undefined): string[] {
  const paginas = config?.landing?.finstruvialServicios?.paginas;
  if (!paginas) return [];
  return FINSTRUVIAL_SERVICIO_SLUGS.filter((slug) => paginas[slug]?.activa !== false).map((slug) =>
    finstruvialServicioRouteSegmentFrom(slug, paginas[slug]?.routeSegment),
  );
}
