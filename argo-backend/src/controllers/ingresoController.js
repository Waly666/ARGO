const mongoose = require('mongoose');
const Ingreso = require('../models/Ingreso');
const Liquidacion = require('../models/Liquidacion');
const DatosAlumno = require('../models/DatosAlumno');
const { models: cat } = require('../models/catalogos');
const { siguienteNumComprobanteIngreso } = require('../services/configRecibo');
const { esAdmin } = require('../utils/roles');
const { parseNumDoc, numDocFromParams, numDocEquals, numDocQuery } = require('../utils/numDoc');
const { refrescarPagoMatricula } = require('../services/liquidacionMatricula');
const { exigirSesionAbierta, verificarMovimientoSesionCajero, requiereAutorizacionAnularMovimiento } = require('../services/cajaSesion');
const { exigirAdminOSupervisor, verificarAdminCredenciales } = require('../services/authVerify');
const {
  validarTipoIngresoCaja,
  esIngresoContrato,
  esAprovisionamientoCaja,
} = require('../services/tipoIngresoCaja');
const {
  resolverTipoIngresoDesdeLiquidacion,
  resolverTipoIngresoIngreso,
  formaPagoDesdeCatalogo,
} = require('../services/tipoIngresoResolver');
const { registrarCreacion, registrarEliminacion } = require('../services/auditoria');

function num(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v.$numberDecimal != null) return Number(v.$numberDecimal) || 0;
  return Number(v) || 0;
}
function toDec(n) {
  return mongoose.Types.Decimal128.fromString(String(Number(n) || 0));
}

function estadoLiq(valor, abonado) {
  const s = valor - abonado;
  if (s <= 0.0001) return 'pagado';
  if (abonado > 0) return 'parcial';
  return 'pendiente';
}

function calcularTipoAbono(valorPago, saldoAntes) {
  return valorPago >= saldoAntes - 0.0001 ? 'total' : 'abono';
}

function tipoAbonoDescr(tipo) {
  if (tipo === 'total') return 'Total';
  if (tipo === 'abono') return 'Abono';
  return null;
}

function esTipoPagoEfectivo(tipoDoc, idTipoPago) {
  const fp = formaPagoDesdeCatalogo(tipoDoc, idTipoPago);
  return fp === 'Efectivo';
}

function descrCuentaBancaria(c) {
  if (!c) return null;
  const parts = [(c.banco || '').trim(), (c.tipo || '').trim(), c.numCuenta ?? ''].filter(Boolean);
  return parts.join(' — ');
}

