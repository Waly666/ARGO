/** Página «Acerca de» — espejo de aulaVirtualAcercaDefaults.js */

import {
  mergePromoHeroExtras,
  mergePromoHeroPillars,
  mergePromoHeroTexts,
  promoHeroHighlightFromExtras,
  PROMO_HERO_PILARES_INSTITUCION,
  PortalPromoHeroHighlight,
  PortalPromoHeroPillar,
  PortalPromoHeroTexts,
} from './portal-promo-hero-fields.util';

export interface PortalAcercaValorItem {
  icon: string;
  title: string;
  text: string;
}

export interface PortalAcercaLanding {
  hero: PortalPromoHeroTexts & {
    lead: string;
    imagenUrl: string;
    imagenUrlAbsoluta?: string;
    imagenAlt: string;
    imagenCaption: string;
    pillarsLabel: string;
    pillars: PortalPromoHeroPillar[];
    mostrarBadgeVirtual: boolean;
    virtualBadgeLabel: string;
    highlightIcon: string;
    highlightTitle: string;
    highlightSubtitle: string;
  };
  quienes: {
    kicker: string;
    titulo: string;
    parrafos: string[];
  };
  cta: {
    texto: string;
    url: string;
  };
  contacto: {
    kicker: string;
    titulo: string;
    etiquetaDireccion: string;
    etiquetaTelefono: string;
    etiquetaCorreo: string;
    enlaceFundacionTexto: string;
    enlaceFundacionUrl: string;
  };
  valores: {
    kicker: string;
    titulo: string;
    lead: string;
    items: PortalAcercaValorItem[];
  };
}

const HERO_TEXTS: PortalPromoHeroTexts = {
  kicker: 'Formación vial',
  tituloLinea: 'Acerca de',
  tituloAcento: '',
  lead:
    'Conduce con responsabilidad, protege tu vida y la de los demás. Más de 28 años formando conductores en Colombia.',
};

const QUIENES_PARAGRAFOS_DEFAULT = [
  'Nuestro Centro de Enseñanza Automovilística lleva la formación vial en el corazón de su servicio.',
  'Somos su mejor opción en cursos de conducción, licencias y capacitación en seguridad vial para conductores, empresas e instituciones.',
  'Formamos conductores responsables con calidad certificada y acompañamiento profesional.',
];

const VALORES_ITEMS_DEFAULT: PortalAcercaValorItem[] = [
  {
    icon: 'star',
    title: 'Más de 28 años de experiencia',
    text: 'Años de experiencia práctica y una amplia gama de habilidades que nos hacen la mejor opción en seguridad vial para empresas y el sector público.',
  },
  {
    icon: 'globe',
    title: 'Formando una cultura vial responsable',
    text: 'Educamos, capacitamos y acompañamos a las comunidades para salvar vidas en las vías.',
  },
  {
    icon: 'user-group',
    title: 'Seguridad vial para todos',
    text: 'Promovemos la conciencia y la prevención vial a través de la educación, la investigación y la acción estratégica.',
  },
  {
    icon: 'target',
    title: 'Caminos seguros, futuro en movimiento',
    text: 'Diseñamos y ejecutamos planes integrales de seguridad vial que transforman la movilidad y protegen a las personas.',
  },
  {
    icon: 'heart',
    title: 'Educamos para salvar vidas',
    text: 'Impulsamos la formación, la planificación y las campañas que construyen una movilidad más segura y sostenible.',
  },
  {
    icon: 'car',
    title: 'Movilidad segura, compromiso de todos',
    text: 'Trabajamos junto a instituciones y ciudadanos para construir una cultura vial basada en el respeto, la prevención y la vida.',
  },
];

