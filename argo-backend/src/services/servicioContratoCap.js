const Liquidacion = require('../models/Liquidacion');
const Cliente = require('../models/Cliente');
const { models: cat } = require('../models/catalogos');
const { parseNumDoc } = require('../utils/numDoc');
const { toDec, roundMoney, num } = require('../utils/coerceTypes');
const { SERVICIO_CAPACITACION_CONTRATO_ID } = require('../constants/servicioContratoCap');
const { condicionIvaServicio } = require('./facturaPayload');

async function buscarServicioCapacitacionContrato() {
  const id = SERVICIO_CAPACITACION_CONTRATO_ID;
  const n = Number(id);
  const serv = await cat.servicios
    .findOne({ $or: [{ idServ: id }, ...(Number.isFinite(n) ? [{ idServ: n }] : [])] })
    .lean();
  if (!serv) {
    const err = new Error(
      `Servicio de capacitación (idServ ${id}) no encontrado en catálogo. Configúrelo en Servicios.`,
    );
    err.status = 400;
    err.code = 'SERVICIO_CAP_CONTRATO_NO_ENCONTRADO';
    throw err;
  }
  return serv;
}

/**
 * IVA del servicio de capacitación (catálogo idServ 53).
 * Cada empresa lo configura en Servicios: gravado con %, exento o excluido/sin IVA.
 */
function perfilFiscalServicioCap(servicio, cfgFacturacion = null) {
  const condicionIva = condicionIvaServicio(servicio);
  let porcentajeIva = 0;
  if (condicionIva === 'gravado') {
    porcentajeIva = num(servicio?.iva);
    if (!(porcentajeIva > 0)) {
      porcentajeIva = Number(cfgFacturacion?.ivaPorDefecto) || 0;
    }
  }
  return {
    condicionIva,
    porcentajeIva,
    idServ: String(servicio?.idServ ?? SERVICIO_CAPACITACION_CONTRATO_ID),
    descrServicio: String(
      servicio?.descrServicio || servicio?.descripcion || servicio?.nombre || 'Capacitación',
    ).trim(),
  };
}

async function resolverNumDocContratante(contrato, clientePrecargado = null) {
  const cliente =
    clientePrecargado ||
    (contrato?.idClienteFacturacion
      ? await Cliente.findById(contrato.idClienteFacturacion).lean()
      : null);
  const raw = String(contrato?.numeroIdentificacion || cliente?.identificacion || '').trim();
  const numDoc = parseNumDoc(raw);
  if (numDoc == null) {
    const err = new Error(
      'Indique el NIT/documento del contratante (en el contrato o en el cliente de facturación) para causar el servicio.',
    );
    err.status = 400;
    err.code = 'CONTRATO_SIN_DOCUMENTO';
    throw err;
  }
  return { numDoc, cliente };
}

function descripcionLiquidacionContrato({ servicio, contrato, objeto, etiquetaCuota }) {
  const base = String(
    servicio?.descrServicio || servicio?.descripcion || servicio?.nombre || 'Capacitación',
  ).trim();
  const cod = String(contrato?.codContrato || contrato?._id || '').trim();
  const obj = String(objeto || contrato?.objetoContrato || contrato?.objeto || '').trim();
  const etiqueta = String(etiquetaCuota || '').trim();
  if (etiqueta) {
    return `${etiqueta} — ${base}: ${obj || cod}`.slice(0, 500);
  }
  return `${base} — Contrato ${cod}: ${obj}`.slice(0, 500);
}

/**
 * Causa el servicio de capacitación (#53) y lo marca pagado con el comprobante de ingreso.
 */
async function causarServicioContratoCap({
  contrato,
  valor,
  objeto,
  etiquetaCuota,
  idCuota,
  idSede = null,
  cliente = null,
}) {
  const servicio = await buscarServicioCapacitacionContrato();
  const { numDoc } = await resolverNumDocContratante(contrato, cliente);
  const v = roundMoney(num(valor));
  if (!(v > 0)) {
    const err = new Error('Valor inválido para causar el servicio.');
    err.status = 400;
    throw err;
  }
  const descripcion = descripcionLiquidacionContrato({
    servicio,
    contrato,
    objeto,
    etiquetaCuota,
  });
  const liq = await Liquidacion.create({
    numDoc,
    idSede: idSede || null,
    idServ: String(servicio.idServ ?? SERVICIO_CAPACITACION_CONTRATO_ID),
    idProg: servicio.idProg || null,
    descripcion,
    valor: toDec(v),
    abonado: toDec(v),
    saldo: toDec(0),
    estado: 'pagado',
    idContrato: contrato._id,
    idCuotaContrato: idCuota || null,
    origenContratoCap: true,
  });
  return { liquidacion: liq, servicio, numDoc, descripcion };
}

module.exports = {
  SERVICIO_CAPACITACION_CONTRATO_ID,
  buscarServicioCapacitacionContrato,
  perfilFiscalServicioCap,
  resolverNumDocContratante,
  descripcionLiquidacionContrato,
  causarServicioContratoCap,
};
