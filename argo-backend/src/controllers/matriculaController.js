const mongoose = require('mongoose');
const Matricula = require('../models/Matricula');
const DatosAlumno = require('../models/DatosAlumno');
const Liquidacion = require('../models/Liquidacion');
const { parseNumDoc, numDocFromParams, numDocQuery } = require('../utils/numDoc');
const {
  buscarPrograma,
  listarServiciosMatricula,
  programaUsaSemestres,
  num,
} = require('../services/programaServicio');
const { estadoLiq } = require('../services/liquidacionMatricula');
const { esProgramaJornadasCap, TIPO_JORNADAS_CAPACITACION, resolverIdSedeMatriculaJornada } = require('../services/jornadaCapacitacion');
const { normalizarTipoRegularJornada, TIPO_REGULAR_JORNADA_DEFAULT } = require('../constants/tipoRegularJornada');
const { normalizarIdSede } = require('../services/sedeContext');

function toDec(n) {
  return mongoose.Types.Decimal128.fromString(String(Number(n) || 0));
}

function valorTarifaServicio(serv, tarifa, prog) {
  const t = Number(tarifa);
  if (serv && serv[`tarifa${t}`] != null && serv[`tarifa${t}`] !== '') {
    return num(serv[`tarifa${t}`]);
  }
  return num(prog.valorMatricula);
}

async function crearMatriculaDesdeBody(body, idSedeCtx) {
  const { numDoc: numDocRaw, idPrograma, idProg, tarifa = 1, observaciones } = body || {};
  const numDoc = parseNumDoc(numDocRaw);
  const progId = idPrograma || idProg;
  if (numDoc == null || !progId) {
    const err = new Error('numDoc e idPrograma son obligatorios');
    err.status = 400;
    throw err;
  }
  const prog = await buscarPrograma(progId);
  if (!prog) {
    const err = new Error('Programa no encontrado');
    err.status = 404;
    throw err;
  }

  const esJornada = await esProgramaJornadasCap(prog);
  let idSede = normalizarIdSede(idSedeCtx || body?.idSede);
  if (!idSede && !esJornada) {
    const err = new Error('Debe seleccionar la sede para matricular');
    err.status = 428;
    err.code = 'SEDE_REQUERIDA';
    throw err;
  }
  if (esJornada) {
    idSede = await resolverIdSedeMatriculaJornada();
  }

  const alumno = await DatosAlumno.findOne(numDocQuery(numDoc)).lean();

  const serviciosProg = await listarServiciosMatricula(prog);
  const usaSem = programaUsaSemestres(prog) && serviciosProg.length > 0;
  const t = Number(tarifa);

  let valorMat = 0;
  if (esJornada) {
    valorMat = 0;
  } else if (usaSem) {
    valorMat = serviciosProg.reduce((acc, s) => acc + valorTarifaServicio(s, t, prog), 0);
  } else {
    const serv = serviciosProg[0] || null;
    valorMat = valorTarifaServicio(serv, t, prog);
  }

  if (esJornada && alumno?._id) {
    await DatosAlumno.updateOne(
      { _id: alumno._id },
      { $set: { tipoAlumno: TIPO_JORNADAS_CAPACITACION } },
    );
  }

  const idProgramaVal = String(prog.idPrograma ?? prog._id);
  const m = await Matricula.create({
    numDoc,
    idSede,
    idPrograma: idProgramaVal,
    idProg: idProgramaVal,
    valorMat: toDec(valorMat),
    tarifa: t,
    pagada: 'No Pago',
    estado: 'Activo',
    observaciones,
  });

  const liquidaciones = [];

  if (usaSem) {
    for (const serv of serviciosProg) {
      const v = valorTarifaServicio(serv, t, prog);
      const liq = await Liquidacion.create({
        numDoc,
        idSede,
        idAlumno: alumno?._id ? String(alumno._id) : null,
        idMatricula: m._id,
        idMat: m._id,
        idProg: idProgramaVal,
        idServ: String(serv.idServ),
        descripcion: serv.descrServicio || serv.descripcion || prog.nombreProg,
        valor: toDec(v),
        abonado: toDec(0),
        saldo: toDec(v),
        estado: v <= 0 ? 'pagado' : 'pendiente',
      });
      liquidaciones.push(liq);
    }
  } else {
    const serv = serviciosProg[0] || null;
    const liq = await Liquidacion.create({
      numDoc,
      idSede,
      idAlumno: alumno?._id ? String(alumno._id) : null,
      idMatricula: m._id,
      idMat: m._id,
      idProg: idProgramaVal,
      idServ: serv ? String(serv.idServ) : null,
      descripcion:
        serv?.descrServicio || serv?.descripcion || prog.nombreProg || prog.descripcion || 'Matrícula programa',
      valor: toDec(valorMat),
      abonado: toDec(0),
      saldo: toDec(valorMat),
      estado: valorMat <= 0 ? 'pagado' : 'pendiente',
    });
    liquidaciones.push(liq);
  }

  const estadoAgregado = liquidaciones.length
    ? estadoLiq(
        liquidaciones.reduce((a, l) => a + num(l.valor), 0),
        liquidaciones.reduce((a, l) => a + num(l.abonado), 0),
      )
    : 'pendiente';
  if (estadoAgregado === 'pagado') {
    await Matricula.findByIdAndUpdate(m._id, { pagada: 'Pagado' });
  }

  return {
    matricula: { ...m.toObject(), valorMat: num(m.valorMat) },
    liquidacion: liquidaciones[0]
      ? {
          ...liquidaciones[0].toObject(),
          valor: num(liquidaciones[0].valor),
          abonado: num(liquidaciones[0].abonado),
          saldo: num(liquidaciones[0].saldo),
        }
      : null,
    liquidaciones: liquidaciones.map((l) => ({
      ...l.toObject(),
      valor: num(l.valor),
      abonado: num(l.abonado),
      saldo: num(l.saldo),
    })),
  };
}

exports.crearMatriculaDesdeBody = crearMatriculaDesdeBody;

exports.crear = async (req, res, next) => {
  try {
    const result = await crearMatriculaDesdeBody(req.body, req.idSede);
    res.status(201).json(result);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
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
    const numDoc = numDocFromParams(req.params.numDoc);
    if (numDoc == null) return res.status(400).json({ message: 'numDoc inválido' });
    const filter = numDocQuery(numDoc);
    const rows = await Matricula.find(filter).sort({ createdAt: -1 }).lean();
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
