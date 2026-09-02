import {
  FINSTRUVIAL_SERVICIO_SLUGS,
  FinstruvialServicioSlug,
} from './finstruvial-servicios.constants';
import {
  PortalFinstruvialServicioBloque,
  PortalFinstruvialServicioImagen,
  PortalFinstruvialServicioItem,
  PortalFinstruvialServicioLanding,
  PortalFinstruvialServicioMedio,
  PortalFinstruvialServicioStat,
  PortalFinstruvialServiciosConfig,
} from './finstruvial-servicio-landing.types';
import { FINSTRUVIAL_SERVICIOS_WIREFRAME } from './finstruvial-servicios-wireframe';

const MENU_LABELS: Record<FinstruvialServicioSlug, string> = {
  aulaVirtual: 'Aula Virtual y Formación',
  peridata: 'Análisis de Siniestralidad – PERIDATA',
  capacitacionSensibilizacion: 'Capacitación y Sensibilización',
  estudiosDiagnosticosTecnicos: 'Estudios y Diagnósticos Técnicos',
  herramientasEducativasTecnologicas: 'Herramientas Educativas y Tecnológicas',
  inventariosViales: 'Inventarios Viales',
  planeacionGestionVial: 'Planeación y Gestión Vial',
};

const HUB_ICONS: Record<FinstruvialServicioSlug, string> = {
  aulaVirtual: '💻',
  peridata: '📈',
  capacitacionSensibilizacion: '🎓',
  estudiosDiagnosticosTecnicos: '🔬',
  herramientasEducativasTecnologicas: '🧰',
  inventariosViales: '📍',
  planeacionGestionVial: '📋',
};

function img(id: string, etiqueta: string, alt = ''): PortalFinstruvialServicioImagen {
  return { id, etiqueta, url: '', alt: alt || etiqueta };
}

function defaultImagenes(wire: Partial<PortalFinstruvialServicioLanding>): PortalFinstruvialServicioImagen[] {
  if (wire.imagenes?.length) {
    return wire.imagenes.map((item) => img(item.id, item.etiqueta, item.alt));
  }
  return [img('hero', 'Imagen principal'), img('seccion', 'Imagen de sección')];
}

