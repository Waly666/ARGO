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
  if (!imagenes?.length && !videos?.length && !hasHero && !hasVideo && raw.activa === undefined) {
    return undefined;
  }
  return {
    activa: raw.activa,
    heroImagenUrl: raw.heroImagenUrl?.trim() || '',
    heroImagenUrlAbsoluta: raw.heroImagenUrlAbsoluta?.trim() || '',
    heroVideoYoutubeUrl: raw.heroVideoYoutubeUrl?.trim() || '',
    imagenes: imagenes || [],
    videos: videos || [],
  };
}

/** Conserva solo fotos/videos y visibilidad; los textos vienen de los defaults Servial. */
export function servialPortafolioMediaOnly(
  raw?: Partial<PortalFinstruvialServiciosConfig> | null,
): Partial<PortalFinstruvialServiciosConfig> | null {
  if (!raw) return null;
  const paginas = {} as Partial<Record<string, Partial<PortalFinstruvialServicioLanding>>>;
  for (const slug of FINSTRUVIAL_SERVICIO_SLUGS) {
    const picked = pickPaginaMedia(raw.paginas?.[slug]);
    if (picked) paginas[slug] = picked;
  }
  const hubHero = raw.hub?.heroImagenUrl?.trim() || raw.hub?.heroImagenUrlAbsoluta?.trim();
  return {
    activa: raw.activa,
    hub: hubHero
      ? ({
          heroImagenUrl: raw.hub?.heroImagenUrl?.trim() || '',
          heroImagenUrlAbsoluta: raw.hub?.heroImagenUrlAbsoluta?.trim() || '',
        } as PortalFinstruvialServiciosConfig['hub'])
      : undefined,
    paginas: paginas as PortalFinstruvialServiciosConfig['paginas'],
  };
}
