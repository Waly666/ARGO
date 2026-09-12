import {
  mergePromoHeroPillars,
  PROMO_HERO_PILARES_INSTITUCION,
  PortalPromoHeroPillar,
} from '../../core/constants/portal-promo-hero-fields.util';
import {
  mergeEnlacesRelacionados,
  PortalEnlaceRelacionado,
} from '../../core/portal-enlace-relacionado.util';
import {
  CC_DIRECCION,
  CC_ENLACES_RELACIONADOS,
  CC_ENLACES_RELACIONADOS_TITULO,
  CC_FAQ,
  CC_FAQ_TITULO,
  CC_HERO,
  CC_INVITACION,
  CC_INSCRIPCIONES,
  CC_LICENCIAS_ITEMS,
  CC_LICENCIAS_SECCION,
  CC_LICENCIAS_URL,
  CC_LOCAL,
  CC_SECCION_IMAGENES,
  CC_MAPS_URL,
  CC_METODOLOGIA,
  CC_REQUISITOS,
  CC_SEO_TEXTO,
  CC_TELEFONO_DISPLAY,
  CC_WHATSAPP_DISPLAY,
  CC_WHATSAPP_URL,
  CURSOS_CONDUCCION_GUION_VERSION,
} from './cursos-conduccion-guion';

export interface PortalCursosConduccionResolucion {
  titulo: string;
  archivoUrl: string;
  archivoUrlAbsoluta?: string;
  nombreArchivo: string;
}

/** @deprecated Reemplazado por licencias.items */
export interface PortalCursosConduccionCategoria {
  codigo: string;
  titulo: string;
  descripcion: string;
}

export interface PortalCursosConduccionLicenciaItem {
  icon: string;
  codigo: string;
  titulo: string;
  subtitulo?: string;
  incluye: string[];
  licenciaLabel: string;
  valor: string;
  btnTexto: string;
  btnUrl: string;
  destacada: boolean;
}

export interface PortalCursosConduccionImagenSeccion {
  url: string;
  urlAbsoluta?: string;
  alt: string;
}

export interface PortalCursosConduccionSeccionImagenes {
  invitacion?: PortalCursosConduccionImagenSeccion;
  metodologiaTeorica?: PortalCursosConduccionImagenSeccion;
  metodologiaPractica?: PortalCursosConduccionImagenSeccion;
  metodologiaTaller?: PortalCursosConduccionImagenSeccion;
  requisitos?: PortalCursosConduccionImagenSeccion;
  seo?: PortalCursosConduccionImagenSeccion;
  local?: PortalCursosConduccionImagenSeccion;
}

export interface PortalCursosConduccionLicencias {
  kicker: string;
  titulo: string;
  lead: string;
  items: PortalCursosConduccionLicenciaItem[];
}

export interface PortalCursosConduccionBeneficio {
  icon: string;
  titulo: string;
  texto: string;
}

export interface PortalCursosConduccionPublicidadSlide {
  url: string;
  urlAbsoluta?: string;
  alt: string;
  enlace: string;
}

export interface PortalCursosConduccionPublicidad {
  activo: boolean;
  intervaloSegundos: number;
  slides: PortalCursosConduccionPublicidadSlide[];
}

export interface PortalCursosConduccionInvitacion {
  kicker: string;
  titulo: string;
  lead: string;
  institucion: string;
  beneficios: PortalCursosConduccionBeneficio[];
  destacado: string;
  cierre: string;
  firma: string;
  btnCursos: string;
  btnRegistro: string;
}

export interface PortalCursosConduccionFaqItem {
  pregunta: string;
  respuesta: string;
}

export interface PortalCursosConduccionMetodologiaItem {
  titulo: string;
  texto: string;
}

