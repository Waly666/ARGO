/** Catálogo SEO editable por página — editor del sitio web (ERP). */

import {
  finstruvialServicioPublicRoute,
  FINSTRUVIAL_SERVICIO_SLUGS,
  FinstruvialServicioSlug,
} from './finstruvial-servicios.constants';
import { mergeFinstruvialServicios } from './finstruvial-servicios-defaults';
import { PortalFinstruvialServiciosConfig } from './finstruvial-servicio-landing.types';
import { PortalPaginaKey, PortalSiteConfig } from './portal-site-defaults';
import {
  finstruvialServicioPublicRouteWithSite,
  portalPageRoute,
} from '../utils/portal-page-route.util';

export type FinstruvialServicioSeoKey = `servicio_${FinstruvialServicioSlug}`;

export type PortalSeoPageKey =
  | 'home'
  | 'cursos'
  | 'tienda'
  | 'acerca'
  | 'fundacion'
  | 'consultaCertificados'
  | 'cursosConduccion'
  | 'examenTeorico'
  | 'mercanciasPeligrosas'
  | 'trabajoEnAlturas'
  | 'manejoDefensivo'
  | 'primerosAuxilios'
  | 'serviciosHub'
  | FinstruvialServicioSeoKey
  | 'blog'
  | 'galeria'
  | 'pqr'
  | 'jornadasCapacitacion'
  | 'evaluacionJornadas';

export function finstruvialServicioSeoKey(slug: FinstruvialServicioSlug): FinstruvialServicioSeoKey {
  return `servicio_${slug}`;
}

export function isFinstruvialServicioSeoKey(key: string): key is FinstruvialServicioSeoKey {
  return key.startsWith('servicio_') && FINSTRUVIAL_SERVICIO_SLUGS.includes(key.slice(9) as FinstruvialServicioSlug);
}

function finstruvialServicioTitulo(
  pagina: { tituloLinea: string; tituloAcento: string; menuLabel: string },
): string {
  return [pagina.tituloLinea, pagina.tituloAcento].filter(Boolean).join(' ') || pagina.menuLabel;
}

function buildFinstruvialSeoCatalog(): PortalSeoPageMeta[] {
  const servicios = mergeFinstruvialServicios();
  const hub = servicios.hub;
  const hubTitulo = [hub.tituloLinea, hub.tituloAcento].filter(Boolean).join(' ') || servicios.menuLabel;
  const hubEntry: PortalSeoPageMeta = {
    key: 'serviciosHub',
    label: 'Portafolio de servicios',
    ruta: '/servicios',
    grupo: 'FINSTRUVIAL',
    hint:
      'Página índice /servicios. Si deja los campos vacíos, se usan los textos del editor «Portafolio (/servicios)».',
    defaultTitulo: `${hubTitulo} | FINSTRUVIAL`,
    defaultDescripcion:
      hub.lead?.trim() ||
      'Consultoría, estudios técnicos, planeación vial, tecnología y formación en tránsito, transporte y seguridad vial.',
    defaultKeywords: 'servicios FINSTRUVIAL, consultoría vial, seguridad vial, portafolio servicios',
  };

  const lineas = FINSTRUVIAL_SERVICIO_SLUGS.map((slug): PortalSeoPageMeta => {
    const p = servicios.paginas[slug];
    const titulo = finstruvialServicioTitulo(p);
    return {
      key: finstruvialServicioSeoKey(slug),
      label: p.menuLabel,
      ruta: finstruvialServicioPublicRoute(slug, p.routeSegment),
      grupo: 'FINSTRUVIAL',
      hint: `Línea de servicio. Si deja los campos vacíos, se usa el «Texto para Google» de ${p.menuLabel} en el editor del portafolio.`,
      defaultTitulo: `${titulo} | FINSTRUVIAL`,
      defaultDescripcion: p.metaDescription?.trim() || p.lead?.trim() || p.introLead?.trim() || p.menuLabel,
      defaultKeywords: `${p.menuLabel}, FINSTRUVIAL, seguridad vial, consultoría vial`,
    };
  });

  return [hubEntry, ...lineas];
}

export interface PortalSeoPageConfig {
  titulo: string;
  descripcion: string;
  keywords: string;
}

