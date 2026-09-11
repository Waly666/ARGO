import { PortalLandingConfig } from '../constants/portal-landing-defaults';
import {
  PORTAL_PAGINA_RUTAS,
  PortalPaginaKey,
  PortalSiteConfig,
} from '../constants/portal-site-defaults';
import {
  finstruvialServicioDefaultRouteSegment,
  finstruvialServicioRouteSegmentFrom,
  FinstruvialServicioSlug,
} from '../constants/finstruvial-servicios.constants';
import { portalPageDefaultRoute, portalPageRoute } from './portal-page-route.util';

export interface PortalSlugChange {
  paginaKey: PortalPaginaKey;
  from: string;
  to: string;
}

export interface PortalFinstruvialLineSlugChange {
  lineaSlug: FinstruvialServicioSlug;
  hubPrefix: string;
  fromSegment: string;
  toSegment: string;
}

export interface PortalSlugPropagateDetail {
  from: string;
  to: string;
  count: number;
}

export interface PortalSlugPropagateResult {
  landing: PortalLandingConfig;
  acercaDeHtml?: string;
  totalReplacements: number;
  details: PortalSlugPropagateDetail[];
}

interface PathReplacementRule {
  from: string;
  to: string;
}

const PORTAL_PAGINA_KEYS = Object.keys(PORTAL_PAGINA_RUTAS) as PortalPaginaKey[];

/** Normaliza ruta interna del portal (/foo, sin query; home = /). */
export function normalizePortalPath(path: string): string {
  const raw = String(path ?? '').trim();
  if (!raw || raw === '/') return '/';
  const base = raw.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return base.startsWith('/') ? base || '/' : `/${base}`;
}

export function detectPortalSlugChanges(
  beforeSite: Partial<PortalSiteConfig> | null | undefined,
  afterSite: Partial<PortalSiteConfig> | null | undefined,
): PortalSlugChange[] {
  const changes: PortalSlugChange[] = [];
  for (const key of PORTAL_PAGINA_KEYS) {
    if (key === 'home') continue;
    const from = normalizePortalPath(portalPageRoute(beforeSite, key));
    const to = normalizePortalPath(portalPageRoute(afterSite, key));
    if (from !== to) {
      changes.push({ paginaKey: key, from, to });
    }
  }
  return changes;
}

function isExternalPortalUrl(raw: string): boolean {
  const t = raw.trim();
  return (
    !t ||
    /^https?:\/\//i.test(t) ||
    /^mailto:/i.test(t) ||
    /^tel:/i.test(t) ||
    /^javascript:/i.test(t) ||
    t.startsWith('//')
  );
}

/** Sustituye una URL interna del portal si coincide con alguna regla (ruta exacta o prefijo /foo/…). */
export function rewritePortalInternalUrl(
  raw: string,
  rules: PathReplacementRule[],
): { value: string; changed: boolean; rule?: PathReplacementRule } {
  const trimmed = String(raw ?? '');
  if (!trimmed.trim() || isExternalPortalUrl(trimmed)) {
    return { value: raw, changed: false };
  }

  let pathPart = trimmed.trim();
  let suffix = '';
  const hashIdx = pathPart.indexOf('#');
  if (hashIdx >= 0) {
    suffix = pathPart.slice(hashIdx);
    pathPart = pathPart.slice(0, hashIdx);
  }
  const queryIdx = pathPart.indexOf('?');
  if (queryIdx >= 0) {
    suffix = pathPart.slice(queryIdx) + suffix;
    pathPart = pathPart.slice(0, queryIdx);
  }

  const pathNorm = normalizePortalPath(pathPart);
  for (const rule of rules) {
    const from = normalizePortalPath(rule.from);
    const to = normalizePortalPath(rule.to);
    if (!from || from === to) continue;
    if (pathNorm === from) {
      return { value: `${to}${suffix}`, changed: true, rule };
    }
    if (from !== '/' && pathNorm.startsWith(`${from}/`)) {
      return { value: `${to}${pathNorm.slice(from.length)}${suffix}`, changed: true, rule };
    }
  }
  return { value: raw, changed: false };
}

function buildReplacementRules(changes: PortalSlugChange[]): PathReplacementRule[] {
  const map = new Map<string, string>();
  const add = (from: string, to: string) => {
    const f = normalizePortalPath(from);
    const t = normalizePortalPath(to);
    if (!f || f === t || map.has(f)) return;
    map.set(f, t);
  };

  for (const change of changes) {
    add(change.from, change.to);
    const legacy = normalizePortalPath(portalPageDefaultRoute(change.paginaKey));
    if (legacy !== change.from && legacy !== change.to) {
      add(legacy, change.to);
    }
  }

  return [...map.entries()]
    .map(([from, to]) => ({ from, to }))
    .sort((a, b) => b.from.length - a.from.length);
}

