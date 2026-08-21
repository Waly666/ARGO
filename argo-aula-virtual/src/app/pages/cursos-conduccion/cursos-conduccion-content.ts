import { LICENCIAS_HOME, LicenciaHomeItem } from '../home/home-content';

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

export type PortalCursosConduccionLicenciaItem = LicenciaHomeItem;

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

export interface PortalCursosConduccionLanding {
  hero: {
    kicker: string;
    imagenUrl: string;
    imagenUrlAbsoluta?: string;
    imagenAlt: string;
  };
  tituloPrincipal: string;
  textoInstitucional: string;
  resoluciones: PortalCursosConduccionResolucion[];
  invitacion: PortalCursosConduccionInvitacion;
  licencias: PortalCursosConduccionLicencias;
  /** @deprecated Usar licencias */
  etiquetaCategorias?: string;
  /** @deprecated Usar licencias.lead */
  textoIntroCategorias?: string;
  /** @deprecated Usar licencias.items */
  categorias?: PortalCursosConduccionCategoria[];
  /** @deprecated Usar invitacion */
  textoInvitacion?: string;
}

const INVITACION_DEFAULTS: PortalCursosConduccionInvitacion = {
  kicker: 'Tu libertad al volante',
  titulo: '¡Da el primer paso hacia tu libertad!',
  lead:
    'Aprender a conducir no es solo obtener una licencia: es ganar independencia, confianza y nuevas oportunidades para moverte con seguridad.',
  institucion:
    'Te acompañamos para que aprendas a conducir de manera responsable, segura y con la preparación que necesitas ante el Ministerio de Transporte.',
  beneficios: [
    {
      icon: '💪',
      titulo: 'Confianza',
      texto: 'Avanza con instructores certificados y un plan de formación claro.',
    },
    {
      icon: '🛣️',
      titulo: 'Independencia',
      texto: 'Muévete con autonomía en la ciudad, el trabajo y tu día a día.',
    },
    {
      icon: '🚦',
      titulo: 'Seguridad vial',
      texto: 'Conduce con criterio, respeto por la norma y buenas prácticas.',
    },
  ],
  destacado: '¡No dejes para después lo que puede abrirte nuevas puertas hoy!',
  cierre: 'Inscríbete a tu curso de conducción y empieza a construir el camino hacia tu licencia.',
  firma: '¡Tu camino comienza aquí!',
  btnCursos: 'Ver cursos disponibles',
  btnRegistro: 'Crear cuenta gratis',
};

const LICENCIAS_DEFAULTS: PortalCursosConduccionLicencias = {
  ...LICENCIAS_HOME,
  items: LICENCIAS_HOME.items.map((item) => ({ ...item, incluye: [...item.incluye] })),
};

export const CURSOS_CONDUCCION_LANDING_DEFAULTS: PortalCursosConduccionLanding = {
  hero: {
    kicker: 'Cursos de conducción',
    imagenUrl: '',
    imagenAlt: 'Formación en conducción y categorías de licencia',
  },
  tituloPrincipal: 'CENTRO DE ENSEÑANZA AUTOMOVILÍSTICA',
  textoInstitucional:
    'Centro de Enseñanza Automovilística CEA, debidamente habilitado ante Ministerio de transporte.',
  resoluciones: [
    { titulo: 'Resolución 2267 de 06/08/2014 Mintransporte', archivoUrl: '', nombreArchivo: '' },
    { titulo: 'Resolución 2294 del 11/08/2014 Mintransporte', archivoUrl: '', nombreArchivo: '' },
  ],
  invitacion: { ...INVITACION_DEFAULTS, beneficios: INVITACION_DEFAULTS.beneficios.map((b) => ({ ...b })) },
  licencias: {
    ...LICENCIAS_DEFAULTS,
    items: LICENCIAS_DEFAULTS.items.map((item) => ({ ...item, incluye: [...item.incluye] })),
  },
};

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
      icon: b.icon?.trim() || d.beneficios[i]?.icon || '✦',
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
    incluye: incluye.length ? incluye : [...fb.incluye],
    licenciaLabel: item.licenciaLabel?.trim() || fb.licenciaLabel,
    valor: item.valor?.trim() ?? fb.valor,
    btnTexto: item.btnTexto?.trim() || fb.btnTexto,
    btnUrl: item.btnUrl?.trim() || fb.btnUrl,
    destacada: item.destacada === true,
  };
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
      b1: 'car',
      c1: 'bus',
      c2: 'truck',
      c3: 'truck',
    };
    return {
      kicker: legacy.etiquetaCategorias?.trim() || d.kicker,
      titulo: 'Categorías de licencia',
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
            licenciaLabel: fb.licenciaLabel || `Licencia ${cod}`,
          },
          fb,
        );
      }),
    };
  }

  return JSON.parse(JSON.stringify(d)) as PortalCursosConduccionLicencias;
}

export function mergeCursosConduccionLanding(
  raw?: Partial<PortalCursosConduccionLanding> | null,
): PortalCursosConduccionLanding {
  const d = CURSOS_CONDUCCION_LANDING_DEFAULTS;
  if (!raw) return JSON.parse(JSON.stringify(d)) as PortalCursosConduccionLanding;
  return {
    hero: {
      kicker: raw.hero?.kicker?.trim() || d.hero.kicker,
      imagenUrl: raw.hero?.imagenUrl?.trim() || d.hero.imagenUrl,
      imagenUrlAbsoluta: raw.hero?.imagenUrlAbsoluta?.trim() || undefined,
      imagenAlt: raw.hero?.imagenAlt?.trim() || d.hero.imagenAlt,
    },
    tituloPrincipal: raw.tituloPrincipal?.trim() || d.tituloPrincipal,
    textoInstitucional: raw.textoInstitucional?.trim() || d.textoInstitucional,
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
  };
}
