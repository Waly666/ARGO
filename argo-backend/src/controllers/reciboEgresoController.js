const QRCode = require('qrcode');
const Egreso = require('../models/Egreso');
const Empleado = require('../models/Empleado');
const Vehiculo = require('../models/Vehiculo');
const Tercero = require('../models/Tercero');
const { obtenerConfigRecibo, siguienteNumComprobanteEgreso } = require('../services/configRecibo');
const {
  numeroDocumentoQuery,
  nombreCompletoEmpleado,
  normalizarEmpleadoLegacy,
} = require('../utils/empleadoDoc');
const { normalizarPlaca } = require('../constants/vehiculo');
const { models: cat } = require('../models/catalogos');
const { generarHtmlEgreso } = require('../services/comprobanteHtml');

function num(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v.$numberDecimal != null) return Number(v.$numberDecimal) || 0;
  return Number(v) || 0;
}

async function resolverTipoEgreso(tipoEgreso) {
  if (!tipoEgreso) return null;
  const n = Number(tipoEgreso);
  return cat.tipoEgreso
    .findOne({
      $or: [
        { idTipoEgreso: tipoEgreso },
        ...(Number.isFinite(n) ? [{ idTipoEgreso: n }] : []),
        { tipo: new RegExp(String(tipoEgreso).trim(), 'i') },
      ],
    })
    .lean();
}

async function resolverCuentaOrigen(cuentaOrigen) {
  if (!cuentaOrigen) return null;
  const n = Number(cuentaOrigen);
  return cat.cuentasBancarias
    .findOne({
      $or: [
        { idCuentaBancaria: cuentaOrigen },
        ...(Number.isFinite(n) ? [{ idCuentaBancaria: n }] : []),
      ],
    })
    .lean();
}

async function resolverBancoDestino(bancoDestino) {
  if (!bancoDestino) return null;
  const n = Number(bancoDestino);
  return cat.bancos
    .findOne({
      $or: [
        { idBanco: bancoDestino },
        { idbanco: bancoDestino },
        ...(Number.isFinite(n) ? [{ idBanco: n }, { idbanco: n }] : []),
        { banco: new RegExp(String(bancoDestino).trim(), 'i') },
      ],
    })
    .lean();
}

