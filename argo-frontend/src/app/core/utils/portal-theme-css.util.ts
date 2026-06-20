import {
  buildPortalThemeCssVars as buildAvThemeVars,
  isLightColor,
  PORTAL_TEMA_FINSTRUVIAL,
  withAlpha,
  type PortalTemaLike,
} from './portal-theme-css-base.util';

export {
  FINSTRUVIAL_DERIVED_CSS_VARS,
  isFinstruvialTema,
  isLightColor,
  PORTAL_TEMA_FINSTRUVIAL,
  withAlpha,
  type PortalTemaLike,
} from './portal-theme-css-base.util';

/** Variables --av-* + --pv-* para la vista previa del editor. */
export function buildPortalThemeCssVars(tema: PortalTemaLike | null | undefined): Record<string, string> {
  const av = buildAvThemeVars(tema);
  const primary = av['--av-primary'];
  const accent = av['--av-accent'];
  const bg = av['--av-bg'];
  const light = isLightColor(bg);

  return {
    ...av,
    '--pv-primary': primary,
    '--pv-primary-dark': av['--av-primary-dark'],
    '--pv-accent': accent,
    '--pv-bg': bg,
    '--pv-surface': av['--av-surface'],
    '--pv-text': av['--av-text'],
    '--pv-dim': av['--av-dim'],
    '--pv-font': av['--av-font-sans'],
    '--pv-hero-start': av['--av-hero-grad-start'],
    '--pv-hero-glow': withAlpha(primary, light ? 0.28 : 0.55),
    '--pv-hero-accent-glow': withAlpha(accent, light ? 0.2 : 0.25),
    '--pv-nav-active-bg': av['--av-primary-a22'],
    '--pv-highlight-ring': av['--av-accent-a35'],
    '--pv-quote-band': av['--av-quote-band-bg'],
    '--pv-faq-bg': av['--av-faq-bg'],
    '--pv-footer-bg': av['--av-footer-bg'],
  };
}