function nombreAlumno(a) {
  if (!a) return '';
  return [a.nombre1, a.nombre2, a.apellido1, a.apellido2].filter(Boolean).join(' ').trim();
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

async function resolverBanco(idBanco) {
  if (!idBanco) return null;
  return cat.bancos
    .findOne({
      $or: [
        { idBanco },
        { idbanco: idBanco },
        { idbanco: Number(idBanco) },
        { codigo: idBanco },
      ],
    })
    .lean();
}

async function armarCamposPago(body, tipoDoc, idTipoPago) {
  const esEfectivo = esTipoPagoEfectivo(tipoDoc, idTipoPago);
  const idCuentaBancaria = body.idCuentaBancaria || null;
  const cuenta = esEfectivo ? null : await resolverCuentaBancaria(idCuentaBancaria);
  const banco = body.idBanco ? await resolverBanco(body.idBanco) : null;
  const numTransferencia = String(body.numTransferencia || body.numComprobante || '').trim() || null;
  const formaPago = body.formaPago || formaPagoDesdeCatalogo(tipoDoc, idTipoPago);
  const bancoEmisor =
    body.bancoEmisor ||
    banco?.descripcion ||
    banco?.nombre ||
    banco?.banco ||
    (cuenta?.banco ? String(cuenta.banco).trim() : null);

  return {
    esEfectivo,
    formaPago,
    numTransferencia,
    numComprobante: numTransferencia,
    fechaTransferencia: body.fechaTransferencia ? String(body.fechaTransferencia).trim() : null,
    bancoEmisor: esEfectivo ? null : bancoEmisor,
    idBanco: body.idBanco || null,
    idCuentaBancaria: esEfectivo ? null : idCuentaBancaria,
    cuentaRecibe: esEfectivo ? null : idCuentaBancaria || descrCuentaBancaria(cuenta),
    cuentaBancariaDescr: descrCuentaBancaria(cuenta),
  };
}

function camposTipoIngreso(tipoDoc) {
  if (!tipoDoc) return { idTipoIngreso: null, tipoIngreso: null };
  return {
    idTipoIngreso: tipoDoc.idTipoIngreso != null ? String(tipoDoc.idTipoIngreso) : null,
    tipoIngreso: tipoDoc.tipo || null,
  };
}

async function enriquecer(p) {
  const tipo = await cat.catTipoPago
    .findOne({ $or: [{ idTipoPago: p.idTipoPago }, { codigo: p.idTipoPago }] })
    .lean();
  const tipoIngDoc = await resolverTipoIngresoIngreso(p);
  const banco = p.idBanco || p.bancoEmisor ? await resolverBanco(p.idBanco || p.bancoEmisor) : null;
  const cuenta = await resolverCuentaBancaria(p.idCuentaBancaria || p.cuentaRecibe);
  const formaPago = p.formaPago || formaPagoDesdeCatalogo(tipo, p.idTipoPago);
  const recibiDe = p.recibiDe || p.recibidoDe || null;

  return {
    ...p,
    valor: num(p.valor),
    tipoPagoDescr: tipo?.descripcion || tipo?.nombre || p.idTipoPago,
    formaPago,
    bancoDescr: p.bancoEmisor || banco?.descripcion || banco?.nombre || banco?.banco || null,
    bancoEmisor: p.bancoEmisor || banco?.descripcion || banco?.nombre || banco?.banco || null,
    cuentaBancariaDescr: descrCuentaBancaria(cuenta) || p.cuentaRecibe || null,
    cuentaRecibe: p.cuentaRecibe || p.idCuentaBancaria || descrCuentaBancaria(cuenta),
    numTransferencia: p.numTransferencia || p.numComprobante || null,
    tipoAbonoDescr: tipoAbonoDescr(p.tipoAbono),
    idTipoIngreso: p.idTipoIngreso || (tipoIngDoc?.idTipoIngreso != null ? String(tipoIngDoc.idTipoIngreso) : null),
    tipoIngreso: p.tipoIngreso || tipoIngDoc?.tipo || null,
    tipoIngresoDescr: p.tipoIngreso || tipoIngDoc?.tipo || null,
    recibiDe,
    recibidoDe: recibiDe,
    cuadreDescuadre: !!p.cuadreDescuadre,
    idSesion: p.idSesion ?? null,
    esIngresoCaja: !!(p.ingresoCaja || (!p.idLiquidacion && p.idTipoIngreso)),
  };
}

exports.crear = async (req, res, next) => {
  try {
    const body = req.body || {};
    if (body.idLiquidacion) return exports.crearAlumno(req, res, next);
    if (body.idTipoIngreso) return exports.crearCaja(req, res, next);
    return res.status(400).json({
      message: 'Indique idLiquidacion (cobro de alumno) o idTipoIngreso (ingreso de caja)',
    });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message, code: e.code });
    next(e);
  }
};

