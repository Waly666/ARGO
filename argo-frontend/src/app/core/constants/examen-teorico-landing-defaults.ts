/** Sección inicio + página /examen-teorico (sin menú). */

import { mergePromoHeroTheme, PortalPromoHeroTheme } from './portal-promo-hero-fields.util';
import {
  ENLACE_OFICIAL_MINTRANSPORTE_CIRCULARES,
  mergeNormogramaLanding,
  NORMOGRAMA_LANDING_DEFAULTS,
  type PortalExamenTeoricoNormograma,
  type ExamenTeoricoAcento,
} from './examen-teorico-normograma-defaults';

export type { PortalExamenTeoricoNormograma, ExamenTeoricoAcento };
export type { PortalExamenTeoricoNorma } from './examen-teorico-normograma-defaults';
export { ENLACE_OFICIAL_MINTRANSPORTE_CIRCULARES } from './examen-teorico-normograma-defaults';

export interface PortalExamenTeoricoResolucion {
  titulo: string;
  archivoUrl: string;
  archivoUrlAbsoluta?: string;
  nombreArchivo: string;
}

export interface PortalExamenTeoricoItem {
  numero: number;
  icon: string;
  acento: ExamenTeoricoAcento;
  titulo: string;
  texto: string;
}

export interface PortalExamenTeoricoLanding {
  kicker: string;
  titulo: string;
  tituloLinea2: string;
  fechaBannerPrefijo: string;
  fechaDestacada: string;
  fechaBannerSufijo: string;
  items: PortalExamenTeoricoItem[];
  ctaTexto: string;
  ctaUrl: string;
  paginaIntro: string;
  enlaceOficialUrl: string;
  enlaceOficialEtiqueta: string;
  resolucionesKicker: string;
  resolucionesTitulo: string;
  resolucionesLead: string;
  resoluciones: PortalExamenTeoricoResolucion[];
  normograma: PortalExamenTeoricoNormograma;
  ctaFinalTexto: string;
  ctaFinalUrl: string;
  backLabel: string;
  oficialLead: string;
  theme: PortalPromoHeroTheme;
  mostrarBadgeVirtual: boolean;
  heroImagenUrl: string;
  heroImagenUrlAbsoluta?: string;
  heroImagenAlt: string;
}

