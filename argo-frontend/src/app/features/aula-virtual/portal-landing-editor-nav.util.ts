import {
  ordenSeccionesHomePortal,
  PORTAL_HOME_SECCIONES_LABELS,
  PortalPaginaKey,
  PortalSiteConfig,
} from '../../core/constants/portal-site-defaults';

export type LandingEditorNavTab = {
  id: string;
  label: string;
  homePos: number | null;
  editable: boolean;
  external?: boolean;
  externalHint?: string;
  oculta?: boolean;
};

const BLOQUE_LABELS: Record<string, string> = {
  general: 'Barra y cita',
  hero: 'Banner principal',
  info: 'Tarjetas de contacto',
  ofertas: 'Qué ofrecemos',
  beneficios: 'Beneficios',
  licencias: 'Licencias',
  servicios: 'Servicios',
  carreras: 'Carreras técnicas',
  cursos: 'Sección cursos',
  valores: 'Por qué elegirnos',
  pasos: 'Cómo matricularse',
  appMobile: 'App Mobile',
  testimonios: 'Testimonios',
  faq: 'Preguntas frecuentes',
  pilares: 'Capacitación',
  nav: 'Nombres del menú',
  blog: 'Página Blog',
  footer: 'Pie de página',
  catalogo: 'Página de cursos/tienda',
};

/** Bloques del home editables en este componente (id de sección → id de pestaña). */
const HOME_SECCION_A_BLOQUE: Partial<Record<string, string>> = {
  instBar: 'general',
  quoteBand: 'general',
  hero: 'hero',
  infoCards: 'info',
  ofertas: 'ofertas',
  beneficios: 'beneficios',
  licencias: 'licencias',
  serviciosEmpresa: 'servicios',
  carreras: 'carreras',
  cursosVirtuales: 'cursos',
  valores: 'valores',
  pasos: 'pasos',
  appMobile: 'appMobile',
  testimonios: 'testimonios',
  faq: 'faq',
  pilares: 'pilares',
};

/** Bloques de curso en el home — editables aquí (pestaña home:…). */
const HOME_SECCION_CURSO: Partial<Record<string, PortalPaginaKey>> = {
  examenTeorico: 'examenTeorico',
  mercanciasPeligrosas: 'mercanciasPeligrosas',
  trabajoEnAlturas: 'trabajoEnAlturas',
  manejoDefensivo: 'manejoDefensivo',
  primerosAuxilios: 'primerosAuxilios',
};

/** Bloques del home que se editan en otro panel del constructor. */
const HOME_SECCION_EXTERNA: Partial<Record<string, string>> = {
  publicidadInicio: 'Editor del sitio → Publicidad inicio (carrusel)',
  fotosInicio: 'Editor del sitio → Fotos del inicio',
};

export function homeCursoEditorBloqueId(secId: string): string {
  return `home:${secId}`;
}

export function paginaKeyDesdeHomeBloque(bloqueId: string | null | undefined): PortalPaginaKey | null {
  if (!bloqueId?.startsWith('home:')) return null;
  const secId = bloqueId.slice(5);
  return HOME_SECCION_CURSO[secId] ?? null;
}

const GLOBAL_TABS: string[] = ['nav', 'blog', 'footer', 'catalogo'];

function seccionHomeActiva(site: Partial<PortalSiteConfig> | null | undefined, secId: string): boolean {
  return site?.home?.secciones?.[secId] !== false;
}

function bloqueGeneralOculto(site: Partial<PortalSiteConfig> | null | undefined, orden: string[]): boolean {
  const ids = orden.filter((id) => HOME_SECCION_A_BLOQUE[id] === 'general');
  if (!ids.length) return false;
  return ids.every((id) => !seccionHomeActiva(site, id));
}

/** Pestañas del editor de inicio ordenadas según site.home.orden (Bloques del inicio). */
export function buildLandingEditorNavTabs(site?: Partial<PortalSiteConfig> | null): LandingEditorNavTab[] {
  const orden = ordenSeccionesHomePortal(site);
  const tabs: LandingEditorNavTab[] = [];
  const bloquesVistos = new Set<string>();

  for (let i = 0; i < orden.length; i++) {
    const secId = orden[i];
    const homePos = i + 1;
    const bloqueId = HOME_SECCION_A_BLOQUE[secId];

    if (bloqueId) {
      if (bloquesVistos.has(bloqueId)) continue;
      bloquesVistos.add(bloqueId);
      tabs.push({
        id: bloqueId,
        label: BLOQUE_LABELS[bloqueId] || PORTAL_HOME_SECCIONES_LABELS[secId] || secId,
        homePos,
        editable: true,
        oculta: bloqueId === 'general' ? bloqueGeneralOculto(site, orden) : !seccionHomeActiva(site, secId),
      });
      continue;
    }

    if (HOME_SECCION_CURSO[secId]) {
      tabs.push({
        id: homeCursoEditorBloqueId(secId),
        label: PORTAL_HOME_SECCIONES_LABELS[secId] || secId,
        homePos,
        editable: true,
        oculta: !seccionHomeActiva(site, secId),
      });
      continue;
    }

    const hint = HOME_SECCION_EXTERNA[secId];
    if (hint) {
      tabs.push({
        id: `ext:${secId}`,
        label: PORTAL_HOME_SECCIONES_LABELS[secId] || secId,
        homePos,
        editable: false,
        external: true,
        externalHint: hint,
        oculta: !seccionHomeActiva(site, secId),
      });
    }
  }

  for (const id of GLOBAL_TABS) {
    tabs.push({
      id,
      label: BLOQUE_LABELS[id],
      homePos: null,
      editable: true,
    });
  }

  return tabs;
}
