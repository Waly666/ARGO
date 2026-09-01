const {
  mergePromoHeroExtras,
  mergePromoHeroTexts,
  PROMO_HERO_PILARES_JORNADAS,
} = require('./portalPromoHeroFields');

const HERO_TEXTS = {
  kicker: 'Formación presencial',
  tituloLinea: 'Jornadas de',
  tituloAcento: 'Capacitación',
  lead:
    'Actividades experienciales en seguridad vial, en espacios tipo carpa. Inscríbase en línea y reciba su código QR de asistencia.',
};

const HERO_EXTRAS = {
  pillarsLabel: 'Características de las jornadas',
  pillars: PROMO_HERO_PILARES_JORNADAS,
  mostrarBadgeVirtual: false,
  virtualBadgeLabel: 'VIRTUAL',
  theme: 'gold',
  ctaPrincipal: 'Inscribirme ahora',
  ctaPrincipalUrl: '#inscripcion',
  ctaSecundario: 'Prefiero el aula virtual',
  ctaSecundarioUrl: '/registro',
  imagenUrl: '',
  imagenAlt: '',
};

const JORNADAS_CAPACITACION_LANDING_DEFAULTS = {
  hero: { ...HERO_TEXTS, ...HERO_EXTRAS },
};

function mergeJornadasCapacitacionLanding(raw) {
  const src = raw?.hero && typeof raw.hero === 'object' ? raw.hero : {};
  const texts = mergePromoHeroTexts(src, HERO_TEXTS);
  const extras = mergePromoHeroExtras(
    { ...HERO_EXTRAS, ...src },
    {
      ...HERO_EXTRAS,
      backLabel: '',
      stats: [],
      highlightIcon: '',
      highlightTitle: '',
      highlightSubtitle: '',
    },
  );
  return {
    hero: {
      ...texts,
      pillarsLabel: extras.pillarsLabel,
      pillars: extras.pillars,
      mostrarBadgeVirtual: extras.mostrarBadgeVirtual,
      virtualBadgeLabel: extras.virtualBadgeLabel,
      theme: extras.theme,
      ctaPrincipal: extras.ctaPrincipal,
      ctaPrincipalUrl: extras.ctaPrincipalUrl,
      ctaSecundario: extras.ctaSecundario,
      ctaSecundarioUrl: extras.ctaSecundarioUrl,
      imagenUrl: String(src.imagenUrl ?? '').trim(),
      imagenAlt: String(src.imagenAlt ?? '').trim(),
    },
  };
}

module.exports = { JORNADAS_CAPACITACION_LANDING_DEFAULTS, mergeJornadasCapacitacionLanding };
