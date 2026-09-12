import {
  PortalIconografiaConfig,
} from '../../core/constants/portal-icon-catalog.types';
import {
  findPortalIconCatalogItem,
  resolvePortalIconSlug,
} from '../../core/utils/portal-icon-catalog.util';
import { resolveUploadUrl } from '../../core/upload-url.util';
import { resolvePortalIconName } from './portal-icon.registry';

export type PortalIconDisplay =
  | { type: 'vector'; name: string }
  | { type: 'emoji'; char: string }
  | { type: 'image'; url: string };

export function resolvePortalIconDisplay(
  raw: string | null | undefined,
  iconografia?: Partial<PortalIconografiaConfig> | null,
): PortalIconDisplay | null {
  const key = String(raw ?? '').trim();
  if (!key) return null;

  const item = findPortalIconCatalogItem(key, iconografia);
  if (item) {
    if (item.kind === 'image') {
      const url = resolveUploadUrl(item.value) || item.value;
      return url ? { type: 'image', url } : null;
    }
    if (item.kind === 'emoji') {
      return item.value ? { type: 'emoji', char: item.value } : null;
    }
    const slug = item.kind === 'alias' ? resolvePortalIconSlug(item.value, iconografia) : item.slug;
    const name = resolvePortalIconName(slug);
    return name ? { type: 'vector', name } : null;
  }

  if (/^\p{Extended_Pictographic}/u.test(key)) {
    return { type: 'emoji', char: key };
  }

  const name = resolvePortalIconName(key);
  return name ? { type: 'vector', name } : null;
}