exports.crearAlumno = async (req, res, next) => {
  try {
    const body = req.body || {};
    const {
      numDoc: numDocRaw,
      idLiquidacion,
      valor,
      idTipoPago,
      observaciones,
      fecha,
    } = body;
    const numDoc = parseNumDoc(numDocRaw);
    if (numDoc == null || !idLiquidacion || valor == null || !idTipoPago) {
      return res.status(400).json({ message: 'numDoc, idLiquidacion, valor e idTipoPago son obligatorios' });
    }
    const v = Number(valor);
    if (!(v > 0)) return res.status(400).json({ message: 'Valor inválido' });

    const tipoDoc = await cat.catTipoPago
      .findOne({ $or: [{ idTipoPago }, { codigo: idTipoPago }] })
      .lean();
    const pago = await armarCamposPago(body, tipoDoc, idTipoPago);
    if (!pago.esEfectivo && !pago.idCuentaBancaria) {
      return res.status(400).json({
        message: 'Indique la cuenta bancaria de la empresa donde ingresa el pago (transferencia, cheque, Nequi, etc.)',
      });
    }

    const liq = await Liquidacion.findById(idLiquidacion);
    if (!liq) return res.status(404).json({ message: 'Item de liquidación no encontrado' });
    if (!numDocEquals(liq.numDoc, numDoc)) {
      return res.status(400).json({ message: 'Liquidación no corresponde al alumno' });
    }

    const saldoActual = num(liq.saldo);
    if (v > saldoActual + 0.0001) {
      return res.status(400).json({ message: `El pago excede el saldo (${saldoActual})` });
    }

    const tipoIngDoc = await resolverTipoIngresoDesdeLiquidacion(idLiquidacion);
    const tipoIng = camposTipoIngreso(tipoIngDoc);
    const alumno = await DatosAlumno.findOne(numDocQuery(numDoc)).lean();
    const recibiDe = body.recibiDe || body.recibidoDe || nombreAlumno(alumno) || String(numDoc);

    const nuevoAbonado = num(liq.abonado) + v;
    const nuevoSaldo = num(liq.valor) - nuevoAbonado;
    liq.abonado = toDec(nuevoAbonado);
    liq.saldo = toDec(nuevoSaldo);
    liq.estado = estadoLiq(num(liq.valor), nuevoAbonado);
    await liq.save();

    const numRecibo = await siguienteNumComprobanteIngreso();
    const tipoAbono = calcularTipoAbono(v, saldoActual);
    const sesion = await exigirSesionAbierta(req.user?.sub);
    const username = req.user?.username || req.user?.sub || null;

    let ing;
    try {
      ing = await Ingreso.create({
        numDoc,
        idLiquidacion,
        numRecibo,
        valor: toDec(v),
        tipoAbono,
        concepto: liq.descripcion || null,
        ...tipoIng,
        ingresoCaja: false,
        recibiDe,
        recibidoDe: recibiDe,
        idTipoPago,
        formaPago: pago.formaPago,
        numTransferencia: pago.numTransferencia,
        numComprobante: pago.numComprobante,
        fechaTransferencia: pago.fechaTransferencia,
        bancoEmisor: pago.bancoEmisor,
        idBanco: pago.idBanco,
        idCuentaBancaria: pago.idCuentaBancaria,
        cuentaRecibe: pago.cuentaRecibe,
        observaciones,
        fecha: fecha ? new Date(fecha) : new Date(),
        idSesion: sesion.idSesion,
        idUsuario: req.user?.sub ? String(req.user.sub) : null,
        userAddReg: username,
      });
    } catch (errIngreso) {
      liq.abonado = toDec(num(liq.abonado) - v);
      liq.saldo = toDec(num(liq.valor) - num(liq.abonado));
      liq.estado = estadoLiq(num(liq.valor), num(liq.abonado));
      await liq.save();
      throw errIngreso;
    }

    if (liq.idMat) await refrescarPagoMatricula(liq.idMat);

    const enriquecido = await enriquecer(ing.toObject());
    registrarCreacion(req, 'ingreso', ing, {
      resumen: `Ingreso ${tipoIng.tipoIngreso || 'alumno'} recibo #${numRecibo} por ${v}`,
    });
    res.status(201).json({ ...enriquecido, numRecibo });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message, code: e.code });
    next(e);
  }
};