export interface PortalCursosConduccionLanding {
  guionVersion?: number;
  hero: {
    kicker: string;
    imagenUrl: string;
    imagenUrlAbsoluta?: string;
    imagenAlt: string;
    pillarsLabel: string;
    pillars: PortalPromoHeroPillar[];
    mostrarBadgeVirtual: boolean;
    virtualBadgeLabel: string;
    highlightIcon: string;
    highlightTitle: string;
    highlightSubtitle: string;
    highlightRadar: boolean;
  };
  tituloPrincipal: string;
  textoInstitucional: string;
  resoluciones: PortalCursosConduccionResolucion[];
  invitacion: PortalCursosConduccionInvitacion;
  licencias: PortalCursosConduccionLicencias;
  publicidad: PortalCursosConduccionPublicidad;
  seccionImagenes: PortalCursosConduccionSeccionImagenes;
  metodologiaTitulo: string;
  metodologiaLead: string;
  metodologiaItems: PortalCursosConduccionMetodologiaItem[];
  requisitosTitulo: string;
  requisitosLead: string;
  requisitosTexto: string;
  requisitosLicenciaTexto: string;
  requisitosLicenciaEnlaceTexto: string;
  requisitosBtnTexto: string;
  requisitosBtnUrl: string;
  seoTextoTitulo: string;
  seoTextoParrafos: string[];
  faqTitulo: string;
  faq: PortalCursosConduccionFaqItem[];
  inscripcionesTitulo: string;
  inscripcionesLead: string;
  localTitulo: string;
  localLead: string;
  localDireccion: string;
  localWhatsApp: string;
  localWhatsAppUrl: string;
  localTelefono: string;
  localBtnMapsTexto: string;
  localBtnMapsUrl: string;
  localBtnWhatsappTexto: string;
  enlacesRelacionadosTitulo: string;
  enlacesRelacionados: PortalEnlaceRelacionado[];
  /** @deprecated Usar licencias */
  etiquetaCategorias?: string;
  /** @deprecated Usar licencias.lead */
  textoIntroCategorias?: string;
  /** @deprecated Usar licencias.items */
  categorias?: PortalCursosConduccionCategoria[];
  /** @deprecated Usar invitacion */
  textoInvitacion?: string;
}

const INVITACION_BENEFICIOS: PortalCursosConduccionBeneficio[] = [
  {
    icon: 'shield-check',
    titulo: 'Seguridad vial',
    texto: 'Normas de tránsito, prevención del riesgo y conducción responsable.',
  },
  {
    icon: 'academic-cap',
    titulo: 'Competencias al volante',
    texto: 'Técnicas de conducción segura adaptadas a cada categoría de licencia.',
  },
  {
    icon: 'wrench',
    titulo: 'Conocimiento del vehículo',
    texto: 'Actividades de taller para verificar elementos de seguridad y mantenimiento básico.',
  },
];

const INVITACION_DEFAULTS: PortalCursosConduccionInvitacion = {
  ...CC_INVITACION,
  beneficios: INVITACION_BENEFICIOS.map((b) => ({ ...b })),
};

const LICENCIAS_DEFAULTS: PortalCursosConduccionLicencias = {
  ...CC_LICENCIAS_SECCION,
  items: CC_LICENCIAS_ITEMS.map((item) => ({ ...item, incluye: [...item.incluye] })),
};

const PUBLICIDAD_DEFAULTS: PortalCursosConduccionPublicidad = {
  activo: true,
  intervaloSegundos: 5,
  slides: [],
};