export interface PortalSeoPageMeta {
  key: PortalSeoPageKey;
  label: string;
  ruta: string;
  grupo: string;
  hint: string;
  defaultTitulo: string;
  defaultDescripcion: string;
  defaultKeywords: string;
}

export const PORTAL_SEO_PAGE_CATALOG: PortalSeoPageMeta[] = [
  {
    key: 'home',
    label: 'Inicio',
    ruta: '/',
    grupo: 'Principal',
    hint: 'Página principal del portal. Es la que más aparece en Google.',
    defaultTitulo: 'Cursos de seguridad vial y capacitación | Su institución',
    defaultDescripcion:
      'Cursos virtuales y presenciales en seguridad vial, manejo defensivo y capacitación para conductores y empresas.',
    defaultKeywords: 'cursos seguridad vial, manejo defensivo, capacitación conductores',
  },
  {
    key: 'cursos',
    label: 'Cursos',
    ruta: '/cursos',
    grupo: 'Principal',
    hint: 'Catálogo de cursos y programas virtuales.',
    defaultTitulo: 'Catálogo de cursos | Su institución',
    defaultDescripcion:
      'Explore cursos y programas en seguridad vial, tránsito y conducción. Conozca tarifas y matricúlese en línea.',
    defaultKeywords: 'cursos virtuales, seguridad vial, catálogo cursos',
  },
  {
    key: 'tienda',
    label: 'Tienda',
    ruta: '/tienda',
    grupo: 'Principal',
    hint: 'Vista de inscripción / tienda de cursos.',
    defaultTitulo: 'Tienda de cursos | Su institución',
    defaultDescripcion: 'Inscríbase a cursos virtuales certificados. Programas en línea para conductores y empresas.',
    defaultKeywords: 'tienda cursos, matrícula en línea, cursos certificados',
  },
  {
    key: 'acerca',
    label: 'Acerca de',
    ruta: '/acerca',
    grupo: 'Institucional',
    hint: 'Contacto e información de la institución.',
    defaultTitulo: 'Institución y contacto | Su institución',
    defaultDescripcion: 'Conozca nuestra misión, valores, cursos y capacitación. Teléfono, correo y sede.',
    defaultKeywords: 'contacto, institución, cursos conducción',
  },
  {
    key: 'fundacion',
    label: 'Institucional (CEA)',
    ruta: '/fundacion',
    grupo: 'Institucional',
    hint: 'Página institucional del centro de enseñanza.',
    defaultTitulo: 'Centro de enseñanza automovilística | Su institución',
    defaultDescripcion:
      'Cursos de conducción, licencias, manejo defensivo, seguridad vial y aula virtual certificada.',
    defaultKeywords: 'CEA, escuela de conducción, licencia de conducción',
  },
  {
    key: 'consultaCertificados',
    label: 'Consulta certificados',
    ruta: '/consulta-certificados',
    grupo: 'Servicios',
    hint: 'Verificación pública de certificados expedidos.',
    defaultTitulo: 'Consulta de certificados | Su institución',
    defaultDescripcion: 'Verifique en línea certificados expedidos por su institución. Consulta por documento.',
    defaultKeywords: 'consulta certificados, verificar certificado, seguridad vial',
  },
  {
    key: 'cursosConduccion',
    label: 'Cursos de conducción',
    ruta: '/cursos-conduccion',
    grupo: 'Servicios',
    hint: 'Licencias de conducción y categorías del CEA.',
    defaultTitulo: 'Cursos de Conducción en Villavicencio | SERVIAL Colombia',
    defaultDescripcion:
      'CEA SERVIAL Colombia: cursos de conducción A2, B2, C1, C2 y C3 en Villavicencio, Meta. Formación teórica, práctica y de taller.',
    defaultKeywords:
      'curso de conducción Villavicencio, escuela de conducción Villavicencio, CEA Villavicencio, curso A2, curso B2, curso C1, curso C2, curso C3',
  },
  {
    key: 'examenTeorico',
    label: 'Examen teórico',
    ruta: '/examen-teorico',
    grupo: 'Servicios',
    hint: 'Normatividad y trámites del examen teórico de licencia.',
    defaultTitulo: 'Examen teórico licencia de conducción | Su institución',
    defaultDescripcion:
      'Información sobre el examen teórico para obtener o recategorizar la licencia de conducción.',
    defaultKeywords: 'examen teórico, licencia conducción, RUNT',
  },
  {
    key: 'mercanciasPeligrosas',
    label: 'Mercancías peligrosas',
    ruta: '/mercancias-peligrosas',
    grupo: 'Servicios',
    hint:
      'TITLE y meta descripción para Google. El H1 y los H2 se editan en «Mercancías peligrosas». Google no usa meta keywords.',
    defaultTitulo: 'Curso Mercancías Peligrosas Villavicencio | SERVIAL',
    defaultDescripcion:
      'Curso de mercancías peligrosas en Villavicencio, Meta. Capacitación para conductores y empresas con SERVIAL Colombia. Atención en los Llanos Orientales.',
    defaultKeywords: '',
  },
  {
    key: 'trabajoEnAlturas',
    label: 'Trabajo en alturas',
    ruta: '/trabajo-en-alturas',
    grupo: 'Servicios',
    hint:
      'TITLE, meta descripción y palabras clave para Google. El H1 y los H2 se editan en «Trabajo en alturas».',
    defaultTitulo: 'Curso de Trabajo en Alturas en Villavicencio | SERVIAL Colombia',
    defaultDescripcion:
      'Curso de trabajo seguro en alturas en Villavicencio, Meta. Capacitación para trabajadores y empresas con SERVIAL Colombia, conforme a la normativa vigente. Atención en los Llanos Orientales.',
    defaultKeywords:
      'curso trabajo en alturas Villavicencio, trabajo seguro en alturas Villavicencio, curso de alturas Meta, capacitación trabajo en alturas Colombia, curso trabajador autorizado alturas, reentrenamiento trabajo en alturas, curso coordinador trabajo en alturas, Resolución 4272 de 2021, capacitación alturas Llanos Orientales, SERVIAL Colombia',
  },
  {
    key: 'manejoDefensivo',
    label: 'Manejo defensivo',
    ruta: '/curso-manejo-defensivo',
    grupo: 'Servicios',
    hint:
      'Página de ensayo SEO. El título y la meta descripción se usan en Google. El H1 y los H2 se editan en «Manejo defensivo». Google no usa meta keywords.',
    defaultTitulo: 'Curso de Manejo Defensivo Virtual y Presencial | Meta y Colombia',
    defaultDescripcion:
      'Curso de Manejo Defensivo virtual y presencial para conductores y empresas. Formación práctica en seguridad vial en Villavicencio, Meta, Llanos Orientales y Colombia.',
    defaultKeywords: '',
  },
  {
    key: 'primerosAuxilios',
    label: 'Primeros auxilios',
    ruta: '/curso-primeros-auxilios',
    grupo: 'Servicios',
    hint:
      'Página SEO del curso de primeros auxilios. El título y la meta descripción se usan en Google. El H1 y los H2 se editan en «Primeros auxilios».',
    defaultTitulo: 'Curso de Primeros Auxilios en Villavicencio | Virtual y Presencial',
    defaultDescripcion:
      'Curso de Primeros Auxilios virtual y presencial en Villavicencio, Meta y Colombia. Formación en RCP, trauma y atención inicial de emergencias para personas y empresas.',
    defaultKeywords:
      'curso de primeros auxilios, curso primeros auxilios Villavicencio, curso de primeros auxilios en Villavicencio, curso primeros auxilios Meta, curso de RCP Villavicencio, curso primeros auxilios virtual, capacitación primeros auxilios empresas Villavicencio',
  },
  ...buildFinstruvialSeoCatalog(),
  {
    key: 'blog',
    label: 'Blog',
    ruta: '/blog',
    grupo: 'Contenido',
    hint: 'Listado de artículos y noticias.',
    defaultTitulo: 'Blog y noticias | Su institución',
    defaultDescripcion: 'Artículos y novedades sobre capacitación, seguridad vial y el aula virtual.',
    defaultKeywords: 'blog, noticias seguridad vial, artículos capacitación',
  },
  {
    key: 'galeria',
    label: 'Galería',
    ruta: '/galeria',
    grupo: 'Contenido',
    hint: 'Fotos y videos de la institución.',
    defaultTitulo: 'Galería de fotos | Su institución',
    defaultDescripcion: 'Fotos y videos de actividades de formación, eventos y sede de la institución.',
    defaultKeywords: 'galería, fotos, eventos capacitación',
  },
  {
    key: 'pqr',
    label: 'PQR',
    ruta: '/pqr',
    grupo: 'Contenido',
    hint: 'Peticiones, quejas, reclamos y sugerencias.',
    defaultTitulo: 'PQR — Peticiones y reclamos | Su institución',
    defaultDescripcion: 'Canal oficial de peticiones, quejas, reclamos y sugerencias.',
    defaultKeywords: 'PQR, peticiones quejas reclamos',
  },
  {
    key: 'jornadasCapacitacion',
    label: 'Jornadas de capacitación',
    ruta: '/jornadas-capacitacion',
    grupo: 'Contenido',
    hint: 'Inscripción a jornadas presenciales.',
    defaultTitulo: 'Jornadas de capacitación en seguridad vial | Su institución',
    defaultDescripcion:
      'Inscríbase a jornadas de capacitación presencial en seguridad vial con actividades experienciales.',
    defaultKeywords: 'jornadas capacitación, seguridad vial',
  },
  {
    key: 'evaluacionJornadas',
    label: 'Evaluación de jornadas',
    ruta: '/evaluacion-jornadas',
    grupo: 'Contenido',
    hint: 'Encuesta de satisfacción de jornadas.',
    defaultTitulo: 'Evaluación de jornadas | Su institución',
    defaultDescripcion: 'Encuesta de satisfacción y evaluación de jornadas de capacitación.',
    defaultKeywords: 'evaluación jornadas, encuesta satisfacción',
  },
];