export const EXAMEN_TEORICO_LANDING_DEFAULTS: PortalExamenTeoricoLanding = {
  kicker: 'Actualización MinTransporte — agosto 2026',
  titulo: 'Examen teórico',
  tituloLinea2: 'Estado actual de la normativa',
  fechaBannerPrefijo: 'Circular 20261010000317 (28 ago 2026):',
  fechaDestacada: 'SUSPENDIDA LA EXIGENCIA DEL CERTIFICADO',
  fechaBannerSufijo: 'hasta nueva notificación oficial del Ministerio de Transporte.',
  items: [
    {
      numero: 1,
      icon: 'clipboard',
      acento: 'blue',
      titulo: 'Situación actual',
      texto:
        'El Ministerio de Transporte suspendió la obligatoriedad del certificado de aprobación del examen teórico mediante la Circular Externa 20261010000317 del 28 de agosto de 2026. Por ahora no se puede exigir este certificado para expedir o recategorizar la licencia de conducción.',
    },
    {
      numero: 2,
      icon: 'computer',
      acento: 'teal',
      titulo: '¿Qué se suspendió?',
      texto:
        'Se difirió la fecha prevista (14 de septiembre de 2026) y la entrada en operación del nuevo esquema de Centros de Apoyo Logístico de Evaluación (CALE) hasta completar una revisión técnica de capacidad instalada, cobertura territorial y costos para el ciudadano.',
    },
    {
      numero: 3,
      icon: 'map-pin',
      acento: 'orange',
      titulo: 'Motivo de la medida',
      texto:
        'El Ministerio señaló que registrar un CALE en el RUNT no basta: hace falta verificar capacidad real (cupos, horarios, equipos) y cobertura nacional. Departamentos sin sede (Guainía, Vaupés, Vichada) o con un solo CALE fuera de la capital podrían dejar a los ciudadanos sin acceso oportuno al examen.',
    },
    {
      numero: 4,
      icon: 'check-badge',
      acento: 'green',
      titulo: '¿Qué circular quedó sin efecto?',
      texto:
        'La Circular Externa 20261010000277 del 4 de agosto de 2026 —que fijaba el 14 de septiembre de 2026 como fecha de inicio— quedó sin efecto en lo que le sea contrario a la nueva circular. La suspensión dura tres (3) meses desde el plazo señalado en aquella circular.',
    },
    {
      numero: 5,
      icon: 'arrow-trending-up',
      acento: 'purple',
      titulo: '¿Cuándo volverá a ser obligatorio?',
      texto:
        'El certificado solo será exigible un (1) mes después de que el Ministerio notifique formalmente a los organismos de tránsito, y únicamente si se verifica capacidad y disponibilidad nacional de CALE. La Ley 2251 de 2022 no fue derogada; el Ministerio continuará su implementación.',
    },
    {
      numero: 6,
      icon: 'car',
      acento: 'blue',
      titulo: 'Mientras tanto',
      texto:
        'Los trámites de licencia continúan con los requisitos vigentes antes de la circular de agosto de 2026. La formación en el CEA, las evaluaciones y las demás etapas siguen la normativa aplicable al momento del trámite ante el organismo de tránsito.',
    },
  ],
  ctaTexto: 'Ver información completa y normograma',
  ctaUrl: '/examen-teorico',
  paginaIntro:
    'El 28 de agosto de 2026 el Ministerio de Transporte expidió la Circular Externa 20261010000317, que suspende temporalmente la exigencia del certificado del examen teórico prevista para el 14 de septiembre de 2026. En esta página resumimos el contenido de la circular, el motivo de la derogación parcial de la circular anterior (20261010000277) y el estado actual de los trámites de licencia de conducción en Colombia.',
  enlaceOficialUrl: ENLACE_OFICIAL_MINTRANSPORTE_CIRCULARES,
  enlaceOficialEtiqueta: 'Ver circulares oficiales en MinTransporte',
  resolucionesKicker: 'Documentación oficial',
  resolucionesTitulo: 'Resoluciones y normativa',
  resolucionesLead:
    'Descargue las resoluciones y documentos relacionados con el examen teórico, la habilitación del CEA y la normativa del Ministerio de Transporte.',
  resoluciones: [],
  normograma: JSON.parse(JSON.stringify(NORMOGRAMA_LANDING_DEFAULTS)) as PortalExamenTeoricoNormograma,
  ctaFinalTexto: 'Ver cursos de conducción',
  ctaFinalUrl: '/cursos-conduccion',
  backLabel: '← Volver al inicio',
  oficialLead:
    'Consulte el texto oficial de la circular y las resoluciones relacionadas con el examen teórico y la habilitación del CEA.',
  theme: 'gold',
  mostrarBadgeVirtual: false,
  heroImagenUrl: '',
  heroImagenAlt: '',
};

const ACENTOS: ExamenTeoricoAcento[] = ['blue', 'teal', 'orange', 'green', 'purple'];

/** Detecta contenido guardado antes de la Circular 20261010000317 (fecha 14-sep-2026). */
export function examenTeoricoContenidoAntiguo(
  raw?: Partial<PortalExamenTeoricoLanding> | null,
): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const patron = /14 de septiembre de 2026|LUNES 14 DE SEPTIEMBRE/i;
  if (patron.test(raw.fechaDestacada ?? '')) return true;
  if (/será exigible en todo el país/i.test(raw.fechaBannerSufijo ?? '')) return true;
  const t0 = raw.items?.[0]?.texto ?? '';
  if (patron.test(t0) || /Certificado aprobado/i.test(raw.items?.[0]?.titulo ?? '')) return true;
  return false;
}

