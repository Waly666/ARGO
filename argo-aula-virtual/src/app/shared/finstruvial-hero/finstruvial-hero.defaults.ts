export interface FinstruvialHeroHighlight {
  icon: string;
  title: string;
  subtitle: string;
}

/** Textos por defecto del hero Finstruvial (plantilla azul profundo). */
export const FINSTRUVIAL_HERO_DEFAULTS = {
  instBarRight: 'Cursos y programas de capacitación virtual en Colombia',
  eyebrow: 'CAPACITACIÓN EN SEGURIDAD VIAL',
  h1: 'Formación Especializada en Tránsito, Transporte y Seguridad Vial',
  lead:
    'Desarrolla competencias para una movilidad más segura. FINSTRUVIAL ofrece formación virtual, presencial y mixta para estudiantes, conductores, empresas, autoridades, profesionales y ciudadanos.',
  ctaPrimary: 'Ver cursos y programas',
  ctaPrimaryUrl: '/cursos',
  ctaSecondary: 'Crear cuenta gratis',
  ctaSecondaryUrl: '/registro',
  ctaTertiary: 'Solicitar información',
  ctaTertiaryUrl: '/acerca',
  bgAsset: 'assets/img/hero-finstruvial-bg.png',
} as const;

export const FINSTRUVIAL_HERO_HIGHLIGHT_DEFAULTS = {
  highlightIcon: 'shield-check',
  highlightTitle: 'Desarrolla competencias para una movilidad más segura.',
  highlightSubtitle:
    'FINSTRUVIAL ofrece formación virtual, presencial y mixta para estudiantes, conductores, empresas, autoridades, profesionales y ciudadanos.',
  highlightRadar: true,
} as const;

export function splitFinstruvialHeroLeadToHighlight(lead: string): FinstruvialHeroHighlight | null {
  const text = lead.trim();
  if (!text) return null;
  const dot = text.indexOf('.');
  if (dot > 0 && dot < text.length - 1) {
    return {
      icon: FINSTRUVIAL_HERO_HIGHLIGHT_DEFAULTS.highlightIcon,
      title: text.slice(0, dot + 1).trim(),
      subtitle: text.slice(dot + 1).trim(),
    };
  }
  return {
    icon: FINSTRUVIAL_HERO_HIGHLIGHT_DEFAULTS.highlightIcon,
    title: text,
    subtitle: '',
  };
}

export function splitFinstruvialHeroTitle(title: string): { line1: string; line2: string } {
  const full = title.trim();
  if (!full) {
    return { line1: FINSTRUVIAL_HERO_DEFAULTS.h1, line2: '' };
  }
  const comma = full.indexOf(',');
  if (comma > 0) {
    return {
      line1: full.slice(0, comma + 1).trim(),
      line2: full.slice(comma + 1).trim(),
    };
  }
  const words = full.split(/\s+/);
  if (words.length <= 4) {
    return { line1: full, line2: '' };
  }
  const half = Math.ceil(words.length / 2);
  return {
    line1: words.slice(0, half).join(' '),
    line2: words.slice(half).join(' '),
  };
}