export const ACERCA_LANDING_DEFAULTS: PortalAcercaLanding = {
  hero: {
    ...HERO_TEXTS,
    imagenUrl: '',
    imagenAlt: '',
    imagenCaption: '',
    pillarsLabel: 'Fortalezas de la institución',
    pillars: PROMO_HERO_PILARES_INSTITUCION,
    mostrarBadgeVirtual: true,
    virtualBadgeLabel: 'VIRTUAL',
    highlightIcon: 'trophy',
    highlightTitle: '+28 años',
    highlightSubtitle: 'Formando conductores responsables, con metodología virtual y presencial.',
  },
  quienes: {
    kicker: 'Quiénes somos',
    titulo: 'Nuestra institución',
    parrafos: [...QUIENES_PARAGRAFOS_DEFAULT],
  },
  cta: {
    texto: 'Ver cursos virtuales',
    url: '/cursos',
  },
  contacto: {
    kicker: 'Contacto',
    titulo: 'Datos de contacto',
    etiquetaDireccion: 'Dirección',
    etiquetaTelefono: 'Teléfono',
    etiquetaCorreo: 'Correo',
    enlaceFundacionTexto: 'Conocer el CEA →',
    enlaceFundacionUrl: '/fundacion',
  },
  valores: {
    kicker: 'Lo que nos mueve',
    titulo: 'Nuestro compromiso',
    lead: 'Educamos para salvar vidas y construir una cultura vial responsable.',
    items: VALORES_ITEMS_DEFAULT.map((v) => ({ ...v })),
  },
};

function mergeParrafos(raw: string[] | undefined, defaults: string[]): string[] {
  if (!Array.isArray(raw) || !raw.length) return [...defaults];
  return raw.map((p, i) => String(p ?? defaults[i] ?? '').trim()).filter(Boolean);
}

function mergeValoresItems(
  raw: PortalAcercaValorItem[] | undefined,
  defaults: PortalAcercaValorItem[],
): PortalAcercaValorItem[] {
  if (!Array.isArray(raw) || !raw.length) return defaults.map((v) => ({ ...v }));
  return raw.map((item, i) => ({
    icon: String(item?.icon ?? defaults[i]?.icon ?? 'star').trim() || 'star',
    title: String(item?.title ?? defaults[i]?.title ?? '').trim() || defaults[i]?.title || '',
    text: String(item?.text ?? defaults[i]?.text ?? '').trim() || defaults[i]?.text || '',
  }));
}

