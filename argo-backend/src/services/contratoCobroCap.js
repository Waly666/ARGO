const crypto = require('crypto');
const mongoose = require('mongoose');
const Contratacion = require('../models/Contratacion');
const Cliente = require('../models/Cliente');
const Ingreso = require('../models/Ingreso');
const { models: cat } = require('../models/catalogos');
const { num, roundMoney, toDec } = require('../utils/coerceTypes');
const { siguienteNumComprobanteIngreso, siguienteNumCuentaCobro } = require('./configRecibo');
const { exigirSesionAbierta } = require('./cajaSesion');
const { formaPagoDesdeCatalogo } = require('./tipoIngresoResolver');
const { normalizarTipo } = require('./tipoIngresoCaja');
const { generarHtmlCuentaCobro } = require('./cuentaCobroHtml');
const { registrarCreacion } = require('./auditoria');
const { parseFechaCalendario } = require('../utils/fechaCalendario');
const upload = require('../middleware/upload');
const { validarPagoIntangibleIngreso } = require('../utils/referenciaPago');
const { causarServicioContratoCap } = require('./servicioContratoCap');

function urlSoporteDesdeReq(req) {
  if (req.file?.filename) return upload.publicUrl('ingresos', req.file.filename);
  return null;
}

function parseBoolBody(v) {
  return v === true || v === 'true' || v === '1';
}

function nuevoIdCuota() {
  return crypto.randomBytes(8).toString('hex');
}

function serializarCuota(c) {
  if (!c) return null;
  return {
    id: String(c.id || ''),
    etiqueta: String(c.etiqueta || '').trim(),
    valor: roundMoney(num(c.valor)),
    orden: Number(c.orden) || 0,
    idIngreso: c.idIngreso ? String(c.idIngreso) : null,
    pagadoAt: c.pagadoAt || null,
    pagado: !!c.idIngreso,
  };
}

function serializarPlanCobro(plan) {
  if (!Array.isArray(plan)) return [];
  return plan.map(serializarCuota).filter((c) => c?.id);
}

function mapaCuotasPrevias(prev) {
  const m = new Map();
  for (const c of prev?.planCobro || []) {
    if (c?.id) m.set(String(c.id), c);
  }
  return m;
}

function normalizarPlanCobroEntrada(raw, valorContrato, prev = null) {
  if (!Array.isArray(raw)) return [];
  const prevMap = mapaCuotasPrevias(prev);
  const valorObj = roundMoney(num(valorContrato));
  const out = raw
    .map((c, idx) => {
      const id = String(c?.id || '').trim() || nuevoIdCuota();
      const prevC = prevMap.get(id);
      const valorNuevo = roundMoney(num(c?.valor));
      if (prevC?.idIngreso && valorNuevo !== roundMoney(num(prevC.valor))) {
        const err = new Error(`La cuota «${prevC.etiqueta || id}» ya tiene comprobante; no puede cambiar el valor.`);
        err.status = 409;
        throw err;
      }
      return {
        id,
        etiqueta: String(c?.etiqueta || `Cuota ${idx + 1}`).trim() || `Cuota ${idx + 1}`,
        valor: toDec(valorNuevo),
        orden: idx,
        idIngreso: prevC?.idIngreso || null,
        pagadoAt: prevC?.pagadoAt || null,
      };
    })
    .filter((c) => roundMoney(num(c.valor)) > 0);

  const suma = out.reduce((a, c) => a + roundMoney(num(c.valor)), 0);
  if (valorObj > 0 && out.length && Math.abs(suma - valorObj) > 1) {
    const err = new Error(
      `Las cuotas deben sumar ${valorObj.toLocaleString('es-CO')}. Suma actual: ${suma.toLocaleString('es-CO')}.`,
    );
    err.status = 400;
    err.code = 'PLAN_COBRO_SUMA';
    throw err;
  }

  for (const prevC of prevMap.values()) {
    if (prevC.idIngreso && !out.some((c) => c.id === String(prevC.id))) {
      const err = new Error(
        `No puede eliminar la cuota «${prevC.etiqueta || prevC.id}» porque ya tiene comprobante de ingreso.`,
      );
      err.status = 409;
      throw err;
    }
  }

  return out;
}

