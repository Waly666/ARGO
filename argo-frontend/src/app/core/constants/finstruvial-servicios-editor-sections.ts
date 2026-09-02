import { FinstruvialServicioSlug } from './finstruvial-servicios.constants';

/** Bloques del formulario del editor, alineados con las secciones visibles en el portal. */
export type FinstruvialEditorSeccion =
  | 'portafolio'
  | 'hero'
  | 'introduccion'
  | 'introMedios'
  | 'catalogoCursos'
  | 'pilares'
  | 'ruta'
  | 'bloquesHeader'
  | 'bloquesManual'
  | 'metodologia'
  | 'producto'
  | 'productoMedios'
  | 'experienciaEducativa'
  | 'modulosPlataforma'
  | 'publicos'
  | 'resultado'
  | 'cierre'
  | 'listaServicios'
  | 'ecosistema'
  | 'gamificacion'
  | 'formula'
  | 'contacto'
  | 'imagenes';

/**
 * Secciones editables por línea de servicio.
 * Solo aparecen campos que el portal puede mostrar para esa página.
 */
export const FINSTRUVIAL_EDITOR_SECCIONES: Record<FinstruvialServicioSlug, readonly FinstruvialEditorSeccion[]> = {
  aulaVirtual: [
    'portafolio',
    'hero',
    'introduccion',
    'catalogoCursos',
    'pilares',
    'ruta',
    'experienciaEducativa',
    'modulosPlataforma',
    'cierre',
    'contacto',
    'imagenes',
  ],
  capacitacionSensibilizacion: [
    'portafolio',
    'hero',
    'introduccion',
    'bloquesHeader',
    'bloquesManual',
    'producto',
    'productoMedios',
    'experienciaEducativa',
    'publicos',
    'cierre',
    'contacto',
    'imagenes',
  ],
  peridata: [
    'portafolio',
    'hero',
    'introduccion',
    'introMedios',
    'metodologia',
    'bloquesHeader',
    'bloquesManual',
    'cierre',
    'contacto',
    'imagenes',
  ],
  estudiosDiagnosticosTecnicos: [
    'portafolio',
    'hero',
    'introduccion',
    'bloquesHeader',
    'bloquesManual',
    'metodologia',
    'producto',
    'resultado',
    'cierre',
    'contacto',
    'imagenes',
  ],
  herramientasEducativasTecnologicas: [
    'portafolio',
    'hero',
    'introduccion',
    'bloquesHeader',
    'bloquesManual',
    'producto',
    'ecosistema',
    'gamificacion',
    'formula',
    'cierre',
    'contacto',
    'imagenes',
  ],
  inventariosViales: [
    'portafolio',
    'hero',
    'introduccion',
    'bloquesHeader',
    'bloquesManual',
    'producto',
    'productoMedios',
    'metodologia',
    'modulosPlataforma',
    'ecosistema',
    'listaServicios',
    'publicos',
    'resultado',
    'cierre',
    'contacto',
    'imagenes',
  ],
  planeacionGestionVial: [
    'portafolio',
    'hero',
    'introduccion',
    'bloquesHeader',
    'bloquesManual',
    'metodologia',
    'cierre',
    'contacto',
    'imagenes',
  ],
};

export function finstruvialEditorTieneSeccion(
  slug: FinstruvialServicioSlug,
  seccion: FinstruvialEditorSeccion,
): boolean {
  return FINSTRUVIAL_EDITOR_SECCIONES[slug].includes(seccion);
}