exports.crearCaja = async (req, res, next) => {
  try {
    const body = req.body || {};
    const {
      idTipoIngreso,
      valor,
      idTipoPago,
      observaciones,
      fecha,
      concepto,
      recibidoDe,
      recibiDe,
      documentoTercero,
      tipoPersona,
    } = body;

    if (!idTipoIngreso || valor == null || !idTipoPago) {
      return res.status(400).json({ message: 'idTipoIngreso, valor e idTipoPago son obligatorios' });
    }

    const valTipo = await validarTipoIngresoCaja(idTipoIngreso);
    if (!valTipo.ok) return res.status(valTipo.status).json({ message: valTipo.message });

    const v = Number(valor);
    if (!(v > 0)) return res.status(400).json({ message: 'Valor inválido' });

    const conceptoTxt = String(concepto || '').trim();
    if (!conceptoTxt) return res.status(400).json({ message: 'El concepto es obligatorio' });

    const recibidoTxt = String(recibiDe || recibidoDe || '').trim();
    const docTercero = String(documentoTercero || '').trim();
    const tipoPers = String(tipoPersona || '').trim().toLowerCase();

    if (esIngresoContrato(valTipo.tipo)) {
      if (!recibidoTxt) return res.status(400).json({ message: 'Indique el nombre del contratante (recibido de)' });
      if (!docTercero) return res.status(400).json({ message: 'Indique NIT o documento del contratante' });
      if (!['natural', 'juridica'].includes(tipoPers)) {
        return res.status(400).json({ message: 'Indique si el contratante es persona natural o jurídica' });
      }
    } else if (esAprovisionamientoCaja(valTipo.tipo)) {
      if (!recibidoTxt) return res.status(400).json({ message: 'Indique quién aporta el dinero a la caja' });
    } else if (!recibidoTxt) {
      return res.status(400).json({ message: 'Indique de quién se recibe el ingreso' });
    }

    const tipoDoc = await cat.catTipoPago
      .findOne({ $or: [{ idTipoPago }, { codigo: idTipoPago }] })
      .lean();
    const pago = await armarCamposPago(body, tipoDoc, idTipoPago);
    if (!pago.esEfectivo && !pago.idCuentaBancaria) {
      return res.status(400).json({
        message: 'Indique la cuenta bancaria de la empresa donde ingresa el pago (transferencia, cheque, Nequi, etc.)',
      });
    }

    const tipoIng = camposTipoIngreso(valTipo.tipo);
    const numRecibo = await siguienteNumComprobanteIngreso();
    const sesion = await exigirSesionAbierta(req.user?.sub);
    const username = req.user?.username || req.user?.sub || null;

    const ing = await Ingreso.create({
      numDoc: docTercero ? parseNumDoc(docTercero) : null,
      idLiquidacion: null,
      numRecibo,
      valor: toDec(v),
      ...tipoIng,
      ingresoCaja: true,
      concepto: conceptoTxt,
      recibiDe: recibidoTxt || 'Aportante caja',
      recibidoDe: recibidoTxt || 'Aportante caja',
      documentoTercero: docTercero || null,
      tipoPersona: ['natural', 'juridica'].includes(tipoPers) ? tipoPers : null,
      idTipoPago,
      formaPago: pago.formaPago,
      numTransferencia: pago.numTransferencia,
      numComprobante: pago.numComprobante,
      fechaTransferencia: pago.fechaTransferencia,
      bancoEmisor: pago.bancoEmisor,
      idBanco: pago.idBanco,
      idCuentaBancaria: pago.idCuentaBancaria,
      cuentaRecibe: pago.cuentaRecibe,
      observaciones,
      fecha: fecha ? new Date(fecha) : new Date(),
      idSesion: sesion.idSesion,
      idUsuario: req.user?.sub ? String(req.user.sub) : null,
      userAddReg: username,
    });

    const enriquecido = await enriquecer(ing.toObject());
    registrarCreacion(req, 'ingreso', ing, {
      resumen: `Ingreso caja ${tipoIng.tipoIngreso || idTipoIngreso} recibo #${numRecibo} por ${v}`,
    });
    res.status(201).json({ ...enriquecido, numRecibo });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message, code: e.code });
    next(e);
  }
};

exports.listarPorAlumno = async (req, res, next) => {
  try {
    const numDoc = numDocFromParams(req.params.numDoc);
    if (numDoc == null) return res.status(400).json({ message: 'numDoc inválido' });
    const rows = await Ingreso.find(numDocQuery(numDoc)).sort({ fecha: -1, createdAt: -1 }).lean();
    res.json(await listarIngresosEnriquecidos(rows));
  } catch (e) {
    next(e);
  }
};

