import {
  mergePromoHeroExtras,
  mergePromoHeroTexts,
  PortalPromoHeroExtras,
  PortalPromoHeroTexts,
} from './portal-promo-hero-fields.util';

export interface PortalEvaluacionJornadasLanding {
  hero: PortalPromoHeroTexts &
    Pick<PortalPromoHeroExtras, 'mostrarBadgeVirtual' | 'virtualBadgeLabel' | 'theme'>;
}

const HERO_TEXTS: PortalPromoHeroTexts = {
  kicker: 'Jornadas de capacitación',
  tituloLinea: 'Evaluación de',
  tituloAcento: 'satisfacción',
  lead:
    'Califique con estrellas su experiencia en cada programa al que asistió. Una sola respuesta por encuesta.',
};

const HERO_EXTRAS: Pick<PortalPromoHeroExtras, 'mostrarBadgeVirtual' | 'virtualBadgeLabel' | 'theme'> = {
  mostrarBadgeVirtual: false,
  virtualBadgeLabel: 'VIRTUAL',
  theme: 'gold',
};

export const EVALUACION_JORNADAS_LANDING_DEFAULTS: PortalEvaluacionJornadasLanding = {
  hero: { ...HERO_TEXTS, ...HERO_EXTRAS },
};

export function mergeEvaluacionJornadasLanding(
  raw?: Partial<PortalEvaluacionJornadasLanding> | null,
): PortalEvaluacionJornadasLanding {
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
