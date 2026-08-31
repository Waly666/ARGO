const { mergePromoHeroExtras, mergePromoHeroTexts } = require('./portalPromoHeroFields');

const HERO_TEXTS = {
  kicker: 'PQRSF',
  tituloLinea: 'Peticiones, Quejas, Reclamos,',
  tituloAcento: 'Sugerencias y Felicitaciones',
  lead:
    'En {nombreCea} nos comprometemos a atender y dar respuesta oportuna a todas sus solicitudes.',
};

const HERO_EXTRAS = {
  mostrarBadgeVirtual: false,
  virtualBadgeLabel: 'VIRTUAL',
  theme: 'gold',
};

const PQR_LANDING_DEFAULTS = {
  hero: { ...HERO_TEXTS, ...HERO_EXTRAS },
};

function mergePqrLanding(raw) {
  const src = raw?.hero && typeof raw.hero === 'object' ? raw.hero : {};
  const texts = mergePromoHeroTexts(src, HERO_TEXTS);
  const extras = mergePromoHeroExtras(
    { ...HERO_EXTRAS, ...src },
    {
      ...HERO_EXTRAS,
      pillarsLabel: '',
      pillars: [],
      backLabel: '',
      stats: [],
      highlightIcon: '',
      highlightTitle: '',
      highlightSubtitle: '',
      ctaPrincipal: '',
      ctaPrincipalUrl: '',
      ctaSecundario: '',
      ctaSecundarioUrl: '',
    },
  );
  return {
    hero: {
      ...texts,
      mostrarBadgeVirtual: extras.mostrarBadgeVirtual,
      virtualBadgeLabel: extras.virtualBadgeLabel,
      theme: extras.theme,
    },
  };
}

module.exports = { PQR_LANDING_DEFAULTS, mergePqrLanding };
