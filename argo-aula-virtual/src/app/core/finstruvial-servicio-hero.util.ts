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

export interface FinstruvialServicioHeroOpts {
  /** Si es false, solo campos del banner ERP (sin rellenar desde secciones editoriales). */
  autocompletar?: boolean;
}

function trim(value: unknown): string {
  return String(value ?? '').trim();
}

function isMostlyUppercase(text: string): boolean {
  const letters = text.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑüÜ]/g, '');
  if (letters.length < 4) return false;
  const upper = letters.replace(/[^A-ZÁÉÍÓÚÑÜ]/g, '').length;
  return upper / letters.length > 0.8;
}

/** Convierte textos guardados en MAYÚSCULAS a formato oración (primera letra en mayúscula). */
function toSentenceCaseEs(text: string): string {
  const value = trim(text);
  if (!value || !isMostlyUppercase(value)) return value;
  const lower = value.toLocaleLowerCase('es-CO');
  return lower.charAt(0).toLocaleUpperCase('es-CO') + lower.slice(1);
}

function normalizeHighlightTitle(text: string, fallback: string): string {
  const value = trim(text) || trim(fallback);
  return value ? value.toLocaleUpperCase('es-CO') : '';
}

function normalizeHighlightCopy(title: string, subtitle: string, menuLabel: string): { title: string; subtitle: string } {
  return {
    title: normalizeHighlightTitle(title, menuLabel),
    subtitle: toSentenceCaseEs(subtitle),
  };
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
export function finstruvialServicioHeroPillars(
  s: PortalFinstruvialServicioLanding,
  opts?: FinstruvialServicioHeroOpts,
): PromoBannerPillar[] {
  if (hasExplicitPillars(s.pillars)) {
    return mapPillars(s.pillars);
  }
  if (opts?.autocompletar === false) {
    return [];
  }
  return derivedServicioHeroPillars(s);
}

export function finstruvialServicioHeroPillarsLabel(
  s: PortalFinstruvialServicioLanding,
  opts?: FinstruvialServicioHeroOpts,
): string {
  if (hasExplicitPillars(s.pillars)) {
    return trim(s.pillarsLabel) || 'Fortalezas';
  }
  if (opts?.autocompletar === false) {
    return trim(s.pillarsLabel) || 'Fortalezas';
  }
  if (s.pilaresEducativos?.length) return trim(s.pilaresSeccionTitulo) || 'Fortalezas';
  if (s.metodologiaPasos?.length) return trim(s.metodologiaTitulo) || 'Metodología';
  if (s.resultadoIconos?.length) return trim(s.resultadoTitulo) || 'Resultados';
  if (s.experienciaItems?.length) return trim(s.experienciaSeccionTitulo) || 'Experiencia';
  return 'Fortalezas';
}

function servicioHeroParrafos(s: PortalFinstruvialServicioLanding): string[] {
  return (s.heroParrafos || []).map((p) => trim(p)).filter(Boolean);
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

/** Párrafos del hero que no van dentro de la tarjeta destacada. */
export function finstruvialServicioHeroExtraParrafos(s: PortalFinstruvialServicioLanding): string[] {
  const parrafos = servicioHeroParrafos(s);
  if (!parrafos.length) return [];
  if (trim(s.highlightTitle) || trim(s.highlightSubtitle)) return [];
  return parrafos;
}

/** Tarjeta destacada bajo el lead (ERP, heroParrafos o producto / metodología / mensaje clave). */
export function finstruvialServicioHeroHighlight(
  s: PortalFinstruvialServicioLanding,
  opts?: FinstruvialServicioHeroOpts,
): PromoBannerHighlight | null {
  const explicitTitle = trim(s.highlightTitle);
  const explicitSubtitle = trim(s.highlightSubtitle);
  if (explicitTitle || explicitSubtitle) {
    const copy = normalizeHighlightCopy(explicitTitle, explicitSubtitle, trim(s.menuLabel));
    if (!copy.title || !copy.subtitle) return null;
    return {
      icon: trim(s.highlightIcon) || 'trophy',
      title: copy.title,
      subtitle: copy.subtitle,
    };
  }
  const parrafos = servicioHeroParrafos(s);
  if (parrafos.length) {
    const copy = normalizeHighlightCopy('', parrafos.join(' '), trim(s.menuLabel));
    if (!copy.subtitle) return null;
    return {
      icon: trim(s.highlightIcon) || 'shield-check',
      title: copy.title,
      subtitle: copy.subtitle,
    };
  }
  if (opts?.autocompletar === false) {
    return null;
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
  opts?: FinstruvialServicioHeroOpts,
): PromoBannerRibbonItem[] {
  if (hasExplicitRibbon(s.ribbon)) {
    return mapRibbon(s.ribbon);
  }
  if (opts?.autocompletar === false) {
    return [];
  }
  return derivedServicioHeroRibbon(s);
}

export function finstruvialServicioHeroRibbonLabel(
  s: PortalFinstruvialServicioLanding,
  opts?: FinstruvialServicioHeroOpts,
): string {
  if (hasExplicitRibbon(s.ribbon)) {
    return trim(s.ribbonLabel) || 'Líneas de servicio';
  }
  if (opts?.autocompletar === false) {
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

export function finstruvialServicioHeroStats(
  s: PortalFinstruvialServicioLanding,
  opts?: FinstruvialServicioHeroOpts,
): string[] {
  const explicit = (s.stats || []).map((stat) => trim(stat)).filter(Boolean).slice(0, 4);
  if (explicit.length) return explicit;
  if (opts?.autocompletar === false) {
    return [];
  }
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
  const explicitTitle = trim(hub.highlightTitle);
  const explicitSubtitle = trim(hub.highlightSubtitle);
  if (explicitTitle || explicitSubtitle) {
    const copy = normalizeHighlightCopy(explicitTitle, explicitSubtitle, trim(hub.gridTitulo) || 'Portafolio');
    if (!copy.title || !copy.subtitle) return null;
    return {
      icon: trim(hub.highlightIcon) || 'shield-check',
      title: copy.title,
      subtitle: copy.subtitle,
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