export function mergeExamenTeoricoLanding(
  raw?: Partial<PortalExamenTeoricoLanding> | null,
): PortalExamenTeoricoLanding {
  const d = EXAMEN_TEORICO_LANDING_DEFAULTS;
  const antiguo = examenTeoricoContenidoAntiguo(raw);
  const src =
    antiguo && raw
      ? { normograma: raw.normograma, resoluciones: raw.resoluciones }
      : raw && typeof raw === 'object'
        ? raw
        : {};
  const rawItems = Array.isArray(src.items) ? src.items : [];
  const itemCount = Math.max(rawItems.length, d.items.length);
  const items: PortalExamenTeoricoItem[] = [];
  for (let i = 0; i < itemCount; i++) {
    const fb = d.items[i];
    const item = rawItems[i];
    if (!fb) continue;
    const acento = ACENTOS.includes(item?.acento as ExamenTeoricoAcento)
      ? (item!.acento as ExamenTeoricoAcento)
      : fb.acento;
    items.push({
      numero: Number.isFinite(Number(item?.numero)) ? Number(item!.numero) : fb.numero,
      icon: item?.icon?.trim() || fb.icon,
      acento,
      titulo: item?.titulo?.trim() || fb.titulo,
      texto: item?.texto?.trim() || fb.texto,
    });
  }
  const rawRes = Array.isArray(src.resoluciones) ? src.resoluciones : [];
  const resoluciones = (rawRes.length ? rawRes : d.resoluciones).map((r, i) => {
    const fb = d.resoluciones[i] || { titulo: '', archivoUrl: '', nombreArchivo: '' };
    return {
      titulo: r?.titulo?.trim() || fb.titulo,
      archivoUrl: r?.archivoUrl?.trim() || fb.archivoUrl,
      archivoUrlAbsoluta: r?.archivoUrlAbsoluta?.trim() || fb.archivoUrlAbsoluta,
      nombreArchivo: r?.nombreArchivo?.trim() || fb.nombreArchivo,
    };
  });
  return {
    kicker: src.kicker?.trim() || d.kicker,
    titulo: src.titulo?.trim() || d.titulo,
    tituloLinea2: src.tituloLinea2?.trim() || d.tituloLinea2,
    fechaBannerPrefijo: src.fechaBannerPrefijo?.trim() || d.fechaBannerPrefijo,
    fechaDestacada: src.fechaDestacada?.trim() || d.fechaDestacada,
    fechaBannerSufijo: src.fechaBannerSufijo?.trim() || d.fechaBannerSufijo,
    items: items.length ? items : [...d.items],
    ctaTexto: (() => {
      const rawCta = src.ctaTexto?.trim() || d.ctaTexto;
      if (/cursos de conducci/i.test(rawCta)) return d.ctaTexto;
      return rawCta;
    })(),
    ctaUrl: (() => {
      const rawUrl = src.ctaUrl?.trim() || d.ctaUrl;
      const path = rawUrl.split('?')[0].replace(/\/+$/, '') || d.ctaUrl;
      if (path === '/cursos-conduccion') return '/examen-teorico';
      return rawUrl || d.ctaUrl;
    })(),
    paginaIntro: src.paginaIntro?.trim() || d.paginaIntro,
    enlaceOficialUrl: src.enlaceOficialUrl?.trim() || d.enlaceOficialUrl,
    enlaceOficialEtiqueta: src.enlaceOficialEtiqueta?.trim() || d.enlaceOficialEtiqueta,
    resolucionesKicker: src.resolucionesKicker?.trim() || d.resolucionesKicker,
    resolucionesTitulo: src.resolucionesTitulo?.trim() || d.resolucionesTitulo,
    resolucionesLead: src.resolucionesLead?.trim() || d.resolucionesLead,
    resoluciones,
    normograma: mergeNormogramaLanding(src.normograma),
    ctaFinalTexto: src.ctaFinalTexto?.trim() || d.ctaFinalTexto,
    ctaFinalUrl: src.ctaFinalUrl?.trim() || d.ctaFinalUrl,
    backLabel: src.backLabel?.trim() || d.backLabel,
    oficialLead: src.oficialLead?.trim() || d.oficialLead,
    theme: mergePromoHeroTheme(src.theme, d.theme),
    mostrarBadgeVirtual: src.mostrarBadgeVirtual === true,
    heroImagenUrl: String(src.heroImagenUrl ?? '').trim(),
    heroImagenUrlAbsoluta: String(src.heroImagenUrlAbsoluta ?? '').trim() || undefined,
    heroImagenAlt: String(src.heroImagenAlt ?? '').trim(),
  };
}
