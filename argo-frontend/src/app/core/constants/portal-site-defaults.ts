/** Constructor del sitio — espejo de portalSiteDefaults.js (backend). */

export type PortalPaginaKey =
  | 'home'
  | 'tienda'
  | 'cursos'
  | 'aula'
  | 'fundacion'
  | 'consultaCertificados'
  | 'cursosConduccion'
  | 'galeria'
  | 'blog'
  | 'acerca';

export interface PortalPaginaConfig {
  activa: boolean;
  etiquetaMenu: string;
  ruta: string;
}

export type PortalHeroEstilo = 'starfield' | 'servial-mesh';

export interface PortalTemaConfig {
  colorPrimario: string;
  colorPrimarioOscuro: string;
  colorAcento: string;
  colorFondo: string;
  colorSuperficie: string;
  colorTexto: string;
  colorTextoSecundario: string;
  fuente: string;
  /** Fuente para títulos (hero, secciones). Vacío = misma que texto general. */
  fuenteTitulos?: string;
  urlHero: string;
  urlHeroAbsoluta?: string;
  /** Variante visual del banner principal. */
  heroEstilo?: PortalHeroEstilo;
}

export interface PortalMarcaConfig {
  /** Texto al lado del logo en el menú superior. */
  textoJuntoLogo: string;
  textoCopyright: string;
  ocultarMarcaDesarrollador: boolean;
  textoPieDesarrollador: string;
}

export interface PortalHomeConfig {
  orden: string[];
  secciones: Record<string, boolean>;
}

export interface PortalSiteConfig {
  paginas: Record<PortalPaginaKey, PortalPaginaConfig>;
  tema: PortalTemaConfig;
  marca: PortalMarcaConfig;
  home: PortalHomeConfig;
  homeSeccionesLabels?: Record<string, string>;
  homeSeccionesOrden?: string[];
}

export { PORTAL_FUENTES } from '../utils/portal-fonts.util';

export const PORTAL_HOME_SECCIONES_ORDEN = [
  'instBar',
  'hero',
  'infoCards',
  'ofertas',
  'beneficios',
  'licencias',
  'examenTeorico',
  'quoteBand',
  'fotosInicio',
  'serviciosEmpresa',
  'carreras',
  'cursosVirtuales',
  'valores',
  'pasos',
  'appMobile',
  'testimonios',
  'faq',
  'pilares',
] as const;

export const PORTAL_HOME_SECCIONES_LABELS: Record<string, string> = {
  instBar: 'Barra institucional',
  hero: 'Banner principal (hero)',
  infoCards: 'Tarjetas de contacto',
  ofertas: 'Qué ofrecemos',
  beneficios: 'Beneficios',
  licencias: 'Licencias de conducción',
  examenTeorico: 'Examen teórico (normatividad)',
  quoteBand: 'Frase destacada',
  fotosInicio: 'Fotos destacadas del inicio',
  serviciosEmpresa: 'Servicios para empresas',
  testimonios: 'Testimonios',
  valores: 'Valores',
  cursosVirtuales: 'Cursos virtuales',
  carreras: 'Carreras técnicas',
  pasos: 'Cómo funciona',
  appMobile: 'App Mobile',
  faq: 'Preguntas frecuentes',
  pilares: 'Capacitación y campañas',
};

export const PORTAL_PAGINA_META: { key: PortalPaginaKey; titulo: string; descripcion: string }[] = [
  { key: 'home', titulo: 'Inicio', descripcion: 'Página principal del portal' },
  { key: 'cursos', titulo: 'Cursos', descripcion: 'Catálogo de cursos y programas' },
  { key: 'tienda', titulo: 'Tienda', descripcion: 'Vista de inscripción / tienda' },
  { key: 'aula', titulo: 'Aula virtual', descripcion: 'Panel del estudiante (siempre activa)' },
  { key: 'fundacion', titulo: 'Institucional', descripcion: 'Página institucional (renombrable: Empresa, Nosotros…)' },
  { key: 'acerca', titulo: 'Acerca de', descripcion: 'Contacto e información de la institución' },
  { key: 'consultaCertificados', titulo: 'Certificados', descripcion: 'Consulta pública de certificados' },
  {
    key: 'cursosConduccion',
    titulo: 'Cursos conducción',
    descripcion: 'Categorías de licencia y resoluciones del CEA',
  },
  { key: 'blog', titulo: 'Blog', descripcion: 'Noticias y artículos del portal' },
  { key: 'galeria', titulo: 'Galería', descripcion: 'Fotos y videos de la institución' },
];

/** Orden canónico de bloques del inicio (editor + vista previa). */
export function ordenSeccionesHomePortal(site?: Partial<PortalSiteConfig> | null): string[] {
  const ordenRaw = site?.home?.orden?.length ? site.home.orden : site?.homeSeccionesOrden;
  const base = ordenRaw?.length ? [...ordenRaw] : [...PORTAL_HOME_SECCIONES_ORDEN];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of base) {
    if (PORTAL_HOME_SECCIONES_LABELS[id] && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  for (const id of PORTAL_HOME_SECCIONES_ORDEN) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}

export function mergePortalSiteDefaults(raw?: Partial<PortalSiteConfig> | null): PortalSiteConfig {
  const paginas = { ...(raw?.paginas as Record<PortalPaginaKey, PortalPaginaConfig>) };
  for (const m of PORTAL_PAGINA_META) {
    if (!paginas[m.key]) {
      paginas[m.key] = {
        activa: true,
        etiquetaMenu: m.titulo,
        ruta:
          m.key === 'home'
            ? '/'
            : `/${
                m.key === 'consultaCertificados'
                  ? 'consulta-certificados'
                  : m.key === 'cursosConduccion'
                    ? 'cursos-conduccion'
                    : m.key === 'blog'
                      ? 'blog'
                      : m.key === 'galeria'
                        ? 'galeria'
                        : m.key
              }`,
      };
    }
  }
  return {
    paginas: paginas as Record<PortalPaginaKey, PortalPaginaConfig>,
    tema: {
      colorPrimario: '#3b82f6',
      colorPrimarioOscuro: '#1d4ed8',
      colorAcento: '#22d3ee',
      colorFondo: '#0b1224',
      colorSuperficie: '#121c33',
      colorTexto: '#eef3ff',
      colorTextoSecundario: '#9fb0d0',
      fuente: 'Plus Jakarta Sans',
      fuenteTitulos: '',
      urlHero: '',
      heroEstilo: 'starfield',
      ...raw?.tema,
    },
    marca: {
      textoJuntoLogo: '',
      textoCopyright: '',
      ocultarMarcaDesarrollador: true,
      textoPieDesarrollador: '',
      ...raw?.marca,
    },
    home: {
      orden: raw?.home?.orden?.length ? [...raw.home.orden] : [],
      secciones: { ...(raw?.home?.secciones || {}) },
    },
    homeSeccionesLabels: raw?.homeSeccionesLabels,
    homeSeccionesOrden: raw?.homeSeccionesOrden,
  };
}
