import { getApiBaseUrl } from '../config/apiBase';
import type { PortalAsistenteViewConfig } from '../api/types';
import { resolveUploadUrl } from './uploadUrl';

/** URL reproducible del avatar del asistente virtual. */
export function resolveAsistenteVideoUrl(cfg?: Partial<PortalAsistenteViewConfig> | null): string | null {
  const abs = cfg?.asistenteVideoUrlAbsoluta?.trim();
  if (abs) {
    const upload = resolveUploadUrl(abs);
    if (upload) return upload;
    if (/^https?:\/\//i.test(abs)) return abs;
  }

  const rel = cfg?.asistenteVideoUrl?.trim() || 'videos/asistente-educarte.mp4';
  if (/^https?:\/\//i.test(rel)) return rel;

  const uploadRel = resolveUploadUrl(rel);
  if (uploadRel) return uploadRel;

  const origin = getApiBaseUrl().replace(/\/api\/?$/i, '');
  if (rel.startsWith('/')) return `${origin}${rel}`;
  return `${origin}/${rel.replace(/^\/+/, '')}`;
}
