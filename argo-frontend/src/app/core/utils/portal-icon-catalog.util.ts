import { PORTAL_BUILTIN_ICON_CATALOG } from '../constants/portal-icon-builtin.data';
import {
  PortalIconCatalogItem,
  PortalIconKind,
  PortalIconografiaConfig,
  PORTAL_ICONOGRAFIA_DEFAULTS,
} from '../constants/portal-icon-catalog.types';

function trim(value: unknown): string {
  return String(value ?? '').trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function mergePortalIconografia(
  raw?: Partial<PortalIconografiaConfig> | null,
): PortalIconografiaConfig {
  const d = PORTAL_ICONOGRAFIA_DEFAULTS;
  const src = raw && typeof raw === 'object' ? raw : {};
  const hiddenBuiltin = Array.isArray(src.hiddenBuiltin)
    ? src.hiddenBuiltin.map((s) => trim(s)).filter(Boolean)
    : d.hiddenBuiltin;
  const custom: PortalIconCatalogItem[] = [];
  for (const item of src.custom || []) {
    const slug = trim(item?.slug);
    const value = trim(item?.value);
    if (!slug || !value) continue;
    const kind = (['builtin', 'emoji', 'alias', 'image'] as PortalIconKind[]).includes(item?.kind as PortalIconKind)
      ? (item.kind as PortalIconKind)
      : 'emoji';
    custom.push({
      id: trim(item?.id) || `custom:${slug}`,
      slug,
      label: trim(item?.label) || slug,
      category: trim(item?.category) || 'general',
      kind,
      value,
      activo: item?.activo !== false,
    });
  }
  return { custom, hiddenBuiltin };
}

/** Catálogo unificado: personalizados + builtin visibles. */
export function buildPortalIconCatalog(
  iconografia?: Partial<PortalIconografiaConfig> | null,
): PortalIconCatalogItem[] {
  const cfg = mergePortalIconografia(iconografia);
  const hidden = new Set(cfg.hiddenBuiltin);
  const bySlug = new Map<string, PortalIconCatalogItem>();

  for (const item of PORTAL_BUILTIN_ICON_CATALOG) {
    if (hidden.has(item.slug)) continue;
    bySlug.set(item.slug, { ...item });
  }

  for (const item of cfg.custom) {
    if (!item.activo) continue;
    bySlug.set(item.slug, { ...item });
  }

  return [...bySlug.values()].sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export function findPortalIconCatalogItem(
  slug: string,
  iconografia?: Partial<PortalIconografiaConfig> | null,
): PortalIconCatalogItem | null {
  const key = trim(slug);
  if (!key) return null;
  return buildPortalIconCatalog(iconografia).find((item) => item.slug === key) ?? null;
}

/** Resuelve el slug efectivo guardado en campos del sitio (alias → destino). */
export function resolvePortalIconSlug(
  slug: string,
  iconografia?: Partial<PortalIconografiaConfig> | null,
): string {
  const key = trim(slug);
  if (!key) return '';
  const item = findPortalIconCatalogItem(key, iconografia);
  if (!item) return key;
  if (item.kind === 'alias') return trim(item.value) || key;
  if (item.kind === 'builtin') return item.slug;
  return item.slug;
}

export function createCustomPortalIcon(partial: {
  slug?: string;
  label: string;
  category?: string;
  kind: PortalIconKind;
  value: string;
}): PortalIconCatalogItem {
  const label = trim(partial.label);
  const value = trim(partial.value);
  const slug = trim(partial.slug) || slugify(label || value);
  return {
    id: `custom:${slug}:${Date.now()}`,
    slug,
    label: label || slug,
    category: trim(partial.category) || 'general',
    kind: partial.kind,
    value,
    activo: true,
  };
}

export function portalIconPickerItems(
  iconografia: Partial<PortalIconografiaConfig> | null | undefined,
  mode: 'vector' | 'emoji' | 'any',
): PortalIconCatalogItem[] {
  const all = buildPortalIconCatalog(iconografia);
  if (mode === 'any') return all;
  if (mode === 'emoji') {
    return all.filter((item) => item.kind === 'emoji' || /^\p{Extended_Pictographic}/u.test(item.slug));
  }
  return all.filter((item) => item.kind === 'builtin' || item.kind === 'alias' || item.kind === 'image');
}