async function listarIngresosEnriquecidos(rows) {
  const liqIds = [...new Set(rows.map((r) => String(r.idLiquidacion)).filter(Boolean))];
  const liqs = liqIds.length
    ? await Liquidacion.find({ _id: { $in: liqIds } }).select('descripcion').lean()
    : [];
  const descrMap = Object.fromEntries(liqs.map((l) => [String(l._id), l.descripcion || '']));
  const numDocs = [...new Set(rows.map((r) => r.numDoc).filter((n) => n != null))];
  const alumnos = numDocs.length
    ? await DatosAlumno.find({ numDoc: { $in: numDocs } }).lean()
    : [];
  const alumnoMap = Object.fromEntries(alumnos.map((a) => [String(a.numDoc), a]));
  const out = [];
  for (const r of rows) {
    const e = await enriquecer(r);
    const esCaja = e.esIngresoCaja;
    const alumno = alumnoMap[String(r.numDoc)];
    const alumnoNombre = nombreAlumno(alumno) || null;
    out.push({
      ...e,
      alumnoNombre,
      liquidacionDescr: esCaja ? e.concepto : descrMap[String(r.idLiquidacion)] || e.concepto || null,
      pagadorDescr: esCaja ? e.recibiDe || e.recibidoDe : alumnoNombre || e.recibiDe || null,
      conceptoLabel: esCaja ? e.concepto : descrMap[String(r.idLiquidacion)] || e.concepto || null,
    });
  }
  return out;
}

function rangoFechaQuery(desde, hasta, campo = 'fecha') {
  const f = {};
  if (desde) {
    const d = new Date(String(desde).trim());
    if (!Number.isNaN(d.getTime())) f.$gte = d;
  }
  if (hasta) {
    const h = new Date(String(hasta).trim());
    if (!Number.isNaN(h.getTime())) {
      h.setHours(23, 59, 59, 999);
      f.$lte = h;
    }
  }
  return Object.keys(f).length ? { [campo]: f } : null;
}

