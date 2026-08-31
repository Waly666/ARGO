/** Normograma examen teórico–práctico — licencia de conducción en Colombia. */

export type ExamenTeoricoAcento = 'blue' | 'teal' | 'orange' | 'green' | 'purple';

export interface PortalExamenTeoricoNorma {
  icon: string;
  acento: ExamenTeoricoAcento;
  norma: string;
  fecha: string;
  queEstablece: string;
  detalle: string;
  archivoUrl: string;
  archivoUrlAbsoluta?: string;
  nombreArchivo: string;
}

export interface PortalExamenTeoricoNormograma {
  kicker: string;
  titulo: string;
  subtitulo: string;
  lead: string;
  items: PortalExamenTeoricoNorma[];
}

/** Normas recientes al final del normograma (circulares agosto 2026). */
export const ENLACE_OFICIAL_MINTRANSPORTE_CIRCULARES =
  'https://www.mintransporte.gov.co/documentos/11/circulares/';

export const NORMOGRAMA_ITEMS_CIRCULARES_2026: PortalExamenTeoricoNorma[] = [
  {
    icon: 'clipboard',
    acento: 'orange',
    norma: 'Circular Externa 20261010000277 de 2026',
    fecha: '4 de agosto de 2026',
    queEstablece:
      'Comunicó el registro de 32 Centros de Apoyo Logístico de Evaluación (CALE) de la UNAD y fijó el 14 de septiembre de 2026 como fecha para exigir el certificado de aprobación del examen teórico.',
    detalle:
      'Derogada en lo que le sea contrario por la Circular Externa 20261010000317 del 28 de agosto de 2026. Ya no rige la fecha del 14 de septiembre de 2026 como inicio obligatorio.',
    archivoUrl: '',
    nombreArchivo: '',
  },
  {
    icon: 'check-badge',
    acento: 'green',
    norma: 'Circular Externa 20261010000317 de 2026',
    fecha: '28 de agosto de 2026',
    queEstablece:
      'Difiere la exigibilidad del certificado de aprobación del examen teórico de conducción (antes prevista para el 14 de septiembre de 2026) y ordena la revisión integral del esquema CALE.',
    detalle:
      'Hasta que el Ministerio notifique a los organismos de tránsito —previa verificación de capacidad, cobertura y disponibilidad nacional— no se puede exigir el certificado. Los trámites siguen con los requisitos anteriores a la circular de agosto de 2026. La Ley 2251 de 2022 sigue vigente.',
    archivoUrl: '/documents/circular-20261010000317.pdf',
    nombreArchivo: 'Circular 20261010000317.pdf',
  },
];