function pagina(slug: FinstruvialServicioSlug): PortalFinstruvialServicioLanding {
  const wire = FINSTRUVIAL_SERVICIOS_WIREFRAME[slug] || {};
  const menuLabel = wire.menuLabel || MENU_LABELS[slug];
  const lead = wire.lead || '';
  return {
    slug,
    activa: true,
    menuLabel,
    estilo: wire.estilo || 'default',
    kicker: wire.kicker || '',
    tituloLinea: wire.tituloLinea || menuLabel,
    tituloAcento: wire.tituloAcento || '',
    lead,
    heroParrafos: wire.heroParrafos || [],
    theme: wire.theme || 'blue',
    mostrarBadgeVirtual: wire.mostrarBadgeVirtual === true,
    heroImagenUrl: '',
    heroImagenAlt: menuLabel,
    heroVideoYoutubeUrl: wire.heroVideoYoutubeUrl || '',
    ctaPrincipal: wire.ctaPrincipal || 'Solicitar información',
    ctaPrincipalUrl: wire.ctaPrincipalUrl || '/acerca#contacto',
    ctaSecundario: wire.ctaSecundario || 'Ver todos los servicios',
    ctaSecundarioUrl: wire.ctaSecundarioUrl || '/servicios',
    hubIcon: wire.hubIcon || HUB_ICONS[slug],
    hubLead: wire.hubLead || lead,
    introKicker: wire.introKicker || 'Nuestro servicio',
    introTitulo: wire.introTitulo ?? '',
    introLead: wire.introLead || '',
    introParrafos: wire.introParrafos || [],
    introMedios: [],
    bloquesKicker: wire.bloquesKicker || 'Servicios',
    bloquesTitulo: wire.bloquesTitulo || '¿Qué incluye este servicio?',
    bloques: wire.bloques || [],
    metodologiaKicker: wire.metodologiaKicker || '',
    metodologiaTitulo: wire.metodologiaTitulo || '',
    metodologiaLead: wire.metodologiaLead || '',
    metodologiaPasos: wire.metodologiaPasos || [],
    resultadoKicker: wire.resultadoKicker || '',
    resultadoTitulo: wire.resultadoTitulo || '',
    resultadoIconos: wire.resultadoIconos || [],
    flujoVertical: wire.flujoVertical || [],
    flujoTecnologico: wire.flujoTecnologico || [],
    sistemaSeguroCentro: wire.sistemaSeguroCentro || '',
    sistemaSeguroItems: wire.sistemaSeguroItems || [],
    sistemaSeguroLead: wire.sistemaSeguroLead || '',
    publicos: wire.publicos || [],
    experiencias: wire.experiencias || [],
    mensajeTitulo: wire.mensajeTitulo || '',
    mensajeSubtitulo: wire.mensajeSubtitulo || '',
    dashboardFiltros: wire.dashboardFiltros || [],
    dashboardStats: wire.dashboardStats || [],
    preguntas: wire.preguntas || [],
    ecosistemaCentro: wire.ecosistemaCentro || '',
    ecosistemaKicker: wire.ecosistemaKicker || '',
    ecosistemaTitulo: wire.ecosistemaTitulo || '',
    ecosistemaItems: wire.ecosistemaItems || [],
    gamificacionKicker: wire.gamificacionKicker || '',
    gamificacionTitulo: wire.gamificacionTitulo || '',
    gamificacionItems: wire.gamificacionItems || [],
    formulaAprendizaje: wire.formulaAprendizaje || '',
    pilaresEducativos: wire.pilaresEducativos || [],
    rutaAprendizaje: wire.rutaAprendizaje || [],
    experienciaItems: wire.experienciaItems || [],
    experienciaSeccionKicker: wire.experienciaSeccionKicker || '',
    experienciaSeccionTitulo: wire.experienciaSeccionTitulo || '',
    usarCatalogoCursos: wire.usarCatalogoCursos === true,
    modulosPlataformaKicker: wire.modulosPlataformaKicker || '',
    modulosPlataformaTitulo: wire.modulosPlataformaTitulo || '',
    modulosPlataformaLead: wire.modulosPlataformaLead || '',
    modulosPlataforma: wire.modulosPlataforma || [],
    cierreQuote: wire.cierreQuote || '',
    listaServicios: wire.listaServicios || [],
    listaTitulo: wire.listaTitulo || 'Servicios principales',
    productoKicker: wire.productoKicker || 'Solución tecnológica',
    productoNombre: wire.productoNombre || '',
    productoLead: wire.productoLead || '',
    productoParrafos: wire.productoParrafos || [],
    productoEtiquetas: wire.productoEtiquetas || [],
    productoMedios: [],
    productoVideoYoutubeUrl: wire.productoVideoYoutubeUrl || '',
    productoImagenId: wire.productoImagenId || '',
    ctaTitulo: wire.ctaTitulo || '¿Necesita este servicio?',
    ctaLead:
      wire.ctaLead ||
      'Contáctenos para una asesoría técnica o una propuesta a la medida de su entidad u organización.',
    ctaBtnPrincipal: wire.ctaBtnPrincipal || wire.ctaPrincipal || 'Solicitar información',
    ctaBtnSecundario: wire.ctaBtnSecundario || 'Ver todos los servicios',
    tarjetaCta: wire.tarjetaCta || 'Conocer más',
    imagenes: defaultImagenes(wire),
    videos: [],
    metaDescription: wire.metaDescription || lead,
  };
}

export const FINSTRUVIAL_SERVICIOS_PAGINAS_DEFAULTS = FINSTRUVIAL_SERVICIO_SLUGS.reduce(
  (acc, slug) => {
    acc[slug] = pagina(slug);
    return acc;
  },
  {} as Record<FinstruvialServicioSlug, PortalFinstruvialServicioLanding>,
);

export const FINSTRUVIAL_SERVICIOS_DEFAULTS: PortalFinstruvialServiciosConfig = {
  activa: true,
  menuLabel: 'Nuestros Servicios',
  hub: {
    kicker: 'Portafolio institucional',
    tituloLinea: 'Servicios de',
    tituloAcento: 'FINSTRUVIAL',
    lead:
      'Consultoría, asesoría, investigación, planeación, estudios técnicos, formación y desarrollo tecnológico en tránsito, transporte, movilidad y seguridad vial.',
    gridTitulo: 'Líneas de servicio',
    gridLead:
      'Consultoría técnica, planeación, tecnología y formación en tránsito, transporte, movilidad y seguridad vial.',
    heroImagenUrl: '',
    heroImagenAlt: 'Portafolio de servicios FINSTRUVIAL',
  },
  paginas: JSON.parse(JSON.stringify(FINSTRUVIAL_SERVICIOS_PAGINAS_DEFAULTS)),
};

