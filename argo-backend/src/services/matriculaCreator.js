const mongoose = require('mongoose');
const Matricula = require('../models/Matricula');
const DatosAlumno = require('../models/DatosAlumno');
const Liquidacion = require('../models/Liquidacion');
const { parseNumDoc, numDocQuery } = require('../utils/numDoc');
const {
  buscarPrograma,
  listarServiciosMatricula,
  programaUsaSemestres,
  num,
  valorTarifaServicio,
} = require('./programaServicio');
const { estadoLiq } = require('./liquidacionMatricula');
const {
  esProgramaJornadasCap,
  TIPO_JORNADAS_CAPACITACION,
  resolverIdSedeMatriculaJornada,
} = require('./jornadaCapacitacion');
const { normalizarIdSede } = require('./sedeContext');
const { esTarifaVirtual } = require('../constants/tarifa');
const {
  resolverTarifaMatricula,
  descripcionConRevalidacion,
} = require('./revalidacionPrograma');

function toDec(n) {
  return mongoose.Types.Decimal128.fromString(String(Number(n) || 0));
}

async function crearMatriculaDesdeBody(body, idSedeCtx) {
  const {
    numDoc: numDocRaw,
    idPrograma,
    idProg,
    tarifa: tarifaBody = 1,
    observaciones,
    tarifaManual = false,
  } = body || {};
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

  const tarifaManualFlag =
    tarifaManual === true || tarifaManual === 'true' || body?.forzarTarifa === true;
  const resTarifa = await resolverTarifaMatricula({
    numDoc,
    prog,
    tarifa: tarifaBody,
    tarifaManual: tarifaManualFlag,
  });
  const t = resTarifa.tarifa;
  const esRevalidacion = resTarifa.revalidacion === true;

  if (esTarifaVirtual(t)) {
    const tieneVirtual = usaSem
      ? serviciosProg.some((s) => num(s.tarifaVirtual) > 0)
      : num(serviciosProg[0]?.tarifaVirtual) > 0;
    if (!tieneVirtual) {
      const err = new Error('Este programa no tiene tarifa virtual configurada en Programas');
      err.status = 400;
      throw err;
    }
  }

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
  const obsBase = String(observaciones || '').trim();
  const obsRevalidacion = esRevalidacion
    ? [obsBase, 'Refrendación / renovación de certificado'].filter(Boolean).join(' · ')
    : obsBase;

  const m = await Matricula.create({
    numDoc,
    idSede,
    idPrograma: idProgramaVal,
    idProg: idProgramaVal,
    valorMat: toDec(valorMat),
    tarifa: t,
    pagada: 'No Pago',
    estado: 'Activo',
    observaciones: obsRevalidacion,
    esRevalidacion,
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
        descripcion: descripcionConRevalidacion(
          serv.descrServicio || serv.descripcion || prog.nombreProg,
          esRevalidacion,
        ),
        valor: toDec(v),
        abonado: toDec(0),
        saldo: toDec(v),
        estado: v <= 0 ? 'pagado' : 'pendiente',
        esRevalidacion,
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
      descripcion: descripcionConRevalidacion(
        serv?.descrServicio || serv?.descripcion || prog.nombreProg || prog.descripcion || 'Matrícula programa',
        esRevalidacion,
      ),
      valor: toDec(valorMat),
      abonado: toDec(0),
      saldo: toDec(valorMat),
      estado: valorMat <= 0 ? 'pagado' : 'pendiente',
      esRevalidacion,
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

  const result = {
    matricula: { ...m.toObject(), valorMat: num(m.valorMat) },
    revalidacion: {
      aplica: esRevalidacion,
      aplicadaAuto: resTarifa.aplicadaAuto === true,
      mensaje: resTarifa.mensaje,
      tarifa: t,
    },
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
    usuarioPortal: null,
  };

  const crearPortal =
    esTarifaVirtual(t) &&
    (body.crearUsuarioPortal === true || body.crearUsuarioPortal === 'true');
  if (crearPortal) {
    const { crearUsuarioPortalAlumno } = require('./aulaVirtualMatricula');
    result.usuarioPortal = await crearUsuarioPortalAlumno({
      numDoc,
      email: body.email || alumno?.correo,
      password: body.password,
    });
  }

  return result;
}

module.exports = { crearMatriculaDesdeBody };