async function resolverTipoIngresoContratoCap() {
  const rows = await cat.tipoIngreso.find({}).lean();
  const hit = rows.find((r) => {
    const t = normalizarTipo(r.tipo || r.descripcion);
    return t.includes('INGRESO') && t.includes('CONTRATO');
  });
  if (!hit) {
    const err = new Error('Catálogo sin tipo de ingreso «INGRESO CONTRATO».');
    err.status = 400;
    throw err;
  }
  return hit;
}

function camposTipoIngreso(tipoDoc) {
  return {
    idTipoIngreso: tipoDoc.idTipoIngreso != null ? String(tipoDoc.idTipoIngreso) : null,
    tipoIngreso: tipoDoc.tipo || null,
  };
}

function esTipoPagoEfectivo(tipoDoc, idTipoPago) {
  const txt = String(tipoDoc?.descripcion || tipoDoc?.nombre || idTipoPago || '').toLowerCase();
  return txt.includes('efect') || String(idTipoPago) === '1' || String(tipoDoc?.codigo || '').toUpperCase() === 'EF';
}

async function resolverCuentaBancaria(idCuentaBancaria) {
  if (!idCuentaBancaria) return null;
  const n = Number(idCuentaBancaria);
  return cat.cuentasBancarias
    .findOne({
      $or: [
        { idCuentaBancaria },
        ...(Number.isFinite(n) ? [{ idCuentaBancaria: n }, { idCuenta: n }] : []),
        { idCuenta: idCuentaBancaria },
        { numCuenta: idCuentaBancaria },
        ...(Number.isFinite(n) ? [{ numCuenta: n }] : []),
      ],
    })
    .lean();
}

async function armarCamposPago(body, tipoDoc, idTipoPago) {
  const esEfectivo = esTipoPagoEfectivo(tipoDoc, idTipoPago);
  const idCuentaBancaria = body.idCuentaBancaria || null;
  const cuenta = esEfectivo ? null : await resolverCuentaBancaria(idCuentaBancaria);
  const numTransferencia = String(body.numTransferencia || body.numComprobante || '').trim() || null;
  const formaPago = body.formaPago || formaPagoDesdeCatalogo(tipoDoc, idTipoPago);
  return {
    esEfectivo,
    formaPago,
    numTransferencia,
    numComprobante: numTransferencia,
    fechaTransferencia: body.fechaTransferencia ? String(body.fechaTransferencia).trim() : null,
    bancoEmisor: esEfectivo ? null : body.bancoEmisor || (cuenta?.banco ? String(cuenta.banco).trim() : null),
    idBanco: body.idBanco || null,
    idCuentaBancaria: esEfectivo ? null : idCuentaBancaria,
    cuentaRecibe: esEfectivo ? null : idCuentaBancaria,
  };
}

function resumenCobroContrato(contrato) {
  const valorContrato = roundMoney(num(contrato.valorContrato));
  const cuotas = serializarPlanCobro(contrato.planCobro);
  const pagado = cuotas.filter((c) => c.pagado).reduce((a, c) => a + c.valor, 0);
  return {
    valorContrato,
    comprobantesIngresoCaja: !!contrato.comprobantesIngresoCaja,
    planCobro: cuotas,
    totalCuotas: cuotas.reduce((a, c) => a + c.valor, 0),
    totalPagado: pagado,
    saldoPendiente: Math.max(0, valorContrato - pagado),
    cuentaCobro: contrato.cuentaCobroNumero
      ? {
          numero: contrato.cuentaCobroNumero,
          generadaAt: contrato.cuentaCobroGeneradaAt || null,
        }
      : null,
  };
}

async function estadoCobroContrato(idContrato) {
  const c = await Contratacion.findById(idContrato).lean();
  if (!c) {
    const err = new Error('Contrato no encontrado');
    err.status = 404;
    throw err;
  }
  return resumenCobroContrato(c);
}

