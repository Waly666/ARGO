import {
  mergePromoHeroExtras,
  mergePromoHeroTexts,
  PortalPromoHeroExtras,
  PortalPromoHeroTexts,
} from './portal-promo-hero-fields.util';

export interface PortalEvaluacionJornadasLanding {
  hero: PortalPromoHeroTexts &
    Pick<PortalPromoHeroExtras, 'mostrarBadgeVirtual' | 'virtualBadgeLabel' | 'theme'> & {
      imagenUrl: string;
      imagenUrlAbsoluta?: string;
      imagenAlt: string;
    };
}

const HERO_TEXTS: PortalPromoHeroTexts = {
  kicker: 'Jornadas de capacitación',
  tituloLinea: 'Evaluación de',
  tituloAcento: 'satisfacción',
  lead:
    'Califique con estrellas su experiencia en cada programa al que asistió. Una sola respuesta por encuesta.',
};

const HERO_EXTRAS: Pick<PortalPromoHeroExtras, 'mostrarBadgeVirtual' | 'virtualBadgeLabel' | 'theme'> & {
  imagenUrl: string;
  imagenAlt: string;
} = {
  mostrarBadgeVirtual: false,
  virtualBadgeLabel: 'VIRTUAL',
  theme: 'gold',
  imagenUrl: '',
  imagenAlt: '',
};

export const EVALUACION_JORNADAS_LANDING_DEFAULTS: PortalEvaluacionJornadasLanding = {
  hero: { ...HERO_TEXTS, ...HERO_EXTRAS },
};

export function mergeEvaluacionJornadasLanding(
  raw?: Partial<PortalEvaluacionJornadasLanding> | null,
): PortalEvaluacionJornadasLanding {
  const src = (raw?.hero && typeof raw.hero === 'object' ? raw.hero : {}) as Partial<
    PortalEvaluacionJornadasLanding['hero']
  >;
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
      imagenUrl: String(src.imagenUrl ?? '').trim(),
      imagenUrlAbsoluta: String(src.imagenUrlAbsoluta ?? '').trim() || undefined,
      imagenAlt: String(src.imagenAlt ?? '').trim(),
    },
  };
}
