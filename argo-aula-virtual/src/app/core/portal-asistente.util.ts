import { PortalPaginaKey } from './portal-site';
import {
  LegacyConsultaAsistente,
  PortalAsistenteConfig,
  PortalAsistentePaginaConfig,
  PortalAsistenteViewConfig,
  PORTAL_CONSULTA_ASISTENTE_TEXTO_DEFAULT,
} from './portal-asistente.types';

export type { LegacyConsultaAsistente } from './portal-asistente.types';

export const PORTAL_ASISTENTE_PAGINAS: {
  key: PortalPaginaKey;
  titulo: string;
  descripcion: string;
}[] = [
  { key: 'home', titulo: 'Inicio', descripcion: 'Página principal (/)' },
  { key: 'cursos', titulo: 'Cursos', descripcion: 'Catálogo y detalle de cursos' },
  { key: 'tienda', titulo: 'Tienda', descripcion: 'Vista de inscripción / tienda' },
  { key: 'aula', titulo: 'Aula virtual', descripcion: 'Panel del estudiante' },
  { key: 'fundacion', titulo: 'Institucional', descripcion: 'Quiénes somos / fundación' },
  { key: 'consultaCertificados', titulo: 'Certificados', descripcion: 'Consulta pública de certificados' },
  { key: 'cursosConduccion', titulo: 'Cursos conducción', descripcion: 'Categorías de licencia y resoluciones del CEA' },
  { key: 'examenTeorico', titulo: 'Examen teórico', descripcion: 'Normatividad del examen teórico' },
  { key: 'mercanciasPeligrosas', titulo: 'Mercancías peligrosas', descripcion: 'Landing de mercancías peligrosas' },
  { key: 'trabajoEnAlturas', titulo: 'Trabajo en alturas', descripcion: 'Landing de trabajo en alturas' },
  { key: 'manejoDefensivo', titulo: 'Manejo defensivo', descripcion: 'Landing de manejo defensivo' },
  { key: 'primerosAuxilios', titulo: 'Primeros auxilios', descripcion: 'Landing de primeros auxilios' },
  { key: 'servicios', titulo: 'Portafolio de servicios', descripcion: 'Hub y páginas de servicios' },
  { key: 'jornadasCapacitacion', titulo: 'Jornadas de capacitación', descripcion: 'Inscripción a jornadas' },
  { key: 'evaluacionJornadas', titulo: 'Evaluación de jornadas', descripcion: 'Encuesta de satisfacción' },
  { key: 'pqr', titulo: 'PQR', descripcion: 'Peticiones, quejas y reclamos' },
  { key: 'galeria', titulo: 'Galería', descripcion: 'Fotos y videos de la institución' },
  { key: 'blog', titulo: 'Blog', descripcion: 'Listado y artículos del blog' },
  { key: 'acerca', titulo: 'Acerca de', descripcion: 'Contacto e información' },
];

function asistentePaginaKeys(): PortalPaginaKey[] {
  return Array.isArray(PORTAL_ASISTENTE_PAGINAS)
    ? PORTAL_ASISTENTE_PAGINAS.map((p) => p.key)
    : [];
}

function textoDefaultPagina(key: PortalPaginaKey): string {
  return key === 'consultaCertificados' ? PORTAL_CONSULTA_ASISTENTE_TEXTO_DEFAULT : '';
}

export function defaultAsistentePaginas(): Record<PortalPaginaKey, PortalAsistentePaginaConfig> {
  const paginas = {} as Record<PortalPaginaKey, PortalAsistentePaginaConfig>;
  for (const key of asistentePaginaKeys()) {
    paginas[key] = { activo: false, texto: textoDefaultPagina(key) };
  }
  return paginas;
}

export function mergePortalAsistente(
  raw?: Partial<PortalAsistenteConfig> | null,
  legacyConsulta?: LegacyConsultaAsistente | null,
): PortalAsistenteConfig {
  const paginas = defaultAsistentePaginas();
  const srcPaginas: Partial<Record<PortalPaginaKey, Partial<PortalAsistentePaginaConfig>>> =
    raw?.paginas && typeof raw.paginas === 'object' ? raw.paginas : {};

  for (const key of asistentePaginaKeys()) {
    const pageSrc = srcPaginas[key];
    paginas[key] = {
      activo: pageSrc?.activo === true,
      texto: (pageSrc?.texto ?? paginas[key].texto).trim(),
    };
  }

  if (!raw?.paginas?.consultaCertificados && legacyConsulta?.asistenteActivo === true) {
    paginas.consultaCertificados = {
      activo: true,
      texto: (legacyConsulta.asistenteTexto || paginas.consultaCertificados.texto).trim(),
    };
  }

  const videoUrl =
    raw?.videoUrl?.trim() ||
    legacyConsulta?.asistenteVideoUrl?.trim() ||
    'videos/asistente-educarte.mp4';

  const esSubida =
    videoUrl.includes('aula-virtual-consulta-asistente/') ||
    videoUrl.startsWith('aula-virtual-consulta-asistente/');

  return {
    videoUrl,
    videoUrlAbsoluta: raw?.videoUrlAbsoluta?.trim() || legacyConsulta?.asistenteVideoUrlAbsoluta?.trim() || (esSubida ? '' : undefined),
    paginas,
  };
}

/** Config lista para el componente flotante en una ruta concreta. */
export function asistenteVistaParaPagina(
  asistente: PortalAsistenteConfig | undefined | null,
  pagina: PortalPaginaKey | null,
): PortalAsistenteViewConfig | null {
  if (!asistente || !pagina) return null;
  const page = asistente.paginas?.[pagina];
  if (!page?.activo || !page.texto?.trim()) return null;

  return {
    asistenteActivo: true,
    asistenteTexto: page.texto.trim(),
    asistenteVideoUrl: asistente.videoUrl,
    asistenteVideoUrlAbsoluta: asistente.videoUrlAbsoluta,
  };
}
