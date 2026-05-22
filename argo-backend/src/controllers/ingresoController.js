const mongoose = require('mongoose');
const Ingreso = require('../models/Ingreso');
const Liquidacion = require('../models/Liquidacion');
const Matricula = require('../models/Matricula');
const { models: cat } = require('../models/catalogos');
const { siguienteNumComprobanteIngreso } = require('../services/configRecibo');

function num(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v.$numberDecimal != null) return Number(v.$numberDecimal) || 0;
  return Number(v) || 0;
}
function toDec(n) { return mongoose.Types.Decimal128.fromString(String(Number(n) || 0)); }

function estadoLiq(valor, abonado) {
  const s = valor - abonado;
  if (s <= 0.0001) return 'pagado';
  if (abonado > 0) return 'parcial';
  return 'pendiente';
}

function estadoPagadaMatricula(estadoLiq) {
  if (estadoLiq === 'pagado') return 'Pagado';
  if (estadoLiq === 'parcial') return 'Pago Parcial';
  return 'No Pago';
}

async function refrescarPagoMatricula(idMat, estadoLiq) {
  if (!idMat) return;
  await Matricula.findByIdAndUpdate(idMat, { pagada: estadoPagadaMatricula(estadoLiq) });
}

function calcularTipoAbono(valorPago, saldoAntes) {
  return valorPago >= saldoAntes - 0.0001 ? 'total' : 'abono';
}

function tipoAbonoDescr(tipo) {
  if (tipo === 'total') return 'Total';
  if (tipo === 'abono') return 'Abono';
  return null;
}

async function enriquecer(p) {
  const tipo = await cat.catTipoPago.findOne({ $or: [{ idTipoPago: p.idTipoPago }, { codigo: p.idTipoPago }] }).lean();
  const banco = p.idBanco
    ? await cat.bancos.findOne({
        $or: [
          { idBanco: p.idBanco },
          { idbanco: p.idBanco },
          { idbanco: Number(p.idBanco) },
          { codigo: p.idBanco },
        ],
      }).lean()
    : null;
  return {
    ...p,
    valor: num(p.valor),
    tipoPagoDescr: tipo?.descripcion || tipo?.nombre || p.idTipoPago,
    bancoDescr:    banco?.descripcion || banco?.nombre || banco?.banco || null,
    tipoAbonoDescr: tipoAbonoDescr(p.tipoAbono),
  };
}

exports.crear = async (req, res, next) => {
  try {
    const { numDoc, idLiquidacion, valor, idTipoPago, idBanco, numComprobante, observaciones, fecha } = req.body || {};
    if (!numDoc || !idLiquidacion || valor == null || !idTipoPago) {
      return res.status(400).json({ message: 'numDoc, idLiquidacion, valor e idTipoPago son obligatorios' });
    }
    const v = Number(valor);
    if (!(v > 0)) return res.status(400).json({ message: 'Valor inválido' });

    const liq = await Liquidacion.findById(idLiquidacion);
    if (!liq) return res.status(404).json({ message: 'Item de liquidación no encontrado' });
    if (liq.numDoc !== numDoc) return res.status(400).json({ message: 'Liquidación no corresponde al alumno' });

    const saldoActual = num(liq.saldo);
    if (v > saldoActual + 0.0001) {
      return res.status(400).json({ message: `El pago excede el saldo (${saldoActual})` });
    }

    const nuevoAbonado = num(liq.abonado) + v;
    const nuevoSaldo = num(liq.valor) - nuevoAbonado;
    const estado = estadoLiq(num(liq.valor), nuevoAbonado);

    liq.abonado = toDec(nuevoAbonado);
    liq.saldo = toDec(nuevoSaldo);
    liq.estado = estado;
    await liq.save();

    const numRecibo = await siguienteNumComprobanteIngreso();
    const tipoAbono = calcularTipoAbono(v, saldoActual);

    let ing;
    try {
      ing = await Ingreso.create({
        numDoc,
        idLiquidacion,
        numRecibo,
        valor: toDec(v),
        tipoAbono,
        idTipoPago,
        idBanco: idBanco || null,
        numComprobante,
        observaciones,
        fecha: fecha ? new Date(fecha) : new Date(),
      });
    } catch (errIngreso) {
      // Compensación: revertir cambios en la liquidación
      liq.abonado = toDec(num(liq.abonado) - v);
      liq.saldo = toDec(num(liq.valor) - num(liq.abonado));
      liq.estado = estadoLiq(num(liq.valor), num(liq.abonado));
      await liq.save();
      throw errIngreso;
    }

    if (liq.idMat) {
      await refrescarPagoMatricula(liq.idMat, estado);
    }

    const enriquecido = await enriquecer(ing.toObject());
    res.status(201).json({ ...enriquecido, numRecibo });
  } catch (e) {
    next(e);
  }
};

exports.listarPorAlumno = async (req, res, next) => {
  try {
    const rows = await Ingreso.find({ numDoc: req.params.numDoc }).sort({ fecha: -1, createdAt: -1 }).lean();
    const liqIds = [...new Set(rows.map((r) => String(r.idLiquidacion)).filter(Boolean))];
    const liqs = liqIds.length
      ? await Liquidacion.find({ _id: { $in: liqIds } }).select('descripcion').lean()
      : [];
    const descrMap = Object.fromEntries(liqs.map((l) => [String(l._id), l.descripcion || '']));
    const out = [];
    for (const r of rows) {
      const e = await enriquecer(r);
      out.push({
        ...e,
        liquidacionDescr: descrMap[String(r.idLiquidacion)] || null,
      });
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
};

exports.listarPorLiquidacion = async (req, res, next) => {
  try {
    const idLiq = req.params.idLiquidacion;
    const rows = await Ingreso.find({ idLiquidacion: idLiq }).sort({ fecha: -1 }).lean();
    const liq = await Liquidacion.findById(idLiq).select('descripcion').lean();
    const descr = liq?.descripcion || null;
    const out = [];
    for (const r of rows) {
      const e = await enriquecer(r);
      out.push({ ...e, liquidacionDescr: descr });
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const ing = await Ingreso.findById(req.params.id);
    if (!ing) return res.status(404).json({ message: 'Ingreso no encontrado' });
    const v = num(ing.valor);
    const liq = await Liquidacion.findById(ing.idLiquidacion);
    if (liq) {
      const nuevoAbonado = Math.max(0, num(liq.abonado) - v);
      const nuevoSaldo = num(liq.valor) - nuevoAbonado;
      liq.abonado = toDec(nuevoAbonado);
      liq.saldo = toDec(nuevoSaldo);
      liq.estado = estadoLiq(num(liq.valor), nuevoAbonado);
      await liq.save();
      if (liq.idMat) {
        await refrescarPagoMatricula(liq.idMat, liq.estado);
      }
    }
    await ing.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