function str(val: unknown, fallback: string): string {
  return String(val ?? '').trim() || fallback;
}

function arr<T>(val: T[] | undefined | null, fallback: T[]): T[] {
  return Array.isArray(val) && val.length ? val : fallback;
}

/** Perfiles publicados antes del wireframe guardaban `estilo: "default"` y anulaban academy/tech. */
function resolveEstilo(
  slug: FinstruvialServicioSlug,
  srcEstilo: unknown,
  defaultEstilo: PortalFinstruvialServicioLanding['estilo'],
): PortalFinstruvialServicioLanding['estilo'] {
  const wireEstilo = FINSTRUVIAL_SERVICIOS_WIREFRAME[slug]?.estilo;
  const fromSrc = String(srcEstilo ?? '').trim();
  if (fromSrc && fromSrc !== 'default') {
    return fromSrc as PortalFinstruvialServicioLanding['estilo'];
  }
  if (wireEstilo) return wireEstilo as PortalFinstruvialServicioLanding['estilo'];
  return defaultEstilo || 'default';
}

const HERO_PARRAFO_MAX_CHARS = 200;

function mergeHeroParrafos(
  slug: FinstruvialServicioSlug,
  raw: string[] | undefined,
  defaults: string[],
): string[] {
  const saved = Array.isArray(raw)
    ? raw.map((p) => String(p || '').trim()).filter(Boolean)
    : [];
  if (!saved.length) return defaults;

  const wireHero = FINSTRUVIAL_SERVICIOS_WIREFRAME[slug]?.heroParrafos;
  if (wireHero && wireHero.length === 0) {
    const compact = saved.filter((p) => p.length <= HERO_PARRAFO_MAX_CHARS);
    return compact.length ? compact : defaults;
  }

  return saved;
}

function mergeCapacitacionIntro(
  src: Partial<PortalFinstruvialServicioLanding>,
  defaults: PortalFinstruvialServicioLanding,
): Pick<PortalFinstruvialServicioLanding, 'introLead' | 'introParrafos'> {
  const savedParas = Array.isArray(src.introParrafos)
    ? src.introParrafos.map((p) => String(p || '').trim()).filter(Boolean)
    : [];
  if (
    savedParas.length === 1 &&
    (savedParas[0].includes('En resumen, nuestras estrategias') || savedParas[0].length > 600)
  ) {
    return { introLead: defaults.introLead, introParrafos: defaults.introParrafos };
  }
  return {
    introLead: str(src.introLead, defaults.introLead),
    introParrafos: arr(src.introParrafos, defaults.introParrafos),
  };
}

function mergeCapacitacionProducto(
  src: Partial<PortalFinstruvialServicioLanding>,
  defaults: PortalFinstruvialServicioLanding,
): Pick<PortalFinstruvialServicioLanding, 'productoLead' | 'productoParrafos'> {
  const savedParas = Array.isArray(src.productoParrafos)
    ? src.productoParrafos.map((p) => String(p || '').trim()).filter(Boolean)
    : [];
  if (
    savedParas.length === 1 &&
    savedParas[0].includes('tipo carpa') &&
    savedParas[0].length > 400
  ) {
    return {
      productoLead: defaults.productoLead,
      productoParrafos: defaults.productoParrafos,
    };
  }
  return {
    productoLead: str(src.productoLead, defaults.productoLead),
    productoParrafos: arr(src.productoParrafos, defaults.productoParrafos),
  };
}