export function mergeAcercaLanding(raw?: Partial<PortalAcercaLanding> | null): PortalAcercaLanding {
  const d = ACERCA_LANDING_DEFAULTS;
  const src = raw && typeof raw === 'object' ? raw : {};
  const heroSrc: Partial<PortalAcercaLanding['hero']> =
    src.hero && typeof src.hero === 'object' ? src.hero : {};
  const quienesSrc: Partial<PortalAcercaLanding['quienes']> =
    src.quienes && typeof src.quienes === 'object' ? src.quienes : {};
  const ctaSrc: Partial<PortalAcercaLanding['cta']> =
    src.cta && typeof src.cta === 'object' ? src.cta : {};
  const contactoSrc: Partial<PortalAcercaLanding['contacto']> =
    src.contacto && typeof src.contacto === 'object' ? src.contacto : {};
  const valoresSrc: Partial<PortalAcercaLanding['valores']> =
    src.valores && typeof src.valores === 'object' ? src.valores : {};

  const texts = mergePromoHeroTexts(heroSrc, HERO_TEXTS);
  const extras = mergePromoHeroExtras(
    {
      pillarsLabel: heroSrc.pillarsLabel,
      pillars: heroSrc.pillars,
      mostrarBadgeVirtual: heroSrc.mostrarBadgeVirtual,
      virtualBadgeLabel: heroSrc.virtualBadgeLabel,
      highlightIcon: heroSrc.highlightIcon,
      highlightTitle: heroSrc.highlightTitle,
      highlightSubtitle: heroSrc.highlightSubtitle,
    },
    {
      pillarsLabel: d.hero.pillarsLabel,
      pillars: d.hero.pillars,
      mostrarBadgeVirtual: d.hero.mostrarBadgeVirtual,
      virtualBadgeLabel: d.hero.virtualBadgeLabel,
      backLabel: '',
      theme: 'green',
      stats: [],
      highlightIcon: d.hero.highlightIcon,
      highlightTitle: d.hero.highlightTitle,
      highlightSubtitle: d.hero.highlightSubtitle,
      ctaPrincipal: '',
      ctaPrincipalUrl: '',
      ctaSecundario: '',
      ctaSecundarioUrl: '',
    },
  );

  const str = (v: unknown, fb: string) => String(v ?? fb).trim() || fb;

  return {
    hero: {
      ...texts,
      lead: str(heroSrc.lead, d.hero.lead),
      imagenUrl: str(heroSrc.imagenUrl, d.hero.imagenUrl),
      imagenUrlAbsoluta: heroSrc.imagenUrlAbsoluta?.trim() || d.hero.imagenUrlAbsoluta,
      imagenAlt: str(heroSrc.imagenAlt, d.hero.imagenAlt),
      imagenCaption: str(heroSrc.imagenCaption, d.hero.imagenCaption),
      pillarsLabel: extras.pillarsLabel,
      pillars: mergePromoHeroPillars(heroSrc.pillars, d.hero.pillars),
      mostrarBadgeVirtual: extras.mostrarBadgeVirtual,
      virtualBadgeLabel: extras.virtualBadgeLabel,
      highlightIcon: extras.highlightIcon,
      highlightTitle: extras.highlightTitle,
      highlightSubtitle: extras.highlightSubtitle,
    },
    quienes: {
      kicker: str(quienesSrc.kicker, d.quienes.kicker),
      titulo: str(quienesSrc.titulo, d.quienes.titulo),
      parrafos: mergeParrafos(quienesSrc.parrafos, d.quienes.parrafos),
    },
    cta: {
      texto: str(ctaSrc.texto, d.cta.texto),
      url: str(ctaSrc.url, d.cta.url) || d.cta.url,
    },
    contacto: {
      kicker: str(contactoSrc.kicker, d.contacto.kicker),
      titulo: str(contactoSrc.titulo, d.contacto.titulo),
      etiquetaDireccion: str(contactoSrc.etiquetaDireccion, d.contacto.etiquetaDireccion),
      etiquetaTelefono: str(contactoSrc.etiquetaTelefono, d.contacto.etiquetaTelefono),
      etiquetaCorreo: str(contactoSrc.etiquetaCorreo, d.contacto.etiquetaCorreo),
      enlaceFundacionTexto: str(contactoSrc.enlaceFundacionTexto, d.contacto.enlaceFundacionTexto),
      enlaceFundacionUrl: str(contactoSrc.enlaceFundacionUrl, d.contacto.enlaceFundacionUrl) || d.contacto.enlaceFundacionUrl,
    },
    valores: {
      kicker: str(valoresSrc.kicker, d.valores.kicker),
      titulo: str(valoresSrc.titulo, d.valores.titulo),
      lead: str(valoresSrc.lead, d.valores.lead),
      items: mergeValoresItems(valoresSrc.items, d.valores.items),
    },
  };
}

/** Migra texto legacy `acercaDeHtml` a párrafos si aún no hay contenido guardado en landing. */
export function acercaParrafosFromLegacy(
  acerca: PortalAcercaLanding,
  legacyHtml?: string | null,
  rawAcerca?: Partial<PortalAcercaLanding> | null,
): string[] {
  const hasExplicitParrafos =
    rawAcerca?.quienes &&
    Array.isArray(rawAcerca.quienes.parrafos) &&
    rawAcerca.quienes.parrafos.length > 0;
  if (hasExplicitParrafos) return acerca.quienes.parrafos;
  const raw = legacyHtml?.trim();
  if (!raw) return acerca.quienes.parrafos;
  return raw
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function acercaHeroHighlight(hero: PortalAcercaLanding['hero']): PortalPromoHeroHighlight | null {
  return promoHeroHighlightFromExtras(hero);
}