async function generarCuentaCobroContrato(idContrato, req) {
  const c = await Contratacion.findById(idContrato);
  if (!c) {
    const err = new Error('Contrato no encontrado');
    err.status = 404;
    throw err;
  }
  const valor = roundMoney(num(c.valorContrato));
  if (!(valor > 0)) {
    const err = new Error('Indique el valor del contrato antes de generar la cuenta de cobro.');
    err.status = 400;
    throw err;
  }
  const objeto = String(c.objetoContrato || c.objeto || '').trim();
  if (!objeto) {
    const err = new Error('El contrato debe tener objeto / descripción.');
    err.status = 400;
    throw err;
  }
  if (!c.cuentaCobroNumero) {
    c.cuentaCobroNumero = await siguienteNumCuentaCobro();
    c.cuentaCobroGeneradaAt = new Date();
    c.userChangeRecord = req.user?.username || req.user?.sub || null;
    await c.save();
    registrarCreacion(req, 'cuenta_cobro_contrato', c.toObject(), {
      resumen: `Cuenta de cobro ${c.cuentaCobroNumero} contrato ${c.codContrato || c._id}`,
    });
  }
  return {
    numero: c.cuentaCobroNumero,
    generadaAt: c.cuentaCobroGeneradaAt,
    valorContrato: valor,
  };
}

async function htmlCuentaCobroContrato(idContrato, idSede) {
  const c = await Contratacion.findById(idContrato).lean();
  if (!c) {
    const err = new Error('Contrato no encontrado');
    err.status = 404;
    throw err;
  }
  if (!c.cuentaCobroNumero) {
    const err = new Error('Genere primero la cuenta de cobro para este contrato.');
    err.status = 400;
    throw err;
  }
  const cliente = c.idClienteFacturacion ? await Cliente.findById(c.idClienteFacturacion).lean() : null;
  return generarHtmlCuentaCobro({
    contrato: c,
    cliente,
    idSede,
  });
}