async function enriquecerEgreso(raw) {
  const e = raw;
  const tipo = await resolverTipoEgreso(e.tipoEgreso);
  const cuenta = await resolverCuentaOrigen(e.cuentaOrigen);
  const banco = await resolverBancoDestino(e.bancoDestino);

  let emp = null;
  if (e.idEmpleado != null && Number.isFinite(Number(e.idEmpleado))) {
    emp = await Empleado.findOne({ idEmpleado: Number(e.idEmpleado) }).lean();
  }
  if (!emp && e.numeroDocumento) {
    const q = numeroDocumentoQuery(e.numeroDocumento);
    emp = q ? await Empleado.findOne(q).lean() : null;
  }
  if (emp) emp = normalizarEmpleadoLegacy(emp);

  let ter = null;
  if (e.idTercero) {
    ter = await Tercero.findById(e.idTercero).lean();
  } else if (!emp && e.numeroDocumento) {
    ter = await Tercero.findOne({
      identificacion: String(e.numeroDocumento).trim(),
      activo: { $ne: false },
    }).lean();
  }

  const nombreTer = ter
    ? String(ter.razonSocial || ter.nombres || ter.nombreComercial || '').trim()
    : '';
  const correo =
    String(e.correoBeneficiario || '').trim() ||
    (emp ? String(emp.correoCorporativo || emp.correoPersonal || '').trim() : '') ||
    (ter ? String(ter.correo || '').trim() : '') ||
    null;
  const direccion =
    String(e.direccionBeneficiario || '').trim() ||
    (emp ? String(emp.direccion || '').trim() : '') ||
    (ter ? String(ter.direccion || '').trim() : '') ||
    null;
  const telefono =
    String(e.telefonoBeneficiario || '').trim() ||
    (emp ? String(emp.celular || emp.telefono || '').trim() : '') ||
    (ter ? String(ter.telefono || '').trim() : '') ||
    null;

  const veh = e.placa ? await Vehiculo.findOne({ placa: normalizarPlaca(e.placa) }).lean() : null;
  return {
    idEgreso: String(e._id),
    numRecibo: e.numRecibo || null,
    fechaEgreso: e.fechaEgreso,
    valorEgreso: num(e.valorEgreso),
    pagueA: e.pagueA || nombreCompletoEmpleado(emp) || nombreTer || null,
    numeroDocumento:
      e.numeroDocumento ||
      (emp ? emp.numeroDocumento : null) ||
      (ter ? ter.identificacion : null) ||
      null,
    empleadoNombre: nombreCompletoEmpleado(emp),
    empleadoCargo: emp?.cargoNombre || null,
    correoBeneficiario: correo ? String(correo).toLowerCase() : null,
    direccionBeneficiario: direccion || null,
    telefonoBeneficiario: telefono || null,
    concepto: e.concepto,
    tipoEgresoDescr: tipo?.tipo || null,
    placa: e.placa || null,
    vehiculoMarca: veh?.nombreMarca || null,
    vehiculoLinea: veh?.nombreLinea || null,
    vehiculoClase: veh?.claseVehiculo || null,
    formaPago: e.formaPago || null,
    numTransferencia: e.numTransferencia || null,
    fechaTransferencia: e.fechaTransferencia || null,
    cuentaOrigenDescr: cuenta ? `${cuenta.banco || ''} ${cuenta.numCuenta || ''}`.trim() : null,
    cuentaDestino: e.cuentaDestino || null,
    bancoDestinoDescr: banco?.banco || banco?.descripcion || banco?.nombre || null,
    urlSoporte: e.urlSoporte || null,
    anticipoNomina: e.anticipoNomina || null,
    idPeriodo: e.idPeriodo ?? null,
    userAddReg: e.userAddReg,
    autorizadoPor: e.autorizadoPor || null,
    nombreAutoriza: e.nombreAutoriza || null,
    autorizadoEn: e.autorizadoEn || null,
    estado: e.estado || (e.anulado ? 'ANULADO' : null),
    anulado: e.anulado === true || String(e.estado || '').trim().toUpperCase() === 'ANULADO',
    anuladoEn: e.anuladoEn || null,
    anuladoPor: e.anuladoPor || null,
    valorAnulado: e.valorAnulado != null ? num(e.valorAnulado) : null,
    motivoAnulacion: e.motivoAnulacion || null,
  };
}

async function ensureNumRecibo(egresoDoc) {
  if (egresoDoc.numRecibo) return egresoDoc.numRecibo;
  const num = await siguienteNumComprobanteEgreso(egresoDoc.idSede);
  await Egreso.updateOne({ _id: egresoDoc._id }, { $set: { numRecibo: num } });
  return num;
}

async function armarReciboEgreso(id) {
  const eg = await Egreso.findById(id).lean();
  if (!eg) return null;

  const config = await obtenerConfigRecibo(eg.idSede);
  const egreso = await enriquecerEgreso(eg);
  const numeroRecibo = await ensureNumRecibo(eg);
  egreso.numRecibo = numeroRecibo;

  const prefEg = (config.prefijoComprobanteEgreso || 'CE').trim();
  const numeroComprobante = numeroRecibo || `${prefEg}-${String(eg._id).slice(-8).toUpperCase()}`;

  const qrTexto = JSON.stringify({
    comprobante: numeroComprobante,
    egresoId: String(eg._id),
    beneficiario: egreso.pagueA,
    documento: egreso.numeroDocumento,
    valor: egreso.valorEgreso,
    fecha: egreso.fechaEgreso || eg.fechaAudi,
    nit: config.nit || '',
  });

  let qrDataUrl = null;
  if (config.mostrarQr !== false) {
    try {
      qrDataUrl = await QRCode.toDataURL(qrTexto, { width: 140, margin: 1, errorCorrectionLevel: 'M' });
    } catch {
      qrDataUrl = null;
    }
  }

  return { config, egreso, numeroRecibo: numeroComprobante, qrDataUrl, qrTexto };
}

exports.datos = async (req, res, next) => {
  try {
    const data = await armarReciboEgreso(req.params.id);
    if (!data) return res.status(404).json({ message: 'Egreso no encontrado' });
    res.json(data);
  } catch (e) {
    next(e);
  }
};

exports.html = async (req, res, next) => {
  try {
    const data = await armarReciboEgreso(req.params.id);
    if (!data) return res.status(404).json({ message: 'Egreso no encontrado' });
    const html = await generarHtmlEgreso(data);
    res.type('html').send(html);
  } catch (e) {
    next(e);
  }
};
