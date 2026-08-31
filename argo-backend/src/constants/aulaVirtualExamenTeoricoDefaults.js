/** Sección inicio + página /examen-teorico (sin menú). */
const {
  NORMOGRAMA_DEFAULTS,
  ENLACE_OFICIAL_MINTRANSPORTE_CIRCULARES,
} = require('./aulaVirtualExamenTeoricoNormogramaDefaults');

const EXAMEN_TEORICO_DEFAULTS = {
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
  normograma: JSON.parse(JSON.stringify(NORMOGRAMA_DEFAULTS)),
  ctaFinalTexto: 'Ver cursos de conducción',
  ctaFinalUrl: '/cursos-conduccion',
  backLabel: '← Volver al inicio',
  oficialLead:
    'Consulte el texto oficial de la circular y las resoluciones relacionadas con el examen teórico y la habilitación del CEA.',
  theme: 'gold',
  mostrarBadgeVirtual: false,
};

function examenTeoricoContenidoAntiguo(raw) {
  if (!raw || typeof raw !== 'object') return false;
  const patron = /14 de septiembre de 2026|LUNES 14 DE SEPTIEMBRE/i;
  const s = (v) => String(v ?? '').trim();
  if (patron.test(s(raw.fechaDestacada))) return true;
  if (/será exigible en todo el país/i.test(s(raw.fechaBannerSufijo))) return true;
  const t0 = raw.items?.[0]?.texto ?? '';
  if (patron.test(t0) || /Certificado aprobado/i.test(raw.items?.[0]?.titulo ?? '')) return true;
  return false;
}

module.exports = { EXAMEN_TEORICO_DEFAULTS, examenTeoricoContenidoAntiguo };
