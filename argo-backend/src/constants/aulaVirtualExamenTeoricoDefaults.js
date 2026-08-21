/** Sección inicio + página /examen-teorico (sin menú). */
const { NORMOGRAMA_DEFAULTS } = require('./aulaVirtualExamenTeoricoNormogramaDefaults');

const EXAMEN_TEORICO_DEFAULTS = {
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
  normograma: JSON.parse(JSON.stringify(NORMOGRAMA_DEFAULTS)),
  ctaFinalTexto: 'Ver cursos de conducción',
  ctaFinalUrl: '/cursos-conduccion',
};

module.exports = { EXAMEN_TEORICO_DEFAULTS };