export const CURSOS_CONDUCCION_LANDING_DEFAULTS: PortalCursosConduccionLanding = {
  guionVersion: CURSOS_CONDUCCION_GUION_VERSION,
  hero: {
    kicker: CC_HERO.kicker,
    imagenUrl: '',
    imagenAlt: CC_HERO.imagenAlt,
    pillarsLabel: 'Formación de conductores',
    pillars: PROMO_HERO_PILARES_INSTITUCION,
    mostrarBadgeVirtual: true,
    virtualBadgeLabel: 'VIRTUAL',
    highlightIcon: 'car',
    highlightTitle: CC_INVITACION.destacado,
    highlightSubtitle: CC_INVITACION.lead,
    highlightRadar: true,
  },
  tituloPrincipal: CC_HERO.tituloPrincipal,
  textoInstitucional: CC_HERO.textoInstitucional,
  resoluciones: [
    { titulo: 'Resolución 2267 de 06/08/2014 Mintransporte', archivoUrl: '', nombreArchivo: '' },
    { titulo: 'Resolución 2294 del 11/08/2014 Mintransporte', archivoUrl: '', nombreArchivo: '' },
  ],
  invitacion: { ...INVITACION_DEFAULTS, beneficios: INVITACION_BENEFICIOS.map((b) => ({ ...b })) },
  licencias: {
    ...LICENCIAS_DEFAULTS,
    items: LICENCIAS_DEFAULTS.items.map((item) => ({ ...item, incluye: [...item.incluye] })),
  },
  publicidad: { ...PUBLICIDAD_DEFAULTS, slides: [] },
  seccionImagenes: JSON.parse(JSON.stringify(CC_SECCION_IMAGENES)),
  metodologiaTitulo: CC_METODOLOGIA.titulo,
  metodologiaLead: CC_METODOLOGIA.lead,
  metodologiaItems: CC_METODOLOGIA.items.map((m) => ({ ...m })),
  requisitosTitulo: CC_REQUISITOS.titulo,
  requisitosLead: CC_REQUISITOS.lead,
  requisitosTexto: CC_REQUISITOS.texto,
  requisitosLicenciaTexto: CC_REQUISITOS.licenciaTexto,
  requisitosLicenciaEnlaceTexto: CC_REQUISITOS.licenciaEnlaceTexto,
  requisitosBtnTexto: CC_REQUISITOS.btnTexto,
  requisitosBtnUrl: CC_REQUISITOS.btnUrl,
  seoTextoTitulo: CC_SEO_TEXTO.titulo,
  seoTextoParrafos: [...CC_SEO_TEXTO.parrafos],
  faqTitulo: CC_FAQ_TITULO,
  faq: CC_FAQ.map((f) => ({ ...f })),
  inscripcionesTitulo: CC_INSCRIPCIONES.titulo,
  inscripcionesLead: CC_INSCRIPCIONES.lead,
  localTitulo: CC_LOCAL.titulo,
  localLead: CC_LOCAL.lead,
  localDireccion: CC_DIRECCION,
  localWhatsApp: CC_WHATSAPP_DISPLAY,
  localWhatsAppUrl: CC_WHATSAPP_URL,
  localTelefono: CC_TELEFONO_DISPLAY,
  localBtnMapsTexto: CC_LOCAL.btnMapsTexto,
  localBtnMapsUrl: CC_MAPS_URL,
  localBtnWhatsappTexto: CC_LOCAL.btnWhatsappTexto,
  enlacesRelacionadosTitulo: CC_ENLACES_RELACIONADOS_TITULO,
  enlacesRelacionados: CC_ENLACES_RELACIONADOS.map((e) => ({ ...e })),
};

function cursosConduccionNecesitaActualizarGuion(src: Partial<PortalCursosConduccionLanding>): boolean {
  const v = Number(src.guionVersion) || 0;
  if (v < CURSOS_CONDUCCION_GUION_VERSION) return true;
  const titulo = String(src.tituloPrincipal || '').trim();
  if (titulo === 'CENTRO DE ENSEÑANZA AUTOMOVILÍSTICA') return true;
  const items = src.licencias?.items || [];
  const codigos = items.map((i) => String(i.codigo || '').toUpperCase());
  if (codigos.includes('B2') || codigos.includes('C3')) return true;
  if (items.length !== 4) return true;
  if (items.some((i) => (i.incluye?.length ?? 0) <= 2)) return true;
  if (src.licencias?.kicker === 'Categorías de Licencia de Conducción') return true;
  if (src.licencias?.titulo === 'Cursos de Conducción Disponibles') return true;
  return false;
}