function mergeBloques(
  raw: PortalFinstruvialServicioBloque[] | undefined,
  defaults: PortalFinstruvialServicioBloque[],
): PortalFinstruvialServicioBloque[] {
  return arr(raw, defaults).map((b, i) => {
    const d = defaults[i];
    const bloque: PortalFinstruvialServicioBloque = {
      icon: str(b?.icon, d?.icon || '📌'),
      titulo: str(b?.titulo, d?.titulo || ''),
      texto: str(b?.texto, d?.texto || ''),
    };
    if (b?.imagenId !== undefined || d?.imagenId !== undefined) {
      bloque.imagenId = str(b?.imagenId, d?.imagenId || '');
    }
    if (b?.youtubeUrl !== undefined || d?.youtubeUrl !== undefined) {
      const url = str(b?.youtubeUrl, d?.youtubeUrl ?? '');
      if (d?.youtubeUrl !== undefined || url.trim()) {
        bloque.youtubeUrl = url;
      }
    }
    if (b?.videoId !== undefined || d?.videoId !== undefined) {
      bloque.videoId = str(b?.videoId, d?.videoId || '');
    }
    if (b?.videoOrigen !== undefined || d?.videoOrigen !== undefined) {
      const origen = b?.videoOrigen || d?.videoOrigen;
      if (origen === 'archivo' || origen === 'youtube') {
        bloque.videoOrigen = origen;
      }
    }
    return bloque;
  });
}

function mergeItems(
  raw: PortalFinstruvialServicioItem[] | undefined,
  defaults: PortalFinstruvialServicioItem[],
): PortalFinstruvialServicioItem[] {
  return arr(raw, defaults).map((item, i) => ({
    titulo: str(item?.titulo, defaults[i]?.titulo || ''),
    texto: str(item?.texto, defaults[i]?.texto || ''),
  }));
}

function mergeStats(
  raw: PortalFinstruvialServicioStat[] | undefined,
  defaults: PortalFinstruvialServicioStat[],
): PortalFinstruvialServicioStat[] {
  return arr(raw, defaults).map((item, i) => ({
    valor: str(item?.valor, defaults[i]?.valor || ''),
    etiqueta: str(item?.etiqueta, defaults[i]?.etiqueta || ''),
  }));
}

function mergeImagenes(
  raw: PortalFinstruvialServicioImagen[] | undefined,
  defaults: PortalFinstruvialServicioImagen[],
): PortalFinstruvialServicioImagen[] {
  return mergeArchivos(raw, defaults);
}

function mergeVideos(
  raw: PortalFinstruvialServicioImagen[] | undefined,
  defaults: PortalFinstruvialServicioImagen[],
): PortalFinstruvialServicioImagen[] {
  return mergeArchivos(raw, defaults);
}

function mergeArchivos(
  raw: PortalFinstruvialServicioImagen[] | undefined,
  defaults: PortalFinstruvialServicioImagen[],
): PortalFinstruvialServicioImagen[] {
  const byId = new Map(defaults.map((d) => [d.id, { ...d }]));
  for (const imgRaw of raw || []) {
    const id = String(imgRaw?.id || '').trim();
    if (!id) continue;
    const base = byId.get(id) || { id, etiqueta: id, url: '', alt: '' };
    byId.set(id, {
      id,
      etiqueta: str(imgRaw.etiqueta, base.etiqueta),
      url: str(imgRaw.url, base.url),
      urlAbsoluta: imgRaw.urlAbsoluta?.trim() || base.urlAbsoluta,
      alt: str(imgRaw.alt, base.alt),
    });
  }
  return [...byId.values()];
}

function mergeMedios(
  raw: PortalFinstruvialServicioMedio[] | undefined,
  legacy: PortalFinstruvialServicioMedio[],
): PortalFinstruvialServicioMedio[] {
  if (!Array.isArray(raw) || !raw.length) return legacy;
  const medios: PortalFinstruvialServicioMedio[] = [];
  for (const m of raw) {
    const tipo: PortalFinstruvialServicioMedio['tipo'] = m?.tipo === 'video' ? 'video' : 'imagen';
    if (tipo === 'video') {
      const videoOrigen =
        m?.videoOrigen === 'archivo'
          ? 'archivo'
          : m?.videoOrigen === 'youtube'
            ? 'youtube'
            : m?.videoId?.trim()
              ? 'archivo'
              : 'youtube';
      medios.push({
        tipo,
        videoOrigen,
        youtubeUrl: str(m?.youtubeUrl, ''),
        videoId: str(m?.videoId, ''),
        caption: str(m?.caption, ''),
      });
      continue;
    }
    const imagenId = str(m?.imagenId, '');
    if (!imagenId) continue;
    medios.push({
      tipo,
      imagenId,
      caption: str(m?.caption, ''),
    });
  }
  return medios;
}

