const mongoose = require('mongoose');
const Matricula = require('../models/Matricula');
const Liquidacion = require('../models/Liquidacion');
const { models: cat } = require('../models/catalogos');

function num(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v.$numberDecimal != null) return Number(v.$numberDecimal) || 0;
  return Number(v) || 0;
}

function toDec(n) {
  return mongoose.Types.Decimal128.fromString(String(Number(n) || 0));
}

async function buscarPrograma(idPrograma) {
  const q = String(idPrograma);
  return cat.programas.findOne({
    $or: [
      { idPrograma: q },
      { idPrograma: Number(q) },
      { codigoProg: q },
      mongoose.Types.ObjectId.isValid(q) ? { _id: new mongoose.Types.ObjectId(q) } : null,
    ].filter(Boolean),
  }).lean();
}

async function buscarServicioDePrograma(prog) {
  if (!prog) return null;
  const idProg = prog.idPrograma ?? prog.idProg;
  return cat.servicios.findOne({
    $or: [{ idProg }, { idProg: Number(idProg) }, { idProg: String(idProg) }],
  }).lean();
}

exports.crear = async (req, res, next) => {
  try {
    const { numDoc, idPrograma, idProg, tarifa = 1, observaciones } = req.body || {};
    const progId = idPrograma || idProg;
    if (!numDoc || !progId) {
      return res.status(400).json({ message: 'numDoc e idPrograma son obligatorios' });
    }
    const prog = await buscarPrograma(progId);
    if (!prog) return res.status(404).json({ message: 'Programa no encontrado' });

    const serv = await buscarServicioDePrograma(prog);
    let valorMat = 0;
    const t = Number(tarifa);
    if (serv && serv[`tarifa${t}`] != null && serv[`tarifa${t}`] !== '') {
      valorMat = num(serv[`tarifa${t}`]);
    } else {
      valorMat = num(prog.valorMatricula);
    }

    const idProgramaVal = String(prog.idPrograma ?? prog._id);
    const m = await Matricula.create({
      numDoc,
      idPrograma: idProgramaVal,
      idProg: idProgramaVal,
      valorMat: toDec(valorMat),
      tarifa: t,
      pagada: 'No Pago',
      estado: 'Activo',
      observaciones,
    });

    const alumno = await require('../models/DatosAlumno').findOne({ numDoc }).lean();
    const liq = await Liquidacion.create({
      numDoc,
      idAlumno: alumno?._id ? String(alumno._id) : null,
      idMatricula: m._id,
      idMat: m._id,
      idProg: idProgramaVal,
      idServ: serv ? String(serv.idServ) : null,
      descripcion: serv?.descrServicio || serv?.descripcion || prog.nombreProg || prog.descripcion || 'Matrícula programa',
      valor: toDec(valorMat),
      abonado: toDec(0),
      saldo: toDec(valorMat),
      estado: valorMat <= 0 ? 'pagado' : 'pendiente',
    });

    res.status(201).json({
      matricula: { ...m.toObject(), valorMat: num(m.valorMat) },
      liquidacion: { ...liq.toObject(), valor: num(liq.valor), abonado: num(liq.abonado), saldo: num(liq.saldo) },
    });
  } catch (e) {
    next(e);
  }
};

function normalizarPagada(v) {
  if (v === true || v === 'true') return 'Pagado';
  if (v === false || v === 'false') return 'No Pago';
  if (v == null || v === '') return 'No Pago';
  return String(v);
}

exports.listarPorAlumno = async (req, res, next) => {
  try {
    const rows = await Matricula.find({ numDoc: req.params.numDoc }).sort({ createdAt: -1 }).lean();
    res.json(
      rows.map((r) => ({
        ...r,
        valorMat: num(r.valorMat),
        pagada: normalizarPagada(r.pagada),
      })),
    );
  } catch (e) {
    next(e);
  }
};
