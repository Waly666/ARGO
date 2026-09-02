/** Catálogo SEO editable por página — editor del sitio web (ERP). */

import {
  FINSTRUVIAL_SERVICIO_ROUTE,
  FINSTRUVIAL_SERVICIO_SLUGS,
  FinstruvialServicioSlug,
} from './finstruvial-servicios.constants';
import { mergeFinstruvialServicios } from './finstruvial-servicios-defaults';
import { PortalFinstruvialServiciosConfig } from './finstruvial-servicio-landing.types';

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
      ruta: FINSTRUVIAL_SERVICIO_ROUTE[slug],
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
    defaultTitulo: 'Cursos de conducción y licencias | Su institución',
    defaultDescripcion:
      'Licencias de conducción categorías A2, B1, C1, C2 y C3. Cursos de conducción y educación vial.',
    defaultKeywords: 'licencia de conducción, cursos conducción, categorías licencia',
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
    hint: 'Capacitación en transporte de mercancías peligrosas.',
    defaultTitulo: 'Curso mercancías peligrosas y transporte | Su institución',
    defaultDescripcion:
      'Capacitación en transporte de mercancías peligrosas: normativa, documentación y seguridad vial.',
    defaultKeywords: 'mercancías peligrosas, curso transporte, MinTransporte',
  },
  {
    key: 'trabajoEnAlturas',
    label: 'Trabajo en alturas',
    ruta: '/trabajo-en-alturas',
    grupo: 'Servicios',
    hint: 'Formación en trabajo seguro en alturas.',
    defaultTitulo: 'Curso trabajo en alturas | Su institución',
    defaultDescripcion: 'Capacitación en trabajo seguro en alturas: normativa, EPI y buenas prácticas.',
    defaultKeywords: 'trabajo en alturas, Resolución 4272, seguridad',
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

export function seoPreviewText(value: string, fallback: string, max = 160): string {
  const t = (value?.trim() || fallback || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}
