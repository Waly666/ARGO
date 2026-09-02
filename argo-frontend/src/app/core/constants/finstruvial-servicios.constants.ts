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

export function finstruvialServicioSlugFromRouteSegment(segment: string): FinstruvialServicioSlug | null {
  return FINSTRUVIAL_SERVICIO_ROUTE_SEGMENT[segment.trim().toLowerCase()] ?? null;
}
