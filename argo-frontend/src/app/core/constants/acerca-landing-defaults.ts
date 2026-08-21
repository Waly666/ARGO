/** Página «Acerca de» — espejo de aulaVirtualAcercaDefaults.js */

export interface PortalAcercaLanding {
  hero: {
    kicker: string;
    lead: string;
    imagenUrl: string;
    imagenUrlAbsoluta?: string;
    imagenAlt: string;
    imagenCaption: string;
  };
}

export const ACERCA_LANDING_DEFAULTS: PortalAcercaLanding = {
  hero: {
    kicker: 'Instituto técnico y seguridad vial',
    lead:
      'Formación, consultoría y campañas de seguridad vial con más de 28 años de experiencia en Colombia.',
    imagenUrl: '',
    imagenAlt: '',
    imagenCaption: '',
  },
};

export function mergeAcercaLanding(raw?: Partial<PortalAcercaLanding> | null): PortalAcercaLanding {
  const d = ACERCA_LANDING_DEFAULTS;
  const src = raw && typeof raw === 'object' ? raw : {};
  const heroSrc: Partial<PortalAcercaLanding['hero']> =
    src.hero && typeof src.hero === 'object' ? src.hero : {};
  return {
    hero: {
      kicker: heroSrc.kicker?.trim() || d.hero.kicker,
      lead: heroSrc.lead?.trim() || d.hero.lead,
      imagenUrl: heroSrc.imagenUrl?.trim() || d.hero.imagenUrl,
      imagenUrlAbsoluta: heroSrc.imagenUrlAbsoluta?.trim() || d.hero.imagenUrlAbsoluta,
      imagenAlt: heroSrc.imagenAlt?.trim() || d.hero.imagenAlt,
      imagenCaption: heroSrc.imagenCaption?.trim() || d.hero.imagenCaption,
    },
  };
}
