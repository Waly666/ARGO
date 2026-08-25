const ORIGEN_PAGO_CONSIGNACION = 'portal_consignacion_qr';

const ESTADOS_SOLICITUD = ['pendiente', 'aprobada', 'rechazada'];

const TEXTOS_DEFAULT = {
  tituloElegirMedio: '¿Dónde va a consignar?',
  instruccionesPago:
    'Elija la cuenta, realice la transferencia o consignación por el valor exacto del curso y luego registre su comprobante.',
  textoReferenciaSugerida:
    'En el concepto de la transferencia incluya su número de documento y el nombre del curso.',
  mensajeEnRevision:
    'Recibimos su comprobante. Un administrador lo revisará y le notificaremos por correo cuando el pago sea confirmado.',
  mensajeAprobado: 'Su pago fue verificado. Ya puede obtener su certificado según las reglas del curso.',
  mensajeRechazado:
    'Su comprobante no pudo ser verificado. Revise el correo con el detalle y puede enviar una nueva solicitud.',
  plazoRevision: 'Tiempo estimado de revisión: 24 a 48 horas hábiles.',
};

module.exports = {
  ORIGEN_PAGO_CONSIGNACION,
  ESTADOS_SOLICITUD,
  TEXTOS_DEFAULT,
};
