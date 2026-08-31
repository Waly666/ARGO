/** Campos compartidos de banners hero del portal (ERP + portal público). */

export type PortalPromoHeroTheme = 'gold' | 'green' | 'violet' | 'blue';

export interface PortalPromoHeroPillar {
  icon: string;
  label: string;
}

export interface PortalPromoHeroHighlight {
  icon: string;
  title: string;
  subtitle: string;
}

export interface PortalPromoHeroRibbonItem {
  icon: string;
  label: string;
}

export interface PortalPromoHeroTexts {
  kicker: string;
  tituloLinea: string;
  tituloAcento: string;
  lead: string;
}

export interface PortalPromoHeroExtras {
  pillarsLabel: string;
  pillars: PortalPromoHeroPillar[];
  mostrarBadgeVirtual: boolean;
  virtualBadgeLabel: string;
  backLabel: string;
  theme: PortalPromoHeroTheme;
  stats: string[];
  highlightIcon: string;
  highlightTitle: string;
  highlightSubtitle: string;
  ctaPrincipal: string;
  ctaPrincipalUrl: string;
  ctaSecundario: string;
  ctaSecundarioUrl: string;
}

export const PROMO_HERO_PILARES_INSTITUCION: PortalPromoHeroPillar[] = [
  { icon: 'shield-check', label: 'Seguridad vial' },
  { icon: 'car', label: 'Formación certificada' },
  { icon: 'exclamation', label: 'Prevención de riesgos' },
  { icon: 'defensive', label: 'Conducción responsable' },
];

export const PROMO_HERO_PILARES_MP: PortalPromoHeroPillar[] = [
  { icon: 'shield-check', label: 'Seguridad vial' },
  { icon: 'truck', label: 'Transporte ONU' },
  { icon: 'exclamation', label: 'Prevención de riesgos' },
  { icon: 'document', label: 'Normativa técnica' },
];

export const PROMO_HERO_PILARES_TA: PortalPromoHeroPillar[] = [
  { icon: 'shield-check', label: 'Seguridad en alturas' },
  { icon: 'ladder', label: 'Normativa vigente' },
  { icon: 'exclamation', label: 'Prevención de caídas' },
  { icon: 'document', label: 'Buenas prácticas' },
];

export const PROMO_HERO_PILARES_JORNADAS: PortalPromoHeroPillar[] = [
  { icon: 'qr-code', label: 'Asistencia digital' },
  { icon: 'check-badge', label: 'Sin cuenta portal' },
  { icon: 'user-group', label: 'Estaciones tipo carpa' },
  { icon: 'car', label: 'Seguridad vial' },
];

const str = (v: unknown, fb: string) => String(v ?? fb).trim() || fb;

const THEMES: PortalPromoHeroTheme[] = ['gold', 'green', 'violet', 'blue'];

export function mergePromoHeroTheme(v: unknown, fb: PortalPromoHeroTheme): PortalPromoHeroTheme {
  const t = String(v ?? '').trim() as PortalPromoHeroTheme;
  return THEMES.includes(t) ? t : fb;
}

export function mergePromoHeroTexts(
  raw: Partial<PortalPromoHeroTexts> | null | undefined,
  defaults: PortalPromoHeroTexts,
): PortalPromoHeroTexts {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    kicker: str(src.kicker, defaults.kicker),
    tituloLinea: str(src.tituloLinea, defaults.tituloLinea),
    tituloAcento: str(src.tituloAcento, defaults.tituloAcento),
    lead: str(src.lead, defaults.lead),
  };
}

export function mergePromoHeroPillars(
  raw: PortalPromoHeroPillar[] | undefined,
  defaults: PortalPromoHeroPillar[],
): PortalPromoHeroPillar[] {
  if (!Array.isArray(raw) || !raw.length) return defaults.map((p) => ({ ...p }));
  return raw.map((p, i) => ({
    icon: str(p?.icon, defaults[i]?.icon || 'shield-check'),
    label: str(p?.label, defaults[i]?.label || ''),
  }));
}

export function mergePromoHeroStats(raw: string[] | undefined, defaults: string[]): string[] {
  if (!Array.isArray(raw) || !raw.length) return [...defaults];
  return raw.map((s, i) => str(s, defaults[i] || ''));
}

export function mergePromoHeroExtras(
  raw: Partial<PortalPromoHeroExtras> | null | undefined,
  defaults: PortalPromoHeroExtras,
): PortalPromoHeroExtras {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    pillarsLabel: str(src.pillarsLabel, defaults.pillarsLabel),
    pillars: mergePromoHeroPillars(src.pillars, defaults.pillars),
    mostrarBadgeVirtual: src.mostrarBadgeVirtual !== false,
    virtualBadgeLabel: str(src.virtualBadgeLabel, defaults.virtualBadgeLabel),
    backLabel: str(src.backLabel, defaults.backLabel),
    theme: mergePromoHeroTheme(src.theme, defaults.theme),
    stats: mergePromoHeroStats(src.stats, defaults.stats),
    highlightIcon: str(src.highlightIcon, defaults.highlightIcon),
    highlightTitle: str(src.highlightTitle, defaults.highlightTitle),
    highlightSubtitle: str(src.highlightSubtitle, defaults.highlightSubtitle),
    ctaPrincipal: str(src.ctaPrincipal, defaults.ctaPrincipal),
    ctaPrincipalUrl: str(src.ctaPrincipalUrl, defaults.ctaPrincipalUrl),
    ctaSecundario: str(src.ctaSecundario, defaults.ctaSecundario),
    ctaSecundarioUrl: str(src.ctaSecundarioUrl, defaults.ctaSecundarioUrl),
  };
}

export function promoHeroHighlightFromExtras(
  extras: Pick<PortalPromoHeroExtras, 'highlightIcon' | 'highlightTitle' | 'highlightSubtitle'>,
): PortalPromoHeroHighlight | null {
  if (!extras.highlightTitle?.trim()) return null;
  return {
    icon: extras.highlightIcon || 'trophy',
    title: extras.highlightTitle,
    subtitle: extras.highlightSubtitle,
  };
}

/** Sustituye {nombreCea} en textos del hero. */
export function applyNombreCeaHeroText(text: string, nombreCea: string): string {
  return text.replace(/\{nombreCea\}/gi, nombreCea || 'nuestra institución');
}