function mergeCursosConduccionPreservandoUsuario(
  src: Partial<PortalCursosConduccionLanding>,
  d: PortalCursosConduccionLanding,
): PortalCursosConduccionLanding {
  const merged = JSON.parse(JSON.stringify(d)) as PortalCursosConduccionLanding;
  const hero = src.hero;
  if (hero?.imagenUrl?.trim() || hero?.imagenUrlAbsoluta?.trim()) {
    merged.hero = {
      ...merged.hero,
      imagenUrl: hero.imagenUrl?.trim() || merged.hero.imagenUrl,
      imagenUrlAbsoluta: hero.imagenUrlAbsoluta?.trim() || merged.hero.imagenUrlAbsoluta,
    };
  }
  if (src.publicidad?.slides?.length) {
    merged.publicidad = mergePublicidad(src.publicidad);
  }
  if (src.resoluciones?.length) {
    merged.resoluciones = src.resoluciones.map((r, i) => ({
      titulo: r.titulo?.trim() || d.resoluciones[i]?.titulo || '',
      archivoUrl: r.archivoUrl?.trim() || '',
      archivoUrlAbsoluta: r.archivoUrlAbsoluta?.trim() || undefined,
      nombreArchivo: r.nombreArchivo?.trim() || '',
    }));
  }
  const precios = new Map(
    (src.licencias?.items || []).map((item) => [String(item.codigo || '').toUpperCase(), item.valor]),
  );
    merged.licencias.items = merged.licencias.items.map((item) => {
      const valor = precios.get(item.codigo.toUpperCase());
      return valor?.trim() ? { ...item, valor: valor.trim() } : item;
    });
    if (!src.enlacesRelacionados?.length) {
      merged.enlacesRelacionados = d.enlacesRelacionados.map((e) => ({ ...e }));
      merged.enlacesRelacionadosTitulo = d.enlacesRelacionadosTitulo;
    }
    merged.seccionImagenes = mergeSeccionImagenes(src.seccionImagenes);
    merged.guionVersion = CURSOS_CONDUCCION_GUION_VERSION;
    return merged;
}

function mergeInvitacion(
  raw?: Partial<PortalCursosConduccionInvitacion> | null,
): PortalCursosConduccionInvitacion {
  const d = INVITACION_DEFAULTS;
  if (!raw) return JSON.parse(JSON.stringify(d)) as PortalCursosConduccionInvitacion;
  const beneficiosSrc = raw.beneficios?.length ? raw.beneficios : d.beneficios;
  return {
    kicker: raw.kicker?.trim() || d.kicker,
    titulo: raw.titulo?.trim() || d.titulo,
    lead: raw.lead?.trim() || d.lead,
    institucion: raw.institucion?.trim() || d.institucion,
    destacado: raw.destacado?.trim() || d.destacado,
    cierre: raw.cierre?.trim() || d.cierre,
    firma: raw.firma?.trim() || d.firma,
    btnCursos: raw.btnCursos?.trim() || d.btnCursos,
    btnRegistro: raw.btnRegistro?.trim() || d.btnRegistro,
    beneficios: beneficiosSrc.map((b, i) => ({
      icon: b.icon?.trim() || d.beneficios[i]?.icon || 'shield-check',
      titulo: b.titulo?.trim() || d.beneficios[i]?.titulo || '',
      texto: b.texto?.trim() || d.beneficios[i]?.texto || '',
    })),
  };
}

