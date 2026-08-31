const { mergePromoHeroExtras, mergePromoHeroTexts } = require('./portalPromoHeroFields');

const HERO_TEXTS = {
  kicker: 'Jornadas de capacitación',
  tituloLinea: 'Evaluación de',
  tituloAcento: 'satisfacción',
  lead:
    'Califique con estrellas su experiencia en cada programa al que asistió. Una sola respuesta por encuesta.',
};

const HERO_EXTRAS = {
  mostrarBadgeVirtual: false,
  virtualBadgeLabel: 'VIRTUAL',
  theme: 'gold',
};

const EVALUACION_JORNADAS_LANDING_DEFAULTS = {
  hero: { ...HERO_TEXTS, ...HERO_EXTRAS },
};

function mergeEvaluacionJornadasLanding(raw) {
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

module.exports = { EVALUACION_JORNADAS_LANDING_DEFAULTS, mergeEvaluacionJornadasLanding };
