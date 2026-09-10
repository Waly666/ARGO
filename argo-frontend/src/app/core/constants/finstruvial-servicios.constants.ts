/** Líneas de servicio FINSTRUVIAL — rutas públicas y claves en landing. */

export const FINSTRUVIAL_SERVICIO_SLUGS = [
  'aulaVirtual',
  'peridata',
  'capacitacionSensibilizacion',
  'estudiosDiagnosticosTecnicos',
  'herramientasEducativasTecnologicas',
  'inventariosViales',
  'planeacionGestionVial',
] as const;

export type FinstruvialServicioSlug = (typeof FINSTRUVIAL_SERVICIO_SLUGS)[number];

export const FINSTRUVIAL_SERVICIO_ROUTE: Record<FinstruvialServicioSlug, string> = {
  aulaVirtual: '/servicios/aula-virtual',
  peridata: '/servicios/peridata',
  capacitacionSensibilizacion: '/servicios/capacitacion-sensibilizacion',
  estudiosDiagnosticosTecnicos: '/servicios/estudios-diagnosticos-tecnicos',
  herramientasEducativasTecnologicas: '/servicios/herramientas-educativas-tecnologicas',
  inventariosViales: '/servicios/inventarios-viales',
  planeacionGestionVial: '/servicios/planeacion-gestion-vial',
};

/** Segmento URL → clave interna */
export const FINSTRUVIAL_SERVICIO_ROUTE_SEGMENT: Record<string, FinstruvialServicioSlug> =
  Object.fromEntries(
    FINSTRUVIAL_SERVICIO_SLUGS.map((slug) => [
      FINSTRUVIAL_SERVICIO_ROUTE[slug].replace(/^\/servicios\//, ''),
      slug,
    ]),
  ) as Record<string, FinstruvialServicioSlug>;

export function finstruvialServicioDefaultRouteSegment(slug: FinstruvialServicioSlug): string {
  return FINSTRUVIAL_SERVICIO_ROUTE[slug].replace(/^\/servicios\//, '');
}

/** Normaliza el segmento de URL de una página de servicio (sin barras). */
export function finstruvialServicioNormalizeRouteSegment(raw: string): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function finstruvialServicioRouteSegmentFrom(
  slug: FinstruvialServicioSlug,
  routeSegment?: string,
): string {
  const custom = finstruvialServicioNormalizeRouteSegment(routeSegment || '');
  return custom || finstruvialServicioDefaultRouteSegment(slug);
}

export function finstruvialServicioPublicRoute(
  slug: FinstruvialServicioSlug,
  routeSegment?: string,
): string {
  return `/servicios/${finstruvialServicioRouteSegmentFrom(slug, routeSegment)}`;
}

export type FinstruvialServicioPaginasRouteMap = Partial<
  Record<FinstruvialServicioSlug, { routeSegment?: string } | undefined>
>;

export function buildFinstruvialRouteSegmentIndex(
  paginas?: FinstruvialServicioPaginasRouteMap,
): Record<string, FinstruvialServicioSlug> {
  const index: Record<string, FinstruvialServicioSlug> = {};
  for (const slug of FINSTRUVIAL_SERVICIO_SLUGS) {
    const custom = finstruvialServicioRouteSegmentFrom(slug, paginas?.[slug]?.routeSegment);
    index[custom.toLowerCase()] = slug;
    const legacy = finstruvialServicioDefaultRouteSegment(slug).toLowerCase();
    if (legacy !== custom.toLowerCase()) {
      index[legacy] = slug;
    }
  }
  return index;
}

export function finstruvialServicioSlugFromRouteSegment(
  segment: string,
  paginas?: FinstruvialServicioPaginasRouteMap,
): FinstruvialServicioSlug | null {
  const normalized = segment.trim().toLowerCase();
  if (!normalized) return null;
  if (paginas) {
    const fromConfig = buildFinstruvialRouteSegmentIndex(paginas)[normalized];
    if (fromConfig) return fromConfig;
  }
  return FINSTRUVIAL_SERVICIO_ROUTE_SEGMENT[normalized] ?? null;
}