exports.listarTodos = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const docRaw = String(req.query.numDoc || req.query.doc || '').trim();
    const idSesionQ = req.query.idSesion;
    const skip = Math.max(0, Number(req.query.skip) || 0);
    const limit = Math.min(2000, Math.max(1, Number(req.query.limit) || 500));
    const and = [];

    const rango = rangoFechaQuery(req.query.desde, req.query.hasta, 'fecha');
    if (rango) and.push(rango);

    if (idSesionQ != null && idSesionQ !== '') {
      const sid = Number(idSesionQ);
      if (Number.isFinite(sid)) and.push({ idSesion: sid });
    }

    const ndDoc = docRaw ? parseNumDoc(docRaw) : null;
    if (ndDoc != null) {
      and.push(numDocQuery(ndDoc));
    } else if (q) {
      const ndQ = parseNumDoc(q);
      if (ndQ != null && /^\d+$/.test(q.replace(/\D/g, ''))) {
        and.push(numDocQuery(ndQ));
      } else if (q.length >= 2) {
        const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(esc, 'i');
        const alumnos = await DatosAlumno.find({
          $or: [
            { nombre1: re },
            { nombre2: re },
            { apellido1: re },
            { apellido2: re },
          ],
        })
          .select('numDoc')
          .limit(300)
          .lean();
        const numDocs = alumnos.map((a) => a.numDoc).filter((n) => n != null);
        const liqs = await Liquidacion.find({ descripcion: re }).select('_id').limit(300).lean();
        const liqIds = liqs.map((l) => l._id);
        const or = [
          { numRecibo: re },
          { concepto: re },
          { recibiDe: re },
          { recibidoDe: re },
          { observaciones: re },
          { tipoIngreso: re },
          { documentoTercero: re },
          { numTransferencia: re },
          { numComprobante: re },
        ];
        if (numDocs.length) or.push({ numDoc: { $in: numDocs } });
        if (liqIds.length) or.push({ idLiquidacion: { $in: liqIds } });
        and.push({ $or: or });
      }
    }

    const filter = and.length ? { $and: and } : {};
    const [total, rows] = await Promise.all([
      Ingreso.countDocuments(filter),
      Ingreso.find(filter).sort({ fecha: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);
    const items = await listarIngresosEnriquecidos(rows);
    const totalValor = items.reduce((a, i) => a + num(i.valor), 0);
    res.json({ items, total, skip, limit, totalValor });
  } catch (e) {
    next(e);
  }
};

exports.listarPorSesion = async (req, res, next) => {
  try {
    const idSesion = Number(req.params.idSesion);
    if (!Number.isFinite(idSesion)) return res.status(400).json({ message: 'idSesion inválido' });
    const rows = await Ingreso.find({ idSesion }).sort({ fecha: -1, createdAt: -1 }).lean();
    res.json(await listarIngresosEnriquecidos(rows));
  } catch (e) {
    next(e);
  }
};

exports.listarPorLiquidacion = async (req, res, next) => {
  try {
    const idLiq = req.params.idLiquidacion;
    const rows = await Ingreso.find({ idLiquidacion: idLiq }).sort({ fecha: -1 }).lean();
    res.json(await listarIngresosEnriquecidos(rows));
  } catch (e) {
    next(e);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const ing = await Ingreso.findById(req.params.id);
    if (!ing) return res.status(404).json({ message: 'Ingreso no encontrado' });
    const antesIngreso = ing.toObject();

    let supervisor = null;
    if (!esAdmin(req.user?.rol)) {
      const sesOk = await verificarMovimientoSesionCajero(req, ing.idSesion);
      if (!sesOk.ok) return res.status(sesOk.status).json({ message: sesOk.message, code: sesOk.code });
      const auth = await exigirAdminOSupervisor(
        req,
        'Anular ingresos requiere autorización de un administrador.',
      );
      if (!auth.ok) return res.status(auth.status).json({ message: auth.message });
      supervisor = auth.supervisor;
    } else if (await requiereAutorizacionAnularMovimiento(req, ing.idSesion)) {
      const { autorizadoUsername, autorizadoPassword } = req.body || {};
      const ver = await verificarAdminCredenciales(autorizadoUsername, autorizadoPassword);
      if (!ver.ok) {
        return res.status(ver.status).json({
          message:
            ver.message ||
            'Anular movimientos de otra sesión o sin caja abierta requiere usuario y contraseña de administrador.',
          code: 'SUPERVISOR_AUTH_REQUIRED',
        });
      }
      supervisor = {
        autorizadoPor: ver.username,
        nombreAutoriza: ver.nombreAutoriza,
        autorizadoEn: new Date(),
      };
    }

    const v = num(ing.valor);
    if (ing.idLiquidacion) {
      const liq = await Liquidacion.findById(ing.idLiquidacion);
      if (liq) {
        const nuevoAbonado = Math.max(0, num(liq.abonado) - v);
        const nuevoSaldo = num(liq.valor) - nuevoAbonado;
        liq.abonado = toDec(nuevoAbonado);
        liq.saldo = toDec(nuevoSaldo);
        liq.estado = estadoLiq(num(liq.valor), nuevoAbonado);
        await liq.save();
        if (liq.idMat) await refrescarPagoMatricula(liq.idMat);
      }
    }
    if (ing.cuadreDescuadre && ing.idSesion) {
      const CajaSesion = require('../models/CajaSesion');
      const { toDec } = require('../utils/coerceTypes');
      const ses = await CajaSesion.findOne({ idSesion: Number(ing.idSesion) }).lean();
      if (ses?.efectivoContado != null) {
        const nuevoContado = Math.max(0, num(ses.efectivoContado) - v);
        await CajaSesion.updateOne(
          { idSesion: Number(ing.idSesion) },
          { $set: { efectivoContado: toDec(nuevoContado) } },
        );
      }
    }
    await ing.deleteOne();
    if (ing.idSesion) {
      const { sincronizarDescuadreSesion } = require('../services/descuadreCaja');
      await sincronizarDescuadreSesion(ing.idSesion).catch(() => null);
    }
    registrarEliminacion(req, 'ingreso', antesIngreso, {
      resumen: `Reversa ingreso ${antesIngreso.numRecibo || req.params.id}${
        supervisor?.autorizadoPor ? ` (autorizó ${supervisor.autorizadoPor})` : ''
      }`,
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
