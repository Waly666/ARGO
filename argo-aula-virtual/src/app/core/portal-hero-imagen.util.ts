import { resolveUploadUrl } from './upload-url.util';

export interface PortalHeroImagenFields {
  imagenUrl?: string;
  imagenUrlAbsoluta?: string;
  imagenAlt?: string;
  heroImagenUrl?: string;
  heroImagenUrlAbsoluta?: string;
  heroImagenAlt?: string;
  logoCertificacionUrl?: string;
  logoCertificacionUrlAbsoluta?: string;
  logoCertificacionAlt?: string;
}

export function portalHeroImagenStoredUrl(fields?: PortalHeroImagenFields | null): string {
  return fields?.imagenUrl?.trim() || fields?.heroImagenUrl?.trim() || '';
}

export function portalHeroImagenStoredAlt(
  fields?: PortalHeroImagenFields | null,
  fallback = '',
): string {
  return fields?.imagenAlt?.trim() || fields?.heroImagenAlt?.trim() || fallback.trim();
}

export function portalLogoCertificacionStoredUrl(fields?: PortalHeroImagenFields | null): string {
  return fields?.logoCertificacionUrl?.trim() || '';
}

export function portalLogoCertificacionPublicUrl(fields?: PortalHeroImagenFields | null): string | null {
  const rel = portalLogoCertificacionStoredUrl(fields);
  const abs = fields?.logoCertificacionUrlAbsoluta?.trim();
  if (!rel && !abs) return null;
  if (rel.startsWith('assets/')) return rel;
  if (rel.startsWith('/images/') || rel.startsWith('/apk/')) return rel;
  if (/^https?:\/\//i.test(rel) || rel.startsWith('//')) return rel;
  if (abs && (/^https?:\/\//i.test(abs) || abs.startsWith('//'))) return abs;
  const resolved = resolveUploadUrl(abs || rel);
  if (resolved) return resolved;
  if (rel.startsWith('/uploads/') || rel.startsWith('/')) return rel;
  return null;
}

export function portalHeroImagenPublicUrl(fields?: PortalHeroImagenFields | null): string | null {
  const rel = portalHeroImagenStoredUrl(fields);
  if (!rel) return null;
  if (rel.startsWith('/images/') || rel.startsWith('/apk/')) return rel;
  if (/^https?:\/\//i.test(rel) || rel.startsWith('//')) return rel;
  const abs = fields?.imagenUrlAbsoluta?.trim() || fields?.heroImagenUrlAbsoluta?.trim();
  const resolved = resolveUploadUrl(abs || rel);
  if (resolved) return resolved;
  if (rel.startsWith('/uploads/') || rel.startsWith('/')) return rel;
  return null;
}
