import { portalFontBody, portalFontDisplay } from './portal-fonts.util';

/** Variables CSS derivadas del tema del portal (sitio público). */

export interface PortalTemaLike {
  colorPrimario?: string;
  colorPrimarioOscuro?: string;
  colorAcento?: string;
  colorFondo?: string;
  colorSuperficie?: string;
  colorTexto?: string;
  colorTextoSecundario?: string;
  fuente?: string;
  fuenteTitulos?: string;
  heroEstilo?: 'starfield' | 'servial-mesh';
}

export const PORTAL_TEMA_FINSTRUVIAL: Required<Omit<PortalTemaLike, 'fuente' | 'fuenteTitulos'>> & {
  fuente: string;
  fuenteTitulos?: string;
} = {
  colorPrimario: '#3b82f6',
  colorPrimarioOscuro: '#1d4ed8',
  colorAcento: '#22d3ee',
  colorFondo: '#0b1224',
  colorSuperficie: '#121c33',
  colorTexto: '#eef3ff',
  colorTextoSecundario: '#9fb0d0',
  fuente: 'Plus Jakarta Sans',
  fuenteTitulos: '',
  heroEstilo: 'starfield',
};

/** Derivados idénticos al CSS publicado en https://finstruvial.edu.co/ */
export const FINSTRUVIAL_DERIVED_CSS_VARS: Record<string, string> = {
  '--av-brand': '#4338ca',
  '--av-surface-2': '#1a2744',
  '--av-border-strong': 'rgba(148, 163, 184, 0.45)',
  '--av-dark-lead': '#b6c5e8',
  '--av-dark-body': '#a8b8d8',
  '--av-footer-muted': '#94a3b8',
  '--av-footer-text': '#cbd5e1',
  '--av-starfield-glow': 'rgba(37, 99, 235, 0.5)',
  '--av-starfield-top': '#101b3c',
  '--av-starfield-mid': '#0a1130',
  '--av-starfield-bottom': '#070d26',
  '--av-starfield-bg':
    'radial-gradient(ellipse 90% 70% at 50% 30%, rgba(37, 99, 235, 0.5), transparent 70%), linear-gradient(180deg, #101b3c 0%, #0a1130 55%, #070d26 100%)',
  '--av-starfield-accent-glow': 'rgba(34, 211, 238, 0.16)',
  '--av-starfield-accent-glow-radial':
    'radial-gradient(circle, rgba(34, 211, 238, 0.16) 0%, rgba(34, 211, 238, 0.05) 38%, transparent 68%)',
  '--av-starfield-section-lead': '#b6c5e8',
  '--av-hero-bg':
    'radial-gradient(ellipse 90% 70% at 50% 30%, rgba(37, 99, 235, 0.5), transparent 70%), linear-gradient(180deg, #101b3c 0%, #0a1130 55%, #070d26 100%)',
  '--av-hero-grad-start': 'rgba(29, 78, 216, 0.92)',
  '--av-hero-grad-end': '#0b1224',
  '--av-page-hero-bg': 'linear-gradient(135deg, #030712 0%, #0b1224 45%, #0f172a 100%)',
  '--av-card-wave-a': 'rgba(34, 211, 238, 0.75)',
  '--av-card-wave-b': 'rgba(59, 130, 246, 0.5)',
  '--av-card-wave-light-a': 'rgba(37, 99, 235, 0.65)',
  '--av-card-wave-light-b': 'rgba(34, 211, 238, 0.55)',
  '--av-card-wave-dark-a': 'rgba(186, 230, 253, 0.95)',
  '--av-card-wave-dark-b': 'rgba(34, 211, 238, 0.78)',
  '--av-btn-accent-bg': 'linear-gradient(135deg, #34d399, #14b8a6)',
  '--av-title-underline-light': 'linear-gradient(90deg, #1d4ed8, #0891b2)',
};

function hexKey(hex: string): string | null {
  const n = normalizeHex(hex);
  return n ? n.toLowerCase() : null;
}

