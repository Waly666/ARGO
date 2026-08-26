const { normalizarRol } = require('../utils/roles');
const { formaPagoDesdeCatalogo } = require('./tipoIngresoResolver');
const { validarPagoIntangibleIngreso } = require('../utils/referenciaPago');

function esUsuarioGestorComercial(usuario) {
  return !!usuario && normalizarRol(usuario.rol) === 'gestor';
}

function esTipoPagoTransferencia(tipoDoc, idTipoPago) {
  return formaPagoDesdeCatalogo(tipoDoc, idTipoPago) === 'Transferencia';
}

/**
 * Gestores comerciales (rol gestor): solo transferencia a cuentas de la empresa + soporte.
 */
async function assertPagoGestorSoloTransferencia(req, tipoDoc, idTipoPago, pago, urlSoporte) {
  if (!esUsuarioGestorComercial(req?.user)) return;

  if (!esTipoPagoTransferencia(tipoDoc, idTipoPago)) {
    const err = new Error(
      'Los gestores comerciales solo pueden registrar pagos por transferencia a las cuentas de la empresa, con soporte adjunto.',
    );
    err.status = 400;
    err.code = 'GESTOR_SOLO_TRANSFERENCIA';
    throw err;
  }

  if (!pago?.idCuentaBancaria) {
    const err = new Error(
      'Indique la cuenta bancaria de la empresa donde ingresó la transferencia.',
    );
    err.status = 400;
    err.code = 'GESTOR_CUENTA_REQUERIDA';
    throw err;
  }

  const intangibleVal = validarPagoIntangibleIngreso(pago, urlSoporte);
  if (!intangibleVal.ok) {
    const err = new Error(intangibleVal.message);
    err.status = intangibleVal.status || 400;
    err.code = 'GESTOR_PAGO_SIN_SOPORTE';
    throw err;
  }
}

module.exports = {
  esUsuarioGestorComercial,
  esTipoPagoTransferencia,
  assertPagoGestorSoloTransferencia,
};
