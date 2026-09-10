import { PortalPromoHeroTheme } from './portal-promo-hero-fields.util';
import { FinstruvialServicioSlug } from './finstruvial-servicios.constants';

export type FinstruvialServicioEstilo = 'default' | 'tech' | 'academy';

export interface PortalFinstruvialServicioImagen {
  id: string;
  etiqueta: string;
  url: string;
  urlAbsoluta?: string;
  alt: string;
  /** Solo ERP: prompt para generar la foto. No se muestra en el portal. */
  promptImagen?: string;
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

export interface PortalFinstruvialServicioCatalogoOverride {
  patron: string;
  titulo: string;
  url: string;
  cta: string;
}

export interface PortalFinstruvialServicioLanding {
  guionVersion?: number;
  slug: FinstruvialServicioSlug;
  activa: boolean;
  /** Segmento de URL público bajo /servicios/ (editable en ERP). */
  routeSegment: string;
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
  /** Solo ERP: prompt del banner superior. */
  heroImagenPrompt?: string;
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
  pilaresSeccionKicker: string;
  pilaresSeccionTitulo: string;
  pilaresEducativos: PortalFinstruvialServicioBloque[];
  rutaAprendizajeKicker: string;
  rutaAprendizajeTitulo: string;
  rutaAprendizajeLead: string;
  rutaAprendizajeImagenId: string;
  rutaAprendizaje: string[];
  seoTextoImagenId: string;
  experienciaItems: PortalFinstruvialServicioBloque[];
  experienciaSeccionKicker: string;
  experienciaSeccionTitulo: string;
  /** Si es true, «Programas destacados» muestra el catálogo publicado en /cursos (con portadas). */
  usarCatalogoCursos: boolean;
  modulosPlataformaKicker: string;
  modulosPlataformaTitulo: string;
  modulosPlataformaLead: string;
  guiasPlataformaKicker: string;
  guiasPlataformaTitulo: string;
  guiasPlataformaLead: string;
  guiasPlataforma: PortalFinstruvialServicioBloque[];
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
  seoTextoTitulo: string;
  seoTextoParrafos: string[];
  localTitulo: string;
  localTexto: string;
  faqTitulo: string;
  faq: PortalServiciosHubFaq[];
  enlacesRelacionadosTitulo: string;
  enlacesRelacionados: { texto?: string; etiqueta: string; url: string }[];
  catalogoOverrides: PortalFinstruvialServicioCatalogoOverride[];
}

export interface PortalServiciosHubTarjeta {
  icon: string;
  titulo: string;
  lead: string;
  url: string;
  cta: string;
  externo?: boolean;
}

export interface PortalServiciosHubFaq {
  pregunta: string;
  respuesta: string;
}

export interface PortalFinstruvialServiciosHub {
  guionVersion?: number;
  kicker: string;
  tituloLinea: string;
  tituloAcento: string;
  lead: string;
  gridTitulo: string;
  gridLead: string;
  seoTextoTitulo: string;
  seoTextoParrafos: string[];
  localTitulo: string;
  localTexto: string;
  localDireccion: string;
  localTelefono: string;
  localEmail: string;
  faqTitulo: string;
  faq: PortalServiciosHubFaq[];
  tarjetas: PortalServiciosHubTarjeta[];
  heroStats: string[];
  formacionImagenUrl: string;
  formacionImagenUrlAbsoluta?: string;
  formacionImagenAlt: string;
  formacionImagen2Url: string;
  formacionImagen2UrlAbsoluta?: string;
  formacionImagen2Alt: string;
  heroImagenUrl: string;
  heroImagenUrlAbsoluta?: string;
  heroImagenAlt: string;
  /** Solo ERP: prompt de la imagen del portafolio. */
  heroImagenPrompt?: string;
}

export interface PortalFinstruvialServiciosConfig {
  /** Si es false, oculta todo el portafolio (/servicios, menú y pie). */
  activa: boolean;
  menuLabel: string;
  hub: PortalFinstruvialServiciosHub;
  paginas: Record<FinstruvialServicioSlug, PortalFinstruvialServicioLanding>;
}