export function isFinstruvialTema(tema: PortalTemaLike | null | undefined): boolean {
  const t = resolveTema(tema);
  const f = PORTAL_TEMA_FINSTRUVIAL;
  return (
    hexKey(t.colorPrimario) === hexKey(f.colorPrimario) &&
    hexKey(t.colorPrimarioOscuro) === hexKey(f.colorPrimarioOscuro) &&
    hexKey(t.colorAcento) === hexKey(f.colorAcento) &&
    hexKey(t.colorFondo) === hexKey(f.colorFondo) &&
    hexKey(t.colorSuperficie) === hexKey(f.colorSuperficie) &&
    hexKey(t.colorTexto) === hexKey(f.colorTexto) &&
    hexKey(t.colorTextoSecundario) === hexKey(f.colorTextoSecundario) &&
    String(t.fuente || f.fuente).trim().toLowerCase() === f.fuente.toLowerCase()
  );
}

function normalizeHex(hex: string): string | null {
  const raw = String(hex || '').trim().replace('#', '');
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return raw
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return raw;
  return null;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

export function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function mixHex(a: string, b: string, weightB: number): string {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return a;
  const w = Math.max(0, Math.min(1, weightB));
  const ch = (i: number) => Math.round(ra[i] * (1 - w) + rb[i] * w);
  return `#${[ch(0), ch(1), ch(2)].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

function darkenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const f = (n: number) => Math.max(0, Math.min(255, Math.round(n * (1 - amount))));
  return `#${[f(rgb[0]), f(rgb[1]), f(rgb[2])].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return lum > 0.58;
}

function resolveTema(tema: PortalTemaLike | null | undefined) {
  return { ...PORTAL_TEMA_FINSTRUVIAL, ...tema };
}

export const PORTAL_BRAND_GREEN = '#33dd6f';
export const PORTAL_BRAND_LIME = '#AEE929';

const AMBER_LIKE_ACCENTS = new Set([
  '#ffd200',
  '#d9d314',
  '#f5b417',
  '#fbbf24',
  '#f59e0b',
  '#eab308',
  '#facc15',
  '#ca8a04',
  '#ea580c',
]);

function resolvePortalHeroEstilo(tema: PortalTemaLike | null | undefined): 'starfield' | 'servial-mesh' {
  const explicit = tema?.heroEstilo;
  if (explicit === 'servial-mesh' || explicit === 'starfield') return explicit;
  const accent = tema?.colorAcento?.toLowerCase();
  const fuente = tema?.fuente?.toLowerCase() ?? '';
  const primOscuro = tema?.colorPrimarioOscuro?.toLowerCase();
  if (
    (accent === '#ffd200' || accent === '#aee929' || accent === '#d9d314') &&
    (fuente.includes('poppins') || fuente.includes('figtree')) &&
    (primOscuro === '#000000' || primOscuro === '#04060c' || primOscuro === '#0a0a0a')
  ) {
    return 'servial-mesh';
  }
  return 'starfield';
}

function resolvePortalUiAccent(
  accent: string,
  opts?: { heroEstilo?: 'starfield' | 'servial-mesh' },
): string {
  const key = accent.toLowerCase();
  if (opts?.heroEstilo === 'servial-mesh' || AMBER_LIKE_ACCENTS.has(key)) {
    return key === PORTAL_BRAND_GREEN.toLowerCase() ? accent : PORTAL_BRAND_GREEN;
  }
  return accent;
}

/** Genera todas las variables --av-* aplicadas en :root al cargar el portal. */
export function buildPortalThemeCssVars(tema: PortalTemaLike | null | undefined): Record<string, string> {
  const t = resolveTema(tema);
  const heroEstilo = resolvePortalHeroEstilo(t);
  const primary = t.colorPrimario;
  const primaryDark = t.colorPrimarioOscuro;
  const accent = resolvePortalUiAccent(t.colorAcento, { heroEstilo });
  const bg = t.colorFondo;
  const surface = t.colorSuperficie;
  const text = t.colorTexto;
  const dim = t.colorTextoSecundario;
  const light = isLightColor(bg);
  const fontBody = portalFontBody(t);
  const fontDisplay = portalFontDisplay(t);
  const fontStack = `'${fontBody}', system-ui, sans-serif`;
  const displayStack = `'${fontDisplay}', system-ui, sans-serif`;
  const surface2 = mixHex(surface, primaryDark, 0.28);
  const pageHeroStart = darkenHex(bg, 0.35);
  const footerEnd = darkenHex(bg, 0.55);

  const starfieldTop = light ? bg : surface;
  const starfieldBottom = light ? withAlpha(primary, 0.08) : primaryDark;
  const heroStart = light ? withAlpha(primary, 0.18) : withAlpha(primaryDark, 0.92);
  const starfieldMid = light ? bg : mixHex(bg, surface, 0.45);
  const starfieldBottomGeneric = light ? withAlpha(primaryDark, 0.12) : darkenHex(bg, 0.18);

  const vars: Record<string, string> = {
    '--av-primary': primary,
    '--av-primary-dark': primaryDark,
    '--av-accent': accent,
    '--av-bg': bg,
    '--av-surface': surface,
    '--av-surface-2': surface2,
    '--av-text': text,
    '--av-dim': dim,
    '--av-text-muted': dim,
    '--av-brand': primary,
    '--av-ink': light ? mixHex('#0f172a', primaryDark, 0.15) : '#0f172a',
    '--av-ink-muted': light ? mixHex('#475569', dim, 0.2) : dim,
    '--av-dark-lead': dim,
    '--av-dark-body': mixHex(dim, text, 0.35),
    '--av-footer-muted': dim,
    '--av-footer-text': mixHex(dim, text, 0.45),
    '--av-border': withAlpha(dim, 0.35),
    '--av-border-strong': withAlpha(accent, 0.35),
    '--av-font-sans': fontStack,
    '--av-font-display': displayStack,

    '--av-starfield-top': starfieldTop,
    '--av-starfield-mid': light ? bg : starfieldMid,
    '--av-starfield-bottom': light ? withAlpha(primary, 0.08) : starfieldBottomGeneric,
    '--av-starfield-glow': withAlpha(primary, light ? 0.2 : 0.5),
    '--av-starfield-accent-glow': withAlpha(accent, light ? 0.14 : 0.2),
    '--av-starfield-section-lead': dim,
    '--av-hero-grad-start': heroStart,
    '--av-hero-grad-end': bg,

    '--av-page-hero-bg': `linear-gradient(135deg, ${pageHeroStart} 0%, ${bg} 45%, ${surface2} 100%)`,
    '--av-page-hero-glow': withAlpha(accent, 0.18),
    '--av-page-hero-kicker-bg': withAlpha(accent, 0.12),
    '--av-page-hero-kicker-border': withAlpha(accent, 0.3),
    '--av-page-hero-kicker-text': accent,

    '--av-section-light-bg': `color-mix(in srgb, ${primary} 5.5%, #f8fafc)`,
    '--av-section-light-text': '#0f172a',
    '--av-section-light-muted': mixHex('#475569', primaryDark, 0.12),
    '--av-section-light-link': primaryDark,
    '--av-section-light-border': withAlpha(primary, 0.35),
    '--av-section-light-chip-border': withAlpha(primary, 0.28),
    '--av-section-light-chip-hover': withAlpha(primary, 0.12),

    '--av-section-white-kicker': mixHex(primaryDark, accent, 0.25),

    '--av-quote-band-bg': `linear-gradient(90deg, ${primaryDark}, ${mixHex(primaryDark, accent, 0.55)})`,

    '--av-faq-bg': `radial-gradient(ellipse 85% 65% at 50% 20%, ${withAlpha(primary, 0.42)}, transparent 70%), linear-gradient(180deg, ${starfieldTop} 0%, ${bg} 55%, ${starfieldBottom} 100%)`,
    '--av-faq-glow': withAlpha(accent, 0.12),
    '--av-faq-panel-bg': `linear-gradient(165deg, ${withAlpha(surface, 0.72)}, ${withAlpha(bg, 0.72)})`,
    '--av-faq-panel-border': withAlpha(dim, 0.28),
    '--av-faq-open-text': accent,
    '--av-faq-icon-bg': `linear-gradient(150deg, ${accent}, ${primaryDark})`,
    '--av-faq-icon-shadow': withAlpha(accent, 0.35),

    '--av-footer-bg': `radial-gradient(ellipse 70% 60% at 0% 100%, ${withAlpha(primary, 0.14)}, transparent), radial-gradient(ellipse 50% 40% at 100% 0%, ${withAlpha(accent, 0.1)}, transparent), linear-gradient(180deg, ${bg} 0%, ${surface2} 55%, ${footerEnd} 100%)`,
    '--av-footer-glow-line': `linear-gradient(90deg, ${primary}, ${accent}, ${mixHex(accent, primary, 0.4)}, ${primary})`,
    '--av-footer-link-hover': accent,
    '--av-footer-badge-bg': withAlpha(accent, 0.1),
    '--av-footer-badge-border': withAlpha(accent, 0.28),
    '--av-footer-badge-text': accent,

    '--av-card-wave-a': withAlpha(accent, 0.75),
    '--av-card-wave-b': withAlpha(primary, 0.5),
    '--av-card-wave-dark-a': withAlpha(accent, 0.88),
    '--av-card-wave-dark-b': withAlpha(primary, 0.65),
    '--av-card-wave-light-a': withAlpha(primary, 0.65),
    '--av-card-wave-light-b': withAlpha(accent, 0.55),

    '--av-btn-primary-shadow': withAlpha(primary, 0.28),
    '--av-btn-primary-shadow-hover': withAlpha(primary, 0.38),
    '--av-btn-primary-bg': `linear-gradient(135deg, ${primaryDark} 0%, ${accent} 100%)`,
    '--av-btn-primary-text': '#ffffff',
    '--av-btn-outline-hover-bg': withAlpha(accent, 0.08),
    '--av-btn-outline-hover-bg-soft': withAlpha(accent, 0.06),
    '--av-btn-accent-bg': `linear-gradient(135deg, ${mixHex(accent, '#34d399', 0.35)}, ${accent})`,
    '--av-btn-gradient': `linear-gradient(135deg, ${primaryDark} 0%, ${accent} 100%)`,
    '--av-btn-gradient-alt': `linear-gradient(135deg, ${mixHex(primaryDark, bg, 0.35)}, ${primaryDark})`,

    '--av-hero-accent-glow': withAlpha(accent, 0.45),
    '--av-hero-title-shimmer': mixHex(accent, '#ffffff', 0.75),
    '--av-hero-info-card-bg': `linear-gradient(145deg, ${mixHex('#e0f2fe', accent, 0.35)} 0%, ${mixHex('#dbeafe', primary, 0.3)} 48%, ${mixHex('#bfdbfe', primaryDark, 0.25)} 100%)`,
    '--av-hero-info-card-border': withAlpha(accent, 0.45),
    '--av-hero-info-card-glow': withAlpha(accent, 0.12),
    '--av-hero-info-card-glow-hover': withAlpha(accent, 0.28),
    '--av-hero-info-card-border-hover': withAlpha(accent, 0.85),
    '--av-hero-info-card-title': `linear-gradient(90deg, ${darkenHex(primaryDark, 0.12)} 0%, ${primaryDark} 55%, ${mixHex(primaryDark, accent, 0.4)} 100%)`,

    '--av-title-glow': withAlpha(accent, 0.35),
    '--av-title-underline-light': `linear-gradient(90deg, ${primaryDark}, ${mixHex(primaryDark, accent, 0.45)})`,
    '--av-link-primary': primaryDark,

    '--av-page-body-light-bg': `linear-gradient(180deg, ${mixHex('#eef2ff', primary, 0.08)} 0%, ${mixHex('#f0f9ff', accent, 0.06)} 40%, ${mixHex('#ecfeff', accent, 0.04)} 100%)`,
    '--av-blog-page-bg': `linear-gradient(180deg, ${mixHex('#eef2ff', primary, 0.08)} 0%, #f8fafc 20%, #fff 100%)`,

    '--av-app-phone-screen-bg': `linear-gradient(180deg, ${surface} 0%, ${bg} 100%)`,
    '--av-app-phone-bezel-bg': `linear-gradient(145deg, ${mixHex(surface, '#ffffff', 0.08)} 0%, ${darkenHex(bg, 0.15)} 55%, ${surface2} 100%)`,

    '--av-primary-a06': withAlpha(primary, 0.06),
    '--av-primary-a12': withAlpha(primary, 0.12),
    '--av-primary-a15': withAlpha(primary, 0.15),
    '--av-primary-a18': withAlpha(primary, 0.18),
    '--av-primary-a22': withAlpha(primary, 0.22),
    '--av-primary-a28': withAlpha(primary, 0.28),
    '--av-primary-a30': withAlpha(primary, 0.3),
    '--av-primary-a35': withAlpha(primary, 0.35),
    '--av-primary-a38': withAlpha(primary, 0.38),
    '--av-primary-a42': withAlpha(primary, 0.42),
    '--av-primary-a45': withAlpha(primary, 0.45),
    '--av-primary-a50': withAlpha(primary, 0.5),

    '--av-accent-a08': withAlpha(accent, 0.08),
    '--av-accent-a12': withAlpha(accent, 0.12),
    '--av-accent-a14': withAlpha(accent, 0.14),
    '--av-accent-a18': withAlpha(accent, 0.18),
    '--av-accent-a22': withAlpha(accent, 0.22),
    '--av-accent-a25': withAlpha(accent, 0.25),
    '--av-accent-a28': withAlpha(accent, 0.28),
    '--av-accent-a30': withAlpha(accent, 0.3),
    '--av-accent-a35': withAlpha(accent, 0.35),
    '--av-accent-a45': withAlpha(accent, 0.45),
    '--av-accent-a85': withAlpha(accent, 0.85),

    '--av-app-mobile-glow': `radial-gradient(circle, ${withAlpha(accent, 0.22)} 0%, ${withAlpha(primary, 0.08)} 45%, transparent 70%)`,
    '--av-app-mobile-icon-bg': withAlpha(accent, 0.12),
    '--av-app-mobile-icon-border': withAlpha(accent, 0.25),
    '--av-app-mobile-download-shadow': withAlpha(primary, 0.35),
    '--av-app-mobile-download-shadow-hover': withAlpha(primary, 0.45),

    '--dash-primary': primary,
    '--dash-primary-hover': primaryDark,
    '--dash-accent': accent,

    '--av-fundacion-cta-bg': `linear-gradient(120deg, ${primaryDark} 0%, ${primary} 55%, ${accent} 100%)`,
  };

  vars['--av-starfield-bg'] =
    `radial-gradient(ellipse 90% 70% at 50% 30%, ${vars['--av-starfield-glow']}, transparent 70%), linear-gradient(180deg, ${vars['--av-starfield-top']} 0%, ${vars['--av-starfield-mid']} 55%, ${vars['--av-starfield-bottom']} 100%)`;
  vars['--av-starfield-accent-glow-radial'] =
    `radial-gradient(circle, ${withAlpha(accent, 0.16)} 0%, ${withAlpha(accent, 0.05)} 38%, transparent 68%)`;
  vars['--av-hero-bg'] =
    `radial-gradient(ellipse 85% 65% at 18% 42%, ${vars['--av-starfield-glow']}, transparent 68%), linear-gradient(135deg, ${vars['--av-hero-grad-start']} 0%, ${vars['--av-hero-grad-end']} 78%)`;

  if (heroEstilo === 'servial-mesh') {
    const brandGreen = PORTAL_BRAND_GREEN;
    const brandLime = PORTAL_BRAND_LIME;
    vars['--av-nav-link'] = '#ffffff';
    vars['--av-nav-link-hover'] = brandGreen;
    vars['--av-topbar-bg'] = 'rgba(10, 10, 10, 0.82)';
    vars['--av-topbar-border'] = 'rgba(51, 221, 111, 0.22)';
    vars['--av-inst-bar-bg'] = `linear-gradient(90deg, ${primaryDark} 0%, ${surface} 100%)`;
    vars['--av-hero-bg'] = 'transparent';
    vars['--av-hero-title-shimmer'] = brandGreen;
    vars['--av-quote-band-bg'] = `linear-gradient(90deg, ${primaryDark} 0%, ${primary} 50%, ${brandGreen} 100%)`;
    vars['--av-btn-primary-bg'] = `linear-gradient(90deg, ${brandLime} 0%, ${brandGreen} 100%)`;
    vars['--av-btn-primary-text'] = '#0a0a0a';
    vars['--av-fundacion-cta-bg'] = `linear-gradient(120deg, ${primaryDark} 0%, ${primary} 50%, ${brandGreen} 100%)`;
    vars['--av-starfield-glow'] = withAlpha(brandGreen, 0.2);
    vars['--av-page-hero-kicker-text'] = brandGreen;
  }

  if (isFinstruvialTema(t)) {
    return { ...vars, ...FINSTRUVIAL_DERIVED_CSS_VARS };
  }
  return vars;
}
