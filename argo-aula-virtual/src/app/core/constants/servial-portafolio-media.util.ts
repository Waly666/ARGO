import { FINSTRUVIAL_SERVICIO_SLUGS } from './finstruvial-servicios.constants';
import {
  PortalFinstruvialServicioImagen,
  PortalFinstruvialServicioLanding,
  PortalFinstruvialServiciosConfig,
} from './finstruvial-servicio-landing.types';

function pickImagenes(
  raw?: PortalFinstruvialServicioImagen[],
): PortalFinstruvialServicioImagen[] | undefined {
  if (!raw?.length) return undefined;
  return raw
    .filter((img) => img?.url?.trim() || img?.urlAbsoluta?.trim())
    .map((img) => ({
      id: img.id,
      etiqueta: img.etiqueta,
      url: img.url?.trim() || '',
      urlAbsoluta: img.urlAbsoluta?.trim() || '',
      alt: img.alt,
    }));
}

function pickPaginaMedia(
  raw?: Partial<PortalFinstruvialServicioLanding>,
): Partial<PortalFinstruvialServicioLanding> | undefined {
  if (!raw) return undefined;
  const imagenes = pickImagenes(raw.imagenes);
  const videos = pickImagenes(raw.videos);
  const hasHero = raw.heroImagenUrl?.trim() || raw.heroImagenUrlAbsoluta?.trim();
  const hasVideo = raw.heroVideoYoutubeUrl?.trim();
  const routeSegment = raw.routeSegment?.trim();
  const menuLabel = raw.menuLabel?.trim();
  if (
    !imagenes?.length &&
    !videos?.length &&
    !hasHero &&
    !hasVideo &&
    raw.activa === undefined &&
    !routeSegment &&
    !menuLabel
  ) {
    return undefined;
  }
  return {
    activa: raw.activa,
    ...(routeSegment ? { routeSegment } : {}),
    ...(menuLabel ? { menuLabel } : {}),
    heroImagenUrl: raw.heroImagenUrl?.trim() || '',
    heroImagenUrlAbsoluta: raw.heroImagenUrlAbsoluta?.trim() || '',
    heroVideoYoutubeUrl: raw.heroVideoYoutubeUrl?.trim() || '',
    imagenes: imagenes || [],
    videos: videos || [],
  };
}

function pickHubMedia(
  hub?: Partial<PortalFinstruvialServiciosConfig['hub']>,
): PortalFinstruvialServiciosConfig['hub'] | undefined {
  if (!hub) return undefined;
  const heroImagenUrl = hub.heroImagenUrl?.trim() || '';
  const heroImagenUrlAbsoluta = hub.heroImagenUrlAbsoluta?.trim() || '';
  const formacionImagenUrl = hub.formacionImagenUrl?.trim() || '';
  const formacionImagenUrlAbsoluta = hub.formacionImagenUrlAbsoluta?.trim() || '';
  const formacionImagen2Url = hub.formacionImagen2Url?.trim() || '';
  const formacionImagen2UrlAbsoluta = hub.formacionImagen2UrlAbsoluta?.trim() || '';
  const hasAny =
    heroImagenUrl ||
    heroImagenUrlAbsoluta ||
    formacionImagenUrl ||
    formacionImagenUrlAbsoluta ||
    formacionImagen2Url ||
    formacionImagen2UrlAbsoluta;
  if (!hasAny) return undefined;
  return {
    heroImagenUrl,
    heroImagenUrlAbsoluta,
    formacionImagenUrl,
    formacionImagenUrlAbsoluta,
    formacionImagen2Url,
    formacionImagen2UrlAbsoluta,
  } as PortalFinstruvialServiciosConfig['hub'];
}

/** Conserva fotos/videos, visibilidad y overrides de ERP (slug, nombre en menú). */
export function servialPortafolioMediaOnly(
  raw?: Partial<PortalFinstruvialServiciosConfig> | null,
): Partial<PortalFinstruvialServiciosConfig> | null {
  if (!raw) return null;
  const paginas = {} as Partial<Record<string, Partial<PortalFinstruvialServicioLanding>>>;
  for (const slug of FINSTRUVIAL_SERVICIO_SLUGS) {
    const picked = pickPaginaMedia(raw.paginas?.[slug]);
    if (picked) paginas[slug] = picked;
  }
  const hub = pickHubMedia(raw.hub);
  return {
    activa: raw.activa,
    hub,
    paginas: paginas as PortalFinstruvialServiciosConfig['paginas'],
  };
}
