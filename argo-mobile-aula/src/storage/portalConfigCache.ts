import type { PortalConfig } from '../api/types';
import { secureDelete, secureGet, secureSet } from './safeStore';

const CACHE_KEY = 'argo_aula_portal_config';

export async function loadCachedPortalConfig(): Promise<PortalConfig | null> {
  try {
    const raw = await secureGet(CACHE_KEY);
    if (!raw?.trim()) return null;
    const parsed = JSON.parse(raw) as PortalConfig;
    if (!parsed?.nombreCea?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCachedPortalConfig(config: PortalConfig): Promise<void> {
  try {
    await secureSet(CACHE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

export async function clearCachedPortalConfig(): Promise<void> {
  await secureDelete(CACHE_KEY);
}