function mergeLicenciaItem(
  item: Partial<PortalCursosConduccionLicenciaItem>,
  fb: PortalCursosConduccionLicenciaItem,
): PortalCursosConduccionLicenciaItem {
  const incluyeRaw = item.incluye?.length ? item.incluye : fb.incluye;
  const incluye = incluyeRaw.map((x) => String(x || '').trim()).filter(Boolean);
  return {
    icon: item.icon?.trim() || fb.icon,
    codigo: item.codigo?.trim() || fb.codigo,
    titulo: item.titulo?.trim() || fb.titulo,
    subtitulo: item.subtitulo?.trim() || fb.subtitulo,
    incluye: incluye.length ? incluye : [...fb.incluye],
    licenciaLabel: item.licenciaLabel?.trim() || fb.licenciaLabel,
    valor: item.valor?.trim() ?? fb.valor,
    btnTexto: item.btnTexto?.trim() || fb.btnTexto,
    btnUrl: item.btnUrl?.trim() || fb.btnUrl,
    destacada: item.destacada === true,
  };
}

const SECCION_IMAGEN_SLOTS: (keyof PortalCursosConduccionSeccionImagenes)[] = [
  'invitacion',
  'metodologiaTeorica',
  'metodologiaPractica',
  'metodologiaTaller',
  'requisitos',
  'seo',
  'local',
];

function mergeImagenSeccion(
  raw?: Partial<PortalCursosConduccionImagenSeccion> | null,
  fb?: PortalCursosConduccionImagenSeccion,
): PortalCursosConduccionImagenSeccion | undefined {
  const url = raw?.url?.trim() || fb?.url?.trim() || '';
  if (!url) return undefined;
  return {
    url,
    urlAbsoluta: raw?.urlAbsoluta?.trim() || undefined,
    alt: raw?.alt?.trim() || fb?.alt || 'Formación en conducción SERVIAL',
  };
}

function mergeSeccionImagenes(
  raw?: Partial<PortalCursosConduccionSeccionImagenes> | null,
): PortalCursosConduccionSeccionImagenes {
  const d = CC_SECCION_IMAGENES as PortalCursosConduccionSeccionImagenes;
  const src = raw && typeof raw === 'object' ? raw : {};
  const merged: PortalCursosConduccionSeccionImagenes = {};
  for (const slot of SECCION_IMAGEN_SLOTS) {
    const img = mergeImagenSeccion(src[slot], d[slot]);
    if (img) merged[slot] = img;
  }
  return merged;
}

function mergeLicencias(
  raw?: Partial<PortalCursosConduccionLicencias> | null,
  legacy?: {
    etiquetaCategorias?: string;
    textoIntroCategorias?: string;
    categorias?: PortalCursosConduccionCategoria[];
  },
): PortalCursosConduccionLicencias {
  const d = LICENCIAS_DEFAULTS;
  if (raw?.items?.length) {
    return {
      kicker: raw.kicker?.trim() || d.kicker,
      titulo: raw.titulo?.trim() || d.titulo,
      lead: raw.lead?.trim() || d.lead,
      items: raw.items.map((item, i) => mergeLicenciaItem(item, d.items[i] || d.items[0])),
    };
  }

  if (legacy?.categorias?.length) {
    const iconMap: Record<string, string> = {
      a2: 'bicycle',
      b2: 'truck',
      c1: 'bus',
      c2: 'truck',
      c3: 'truck',
    };
    return {
      kicker: legacy.etiquetaCategorias?.trim() || d.kicker,
      titulo: 'Cursos de Conducción Disponibles',
      lead: legacy.textoIntroCategorias?.trim() || d.lead,
      items: legacy.categorias.map((c, i) => {
        const fb = d.items[i] || d.items[0];
        const cod = (c.codigo || fb.codigo || '').trim().toUpperCase();
        const desc = c.descripcion?.trim();
        return mergeLicenciaItem(
          {
            icon: iconMap[c.codigo?.trim().toLowerCase()] || fb.icon,
            codigo: cod,
            titulo: c.titulo?.trim() ? c.titulo.trim() : fb.titulo,
            incluye: desc ? [desc, ...fb.incluye.slice(1)] : fb.incluye,
            licenciaLabel: fb.licenciaLabel || `Categoría ${cod}`,
          },
          fb,
        );
      }),
    };
  }

  return JSON.parse(JSON.stringify(d)) as PortalCursosConduccionLicencias;
}

