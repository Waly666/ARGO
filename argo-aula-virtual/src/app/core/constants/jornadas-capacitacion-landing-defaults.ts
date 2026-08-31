import {
  mergePromoHeroExtras,
  mergePromoHeroTexts,
  PROMO_HERO_PILARES_JORNADAS,
  PortalPromoHeroExtras,
  PortalPromoHeroTexts,
} from './portal-promo-hero-fields.util';

export interface PortalJornadasCapacitacionLanding {
  hero: PortalPromoHeroTexts &
    Pick<
      PortalPromoHeroExtras,
      | 'pillarsLabel'
      | 'pillars'
      | 'mostrarBadgeVirtual'
      | 'virtualBadgeLabel'
      | 'theme'
      | 'ctaPrincipal'
      | 'ctaPrincipalUrl'
      | 'ctaSecundario'
      | 'ctaSecundarioUrl'
    >;
}

const HERO_TEXTS: PortalPromoHeroTexts = {
  kicker: 'Formación presencial',
  tituloLinea: 'Jornadas de',
  tituloAcento: 'Capacitación',
  lead:
    'Actividades experienciales en seguridad vial, en espacios tipo carpa. Inscríbase en línea y reciba su código QR de asistencia.',
};

const HERO_EXTRAS: Pick<
  PortalPromoHeroExtras,
  | 'pillarsLabel'
  | 'pillars'
  | 'mostrarBadgeVirtual'
  | 'virtualBadgeLabel'
  | 'theme'
  | 'ctaPrincipal'
  | 'ctaPrincipalUrl'
  | 'ctaSecundario'
  | 'ctaSecundarioUrl'
> = {
  pillarsLabel: 'Características de las jornadas',
  pillars: PROMO_HERO_PILARES_JORNADAS,
  mostrarBadgeVirtual: false,
  virtualBadgeLabel: 'VIRTUAL',
  theme: 'gold',
  ctaPrincipal: 'Inscribirme ahora',
  ctaPrincipalUrl: '#inscripcion',
  ctaSecundario: 'Prefiero el aula virtual',
  ctaSecundarioUrl: '/registro',
};

export const JORNADAS_CAPACITACION_LANDING_DEFAULTS: PortalJornadasCapacitacionLanding = {
  hero: { ...HERO_TEXTS, ...HERO_EXTRAS },
};

export function mergeJornadasCapacitacionLanding(
  raw?: Partial<PortalJornadasCapacitacionLanding> | null,
): PortalJornadasCapacitacionLanding {
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
    },
  };
}
