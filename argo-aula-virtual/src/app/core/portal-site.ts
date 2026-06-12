import { PortalConfig } from './models';

export type PortalPaginaKey =
  | 'home'
  | 'tienda'
  | 'cursos'
  | 'aula'
  | 'fundacion'
  | 'consultaCertificados'
  | 'acerca';

const RUTA_PAGINA: Record<PortalPaginaKey, string> = {
  home: '/',
  tienda: '/tienda',
  cursos: '/cursos',
  aula: '/aula',
  fundacion: '/fundacion',
  consultaCertificados: '/consulta-certificados',
  acerca: '/acerca',
};

const DEFAULT_HOME_ORDER = [
  'instBar',
  'hero',
  'infoCards',
  'ofertas',
  'beneficios',
  'quoteBand',
  'serviciosEmpresa',
  'testimonios',
  'valores',
  'cursosVirtuales',
  'carreras',
  'pasos',
  'faq',
  'pilares',
];

export function paginaActiva(config: PortalConfig | null, key: PortalPaginaKey): boolean {
  if (key === 'home' || key === 'aula') return true;
  const p = config?.site?.paginas?.[key];
  if (!p) return true;
  return p.activa !== false;
}

export function etiquetaPagina(config: PortalConfig | null, key: PortalPaginaKey, fallback: string): string {
  return config?.site?.paginas?.[key]?.etiquetaMenu?.trim() || fallback;
}

export function rutaPagina(key: PortalPaginaKey): string {
  return RUTA_PAGINA[key];
}

export function seccionHomeVisible(config: PortalConfig | null, id: string): boolean {
  const sec = config?.site?.home?.secciones;
  if (!sec) return true;
  return sec[id] !== false;
}

export function ordenSeccionesHome(config: PortalConfig | null): string[] {
  const orden = config?.site?.home?.orden;
  if (orden?.length) {
    const set = new Set(DEFAULT_HOME_ORDER);
    const out: string[] = [];
    for (const id of orden) {
      if (set.has(id) && !out.includes(id)) out.push(id);
    }
    for (const id of DEFAULT_HOME_ORDER) {
      if (!out.includes(id)) out.push(id);
    }
    return out;
  }
  return [...DEFAULT_HOME_ORDER];
}

export function clavePaginaPorRuta(path: string): PortalPaginaKey | null {
  const clean = path.split('?')[0].split('#')[0];
  if (clean === '/' || clean === '') return 'home';
  if (clean.startsWith('/cursos/')) return 'cursos';
  for (const [key, ruta] of Object.entries(RUTA_PAGINA)) {
    if (ruta !== '/' && clean === ruta) return key as PortalPaginaKey;
  }
  return null;
}
