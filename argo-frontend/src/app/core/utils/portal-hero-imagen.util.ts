/** Campos de imagen de hero en distintas secciones del landing. */

export interface PortalHeroImagenFields {
  imagenUrl?: string;
  imagenUrlAbsoluta?: string;
  imagenAlt?: string;
  /** Solo ERP: prompt para generar la foto. No se muestra en el portal. */
  promptImagen?: string;
  heroImagenUrl?: string;
  heroImagenUrlAbsoluta?: string;
  heroImagenAlt?: string;
  /** Solo ERP (alias en páginas con heroImagenAlt). */
  heroImagenPrompt?: string;
}

export type PortalLandingHeroImageKey =
  | 'blog'
  | 'pqr'
  | 'examenTeorico'
  | 'jornadasCapacitacion'
  | 'evaluacionJornadas'
  | 'consultaCertificados';

export function portalHeroImagenStoredUrl(fields?: PortalHeroImagenFields | null): string {
  return fields?.imagenUrl?.trim() || fields?.heroImagenUrl?.trim() || '';
}

export function portalHeroImagenStoredAlt(fields?: PortalHeroImagenFields | null): string {
  return fields?.imagenAlt?.trim() || fields?.heroImagenAlt?.trim() || '';
}

export function portalHeroImagenPreviewUrl(
  fields: PortalHeroImagenFields | null | undefined,
  uploadsBase: string,
): string | null {
  const rel = portalHeroImagenStoredUrl(fields);
  if (!rel) return null;
  if (/^https?:\/\//i.test(rel) || rel.startsWith('//')) return rel;
  if (rel.startsWith('/images/') || rel.startsWith('/apk/')) return rel;
  const abs = fields?.imagenUrlAbsoluta?.trim() || fields?.heroImagenUrlAbsoluta?.trim();
  if (abs && /^https?:\/\//i.test(abs)) return abs;
  if (rel.startsWith('/uploads/') || rel.startsWith('/')) return rel;
  const base = uploadsBase.replace(/\/+$/, '');
  return `${base}/${rel.replace(/^\/+/, '')}`;
}