function buildFinstruvialLineRules(change: PortalFinstruvialLineSlugChange): PathReplacementRule[] {
  const hub = normalizePortalPath(change.hubPrefix);
  const fromSeg = finstruvialServicioRouteSegmentFrom(change.lineaSlug, change.fromSegment);
  const toSeg = finstruvialServicioRouteSegmentFrom(change.lineaSlug, change.toSegment);
  const map = new Map<string, string>();
  const add = (from: string, to: string) => {
    const f = normalizePortalPath(from);
    const t = normalizePortalPath(to);
    if (!f || f === t) return;
    map.set(f, t);
  };

  add(`${hub}/${fromSeg}`, `${hub}/${toSeg}`);
  const legacySeg = finstruvialServicioDefaultRouteSegment(change.lineaSlug);
  if (legacySeg !== fromSeg) add(`${hub}/${legacySeg}`, `${hub}/${toSeg}`);

  const defaultHub = '/servicios';
  if (hub !== defaultHub) {
    add(`${defaultHub}/${fromSeg}`, `${hub}/${toSeg}`);
    if (legacySeg !== fromSeg) add(`${defaultHub}/${legacySeg}`, `${hub}/${toSeg}`);
  }

  return [...map.entries()]
    .map(([from, to]) => ({ from, to }))
    .sort((a, b) => b.from.length - a.from.length);
}

class PropagationStats {
  private counts = new Map<string, PortalSlugPropagateDetail>();

  record(rule: PathReplacementRule | undefined): void {
    if (!rule) return;
    const id = `${rule.from}→${rule.to}`;
    const prev = this.counts.get(id);
    if (prev) prev.count += 1;
    else this.counts.set(id, { from: rule.from, to: rule.to, count: 1 });
  }

  details(): PortalSlugPropagateDetail[] {
    return [...this.counts.values()];
  }

  total(): number {
    return this.details().reduce((n, d) => n + d.count, 0);
  }
}

function replaceStringValue(raw: string, rules: PathReplacementRule[], stats: PropagationStats): string {
  const { value, changed, rule } = rewritePortalInternalUrl(raw, rules);
  if (changed) stats.record(rule);
  return value;
}

function deepReplacePortalUrls(node: unknown, rules: PathReplacementRule[], stats: PropagationStats): void {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (typeof node[i] === 'string') {
        node[i] = replaceStringValue(node[i], rules, stats);
      } else {
        deepReplacePortalUrls(node[i], rules, stats);
      }
    }
    return;
  }
  if (typeof node === 'object') {
    for (const key of Object.keys(node as Record<string, unknown>)) {
      const val = (node as Record<string, unknown>)[key];
      if (typeof val === 'string') {
        (node as Record<string, unknown>)[key] = replaceStringValue(val, rules, stats);
      } else {
        deepReplacePortalUrls(val, rules, stats);
      }
    }
  }
}

function rewriteHtmlInternalLinks(
  html: string,
  rules: PathReplacementRule[],
  stats: PropagationStats,
): string {
  let out = html;
  for (const rule of rules) {
    if (!rule.from || rule.from === rule.to) continue;
    for (const attr of ['href', 'routerLink']) {
      for (const q of ['"', "'"]) {
        const fromEsc = rule.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(${attr}\\s*=\\s*${q})${fromEsc}(?=${q})`, 'gi');
        out = out.replace(re, (_m, prefix: string) => {
          stats.record(rule);
          return `${prefix}${rule.to}`;
        });
      }
    }
  }
  return out;
}

function runPropagation(
  landing: PortalLandingConfig,
  acercaDeHtml: string | null | undefined,
  rules: PathReplacementRule[],
): PortalSlugPropagateResult {
  const stats = new PropagationStats();
  if (rules.length) {
    deepReplacePortalUrls(landing as unknown, rules, stats);
  }

  let htmlOut = acercaDeHtml ?? undefined;
  if (htmlOut && rules.length) {
    htmlOut = rewriteHtmlInternalLinks(htmlOut, rules, stats);
  }

  const details = stats.details();
  return {
    landing,
    acercaDeHtml: htmlOut,
    totalReplacements: stats.total(),
    details,
  };
}

export function propagatePortalSlugChanges(opts: {
  landing: PortalLandingConfig;
  acercaDeHtml?: string | null;
  changes: PortalSlugChange[];
}): PortalSlugPropagateResult {
  const rules = buildReplacementRules(opts.changes);
  return runPropagation(opts.landing, opts.acercaDeHtml, rules);
}

export function propagateFinstruvialLineSlugChange(opts: {
  landing: PortalLandingConfig;
  acercaDeHtml?: string | null;
  change: PortalFinstruvialLineSlugChange;
}): PortalSlugPropagateResult {
  return runPropagation(opts.landing, opts.acercaDeHtml, buildFinstruvialLineRules(opts.change));
}

export function formatPortalSlugPropagateMessage(result: PortalSlugPropagateResult): string | null {
  if (result.totalReplacements <= 0) return null;
  const parts = result.details
    .slice(0, 4)
    .map((d) => `${d.from} → ${d.to} (${d.count})`)
    .join('; ');
  const extra = result.details.length > 4 ? `; +${result.details.length - 4} rutas más` : '';
  return `Se actualizaron ${result.totalReplacements} enlaces internos: ${parts}${extra}.`;
}
