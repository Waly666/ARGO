/** Resolución de SEO por página desde site.seo (editor del sitio). */

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
  | 'blog'
  | 'galeria'
  | 'pqr'
  | 'jornadasCapacitacion'
  | 'evaluacionJornadas';

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
