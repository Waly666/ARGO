import { PortalAsistenteViewConfig } from './portal-landing';
import { resolveUploadUrl } from './upload-url.util';

/** URL reproducible del avatar del asistente virtual. */
export function resolveConsultaAsistenteVideoUrl(
  cfg?: Partial<PortalAsistenteViewConfig> | null,
): string {
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

  if (rel.startsWith('/')) return rel;
  return `/${rel.replace(/^\/+/, '')}`;
}
