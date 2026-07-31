const TIPO_SESION_VIRTUAL = 'virtual_diaria';
const TIPO_PAGO_EN_LINEA = 'PL';
const TIPO_PAGO_EN_LINEA_ID = '7';
const ORIGEN_PAGO_PASARELA = 'pasarela_wompi';

const WOMPI_SANDBOX_CHECKOUT = 'https://checkout.wompi.co/p/';
const WOMPI_PROD_CHECKOUT = 'https://checkout.wompi.co/p/';
const WOMPI_SANDBOX_API = 'https://sandbox.wompi.co/v1';
const WOMPI_PROD_API = 'https://production.wompi.co/v1';

const IDS_TIPO_PAGO_EN_LINEA = new Set([
  String(TIPO_PAGO_EN_LINEA).toUpperCase(),
  String(TIPO_PAGO_EN_LINEA_ID),
  'PL',
  '7',
]);

function normalizarTxtPago(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** True si el tipo de pago es el de pasarela (PL / id 7). */
function esIdTipoPagoEnLinea(idTipoPago, tipoDoc) {
  const id = String(idTipoPago ?? '').trim().toUpperCase();
  if (id && IDS_TIPO_PAGO_EN_LINEA.has(id)) return true;
  const codigo = String(tipoDoc?.codigo ?? '').trim().toUpperCase();
  if (codigo && IDS_TIPO_PAGO_EN_LINEA.has(codigo)) return true;
  const desc = normalizarTxtPago(tipoDoc?.descripcion || tipoDoc?.nombre || '');
  return /pago en linea/.test(desc) || desc === 'pl';
}

/**
 * Ingreso automático de aula virtual / Wompi.
 * No debe entrar al cuadre ni arqueo del cajero.
 * Cobros manuales de tarifa virtual (transferencia, etc.) NO marcan esto.
 */
function esIngresoPagoEnLinea(ing) {
  if (!ing) return false;
  if (ing.origenPasarela === true) return true;
  if (String(ing.origenPago || '').trim() === ORIGEN_PAGO_PASARELA) return true;
  if (esIdTipoPagoEnLinea(ing.idTipoPago)) return true;
  const fp = normalizarTxtPago(ing.formaPago);
  if (/pago en linea/.test(fp)) return true;
  return false;
}

function filtroMongoIngresosEnLinea() {
  return {
    $or: [
      { origenPasarela: true },
      { origenPago: ORIGEN_PAGO_PASARELA },
      { idTipoPago: { $in: [...IDS_TIPO_PAGO_EN_LINEA] } },
      { formaPago: 'Pago en línea' },
    ],
  };
}

module.exports = {
  TIPO_SESION_VIRTUAL,
  TIPO_PAGO_EN_LINEA,
  TIPO_PAGO_EN_LINEA_ID,
  ORIGEN_PAGO_PASARELA,
  IDS_TIPO_PAGO_EN_LINEA,
  WOMPI_SANDBOX_CHECKOUT,
  WOMPI_PROD_CHECKOUT,
  WOMPI_SANDBOX_API,
  WOMPI_PROD_API,
  esIdTipoPagoEnLinea,
  esIngresoPagoEnLinea,
  filtroMongoIngresosEnLinea,
};