function mergePublicidad(
  raw?: Partial<PortalCursosConduccionPublicidad> | null,
): PortalCursosConduccionPublicidad {
  const d = PUBLICIDAD_DEFAULTS;
  if (!raw) return { ...d, slides: [] };
  const slidesSrc = Array.isArray(raw.slides) ? raw.slides : [];
  return {
    activo: raw.activo !== false,
    intervaloSegundos: Math.max(3, Number(raw.intervaloSegundos) || d.intervaloSegundos),
    slides: slidesSrc
      .map((s) => ({
        url: s.url?.trim() || '',
        urlAbsoluta: s.urlAbsoluta?.trim() || undefined,
        alt: s.alt?.trim() || 'Publicidad',
        enlace: s.enlace?.trim() || '',
      }))
      .filter((s) => s.url),
  };
}

function mergeFaq(
  raw?: PortalCursosConduccionFaqItem[] | null,
  fb: PortalCursosConduccionFaqItem[] = CC_FAQ,
): PortalCursosConduccionFaqItem[] {
  const src = Array.isArray(raw) ? raw : [];
  if (!src.length) return fb.map((f) => ({ ...f }));
  return src
    .map((item, i) => ({
      pregunta: item.pregunta?.trim() || fb[i]?.pregunta || '',
      respuesta: item.respuesta?.trim() || fb[i]?.respuesta || '',
    }))
    .filter((f) => f.pregunta && f.respuesta);
}

function mergeMetodologiaItems(
  raw?: PortalCursosConduccionMetodologiaItem[] | null,
): PortalCursosConduccionMetodologiaItem[] {
  const fb = CC_METODOLOGIA.items;
  const src = Array.isArray(raw) ? raw : [];
  if (!src.length) return fb.map((m) => ({ ...m }));
  return src.map((item, i) => ({
    titulo: item.titulo?.trim() || fb[i]?.titulo || '',
    texto: item.texto?.trim() || fb[i]?.texto || '',
  }));
}

