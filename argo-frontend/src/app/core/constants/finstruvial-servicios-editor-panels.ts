import { FinstruvialServicioSlug, FINSTRUVIAL_SERVICIO_ROUTE } from './finstruvial-servicios.constants';

/** Paneles del constructor del sitio → slug interno de la línea. */
export const FINSTRUVIAL_SERVICIO_BUILDER_PANELS = {
  finstruvialServicioAulaVirtual: 'aulaVirtual',
  finstruvialServicioPeridata: 'peridata',
  finstruvialServicioCapacitacion: 'capacitacionSensibilizacion',
  finstruvialServicioEstudios: 'estudiosDiagnosticosTecnicos',
  finstruvialServicioHerramientas: 'herramientasEducativasTecnologicas',
  finstruvialServicioInventarios: 'inventariosViales',
  finstruvialServicioPlaneacion: 'planeacionGestionVial',
} as const satisfies Record<string, FinstruvialServicioSlug>;

export type FinstruvialServicioBuilderPanel = keyof typeof FINSTRUVIAL_SERVICIO_BUILDER_PANELS;

export const FINSTRUVIAL_SERVICIO_BUILDER_PANEL_LIST = Object.keys(
  FINSTRUVIAL_SERVICIO_BUILDER_PANELS,
) as FinstruvialServicioBuilderPanel[];

export const FINSTRUVIAL_SERVICIO_BUILDER_MENU: {
  id: FinstruvialServicioBuilderPanel;
  slug: FinstruvialServicioSlug;
  icon: string;
  label: string;
}[] = [
  { id: 'finstruvialServicioAulaVirtual', slug: 'aulaVirtual', icon: '💻', label: 'Aula Virtual y Formación' },
  { id: 'finstruvialServicioPeridata', slug: 'peridata', icon: '📈', label: 'Análisis de Siniestralidad – PERIDATA' },
  {
    id: 'finstruvialServicioCapacitacion',
    slug: 'capacitacionSensibilizacion',
    icon: '🎓',
    label: 'Capacitación y Sensibilización',
  },
  {
    id: 'finstruvialServicioEstudios',
    slug: 'estudiosDiagnosticosTecnicos',
    icon: '🔬',
    label: 'Estudios y Diagnósticos Técnicos',
  },
  {
    id: 'finstruvialServicioHerramientas',
    slug: 'herramientasEducativasTecnologicas',
    icon: '🛠️',
    label: 'Herramientas Educativas y Tecnológicas',
  },
  { id: 'finstruvialServicioInventarios', slug: 'inventariosViales', icon: '🛣️', label: 'Inventarios Viales' },
  {
    id: 'finstruvialServicioPlaneacion',
    slug: 'planeacionGestionVial',
    icon: '📋',
    label: 'Planeación y Gestión Vial',
  },
];

export function finstruvialServicioSlugFromBuilderPanel(
  panel: string,
): FinstruvialServicioSlug | null {
  return (FINSTRUVIAL_SERVICIO_BUILDER_PANELS as Record<string, FinstruvialServicioSlug>)[panel] ?? null;
}

export function finstruvialServicioRoute(slug: FinstruvialServicioSlug): string {
  return FINSTRUVIAL_SERVICIO_ROUTE[slug];
}
