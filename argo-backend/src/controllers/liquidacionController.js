const mongoose = require('mongoose');
const Liquidacion = require('../models/Liquidacion');
const { models: cat } = require('../models/catalogos');

function num(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v.$numberDecimal != null) return Number(v.$numberDecimal) || 0;
  return Number(v) || 0;
}
function toDec(n) { return mongoose.Types.Decimal128.fromString(String(Number(n) || 0)); }

function plano(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return { ...o, valor: num(o.valor), abonado: num(o.abonado), saldo: num(o.saldo) };
}

exports.listarPorAlumno = async (req, res, next) => {
  try {
    const docs = await Liquidacion.find({ numDoc: req.params.numDoc }).sort({ createdAt: -1 });
    const items = docs.map(plano);
    const totales = items.reduce(
      (acc, it) => {
        acc.valor += it.valor;
        acc.abonado += it.abonado;
        acc.saldo += it.saldo;
        return acc;
      },
      { valor: 0, abonado: 0, saldo: 0 },
    );
    res.json({ items, totales });
  } catch (e) {
    next(e);
  }
};

exports.obtener = async (req, res, next) => {
  try {
    const it = await Liquidacion.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Item no encontrado' });
    res.json(plano(it));
  } catch (e) {
    next(e);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const { numDoc, idServ, descripcion, valor } = req.body || {};
    if (!numDoc || !idServ || valor == null) {
      return res.status(400).json({ message: 'numDoc, idServ y valor son obligatorios' });
    }
    const v = Number(valor);
    if (!(v > 0)) return res.status(400).json({ message: 'Valor inválido' });

    const serv = await cat.servicios.findOne({ idServ }).lean();
    const descr = descripcion || (serv?.descripcion ?? serv?.nombre ?? 'Servicio adicional');

    const it = await Liquidacion.create({
      numDoc,
      idServ,
      idProg: serv?.idProg || null,
      descripcion: descr,
      valor: toDec(v),
      abonado: toDec(0),
      saldo: toDec(v),
      estado: 'pendiente',
    });
    res.status(201).json(plano(it));
  } catch (e) {
    next(e);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const it = await Liquidacion.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Item no encontrado' });
    if (num(it.abonado) > 0) {
      return res.status(400).json({ message: 'No se puede eliminar un ítem con pagos registrados' });
    }
    await it.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
