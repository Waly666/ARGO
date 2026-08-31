/** Campos compartidos de banners hero del portal (ERP + portal público). */

const PROMO_HERO_PILARES_INSTITUCION = [
  { icon: 'shield-check', label: 'Seguridad vial' },
  { icon: 'car', label: 'Formación certificada' },
  { icon: 'exclamation', label: 'Prevención de riesgos' },
  { icon: 'defensive', label: 'Conducción responsable' },
];

const PROMO_HERO_PILARES_MP = [
  { icon: 'shield-check', label: 'Seguridad vial' },
  { icon: 'truck', label: 'Transporte ONU' },
  { icon: 'exclamation', label: 'Prevención de riesgos' },
  { icon: 'document', label: 'Normativa técnica' },
];

const PROMO_HERO_PILARES_TA = [
  { icon: 'shield-check', label: 'Seguridad en alturas' },
  { icon: 'ladder', label: 'Normativa vigente' },
  { icon: 'exclamation', label: 'Prevención de caídas' },
  { icon: 'document', label: 'Buenas prácticas' },
];

const PROMO_HERO_PILARES_JORNADAS = [
  { icon: 'qr-code', label: 'Asistencia digital' },
  { icon: 'check-badge', label: 'Sin cuenta portal' },
  { icon: 'user-group', label: 'Estaciones tipo carpa' },
  { icon: 'car', label: 'Seguridad vial' },
];

const THEMES = ['gold', 'green', 'violet', 'blue'];

function str(v, fb) {
  return String(v ?? fb).trim() || fb;
}

function mergePromoHeroTheme(v, fb) {
  const t = String(v ?? '').trim();
  return THEMES.includes(t) ? t : fb;
}

function mergePromoHeroTexts(raw, defaults) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    kicker: str(src.kicker, defaults.kicker),
    tituloLinea: str(src.tituloLinea, defaults.tituloLinea),
    tituloAcento: str(src.tituloAcento, defaults.tituloAcento),
    lead: str(src.lead, defaults.lead),
  };
}

function mergePromoHeroPillars(raw, defaults) {
  if (!Array.isArray(raw) || !raw.length) return defaults.map((p) => ({ ...p }));
  return raw.map((p, i) => ({
    icon: str(p?.icon, defaults[i]?.icon || 'shield-check'),
    label: str(p?.label, defaults[i]?.label || ''),
  }));
}

function mergePromoHeroStats(raw, defaults) {
  if (!Array.isArray(raw) || !raw.length) return [...defaults];
  return raw.map((s, i) => str(s, defaults[i] || ''));
}

function mergePromoHeroExtras(raw, defaults) {
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

module.exports = {
  PROMO_HERO_PILARES_INSTITUCION,
  PROMO_HERO_PILARES_MP,
  PROMO_HERO_PILARES_TA,
  PROMO_HERO_PILARES_JORNADAS,
  mergePromoHeroTheme,
  mergePromoHeroTexts,
  mergePromoHeroPillars,
  mergePromoHeroStats,
  mergePromoHeroExtras,
};