function legacyIntroMedios(
  src: Partial<PortalFinstruvialServicioLanding>,
  d: PortalFinstruvialServicioLanding,
  imagenes: PortalFinstruvialServicioImagen[],
): PortalFinstruvialServicioMedio[] {
  const medios: PortalFinstruvialServicioMedio[] = [];
  const videoUrl = str(src.heroVideoYoutubeUrl, d.heroVideoYoutubeUrl).trim();
  if (videoUrl) {
    medios.push({
      tipo: 'video',
      videoOrigen: 'youtube',
      youtubeUrl: videoUrl,
      caption: `Video — ${d.menuLabel}`,
    });
  }
  const seccion = imagenes.find((i) => i.id === 'seccion');
  if (seccion?.url?.trim() || seccion?.urlAbsoluta?.trim()) {
    medios.push({
      tipo: 'imagen',
      imagenId: 'seccion',
      caption: seccion.etiqueta || seccion.alt || 'Imagen de sección',
    });
  }
  return medios;
}

function legacyProductoMedios(
  src: Partial<PortalFinstruvialServicioLanding>,
  d: PortalFinstruvialServicioLanding,
  slug: FinstruvialServicioSlug,
  imagenes: PortalFinstruvialServicioImagen[],
): PortalFinstruvialServicioMedio[] {
  const medios: PortalFinstruvialServicioMedio[] = [];
  const imgId = str(src.productoImagenId, d.productoImagenId).trim();
  if (imgId && slug !== 'herramientasEducativasTecnologicas') {
    const img = imagenes.find((i) => i.id === imgId);
    medios.push({
      tipo: 'imagen',
      imagenId: imgId,
      caption: img?.etiqueta || img?.alt || '',
    });
  }
  const wire = FINSTRUVIAL_SERVICIOS_WIREFRAME[slug];
  if (wire?.productoVideoYoutubeUrl !== undefined) {
    const videoUrl = str(src.productoVideoYoutubeUrl, d.productoVideoYoutubeUrl).trim();
    if (videoUrl) {
      medios.push({
        tipo: 'video',
        videoOrigen: 'youtube',
        youtubeUrl: videoUrl,
        caption: `Video — ${d.productoNombre || d.menuLabel}`,
      });
    }
  }
  return medios;
}

