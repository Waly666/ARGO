/** Sección inicio + página /examen-teorico (sin menú). */

import {
  mergeNormogramaLanding,
  NORMOGRAMA_LANDING,
  type PortalExamenTeoricoNormograma,
  type ExamenTeoricoAcento,
} from './examen-teorico-normograma-content';

export type { PortalExamenTeoricoNormograma, ExamenTeoricoAcento };
export type { PortalExamenTeoricoNorma } from './examen-teorico-normograma-content';
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
  resolucionesKicker: string;
  resolucionesTitulo: string;
  resolucionesLead: string;
  resoluciones: PortalExamenTeoricoResolucion[];
  normograma: PortalExamenTeoricoNormograma;
  ctaFinalTexto: string;
  ctaFinalUrl: string;
}

export const EXAMEN_TEORICO_LANDING: PortalExamenTeoricoLanding = {
  kicker: 'Actualización normativa',
  titulo: 'Examen teórico',
  tituloLinea2: 'Requisito para tu licencia',
  fechaBannerPrefijo: 'A partir del',
  fechaDestacada: 'LUNES 14 DE SEPTIEMBRE DE 2026',
  fechaBannerSufijo: 'será exigible en todo el país.',
  items: [
    {
      numero: 1,
      icon: 'clipboard',
      acento: 'blue',
      titulo: 'Certificado aprobado',
      texto:
        'A partir del lunes 14 de septiembre de 2026, para realizar los trámites de otorgamiento de la licencia de conducción por primera vez y las recategorizaciones, se deberá contar con el certificado de aprobación del examen teórico.',
    },
    {
      numero: 2,
      icon: 'computer',
      acento: 'teal',
      titulo: 'Verificación en RUNT',
      texto:
        'El cumplimiento del requisito se verificará por parte del Organismo de Tránsito, a través del sistema RUNT.',
    },
    {
      numero: 3,
      icon: 'map-pin',
      acento: 'orange',
      titulo: 'Cale en tu región',
      texto:
        'El sistema RUNT validará que el certificado aprobado que se utilice al momento de expedir la licencia de conducción, esté emitido por un CALE ubicado en el mismo departamento o en alguno de los departamentos contiguos al del Organismo de Tránsito en el que se tramitará la licencia.',
    },
    {
      numero: 4,
      icon: 'check-badge',
      acento: 'green',
      titulo: 'Fecha que cuenta',
      texto:
        'La verificación del cumplimiento del requisito depende de la fecha en la que se realice el trámite de la licencia, no de la fecha en la que se inicie el proceso de enseñanza en el Centro de Enseñanza o del examen médico para conductores.',
    },
    {
      numero: 5,
      icon: 'arrow-trending-up',
      acento: 'purple',
      titulo: 'Repetición sin costo',
      texto:
        'El aspirante que no apruebe el examen teórico podrá repetirlo, por una sola vez, en el mismo CALE sin costo alguno, dentro de los 10 días siguientes a la fecha en el que lo reprobó. Si decide presentarlo en otro CALE, deberá pagar nuevamente los derechos de presentación.',
    },
  ],
  ctaTexto: 'Ver información completa',
  ctaUrl: '/examen-teorico',
  paginaIntro:
    'A continuación encontrará la información oficial sobre el nuevo requisito del examen teórico para obtener o recategorizar la licencia de conducción en Colombia, incluida la fecha de entrada en vigencia y las condiciones de verificación en RUNT.',
  resolucionesKicker: 'Documentación oficial',
  resolucionesTitulo: 'Resoluciones y normativa',
  resolucionesLead:
    'Descargue las resoluciones y documentos relacionados con el examen teórico, la habilitación del CEA y la normativa del Ministerio de Transporte.',
  resoluciones: [],
  normograma: JSON.parse(JSON.stringify(NORMOGRAMA_LANDING)) as PortalExamenTeoricoNormograma,
  ctaFinalTexto: 'Ver cursos de conducción',
  ctaFinalUrl: '/cursos-conduccion',
};

const ACENTOS: ExamenTeoricoAcento[] = ['blue', 'teal', 'orange', 'green', 'purple'];

export function mergeExamenTeoricoLanding(
  raw?: Partial<PortalExamenTeoricoLanding> | null,
): PortalExamenTeoricoLanding {
  const d = EXAMEN_TEORICO_LANDING;
  const src = raw && typeof raw === 'object' ? raw : {};
  const rawItems = Array.isArray(src.items) ? src.items : [];
  const items = (rawItems.length ? rawItems : d.items).map((item, i) => {
    const fb = d.items[i] || d.items[0];
    const acento = ACENTOS.includes(item?.acento as ExamenTeoricoAcento)
      ? (item!.acento as ExamenTeoricoAcento)
      : fb.acento;
    return {
      numero: Number.isFinite(Number(item?.numero)) ? Number(item!.numero) : fb.numero,
      icon: item?.icon?.trim() || fb.icon,
      acento,
      titulo: item?.titulo?.trim() || fb.titulo,
      texto: item?.texto?.trim() || fb.texto,
    };
  });
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
      const raw = src.ctaTexto?.trim() || d.ctaTexto;
      if (/cursos de conducci/i.test(raw)) return d.ctaTexto;
      return raw;
    })(),
    ctaUrl: (() => {
      const raw = src.ctaUrl?.trim() || d.ctaUrl;
      const path = raw.split('?')[0].replace(/\/+$/, '') || d.ctaUrl;
      if (path === '/cursos-conduccion') return '/examen-teorico';
      return raw || d.ctaUrl;
    })(),
    paginaIntro: src.paginaIntro?.trim() || d.paginaIntro,
    resolucionesKicker: src.resolucionesKicker?.trim() || d.resolucionesKicker,
    resolucionesTitulo: src.resolucionesTitulo?.trim() || d.resolucionesTitulo,
    resolucionesLead: src.resolucionesLead?.trim() || d.resolucionesLead,
    resoluciones,
    normograma: mergeNormogramaLanding(src.normograma),
    ctaFinalTexto: src.ctaFinalTexto?.trim() || d.ctaFinalTexto,
    ctaFinalUrl: src.ctaFinalUrl?.trim() || d.ctaFinalUrl,
  };
}
