import { radii as tokenRadii, layout } from './tokens';

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: layout.screen,
  xl: 20,
  xxl: layout.section,
  xxxl: 32,
} as const;

export const radius = {
  sm: tokenRadii.sm,
  md: tokenRadii.md,
  lg: tokenRadii.lg,
  xl: tokenRadii.xl,
  pill: tokenRadii.pill,
} as const;
