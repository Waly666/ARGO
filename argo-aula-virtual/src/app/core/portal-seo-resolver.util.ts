/** Resolución de SEO por página desde site.seo (editor del sitio). */

import {
  FINSTRUVIAL_SERVICIO_SLUGS,
  FinstruvialServicioSlug,
} from './constants/finstruvial-servicios.constants';

export type FinstruvialServicioSeoKey = `servicio_${FinstruvialServicioSlug}`;

export type PortalSeoPageKey =
  | 'home'
  | 'cursos'
  | 'tienda'
  | 'acerca'
  | 'fundacion'
  | 'consultaCertificados'
  | 'cursosConduccion'
  | 'examenTeorico'
  | 'mercanciasPeligrosas'
  | 'trabajoEnAlturas'
  | 'serviciosHub'
  | FinstruvialServicioSeoKey
  | 'blog'
  | 'galeria'
  | 'pqr'
  | 'jornadasCapacitacion'
  | 'evaluacionJornadas';

export function finstruvialServicioSeoKey(slug: FinstruvialServicioSlug): FinstruvialServicioSeoKey {
  return `servicio_${slug}`;
}

export function isFinstruvialServicioSeoKey(key: string): key is FinstruvialServicioSeoKey {
  return key.startsWith('servicio_') && FINSTRUVIAL_SERVICIO_SLUGS.includes(key.slice(9) as FinstruvialServicioSlug);
}

export interface PortalSeoPageConfig {
  titulo: string;
  descripcion: string;
  keywords: string;
}

export interface PortalSeoResolved {
  pageTitle: string;
  description: string;
  keywords: string;
}

export function resolvePortalSeoPage(
  site: { seo?: Partial<Record<PortalSeoPageKey, Partial<PortalSeoPageConfig>>> } | null | undefined,
  key: PortalSeoPageKey,
  fallback: PortalSeoResolved,
  landing?: { metaDescription?: string; metaKeywords?: string } | null,
): PortalSeoResolved {
  const custom = site?.seo?.[key];
  if (key === 'home') {
    return {
      pageTitle: custom?.titulo?.trim() || fallback.pageTitle,
      description:
        custom?.descripcion?.trim() || landing?.metaDescription?.trim() || fallback.description,
      keywords: custom?.keywords?.trim() || landing?.metaKeywords?.trim() || fallback.keywords,
    };
  }
  return {
    pageTitle: custom?.titulo?.trim() || fallback.pageTitle,
    description: custom?.descripcion?.trim() || fallback.description,
    keywords: custom?.keywords?.trim() || fallback.keywords,
  };
}
