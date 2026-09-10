import type { PortalLandingConfig } from '../constants/portal-landing-defaults';

/** Textos del inicio que forman la plantilla Servial personalizable. */
export type ServialPlantillaInicioSnapshot = Partial<
  Pick<
    PortalLandingConfig,
    | 'instBarTag'
    | 'quoteText'
    | 'quoteLabel'
    | 'metaDescription'
    | 'metaKeywords'
    | 'hero'
    | 'ofertas'
    | 'beneficios'
    | 'licencias'
    | 'servicios'
    | 'valores'
    | 'testimonios'
    | 'pasos'
    | 'faq'
    | 'cursos'
    | 'catalogo'
    | 'infoCards'
    | 'pilares'
    | 'footerServicios'
    | 'carreras'
  >
>;

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function buildServialLandingDefaults(
  factory: PortalLandingConfig,
  raw?: Partial<PortalLandingConfig> | null,
): PortalLandingConfig {
  const snap = raw?.servialPlantillaBase as ServialPlantillaInicioSnapshot | undefined;
  if (!snap) return clone(factory);

  return {
    ...factory,
    instBarTag: snap.instBarTag?.trim() || factory.instBarTag,
    quoteText: snap.quoteText?.trim() || factory.quoteText,
    quoteLabel: snap.quoteLabel?.trim() || factory.quoteLabel,
    metaDescription: snap.metaDescription?.trim() || factory.metaDescription,
    metaKeywords: snap.metaKeywords?.trim() || factory.metaKeywords,
    hero: { ...factory.hero, ...snap.hero },
    ofertas: snap.ofertas
      ? {
          ...factory.ofertas,
          ...snap.ofertas,
          items: snap.ofertas.items?.length ? snap.ofertas.items : factory.ofertas.items,
        }
      : factory.ofertas,
    beneficios: snap.beneficios
      ? {
          ...factory.beneficios,
          ...snap.beneficios,
          items: snap.beneficios.items?.length ? snap.beneficios.items : factory.beneficios.items,
        }
      : factory.beneficios,
    licencias: snap.licencias
      ? {
          ...factory.licencias,
          ...snap.licencias,
          items: snap.licencias.items?.length
            ? snap.licencias.items.map((item, i) => ({
                ...factory.licencias.items[i],
                ...item,
                incluye: item.incluye?.length ? item.incluye : factory.licencias.items[i]?.incluye || [],
              }))
            : factory.licencias.items.map((item) => ({ ...item, incluye: [...item.incluye] })),
        }
      : factory.licencias,
    servicios: snap.servicios ? { ...factory.servicios, ...snap.servicios } : factory.servicios,
    valores: snap.valores
      ? {
          ...factory.valores,
          ...snap.valores,
          items: snap.valores.items?.length ? snap.valores.items : factory.valores.items,
        }
      : factory.valores,
    testimonios: snap.testimonios
      ? {
          ...factory.testimonios,
          ...snap.testimonios,
          items: snap.testimonios.items?.length ? snap.testimonios.items : factory.testimonios.items,
        }
      : factory.testimonios,
    pasos: snap.pasos
      ? {
          ...factory.pasos,
          ...snap.pasos,
          items: snap.pasos.items?.length ? snap.pasos.items : factory.pasos.items,
        }
      : factory.pasos,
    faq: snap.faq
      ? {
          ...factory.faq,
          ...snap.faq,
          items: snap.faq.items?.length ? snap.faq.items : factory.faq.items,
        }
      : factory.faq,
    cursos: snap.cursos ? { ...factory.cursos, ...snap.cursos } : factory.cursos,
    catalogo: snap.catalogo ? { ...factory.catalogo, ...snap.catalogo } : factory.catalogo,
    infoCards: snap.infoCards?.length
      ? snap.infoCards.map((c) => ({ ...c }))
      : factory.infoCards.map((c) => ({ ...c })),
    pilares: snap.pilares
      ? {
          tabCapacitacion: snap.pilares.tabCapacitacion ?? factory.pilares.tabCapacitacion,
          tabCampanas: snap.pilares.tabCampanas ?? factory.pilares.tabCampanas,
          capacitacion: snap.pilares.capacitacion?.length ? snap.pilares.capacitacion : factory.pilares.capacitacion,
          campanas: snap.pilares.campanas?.length ? snap.pilares.campanas : factory.pilares.campanas,
        }
      : factory.pilares,
    footerServicios: snap.footerServicios?.length ? [...snap.footerServicios] : [...factory.footerServicios],
    carreras: snap.carreras
      ? {
          ...factory.carreras,
          ...snap.carreras,
          items: snap.carreras.items?.length ? snap.carreras.items : factory.carreras.items,
        }
      : factory.carreras,
  };
}

export function snapshotServialPlantillaInicio(landing: PortalLandingConfig): ServialPlantillaInicioSnapshot {
  return {
    instBarTag: landing.instBarTag,
    quoteText: landing.quoteText,
    quoteLabel: landing.quoteLabel,
    metaDescription: landing.metaDescription,
    metaKeywords: landing.metaKeywords,
    hero: { ...landing.hero },
    ofertas: clone(landing.ofertas),
    beneficios: clone(landing.beneficios),
    licencias: clone(landing.licencias),
    servicios: clone(landing.servicios),
    valores: clone(landing.valores),
    testimonios: clone(landing.testimonios),
    pasos: clone(landing.pasos),
    faq: clone(landing.faq),
    cursos: { ...landing.cursos },
    catalogo: { ...landing.catalogo },
    infoCards: landing.infoCards.map((c) => ({ ...c })),
    pilares: clone(landing.pilares),
    footerServicios: [...landing.footerServicios],
    carreras: clone(landing.carreras),
  };
}

export function aplicarServialPlantillaFabrica(landing: PortalLandingConfig, factory: PortalLandingConfig): void {
  landing.servialPlantillaBase = null;
  landing.instBarTag = factory.instBarTag;
  landing.quoteText = factory.quoteText;
  landing.quoteLabel = factory.quoteLabel;
  landing.metaDescription = factory.metaDescription;
  landing.metaKeywords = factory.metaKeywords;
  landing.hero = { ...factory.hero };
  landing.ofertas = clone(factory.ofertas);
  landing.beneficios = clone(factory.beneficios);
  landing.licencias = clone(factory.licencias);
  landing.servicios = clone(factory.servicios);
  landing.valores = clone(factory.valores);
  landing.testimonios = clone(factory.testimonios);
  landing.pasos = clone(factory.pasos);
  landing.faq = clone(factory.faq);
  landing.cursos = { ...factory.cursos };
  landing.catalogo = { ...factory.catalogo };
  landing.infoCards = factory.infoCards.map((c) => ({ ...c }));
  landing.pilares = clone(factory.pilares);
  landing.footerServicios = [...factory.footerServicios];
  landing.carreras = clone(factory.carreras);
}

export function servialLandingFactoryFromDefaults(
  base: PortalLandingConfig,
  servial: Partial<PortalLandingConfig>,
): PortalLandingConfig {
  return { ...base, ...servial } as PortalLandingConfig;
}
