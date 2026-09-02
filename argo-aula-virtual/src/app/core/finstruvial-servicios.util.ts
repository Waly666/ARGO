import { PortalFinstruvialServicioImagen, PortalFinstruvialServicioLanding } from './constants/finstruvial-servicio-landing.types';
import { portalHeroImagenPublicUrl } from './portal-hero-imagen.util';
import { resolveUploadUrl } from './upload-url.util';

export function finstruvialServicioHeroPhoto(
  servicio: PortalFinstruvialServicioLanding,
): string | null {
  return portalHeroImagenPublicUrl({
    heroImagenUrl: servicio.heroImagenUrl,
    heroImagenUrlAbsoluta: servicio.heroImagenUrlAbsoluta,
    heroImagenAlt: servicio.heroImagenAlt,
  });
}

export function finstruvialServicioImagenUrl(
  imagenes: PortalFinstruvialServicioImagen[] | undefined,
  id: string,
): string | null {
  return finstruvialServicioArchivoUrl(imagenes, id);
}

export function finstruvialServicioVideoUrl(
  videos: PortalFinstruvialServicioImagen[] | undefined,
  id: string,
): string | null {
  return finstruvialServicioArchivoUrl(videos, id);
}

function finstruvialServicioArchivoUrl(
  archivos: PortalFinstruvialServicioImagen[] | undefined,
  id: string,
): string | null {
  const item = archivos?.find((i) => i.id === id);
  if (!item) return null;
  const rel = item.url?.trim();
  if (!rel) return null;
  if (rel.startsWith('/images/') || rel.startsWith('/apk/')) return rel;
  if (/^https?:\/\//i.test(rel) || rel.startsWith('//')) return rel;
  const resolved = resolveUploadUrl(item.urlAbsoluta || rel);
  if (resolved) return resolved;
  if (rel.startsWith('/uploads/') || rel.startsWith('/')) return rel;
  return null;
}
