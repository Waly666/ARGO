import {
  applyNombreCeaHeroText,
  mergePromoHeroExtras,
  mergePromoHeroTexts,
  PortalPromoHeroExtras,
  PortalPromoHeroTexts,
} from './portal-promo-hero-fields.util';

export interface PortalPqrLanding {
  hero: PortalPromoHeroTexts &
    Pick<
      PortalPromoHeroExtras,
      'mostrarBadgeVirtual' | 'virtualBadgeLabel' | 'theme'
    >;
}

const HERO_TEXTS: PortalPromoHeroTexts = {
  kicker: 'PQRSF',
  tituloLinea: 'Peticiones, Quejas, Reclamos,',
  tituloAcento: 'Sugerencias y Felicitaciones',
  lead:
    'En {nombreCea} nos comprometemos a atender y dar respuesta oportuna a todas sus solicitudes.',
};

const HERO_EXTRAS: Pick<PortalPromoHeroExtras, 'mostrarBadgeVirtual' | 'virtualBadgeLabel' | 'theme'> = {
  mostrarBadgeVirtual: false,
  virtualBadgeLabel: 'VIRTUAL',
  theme: 'gold',
};

export const PQR_LANDING_DEFAULTS: PortalPqrLanding = {
  hero: { ...HERO_TEXTS, ...HERO_EXTRAS },
};

export function mergePqrLanding(raw?: Partial<PortalPqrLanding> | null): PortalPqrLanding {
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

export function pqrHeroLead(lead: string, nombreCea: string): string {
  return applyNombreCeaHeroText(lead, nombreCea);
}
