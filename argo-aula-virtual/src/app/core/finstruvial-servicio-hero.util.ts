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
import {
  PortalPromoHeroPillar,
  PortalPromoHeroRibbonItem,
} from './constants/portal-promo-hero-fields.util';

const MAX_PILLARS = 4;
const MAX_RIBBON = 4;

function trim(value: unknown): string {
  return String(value ?? '').trim();
}

function mapPillars(items: PortalPromoHeroPillar[]): PromoBannerPillar[] {
  return items
    .filter((item) => trim(item.label))
    .slice(0, MAX_PILLARS)
    .map((item) => ({
      icon: trim(item.icon) || 'check-badge',
      label: trim(item.label),
    }));
}

function mapRibbon(items: PortalPromoHeroRibbonItem[]): PromoBannerRibbonItem[] {
  return items
    .filter((item) => trim(item.label))
    .slice(0, MAX_RIBBON)
    .map((item) => ({
      icon: trim(item.icon) || 'document',
      label: trim(item.label),
    }));
}

function hasExplicitPillars(items?: PortalPromoHeroPillar[]): boolean {
  return Array.isArray(items) && items.some((item) => trim(item.label));
}

function hasExplicitRibbon(items?: PortalPromoHeroRibbonItem[]): boolean {
  return Array.isArray(items) && items.some((item) => trim(item.label));
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

function derivedServicioHeroPillars(s: PortalFinstruvialServicioLanding): PromoBannerPillar[] {
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

/** Pilares del hero: primero campos ERP dedicados; si no, contenido editorial existente. */
export function finstruvialServicioHeroPillars(s: PortalFinstruvialServicioLanding): PromoBannerPillar[] {
  if (hasExplicitPillars(s.pillars)) {
    return mapPillars(s.pillars);
  }
  return derivedServicioHeroPillars(s);
}

export function finstruvialServicioHeroPillarsLabel(s: PortalFinstruvialServicioLanding): string {
  if (hasExplicitPillars(s.pillars)) {
    return trim(s.pillarsLabel) || 'Fortalezas';
  }
  if (s.pilaresEducativos?.length) return trim(s.pilaresSeccionTitulo) || 'Fortalezas';
  if (s.metodologiaPasos?.length) return trim(s.metodologiaTitulo) || 'Metodología';
  if (s.resultadoIconos?.length) return trim(s.resultadoTitulo) || 'Resultados';
  if (s.experienciaItems?.length) return trim(s.experienciaSeccionTitulo) || 'Experiencia';
  return 'Fortalezas';
}

function derivedServicioHeroHighlight(s: PortalFinstruvialServicioLanding): PromoBannerHighlight | null {
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

/** Tarjeta destacada bajo el lead (ERP o producto / metodología / mensaje clave). */
export function finstruvialServicioHeroHighlight(
  s: PortalFinstruvialServicioLanding,
): PromoBannerHighlight | null {
  if (trim(s.highlightTitle)) {
    return {
      icon: trim(s.highlightIcon) || 'trophy',
      title: trim(s.highlightTitle),
      subtitle: trim(s.highlightSubtitle),
    };
  }
  return derivedServicioHeroHighlight(s);
}

function derivedServicioHeroRibbon(s: PortalFinstruvialServicioLanding): PromoBannerRibbonItem[] {
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

export function finstruvialServicioHeroRibbon(
  s: PortalFinstruvialServicioLanding,
): PromoBannerRibbonItem[] {
  if (hasExplicitRibbon(s.ribbon)) {
    return mapRibbon(s.ribbon);
  }
  return derivedServicioHeroRibbon(s);
}

export function finstruvialServicioHeroRibbonLabel(s: PortalFinstruvialServicioLanding): string {
  if (hasExplicitRibbon(s.ribbon)) {
    return trim(s.ribbonLabel) || 'Líneas de servicio';
  }
  if (s.rutaAprendizaje?.length) return trim(s.rutaAprendizajeTitulo) || 'Ruta de aprendizaje';
  return 'Líneas de servicio';
}

function derivedServicioHeroStats(s: PortalFinstruvialServicioLanding): string[] {
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

export function finstruvialServicioHeroStats(s: PortalFinstruvialServicioLanding): string[] {
  const explicit = (s.stats || []).map((stat) => trim(stat)).filter(Boolean).slice(0, 4);
  if (explicit.length) return explicit;
  return derivedServicioHeroStats(s);
}

export function finstruvialHubHeroPillars(hub: PortalFinstruvialServiciosHub): PromoBannerPillar[] {
  if (hasExplicitPillars(hub.pillars)) {
    return mapPillars(hub.pillars);
  }
  const fromStats = (hub.stats?.length ? hub.stats : hub.heroStats || [])
    .map((label) => trim(label))
    .filter(Boolean)
    .slice(0, MAX_PILLARS)
    .map((label) => ({ icon: 'check-badge', label }));
  if (fromStats.length) return fromStats;
  return PROMO_BANNER_PILARES_INSTITUCION.map((pillar) => ({ ...pillar }));
}

export function finstruvialHubHeroPillarsLabel(hub: PortalFinstruvialServiciosHub): string {
  if (hasExplicitPillars(hub.pillars)) {
    return trim(hub.pillarsLabel) || 'Áreas de formación';
  }
  return 'Áreas de formación';
}

export function finstruvialHubHeroStats(hub: PortalFinstruvialServiciosHub): string[] {
  const stats = (hub.stats?.length ? hub.stats : hub.heroStats || [])
    .map((stat) => trim(stat))
    .filter(Boolean)
    .slice(0, 4);
  return stats;
}

export function finstruvialHubHeroRibbon(
  hub: PortalFinstruvialServiciosHub,
  tarjetas: PortalServiciosHubTarjeta[],
): PromoBannerRibbonItem[] {
  if (hasExplicitRibbon(hub.ribbon)) {
    return mapRibbon(hub.ribbon);
  }
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

export function finstruvialHubHeroRibbonLabel(hub: PortalFinstruvialServiciosHub): string {
  if (hasExplicitRibbon(hub.ribbon)) {
    return trim(hub.ribbonLabel) || 'Líneas de servicio';
  }
  return 'Líneas de servicio';
}

export function finstruvialHubHeroHighlight(hub: PortalFinstruvialServiciosHub): PromoBannerHighlight | null {
  if (trim(hub.highlightTitle)) {
    return {
      icon: trim(hub.highlightIcon) || 'shield-check',
      title: trim(hub.highlightTitle),
      subtitle: trim(hub.highlightSubtitle),
    };
  }
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