async function generarComprobanteIngresoContrato(idContrato, body, req) {
  const contrato = await Contratacion.findById(idContrato);
  if (!contrato) {
    const err = new Error('Contrato no encontrado');
    err.status = 404;
    throw err;
  }
  const idCuota = String(body?.idCuota || '').trim();
  if (!idCuota) {
    const err = new Error('Indique la cuota a cobrar.');
    err.status = 400;
    throw err;
  }
  const cuotaIdx = (contrato.planCobro || []).findIndex((q) => String(q.id) === idCuota);
  if (cuotaIdx < 0) {
    const err = new Error('Cuota no encontrada en el plan del contrato.');
    err.status = 404;
    throw err;
  }
  const cuota = contrato.planCobro[cuotaIdx];
  if (cuota.idIngreso) {
    const err = new Error('Esta cuota ya tiene comprobante de ingreso registrado.');
    err.status = 409;
    throw err;
  }
  const valor = roundMoney(num(cuota.valor));
  if (!(valor > 0)) {
    const err = new Error('La cuota no tiene valor válido.');
    err.status = 400;
    throw err;
  }

  const entraCaja =
    body?.entraCaja != null ? parseBoolBody(body.entraCaja) : !!contrato.comprobantesIngresoCaja;
  const idTipoPago = String(body?.idTipoPago || '').trim();
  if (!idTipoPago) {
    const err = new Error('Indique la forma de pago.');
    err.status = 400;
    throw err;
  }
  const tipoDoc = await cat.catTipoPago
    .findOne({ $or: [{ idTipoPago }, { codigo: idTipoPago }] })
    .lean();
  const pago = await armarCamposPago(body || {}, tipoDoc, idTipoPago);
  const urlSoporte = urlSoporteDesdeReq(req);
  const intangibleVal = validarPagoIntangibleIngreso(pago, urlSoporte);
  if (!intangibleVal.ok) {
    const err = new Error(intangibleVal.message);
    err.status = intangibleVal.status;
    throw err;
  }
  if (!pago.esEfectivo && !pago.idCuentaBancaria) {
    const err = new Error('Indique la cuenta bancaria donde ingresa el pago (si no es efectivo).');
    err.status = 400;
    throw err;
  }

  let idSesion = null;
  if (entraCaja) {
    const sesion = await exigirSesionAbierta(req.user?.sub, req.idSede);
    idSesion = sesion.idSesion;
  }

  const tipoIngDoc = await resolverTipoIngresoContratoCap();
  const tipoIng = camposTipoIngreso(tipoIngDoc);
  const numRecibo = await siguienteNumComprobanteIngreso(req.idSede);
  const objeto = String(contrato.objetoContrato || contrato.objeto || '').trim();
  const cod = String(contrato.codContrato || contrato._id).trim();
  const etiqueta = String(cuota.etiqueta || '').trim();
  const concepto = etiqueta
    ? `${etiqueta} — Contrato ${cod}: ${objeto}`.slice(0, 500)
    : `Contrato ${cod}: ${objeto}`.slice(0, 500);

  const fechaRaw = body?.fecha;
  const fecha = fechaRaw ? parseFechaCalendario(fechaRaw) || new Date(fechaRaw) : new Date();
  const clienteNombre = String(contrato.razoSocial || contrato.nombreComercial || '').trim();
  const docTercero = String(contrato.numeroIdentificacion || '').trim() || null;

  const { liquidacion, numDoc: numDocContratante } = await causarServicioContratoCap({
    contrato,
    valor,
    objeto,
    etiquetaCuota: etiqueta,
    idCuota,
    idSede: req.idSede || null,
  });

  const ing = await Ingreso.create({
    numDoc: numDocContratante,
    idLiquidacion: liquidacion._id,
    numRecibo,
    valor: toDec(valor),
    tipoAbono: 'abono',
    concepto,
    ...tipoIng,
    ingresoCaja: entraCaja,
    origenContratoCap: true,
    idContrato: contrato._id,
    idCuotaContrato: idCuota,
    recibiDe: clienteNombre || 'Contratante',
    recibidoDe: clienteNombre || 'Contratante',
    documentoTercero: docTercero,
    tipoPersona: 'juridica',
    idTipoPago,
    formaPago: pago.formaPago,
    numTransferencia: pago.numTransferencia,
    numComprobante: pago.numComprobante,
    fechaTransferencia: pago.fechaTransferencia,
    bancoEmisor: pago.bancoEmisor,
    idBanco: pago.idBanco,
    idCuentaBancaria: pago.idCuentaBancaria,
    cuentaRecibe: pago.cuentaRecibe,
    urlSoporte,
    observaciones: String(body?.observaciones || '').trim() || null,
    fecha: fecha && !Number.isNaN(fecha.getTime()) ? fecha : new Date(),
    idSesion,
    idSede: req.idSede || null,
    idUsuario: /^[a-fA-F0-9]{24}$/.test(String(req.user?.sub || ''))
      ? new mongoose.Types.ObjectId(req.user.sub)
      : null,
    userAddReg: req.user?.username || req.user?.sub || null,
  });

  contrato.planCobro[cuotaIdx].idIngreso = ing._id;
  contrato.planCobro[cuotaIdx].pagadoAt = ing.fecha || new Date();
  contrato.userChangeRecord = req.user?.username || req.user?.sub || null;
  await contrato.save();

  registrarCreacion(req, 'ingreso', ing, {
    resumen: `Ingreso contrato cap ${cod} cuota ${etiqueta || idCuota} recibo #${numRecibo}`,
  });

  return {
    ingreso: {
      _id: String(ing._id),
      numRecibo,
      valor,
      entraCaja,
      idSesion,
      fecha: ing.fecha,
    },
    cobro: resumenCobroContrato(contrato.toObject ? contrato.toObject() : contrato),
  };
}

/**
 * Tras anular un comprobante de ingreso del contrato: libera la cuota en el plan de cobro.
 */
async function revertirComprobanteIngresoContratoCap(ingreso) {
  if (!ingreso?.origenContratoCap || !ingreso.idContrato) return null;
  const idCuota = String(ingreso.idCuotaContrato || '').trim();
  if (!idCuota) return null;
  const contrato = await Contratacion.findById(ingreso.idContrato);
  if (!contrato) return null;
  const idx = (contrato.planCobro || []).findIndex((q) => String(q.id) === idCuota);
  if (idx < 0) return contrato;
  const cuota = contrato.planCobro[idx];
  if (cuota?.idIngreso && String(cuota.idIngreso) === String(ingreso._id)) {
    contrato.planCobro[idx].idIngreso = null;
    contrato.planCobro[idx].pagadoAt = null;
    await contrato.save();
  }
  return contrato;
}

module.exports = {
  serializarPlanCobro,
  normalizarPlanCobroEntrada,
  estadoCobroContrato,
  generarCuentaCobroContrato,
  htmlCuentaCobroContrato,
  generarComprobanteIngresoContrato,
  resumenCobroContrato,
  revertirComprobanteIngresoContratoCap,
};
