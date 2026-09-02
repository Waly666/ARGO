import { PortalPromoHeroTheme } from './portal-promo-hero-fields.util';
import { FinstruvialServicioSlug } from './finstruvial-servicios.constants';

export type FinstruvialServicioEstilo = 'default' | 'tech' | 'academy';

export interface PortalFinstruvialServicioImagen {
  id: string;
  etiqueta: string;
  url: string;
  urlAbsoluta?: string;
  alt: string;
}

export interface PortalFinstruvialServicioBloque {
  icon: string;
  titulo: string;
  texto: string;
  imagenId?: string;
  youtubeUrl?: string;
  /** Video subido (MP4/WEBM): ID en `videos`. */
  videoId?: string;
  videoOrigen?: PortalFinstruvialServicioVideoOrigen;
}

export interface PortalFinstruvialServicioItem {
  titulo: string;
  texto: string;
}

export interface PortalFinstruvialServicioStat {
  valor: string;
  etiqueta: string;
}

export interface PortalFinstruvialServicioVideo {
  id: string;
  etiqueta: string;
  titulo: string;
  youtubeUrl: string;
}

export type PortalFinstruvialServicioMedioTipo = 'imagen' | 'video';
export type PortalFinstruvialServicioVideoOrigen = 'youtube' | 'archivo';

/** Imagen o video insertable dinámicamente en una sección editorial. */
export interface PortalFinstruvialServicioMedio {
  tipo: PortalFinstruvialServicioMedioTipo;
  imagenId?: string;
  /** Solo si tipo es video: YouTube o archivo subido (MP4/WEBM). */
  videoOrigen?: PortalFinstruvialServicioVideoOrigen;
  youtubeUrl?: string;
  videoId?: string;
  caption?: string;
}

export interface PortalFinstruvialServicioLanding {
  slug: FinstruvialServicioSlug;
  activa: boolean;
  menuLabel: string;
  estilo: FinstruvialServicioEstilo;
  kicker: string;
  tituloLinea: string;
  tituloAcento: string;
  lead: string;
  heroParrafos: string[];
  theme: PortalPromoHeroTheme;
  mostrarBadgeVirtual: boolean;
  heroImagenUrl: string;
  heroImagenUrlAbsoluta?: string;
  heroImagenAlt: string;
  heroVideoYoutubeUrl: string;
  ctaPrincipal: string;
  ctaPrincipalUrl: string;
  ctaSecundario: string;
  ctaSecundarioUrl: string;
  hubIcon: string;
  hubLead: string;
  introKicker: string;
  introTitulo: string;
  introLead: string;
  introParrafos: string[];
  introMedios: PortalFinstruvialServicioMedio[];
  bloquesKicker: string;
  bloquesTitulo: string;
  bloques: PortalFinstruvialServicioBloque[];
  metodologiaKicker: string;
  metodologiaTitulo: string;
  metodologiaLead: string;
  metodologiaPasos: string[];
  resultadoKicker: string;
  resultadoTitulo: string;
  resultadoIconos: PortalFinstruvialServicioBloque[];
  flujoVertical: PortalFinstruvialServicioItem[];
  flujoTecnologico: string[];
  sistemaSeguroCentro: string;
  sistemaSeguroItems: string[];
  sistemaSeguroLead: string;
  publicos: string[];
  experiencias: PortalFinstruvialServicioBloque[];
  mensajeTitulo: string;
  mensajeSubtitulo: string;
  dashboardFiltros: string[];
  dashboardStats: PortalFinstruvialServicioStat[];
  preguntas: string[];
  ecosistemaCentro: string;
  ecosistemaKicker: string;
  ecosistemaTitulo: string;
  ecosistemaItems: PortalFinstruvialServicioBloque[];
  gamificacionKicker: string;
  gamificacionTitulo: string;
  gamificacionItems: string[];
  formulaAprendizaje: string;
  pilaresEducativos: PortalFinstruvialServicioBloque[];
  rutaAprendizaje: string[];
  experienciaItems: PortalFinstruvialServicioBloque[];
  experienciaSeccionKicker: string;
  experienciaSeccionTitulo: string;
  /** Si es true, «Programas destacados» muestra el catálogo publicado en /cursos (con portadas). */
  usarCatalogoCursos: boolean;
  modulosPlataformaKicker: string;
  modulosPlataformaTitulo: string;
  modulosPlataformaLead: string;
  /** Secciones del campus virtual (tablero, cursos, certificados…) con imagen opcional. */
  modulosPlataforma: PortalFinstruvialServicioBloque[];
  cierreQuote: string;
  listaServicios: PortalFinstruvialServicioItem[];
  listaTitulo: string;
  productoKicker: string;
  productoNombre: string;
  productoLead: string;
  productoParrafos: string[];
  productoEtiquetas: string[];
  productoMedios: PortalFinstruvialServicioMedio[];
  productoVideoYoutubeUrl: string;
  productoImagenId: string;
  ctaTitulo: string;
  ctaLead: string;
  ctaBtnPrincipal: string;
  ctaBtnSecundario: string;
  tarjetaCta: string;
  imagenes: PortalFinstruvialServicioImagen[];
  videos: PortalFinstruvialServicioImagen[];
  metaDescription: string;
}

export interface PortalFinstruvialServiciosHub {
  kicker: string;
  tituloLinea: string;
  tituloAcento: string;
  lead: string;
  gridTitulo: string;
  gridLead: string;
  heroImagenUrl: string;
  heroImagenUrlAbsoluta?: string;
  heroImagenAlt: string;
}

export interface PortalFinstruvialServiciosConfig {
  /** Si es false, oculta todo el portafolio (/servicios, menú y pie). */
  activa: boolean;
  menuLabel: string;
  hub: PortalFinstruvialServiciosHub;
  paginas: Record<FinstruvialServicioSlug, PortalFinstruvialServicioLanding>;
}
