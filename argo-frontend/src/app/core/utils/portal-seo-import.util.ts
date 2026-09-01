import { PortalLandingConfig } from '../constants/portal-landing-defaults';
import { PortalSiteConfig } from '../constants/portal-site-defaults';
import {
  mergePortalSeoPages,
  PortalSeoPageConfig,
  PortalSeoPageKey,
  PORTAL_SEO_PAGE_KEYS,
} from '../constants/portal-seo-pages';

export interface PortalSeoImportPack {
  site?: {
    seo?: Partial<Record<string, Partial<PortalSeoPageConfig>>>;
  };
  landing?: {
    metaDescription?: string;
    metaKeywords?: string;
  };
}

export type PortalSeoImportPreview = {
  ok: true;
  pageKeys: PortalSeoPageKey[];
  skippedKeys: string[];
  hasLanding: boolean;
};

export type PortalSeoImportApplyResult = PortalSeoImportPreview & {
  landingUpdated: boolean;
};

export type PortalSeoImportError = { ok: false; error: string };

export type PortalSeoImportParseResult =
  | { ok: true; pack: PortalSeoImportPack }
  | PortalSeoImportError;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizePageConfig(raw: unknown): PortalSeoPageConfig | null {
  if (!isRecord(raw)) return null;
  const titulo = String(raw['titulo'] ?? '').trim();
  const descripcion = String(raw['descripcion'] ?? '').trim();
  const keywords = String(raw['keywords'] ?? '').trim();
  if (!titulo && !descripcion && !keywords) return null;
  return { titulo, descripcion, keywords };
}

function isPortalSeoPageKey(key: string): key is PortalSeoPageKey {
  return (PORTAL_SEO_PAGE_KEYS as string[]).includes(key);
}

/** Acepta JSON de ARGO SEO Studio (`exportErp`) o `site.seo` directo. */
export function parsePortalSeoImportJson(raw: string): PortalSeoImportParseResult {
  const text = raw.trim();
  if (!text) return { ok: false, error: 'Pegue el JSON exportado desde ARGO SEO Studio.' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El texto no es un JSON válido. Revise comillas y llaves.' };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: 'El JSON debe ser un objeto con site.seo y/o landing.' };
  }

  const root = isRecord(parsed['exportErp']) ? (parsed['exportErp'] as Record<string, unknown>) : parsed;

  const pack: PortalSeoImportPack = {};

  if (isRecord(root['site']) && isRecord(root['site']['seo'])) {
    pack.site = { seo: root['site']['seo'] as PortalSeoImportPack['site'] };
  } else if (isRecord(root['seo'])) {
    pack.site = { seo: root['seo'] as PortalSeoImportPack['site'] };
  }

  if (isRecord(root['landing'])) {
    pack.landing = {
      metaDescription: String(root['landing']['metaDescription'] ?? '').trim(),
      metaKeywords: String(root['landing']['metaKeywords'] ?? '').trim(),
    };
  }

  if (!pack.site?.seo && !pack.landing?.metaDescription && !pack.landing?.metaKeywords) {
    return {
      ok: false,
      error: 'No se encontró site.seo ni landing. Use «Copiar JSON ERP» en SEO Studio.',
    };
  }

  return { ok: true, pack };
}

export function previewPortalSeoImport(pack: PortalSeoImportPack): PortalSeoImportPreview | PortalSeoImportError {
  const pageKeys: PortalSeoPageKey[] = [];
  const skippedKeys: string[] = [];

  const seo = pack.site?.seo;
  if (seo && typeof seo === 'object') {
    for (const [key, value] of Object.entries(seo)) {
      if (!isPortalSeoPageKey(key)) {
        skippedKeys.push(key);
        continue;
      }
      if (normalizePageConfig(value)) pageKeys.push(key);
    }
  }

  const hasLanding = !!(pack.landing?.metaDescription?.trim() || pack.landing?.metaKeywords?.trim());

  if (pageKeys.length === 0 && !hasLanding) {
    return { ok: false, error: 'El pack no contiene páginas con título, descripción o keywords.' };
  }

  return { ok: true, pageKeys, skippedKeys, hasLanding };
}

/** Fusiona el pack en site.seo y landing (mutación in-place). */
export function applyPortalSeoImportPack(
  pack: PortalSeoImportPack,
  site: PortalSiteConfig,
  landing: PortalLandingConfig | null,
): PortalSeoImportApplyResult | PortalSeoImportError {
  const preview = previewPortalSeoImport(pack);
  if (!preview.ok) return preview;

  const current = mergePortalSeoPages(site.seo);
  const seo = pack.site?.seo;

  if (seo && typeof seo === 'object') {
    for (const key of preview.pageKeys) {
      const next = normalizePageConfig(seo[key]);
      if (next) current[key] = next;
    }
  }

  site.seo = current;

  let landingUpdated = false;
  const home = current.home;

  if (pack.landing?.metaDescription?.trim() && landing) {
    const desc = pack.landing.metaDescription.trim();
    landing.metaDescription = desc;
    if (!home.descripcion) home.descripcion = desc;
    landingUpdated = true;
  }

  if (pack.landing?.metaKeywords?.trim() && landing) {
    const kw = pack.landing.metaKeywords.trim();
    landing.metaKeywords = kw;
    if (!home.keywords) home.keywords = kw;
    landingUpdated = true;
  }

  if (home.descripcion && landing) {
    landing.metaDescription = home.descripcion;
    landing.metaKeywords = home.keywords;
    landingUpdated = true;
  }

  return { ...preview, landingUpdated };
}