export const PORTAL_SEO_PAGE_KEYS = PORTAL_SEO_PAGE_CATALOG.map((p) => p.key);

export function emptyPortalSeoPages(): Record<PortalSeoPageKey, PortalSeoPageConfig> {
  return Object.fromEntries(
    PORTAL_SEO_PAGE_KEYS.map((key) => [key, { titulo: '', descripcion: '', keywords: '' }]),
  ) as Record<PortalSeoPageKey, PortalSeoPageConfig>;
}

export function mergePortalSeoPages(
  raw?: Partial<Record<PortalSeoPageKey, Partial<PortalSeoPageConfig>>> | null,
): Record<PortalSeoPageKey, PortalSeoPageConfig> {
  const base = emptyPortalSeoPages();
  if (!raw || typeof raw !== 'object') return base;
  for (const key of PORTAL_SEO_PAGE_KEYS) {
    const item = raw[key];
    if (!item || typeof item !== 'object') continue;
    base[key] = {
      titulo: String(item.titulo ?? '').trim(),
      descripcion: String(item.descripcion ?? '').trim(),
      keywords: String(item.keywords ?? '').trim(),
    };
  }
  return base;
}

export function finstruvialSeoEditorFallback(
  key: PortalSeoPageKey,
  landing?: { finstruvialServicios?: Partial<PortalFinstruvialServiciosConfig> } | null,
): PortalSeoPageConfig | null {
  if (!landing?.finstruvialServicios) return null;
  const servicios = mergeFinstruvialServicios(landing.finstruvialServicios);

  if (key === 'serviciosHub') {
    const hub = servicios.hub;
    const esServialHub =
      Number(hub.guionVersion) >= 1 || String(hub.tituloLinea || '').includes('Villavicencio');
    if (esServialHub) {
      return {
        titulo: 'Servicios de Capacitación en Villavicencio | SERVIAL Colombia',
        descripcion:
          'Conoce los servicios y cursos de SERVIAL Colombia en Villavicencio, Meta: conducción, seguridad vial, transporte y formación especializada para personas y empresas.',
        keywords:
          'servicios SERVIAL Villavicencio, cursos en Villavicencio, capacitaciones en Villavicencio, capacitación empresarial Villavicencio, cursos de seguridad vial Villavicencio, formación para conductores Villavicencio, SERVIAL Colombia',
      };
    }
    const titulo = [hub.tituloLinea, hub.tituloAcento].filter(Boolean).join(' ') || servicios.menuLabel;
    return {
      titulo: `${titulo} | FINSTRUVIAL`,
      descripcion:
        hub.lead?.trim() ||
        'Consultoría, estudios técnicos, planeación vial, tecnología y formación en tránsito, transporte y seguridad vial.',
      keywords: 'servicios FINSTRUVIAL, consultoría vial, seguridad vial',
    };
  }

  if (!isFinstruvialServicioSeoKey(key)) return null;
  const slug = key.slice(9) as FinstruvialServicioSlug;
  const p = servicios.paginas[slug];
  const esServial =
    Number(servicios.hub?.guionVersion) >= 1 ||
    String(servicios.hub?.tituloLinea || '').includes('Villavicencio');
  if (key === 'servicio_aulaVirtual' && esServial) {
    return {
      titulo: 'Aula Virtual y Cursos Online | SERVIAL Colombia',
      descripcion:
        'Acceda al Aula Virtual de SERVIAL Colombia: cursos online en seguridad vial, tránsito, transporte y formación especializada para estudiantes y empresas en todo el país.',
      keywords:
        'aula virtual SERVIAL, cursos virtuales SERVIAL, cursos virtuales Villavicencio, capacitación virtual Villavicencio, cursos online Colombia, cursos seguridad vial virtuales, capacitación virtual seguridad vial, cursos virtuales Meta, SERVIAL Colombia',
    };
  }
  const titulo = finstruvialServicioTitulo(p);
  return {
    titulo: `${titulo} | FINSTRUVIAL`,
    descripcion: p.metaDescription?.trim() || p.lead?.trim() || p.introLead?.trim() || p.menuLabel,
    keywords: `${p.menuLabel}, FINSTRUVIAL, seguridad vial`,
  };
}