export function mergeCursosConduccionLanding(
  raw?: Partial<PortalCursosConduccionLanding> | null,
): PortalCursosConduccionLanding {
  const d = CURSOS_CONDUCCION_LANDING_DEFAULTS;
  const src = raw && typeof raw === 'object' ? raw : {};
  if (!raw) return JSON.parse(JSON.stringify(d)) as PortalCursosConduccionLanding;

  if (cursosConduccionNecesitaActualizarGuion(src)) {
    return mergeCursosConduccionPreservandoUsuario(src, d);
  }

  const str = (v: unknown, fb: string) => String(v ?? fb).trim() || fb;
  const parrafos = (v: string[] | undefined, fb: string[]) =>
    Array.isArray(v) && v.length ? v.map((p) => String(p || '').trim()).filter(Boolean) : [...fb];

  return {
    guionVersion: CURSOS_CONDUCCION_GUION_VERSION,
    hero: {
      kicker: raw.hero?.kicker?.trim() || d.hero.kicker,
      imagenUrl: raw.hero?.imagenUrl?.trim() || d.hero.imagenUrl,
      imagenUrlAbsoluta: raw.hero?.imagenUrlAbsoluta?.trim() || undefined,
      imagenAlt: raw.hero?.imagenAlt?.trim() || d.hero.imagenAlt,
      pillarsLabel: raw.hero?.pillarsLabel?.trim() || d.hero.pillarsLabel,
      pillars: mergePromoHeroPillars(raw.hero?.pillars, d.hero.pillars),
      mostrarBadgeVirtual: raw.hero?.mostrarBadgeVirtual !== false,
      virtualBadgeLabel: raw.hero?.virtualBadgeLabel?.trim() || d.hero.virtualBadgeLabel,
      highlightIcon: raw.hero?.highlightIcon?.trim() || d.hero.highlightIcon,
      highlightTitle: raw.hero?.highlightTitle?.trim() || d.hero.highlightTitle,
      highlightSubtitle: raw.hero?.highlightSubtitle?.trim() || d.hero.highlightSubtitle,
      highlightRadar: raw.hero?.highlightRadar !== false,
    },
    tituloPrincipal: str(raw.tituloPrincipal, d.tituloPrincipal),
    textoInstitucional: str(raw.textoInstitucional, d.textoInstitucional),
    invitacion: mergeInvitacion(raw.invitacion),
    licencias: mergeLicencias(raw.licencias, {
      etiquetaCategorias: raw.etiquetaCategorias,
      textoIntroCategorias: raw.textoIntroCategorias,
      categorias: raw.categorias,
    }),
    resoluciones: raw.resoluciones?.length
      ? raw.resoluciones.map((r, i) => ({
          titulo: r.titulo?.trim() || d.resoluciones[i]?.titulo || '',
          archivoUrl: r.archivoUrl?.trim() || '',
          archivoUrlAbsoluta: r.archivoUrlAbsoluta?.trim() || undefined,
          nombreArchivo: r.nombreArchivo?.trim() || '',
        }))
      : d.resoluciones.map((r) => ({ ...r })),
    publicidad: mergePublicidad(raw.publicidad),
    seccionImagenes: mergeSeccionImagenes(raw.seccionImagenes),
    metodologiaTitulo: str(raw.metodologiaTitulo, d.metodologiaTitulo),
    metodologiaLead: str(raw.metodologiaLead, d.metodologiaLead),
    metodologiaItems: mergeMetodologiaItems(raw.metodologiaItems),
    requisitosTitulo: str(raw.requisitosTitulo, d.requisitosTitulo),
    requisitosLead: str(raw.requisitosLead, d.requisitosLead),
    requisitosTexto: str(raw.requisitosTexto, d.requisitosTexto),
    requisitosLicenciaTexto: str(raw.requisitosLicenciaTexto, d.requisitosLicenciaTexto),
    requisitosLicenciaEnlaceTexto: str(raw.requisitosLicenciaEnlaceTexto, d.requisitosLicenciaEnlaceTexto),
    requisitosBtnTexto: str(raw.requisitosBtnTexto, d.requisitosBtnTexto),
    requisitosBtnUrl: str(raw.requisitosBtnUrl, d.requisitosBtnUrl),
    seoTextoTitulo: str(raw.seoTextoTitulo, d.seoTextoTitulo),
    seoTextoParrafos: parrafos(raw.seoTextoParrafos, d.seoTextoParrafos),
    faqTitulo: str(raw.faqTitulo, d.faqTitulo),
    faq: mergeFaq(raw.faq, d.faq),
    inscripcionesTitulo: str(raw.inscripcionesTitulo, d.inscripcionesTitulo),
    inscripcionesLead: str(raw.inscripcionesLead, d.inscripcionesLead),
    localTitulo: str(raw.localTitulo, d.localTitulo),
    localLead: str(raw.localLead, d.localLead),
    localDireccion: str(raw.localDireccion, d.localDireccion),
    localWhatsApp: str(raw.localWhatsApp, d.localWhatsApp),
    localWhatsAppUrl: str(raw.localWhatsAppUrl, d.localWhatsAppUrl),
    localTelefono: str(raw.localTelefono, d.localTelefono),
    localBtnMapsTexto: str(raw.localBtnMapsTexto, d.localBtnMapsTexto),
    localBtnMapsUrl: str(raw.localBtnMapsUrl, d.localBtnMapsUrl),
    localBtnWhatsappTexto: str(raw.localBtnWhatsappTexto, d.localBtnWhatsappTexto),
    enlacesRelacionadosTitulo: str(raw.enlacesRelacionadosTitulo, d.enlacesRelacionadosTitulo),
    enlacesRelacionados: mergeEnlacesRelacionados(raw.enlacesRelacionados, d.enlacesRelacionados),
  };
}
