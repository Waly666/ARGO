export interface PromoBannerPillar {
  icon: string;
  label: string;
}

export interface PromoBannerRibbonItem {
  icon: string;
  label: string;
}

export interface PromoBannerHighlight {
  icon: string;
  title: string;
  subtitle: string;
}

export type PromoBannerTheme = 'gold' | 'green' | 'violet' | 'blue';

export const PROMO_BANNER_RIBBON_DEFAULT: PromoBannerRibbonItem[] = [
  { icon: 'computer', label: '100% virtual' },
  { icon: 'document', label: 'Flexible a tu ritmo' },
  { icon: 'certificate', label: 'Certificación al finalizar' },
  { icon: 'trending-up', label: 'Contenido práctico' },
];

export const PROMO_BANNER_PILARES_INSTITUCION: PromoBannerPillar[] = [
  { icon: 'shield-check', label: 'Seguridad vial' },
  { icon: 'car', label: 'Formación certificada' },
  { icon: 'exclamation', label: 'Prevención de riesgos' },
  { icon: 'defensive', label: 'Conducción responsable' },
];