export function mergeFinstruvialServicioLanding(
  slug: FinstruvialServicioSlug,
  raw?: Partial<PortalFinstruvialServicioLanding> | null,
): PortalFinstruvialServicioLanding {
  const d = FINSTRUVIAL_SERVICIOS_PAGINAS_DEFAULTS[slug];
  const src = raw && typeof raw === 'object' ? raw : {};
  const intro =
    slug === 'capacitacionSensibilizacion'
      ? mergeCapacitacionIntro(src, d)
      : { introLead: str(src.introLead, d.introLead), introParrafos: arr(src.introParrafos, d.introParrafos) };
  const producto =
    slug === 'capacitacionSensibilizacion'
      ? mergeCapacitacionProducto(src, d)
      : {
          productoLead: str(src.productoLead, d.productoLead),
          productoParrafos: arr(src.productoParrafos, d.productoParrafos),
        };
  const imagenes = mergeImagenes(src.imagenes, d.imagenes);
  const videos = mergeVideos(src.videos, d.videos);
  const introMedios = mergeMedios(src.introMedios, legacyIntroMedios(src, d, imagenes));
  const productoMedios = mergeMedios(
    src.productoMedios,
    legacyProductoMedios(src, d, slug, imagenes),
  );
  return {
    slug,
    activa: src.activa !== false,
    menuLabel: str(src.menuLabel, d.menuLabel),
    estilo: resolveEstilo(slug, src.estilo, d.estilo),
    kicker: str(src.kicker, d.kicker),
    tituloLinea: str(src.tituloLinea, d.tituloLinea),
    tituloAcento: str(src.tituloAcento, d.tituloAcento),
    lead: str(src.lead, d.lead),
    heroParrafos: mergeHeroParrafos(slug, src.heroParrafos, d.heroParrafos),
    theme: (src.theme as PortalFinstruvialServicioLanding['theme']) || d.theme,
    mostrarBadgeVirtual: src.mostrarBadgeVirtual === true,
    heroImagenUrl: str(src.heroImagenUrl, d.heroImagenUrl),
    heroImagenUrlAbsoluta: src.heroImagenUrlAbsoluta?.trim() || d.heroImagenUrlAbsoluta,
    heroImagenAlt: str(src.heroImagenAlt, d.heroImagenAlt),
    heroVideoYoutubeUrl: str(src.heroVideoYoutubeUrl, d.heroVideoYoutubeUrl),
    ctaPrincipal: str(src.ctaPrincipal, d.ctaPrincipal),
    ctaPrincipalUrl: str(src.ctaPrincipalUrl, d.ctaPrincipalUrl),
    ctaSecundario: str(src.ctaSecundario, d.ctaSecundario),
    ctaSecundarioUrl: str(src.ctaSecundarioUrl, d.ctaSecundarioUrl),
    hubIcon: str(src.hubIcon, d.hubIcon),
    hubLead: str(src.hubLead, d.hubLead),
    introKicker: str(src.introKicker, d.introKicker),
    introTitulo: str(src.introTitulo, d.introTitulo),
    introLead: intro.introLead,
    introParrafos: intro.introParrafos,
    introMedios,
    bloquesKicker: str(src.bloquesKicker, d.bloquesKicker),
    bloquesTitulo: str(src.bloquesTitulo, d.bloquesTitulo),
    bloques: mergeBloques(src.bloques, d.bloques),
    metodologiaKicker: str(src.metodologiaKicker, d.metodologiaKicker),
    metodologiaTitulo: str(src.metodologiaTitulo, d.metodologiaTitulo),
    metodologiaLead: str(src.metodologiaLead, d.metodologiaLead),
    metodologiaPasos: arr(src.metodologiaPasos, d.metodologiaPasos),
    resultadoKicker: str(src.resultadoKicker, d.resultadoKicker),
    resultadoTitulo: str(src.resultadoTitulo, d.resultadoTitulo),
    resultadoIconos: mergeBloques(src.resultadoIconos, d.resultadoIconos),
    flujoVertical: mergeItems(src.flujoVertical, d.flujoVertical),
    flujoTecnologico: arr(src.flujoTecnologico, d.flujoTecnologico),
    sistemaSeguroCentro: str(src.sistemaSeguroCentro, d.sistemaSeguroCentro),
    sistemaSeguroItems: arr(src.sistemaSeguroItems, d.sistemaSeguroItems),
    sistemaSeguroLead: str(src.sistemaSeguroLead, d.sistemaSeguroLead),
    publicos: arr(src.publicos, d.publicos),
    experiencias: mergeBloques(src.experiencias, d.experiencias),
    mensajeTitulo: str(src.mensajeTitulo, d.mensajeTitulo),
    mensajeSubtitulo: str(src.mensajeSubtitulo, d.mensajeSubtitulo),
    dashboardFiltros: arr(src.dashboardFiltros, d.dashboardFiltros),
    dashboardStats: mergeStats(src.dashboardStats, d.dashboardStats),
    preguntas: arr(src.preguntas, d.preguntas),
    ecosistemaCentro: str(src.ecosistemaCentro, d.ecosistemaCentro),
    ecosistemaKicker: str(src.ecosistemaKicker, d.ecosistemaKicker),
    ecosistemaTitulo: str(src.ecosistemaTitulo, d.ecosistemaTitulo),
    ecosistemaItems: mergeBloques(src.ecosistemaItems, d.ecosistemaItems),
    gamificacionKicker: str(src.gamificacionKicker, d.gamificacionKicker),
    gamificacionTitulo: str(src.gamificacionTitulo, d.gamificacionTitulo),
    gamificacionItems: arr(src.gamificacionItems, d.gamificacionItems),
    formulaAprendizaje: str(src.formulaAprendizaje, d.formulaAprendizaje),
    pilaresEducativos: mergeBloques(src.pilaresEducativos, d.pilaresEducativos),
    rutaAprendizaje: arr(src.rutaAprendizaje, d.rutaAprendizaje),
    experienciaItems: mergeBloques(src.experienciaItems, d.experienciaItems),
    experienciaSeccionKicker: str(src.experienciaSeccionKicker, d.experienciaSeccionKicker),
    experienciaSeccionTitulo: str(src.experienciaSeccionTitulo, d.experienciaSeccionTitulo),
    usarCatalogoCursos:
      slug === 'aulaVirtual'
        ? true
        : src.usarCatalogoCursos !== undefined
          ? src.usarCatalogoCursos === true
          : d.usarCatalogoCursos === true,
    modulosPlataformaKicker: str(src.modulosPlataformaKicker, d.modulosPlataformaKicker),
    modulosPlataformaTitulo: str(src.modulosPlataformaTitulo, d.modulosPlataformaTitulo),
    modulosPlataformaLead: str(src.modulosPlataformaLead, d.modulosPlataformaLead),
    modulosPlataforma: mergeBloques(src.modulosPlataforma, d.modulosPlataforma),
    cierreQuote: str(src.cierreQuote, d.cierreQuote),
    listaServicios: mergeItems(src.listaServicios, d.listaServicios),
    listaTitulo: str(src.listaTitulo, d.listaTitulo),
    productoKicker: str(src.productoKicker, d.productoKicker),
    productoNombre: str(src.productoNombre, d.productoNombre),
    productoLead: producto.productoLead,
    productoParrafos: producto.productoParrafos,
    productoEtiquetas: arr(src.productoEtiquetas, d.productoEtiquetas),
    productoMedios,
    productoVideoYoutubeUrl: str(src.productoVideoYoutubeUrl, d.productoVideoYoutubeUrl),
    productoImagenId: str(src.productoImagenId, d.productoImagenId),
    ctaTitulo: str(src.ctaTitulo, d.ctaTitulo),
    ctaLead: str(src.ctaLead, d.ctaLead),
    ctaBtnPrincipal: str(src.ctaBtnPrincipal, d.ctaBtnPrincipal),
    ctaBtnSecundario: str(src.ctaBtnSecundario, d.ctaBtnSecundario),
    tarjetaCta: str(src.tarjetaCta, d.tarjetaCta),
    imagenes,
    videos,
    metaDescription: str(src.metaDescription, d.metaDescription),
  };
}

