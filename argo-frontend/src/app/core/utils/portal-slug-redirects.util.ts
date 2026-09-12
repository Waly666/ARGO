import { PortalPaginaKey } from '../constants/portal-site-defaults';
import { normalizePortalPath } from './portal-slug-propagate.util';

export interface PortalSlugRedirect {
  from: string;
  to: string;
}

export function mergeSlugRedirects(
  existing: PortalSlugRedirect[] | null | undefined,
  changes: PortalSlugRedirect[],
): PortalSlugRedirect[] {
  const map = new Map<string, string>();
  for (const item of existing || []) {
    const from = normalizePortalPath(item.from);
    const to = normalizePortalPath(item.to);
    if (!from || !to || from === to || from === '/') continue;
    map.set(from, to);
  }
  for (const change of changes) {
    const from = normalizePortalPath(change.from);
    const to = normalizePortalPath(change.to);
    if (!from || !to || from === to || from === '/') continue;
    for (const [oldFrom, oldTo] of [...map.entries()]) {
      if (oldTo === from) map.set(oldFrom, to);
    }
    map.set(from, to);
  }
  return [...map.entries()]
    .filter(([from, to]) => from !== to)
    .map(([from, to]) => ({ from, to }));
}

export function appendPortalSlugRedirect(
  site: { slugRedirects?: PortalSlugRedirect[]; paginas?: Record<string, { ruta?: string }> },
  change: { from: string; to: string; paginaKey?: PortalPaginaKey },
): void {
  if (!site.slugRedirects) site.slugRedirects = [];
  site.slugRedirects = mergeSlugRedirects(site.slugRedirects, [{ from: change.from, to: change.to }]);
  const canon = new Set(
    Object.values(site.paginas || {})
      .map((p) => normalizePortalPath(p?.ruta || '/'))
      .filter((p) => p && p !== '/'),
  );
  site.slugRedirects = site.slugRedirects.filter((r) => !canon.has(normalizePortalPath(r.from)));
}

export function finstruvialLineToRedirectPaths(
  hubPrefix: string,
  fromSegment: string,
  toSegment: string,
): PortalSlugRedirect[] {
  const hub = normalizePortalPath(hubPrefix || '/servicios');
  const from = `${hub}/${fromSegment.replace(/^\/+|\/+$/g, '')}`;
  const to = `${hub}/${toSegment.replace(/^\/+|\/+$/g, '')}`;
  if (normalizePortalPath(from) === normalizePortalPath(to)) return [];
  return [{ from, to }];
}