export function seoPageForEditor(
  site: { seo?: Partial<Record<PortalSeoPageKey, PortalSeoPageConfig>> } | null | undefined,
  key: PortalSeoPageKey,
  landing?: {
    metaDescription?: string;
    metaKeywords?: string;
    finstruvialServicios?: Partial<PortalFinstruvialServiciosConfig>;
  } | null,
): PortalSeoPageConfig {
  const stored = site?.seo?.[key];
  const finstruvial = finstruvialSeoEditorFallback(key, landing);
  if (key === 'home') {
    return {
      titulo: stored?.titulo?.trim() || '',
      descripcion: stored?.descripcion?.trim() || landing?.metaDescription?.trim() || '',
      keywords: stored?.keywords?.trim() || landing?.metaKeywords?.trim() || '',
    };
  }
  return {
    titulo: stored?.titulo?.trim() || finstruvial?.titulo?.trim() || '',
    descripcion: stored?.descripcion?.trim() || finstruvial?.descripcion?.trim() || '',
    keywords: stored?.keywords?.trim() || finstruvial?.keywords?.trim() || '',
  };
}

const SEO_KEY_TO_PAGINA: Partial<Record<PortalSeoPageKey, PortalPaginaKey>> = {
  home: 'home',
  cursos: 'cursos',
  tienda: 'tienda',
  acerca: 'acerca',
  fundacion: 'fundacion',
  consultaCertificados: 'consultaCertificados',
  cursosConduccion: 'cursosConduccion',
  examenTeorico: 'examenTeorico',
  mercanciasPeligrosas: 'mercanciasPeligrosas',
  trabajoEnAlturas: 'trabajoEnAlturas',
  manejoDefensivo: 'manejoDefensivo',
  primerosAuxilios: 'primerosAuxilios',
  serviciosHub: 'servicios',
  blog: 'blog',
  galeria: 'galeria',
  pqr: 'pqr',
  jornadasCapacitacion: 'jornadasCapacitacion',
  evaluacionJornadas: 'evaluacionJornadas',
};

/** Ruta pública efectiva (slug ERP) para una fila del catálogo SEO. */
export function resolvePortalSeoPageRuta(
  key: PortalSeoPageKey,
  site?: Partial<PortalSiteConfig> | null,
  landing?: { finstruvialServicios?: Partial<PortalFinstruvialServiciosConfig> } | null,
): string {
  if (isFinstruvialServicioSeoKey(key)) {
    const slug = key.slice(9) as FinstruvialServicioSlug;
    const p = mergeFinstruvialServicios(landing?.finstruvialServicios).paginas[slug];
    return finstruvialServicioPublicRouteWithSite(slug, p?.routeSegment, site);
  }
  const paginaKey = SEO_KEY_TO_PAGINA[key];
  if (paginaKey) return portalPageRoute(site, paginaKey);
  return PORTAL_SEO_PAGE_CATALOG.find((p) => p.key === key)?.ruta || '/';
}

export function seoPreviewText(value: string, fallback: string, max = 160): string {
  const t = (value?.trim() || fallback || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}