export const NORMOGRAMA_LANDING: PortalExamenTeoricoNormograma = {
  kicker: 'Marco normativo',
  titulo: 'Normograma examen teórico–práctico',
  subtitulo: 'Licencia de conducción en Colombia',
  lead:
    'Línea de tiempo de leyes, decretos, resoluciones y circulares del Ministerio de Transporte. Incluye la actualización de agosto de 2026 que suspende temporalmente la exigencia del certificado del examen teórico. Descargue cada norma en PDF.',
  items: [
    {
      icon: 'document',
      acento: 'blue',
      norma: 'Ley 769 de 2002',
      fecha: 'Agosto 6 de 2002',
      queEstablece: 'Establece requisito del examen teórico práctico.',
      detalle: 'Aprobar exámenes teórico y práctico de conducción.',
      archivoUrl: '',
      nombreArchivo: '',
    },
    {
      icon: 'document',
      acento: 'green',
      norma: 'Decreto número 019 (enero 10) 2012',
      fecha: 'Enero 10 de 2012',
      queEstablece:
        'Por el cual se dictan normas para suprimir o reformar regulaciones, procedimientos y trámites innecesarios existentes en la Administración Pública.',
      detalle: '—',
      archivoUrl: '',
      nombreArchivo: '',
    },
    {
      icon: 'clipboard',
      acento: 'teal',
      norma: 'Resolución 1349 de 2017',
      fecha: '—',
      queEstablece:
        'Se reglamentan las condiciones de habilitación para los Centros de Apoyo Logístico de Evaluación (CALE) y las condiciones, características de seguridad y el rango de precios del examen teórico y práctico para la obtención de la licencia de conducción en el territorio nacional y se dictan otras disposiciones.',
      detalle:
        'Reglamenta habilitación de CALE, condiciones, características de seguridad y rango de precios del examen teórico y práctico.',
      archivoUrl: '',
      nombreArchivo: '',
    },
    {
      icon: 'check-badge',
      acento: 'orange',
      norma: 'Resolución 1487 de 2018',
      fecha: '11 de mayo de 2018',
      queEstablece:
        'Que el plazo antes señalado fue prorrogado por doce (12) meses más, es decir, hasta el once (11) de mayo de 2019.',
      detalle: 'Prórroga del plazo.',
      archivoUrl: '',
      nombreArchivo: '',
    },
    {
      icon: 'check-badge',
      acento: 'purple',
      norma: 'Resolución 023 de 2019',
      fecha: 'Enero 04 de 2019',
      queEstablece: 'Prorroga plazo.',
      detalle: 'Por dieciocho (18) meses más, es decir, hasta el doce (12) de noviembre de 2020.',
      archivoUrl: '',
      nombreArchivo: '',
    },
    {
      icon: 'building',
      acento: 'blue',
      norma: 'Decreto Ley 2106 de 2019',
      fecha: 'Noviembre 22 de 2019',
      queEstablece: 'Ley antitrámites suprime trámites ratifica presentación examen teórico práctico.',
      detalle:
        'Estableciendo que podrá obtener una licencia de conducción para vehículos automotores, quien acredite entre otros requisitos, la aprobación de exámenes teórico y práctico de conducción para vehículos particulares, ante las autoridades públicas o privadas que se encuentren debidamente registradas en el sistema RUNT.',
      archivoUrl: '',
      nombreArchivo: '',
    },
    {
      icon: 'document',
      acento: 'teal',
      norma: 'Resolución 20203040021135 de 2020 — Ministerio de Transporte',
      fecha: 'Noviembre 12 de 2020',
      queEstablece:
        'Por la cual se prorroga el plazo establecido en el artículo 23 de la Resolución 1349 de 2017, prorrogado por las Resoluciones 1487 de 2018 y 023 de 2019, del Ministerio de Transporte.',
      detalle:
        'Prorrogar el plazo establecido en el artículo 23 de la Resolución 1349 de 2017 prorrogado por las Resoluciones 1487 de 2018 y 023 de 2019, del Ministerio de Transporte, por nueve (9) meses más.',
      archivoUrl: '',
      nombreArchivo: '',
    },
    {
      icon: 'document',
      acento: 'green',
      norma: 'Ley 2251 de 2022 (julio 14)',
      fecha: 'Julio 14 de 2022',
      queEstablece:
        'Por la cual se dictan normas para el diseño e implementación de la política de seguridad vial con enfoque de sistema seguro y se dictan otras disposiciones — Ley Julián Esteban.',
      detalle: 'Licencia digital ratifica examen teórico práctico CALE.',
      archivoUrl: '',
      nombreArchivo: '',
    },
    {
      icon: 'book',
      acento: 'orange',
      norma: 'Resolución 20223040045295 de 2022',
      fecha: 'Agosto 04 de 2022',
      queEstablece:
        'Por medio del cual se expide la Resolución Única Compilatoria en materia de Tránsito del Ministerio de Transporte.',
      detalle: 'Compila y unifica la normatividad aplicable en materia de tránsito.',
      archivoUrl: '',
      nombreArchivo: '',
    },
    {
      icon: 'car',
      acento: 'purple',
      norma: 'Resolución 20253040037125 de 2025',
      fecha: 'Septiembre 10 de 2025',
      queEstablece:
        'Por la cual se sustituye el Capítulo 7 del Título 3 de la Resolución Única Compilatoria en materia de Tránsito 20223040045295 de 2022, en lo relacionado con los Centros de Apoyo Logístico de Evaluación — CALE.',
      detalle:
        'Reglamenta los requisitos de registro de los CALE en el RUNT y establece las condiciones para realizar los exámenes teórico y práctico de conducción que deben presentar los aspirantes para el otorgamiento de la licencia de conducción y su recategorización.',
      archivoUrl: '',
      nombreArchivo: '',
    },
    ...NORMOGRAMA_ITEMS_CIRCULARES_2026,
  ],
};

const ACENTOS: ExamenTeoricoAcento[] = ['blue', 'teal', 'orange', 'green', 'purple'];

function mergeNormogramaItem(
  item: Partial<PortalExamenTeoricoNorma> | undefined,
  fb: PortalExamenTeoricoNorma,
): PortalExamenTeoricoNorma {
  const acento = ACENTOS.includes(item?.acento as ExamenTeoricoAcento)
    ? (item!.acento as ExamenTeoricoAcento)
    : fb.acento;
  return {
    icon: item?.icon?.trim() || fb.icon,
    acento,
    norma: item?.norma?.trim() || fb.norma,
    fecha: item?.fecha?.trim() || fb.fecha,
    queEstablece: item?.queEstablece?.trim() || fb.queEstablece,
    detalle: item?.detalle?.trim() || fb.detalle,
    archivoUrl: item?.archivoUrl?.trim() || fb.archivoUrl,
    archivoUrlAbsoluta: item?.archivoUrlAbsoluta?.trim() || fb.archivoUrlAbsoluta,
    nombreArchivo: item?.nombreArchivo?.trim() || fb.nombreArchivo,
  };
}

export function mergeNormogramaLanding(
  raw?: Partial<PortalExamenTeoricoNormograma> | null,
): PortalExamenTeoricoNormograma {
  const d = NORMOGRAMA_LANDING;
  const src = raw && typeof raw === 'object' ? raw : {};
  const rawItems = Array.isArray(src.items) ? src.items : [];
  const itemCount = Math.max(rawItems.length, d.items.length);
  const items: PortalExamenTeoricoNorma[] = [];
  for (let i = 0; i < itemCount; i++) {
    const fb = d.items[i];
    const item = rawItems[i];
    if (!fb) {
      if (item?.norma?.trim()) items.push(mergeNormogramaItem(item, d.items[0]));
      continue;
    }
    items.push(mergeNormogramaItem(item, fb));
  }
  return {
    kicker: src.kicker?.trim() || d.kicker,
    titulo: src.titulo?.trim() || d.titulo,
    subtitulo: src.subtitulo?.trim() || d.subtitulo,
    lead: src.lead?.trim() || d.lead,
    items: items.length ? items : [...d.items],
  };
}
