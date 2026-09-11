import {
  PROMO_BANNER_PILARES_INSTITUCION,
  PROMO_BANNER_RIBBON_DEFAULT,
  PromoBannerHighlight,
  PromoBannerPillar,
  PromoBannerRibbonItem,
} from '../shared/portal-promo-banner-hero/portal-promo-banner-defaults';
import {
  PortalFinstruvialServicioLanding,
  PortalFinstruvialServiciosHub,
  PortalServiciosHubTarjeta,
} from './constants/finstruvial-servicio-landing.types';

const MAX_PILLARS = 4;
const MAX_RIBBON = 4;

function trim(value: unknown): string {
  return String(value ?? '').trim();
}

function bloquePillars(items: { icon: string; titulo: string }[]): PromoBannerPillar[] {
  return items
    .filter((item) => trim(item.titulo))
    .slice(0, MAX_PILLARS)
    .map((item) => ({
      icon: trim(item.icon) || 'check-badge',
      label: trim(item.titulo),
    }));
}

/** Pilares del hero a partir del contenido ya publicado en cada línea de servicio. */
export function finstruvialServicioHeroPillars(s: PortalFinstruvialServicioLanding): PromoBannerPillar[] {
  if (s.pilaresEducativos?.length) {
    const pillars = bloquePillars(s.pilaresEducativos);
    if (pillars.length) return pillars;
  }
  if (s.resultadoIconos?.length) {
    const pillars = bloquePillars(s.resultadoIconos);
    if (pillars.length) return pillars;
  }
  if (s.experienciaItems?.length) {
    const pillars = bloquePillars(s.experienciaItems);
    if (pillars.length) return pillars;
  }
  if (s.metodologiaPasos?.length) {
    return s.metodologiaPasos
      .filter((step) => trim(step))
      .slice(0, MAX_PILLARS)
      .map((step) => ({ icon: 'check-badge', label: trim(step) }));
  }
  if (s.bloques?.length) {
    const pillars = bloquePillars(s.bloques);
    if (pillars.length) return pillars;
  }
  if (s.publicos?.length) {
    return s.publicos
      .filter((label) => trim(label))
      .slice(0, MAX_PILLARS)
      .map((label) => ({ icon: 'user-group', label: trim(label) }));
  }
  return PROMO_BANNER_PILARES_INSTITUCION.map((pillar) => ({ ...pillar }));
}

export function finstruvialServicioHeroPillarsLabel(s: PortalFinstruvialServicioLanding): string {
  if (s.pilaresEducativos?.length) return trim(s.pilaresSeccionTitulo) || 'Fortalezas';
  if (s.metodologiaPasos?.length) return trim(s.metodologiaTitulo) || 'Metodología';
  if (s.resultadoIconos?.length) return trim(s.resultadoTitulo) || 'Resultados';
  if (s.experienciaItems?.length) return trim(s.experienciaSeccionTitulo) || 'Experiencia';
  return 'Fortalezas';
}

/** Tarjeta destacada bajo el lead (producto, metodología o mensaje clave). */
export function finstruvialServicioHeroHighlight(
  s: PortalFinstruvialServicioLanding,
): PromoBannerHighlight | null {
  if (trim(s.productoNombre)) {
    return {
      icon: 'trophy',
      title: trim(s.productoNombre),
      subtitle: trim(s.productoLead) || trim(s.mensajeSubtitulo),
    };
  }
  if (trim(s.metodologiaTitulo)) {
    return {
      icon: 'check-badge',
      title: trim(s.metodologiaTitulo),
      subtitle: trim(s.metodologiaLead),
    };
  }
  if (trim(s.mensajeTitulo)) {
    return {
      icon: 'shield-check',
      title: trim(s.mensajeTitulo),
      subtitle: trim(s.mensajeSubtitulo),
    };
  }
  return null;
}

export function finstruvialServicioHeroRibbon(
  s: PortalFinstruvialServicioLanding,
): PromoBannerRibbonItem[] {
  if (s.rutaAprendizaje?.length) {
    return s.rutaAprendizaje
      .filter((label) => trim(label))
      .slice(0, MAX_RIBBON)
      .map((label) => ({ icon: 'arrow-right', label: trim(label) }));
  }
  if (s.publicos?.length) {
    return s.publicos
      .filter((label) => trim(label))
      .slice(0, MAX_RIBBON)
      .map((label) => ({ icon: 'user-group', label: trim(label) }));
  }
  if (s.mostrarBadgeVirtual) {
    return PROMO_BANNER_RIBBON_DEFAULT.map((item) => ({ ...item }));
  }
  return [];
}

export function finstruvialServicioHeroStats(s: PortalFinstruvialServicioLanding): string[] {
  if (s.dashboardStats?.length) {
    return s.dashboardStats
      .filter((stat) => trim(stat.valor) || trim(stat.etiqueta))
      .slice(0, 4)
      .map((stat) =>
        trim(stat.valor) ? `${trim(stat.valor)} ${trim(stat.etiqueta)}`.trim() : trim(stat.etiqueta),
      );
  }
  if (s.metodologiaPasos?.length) {
    return s.metodologiaPasos.filter((step) => trim(step)).slice(0, 4);
  }
  if (s.productoEtiquetas?.length) {
    return s.productoEtiquetas.filter((tag) => trim(tag)).slice(0, 4);
  }
  return [];
}

export function finstruvialHubHeroPillars(labels: string[]): PromoBannerPillar[] {
  const pillars = labels
    .filter((label) => trim(label))
    .slice(0, MAX_PILLARS)
    .map((label) => ({ icon: 'check-badge', label: trim(label) }));
  return pillars.length ? pillars : PROMO_BANNER_PILARES_INSTITUCION.map((pillar) => ({ ...pillar }));
}

export function finstruvialHubHeroRibbon(
  tarjetas: PortalServiciosHubTarjeta[],
): PromoBannerRibbonItem[] {
  const fromTarjetas = tarjetas
    .filter((t) => trim(t.titulo))
    .slice(0, MAX_RIBBON)
    .map((t) => ({
      icon: trim(t.icon) || 'document',
      label: trim(t.titulo),
    }));
  if (fromTarjetas.length >= 3) return fromTarjetas;
  return PROMO_BANNER_RIBBON_DEFAULT.map((item) => ({ ...item }));
}

export function finstruvialHubHeroHighlight(hub: PortalFinstruvialServiciosHub): PromoBannerHighlight | null {
  if (trim(hub.seoTextoTitulo)) {
    return {
      icon: 'academic-cap',
      title: trim(hub.gridTitulo) || 'Portafolio de servicios',
      subtitle: trim(hub.gridLead) || trim(hub.seoTextoTitulo),
    };
  }
  if (trim(hub.gridTitulo)) {
    return {
      icon: 'shield-check',
      title: trim(hub.gridTitulo),
      subtitle: trim(hub.gridLead),
    };
  }
  return null;
}