export function finstruvialServiciosIncompleto(
  raw?: Partial<PortalFinstruvialServiciosConfig> | null,
): boolean {
  if (!raw?.paginas) return true;
  return FINSTRUVIAL_SERVICIO_SLUGS.some((slug) => !raw.paginas?.[slug]);
}

export function mergeFinstruvialServicios(
  raw?: Partial<PortalFinstruvialServiciosConfig> | null,
): PortalFinstruvialServiciosConfig {
  const d = FINSTRUVIAL_SERVICIOS_DEFAULTS;
  const src = raw && typeof raw === 'object' ? raw : {};
  const paginas = {} as Record<FinstruvialServicioSlug, PortalFinstruvialServicioLanding>;
  for (const slug of FINSTRUVIAL_SERVICIO_SLUGS) {
    paginas[slug] = mergeFinstruvialServicioLanding(slug, src.paginas?.[slug]);
  }
  return {
    activa: src.activa !== false,
    menuLabel: str(src.menuLabel, d.menuLabel),
    hub: {
      kicker: str(src.hub?.kicker, d.hub.kicker),
      tituloLinea: str(src.hub?.tituloLinea, d.hub.tituloLinea),
      tituloAcento: str(src.hub?.tituloAcento, d.hub.tituloAcento),
      lead: str(src.hub?.lead, d.hub.lead),
      gridTitulo: str(src.hub?.gridTitulo, d.hub.gridTitulo),
      gridLead: str(src.hub?.gridLead, d.hub.gridLead),
      heroImagenUrl: str(src.hub?.heroImagenUrl, d.hub.heroImagenUrl),
      heroImagenUrlAbsoluta: src.hub?.heroImagenUrlAbsoluta?.trim() || d.hub.heroImagenUrlAbsoluta,
      heroImagenAlt: str(src.hub?.heroImagenAlt, d.hub.heroImagenAlt),
    },
    paginas,
  };
}

export function finstruvialServiciosLista(
  config: PortalFinstruvialServiciosConfig,
): PortalFinstruvialServicioLanding[] {
  return FINSTRUVIAL_SERVICIO_SLUGS.map((slug) => config.paginas[slug]);
}

export function finstruvialPortafolioActivo(config: PortalFinstruvialServiciosConfig): boolean {
  return config.activa !== false;
}

export function finstruvialServiciosActivos(
  config: PortalFinstruvialServiciosConfig,
): PortalFinstruvialServicioLanding[] {
  if (!finstruvialPortafolioActivo(config)) return [];
  return finstruvialServiciosLista(config).filter((p) => p.activa !== false);
}
