const { models: cat } = require('../models/catalogos');
const {
  num,
  maxNumericId,
  insertarCatalogo,
  generarCodigoProg,
  buscarPrograma,
  buscarServicioDePrograma,
  listarServiciosDePrograma,
  listarServiciosMatricula,
  programaUsaSemestres,
  sincronizarServicioPrograma,
  serviciosTienenLiquidaciones,
} = require('../services/programaServicio');
const { normalizarTipoCertificado } = require('../services/clasificacionCertificado');
const { esProgramaJornadasCap } = require('../services/jornadaCapacitacion');
const { filtrarProgramas } = require('../services/sedeOferta');

function usuario(req) {
  return req.user || {};
}

function bodyServicio(body) {
  return {
    descrServicio: body.descrServicio,
    tipoServ: body.tipoServ,
    facturar: body.facturar,
    iva: body.iva,
    tarifa1: body.tarifa1,
    tarifa2: body.tarifa2,
    tarifa3: body.tarifa3,
    valorMatricula: body.valorMatricula,
    tarifaHoraPractica: body.tarifaHoraPractica,
  };
}

exports.listar = async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const soloActivos = req.query.activos !== 'false';
    const filter = {};
    if (soloActivos) filter.estado = { $in: [/^activo$/i, 'ACTIVO', 'Activo', null] };
    if (q.length >= 2) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ nombreProg: re }, { codigoProg: re }, { nomCert: re }, { descripcion: re }];
    }
    let rows = await cat.programas.find(filter).sort({ idPrograma: 1, nombreProg: 1 }).lean();
    if (req.idSede && req.query.catalogo !== '1') {
      rows = await filtrarProgramas(rows, req.idSede);
    }
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

exports.obtener = async (req, res, next) => {
  try {
    const prog = await buscarPrograma(req.params.id);
    if (!prog) return res.status(404).json({ message: 'Programa no encontrado' });
    const servicios = await listarServiciosDePrograma(prog);
    const matricula = await listarServiciosMatricula(prog);
    const servicio = matricula[0] || null;
    res.json({ programa: prog, servicio, servicios });
  } catch (e) {
    next(e);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const body = req.body || {};
    const nombreProg = (body.nombreProg || '').trim();
    if (!nombreProg) return res.status(400).json({ message: 'nombreProg es obligatorio' });
    if (body.idTipCap === '' || body.idTipCap == null) {
      return res.status(400).json({ message: 'idTipCap (tipo de capacitación) es obligatorio' });
    }

    let codigoProg = (body.codigoProg || '').trim();
    if (!codigoProg) codigoProg = await generarCodigoProg(body.idTipCap);
    const dup = await cat.programas.findOne({ codigoProg }).lean();
    if (dup) return res.status(409).json({ message: `Ya existe el código ${codigoProg}` });

    const idPrograma = await maxNumericId(cat.programas, 'idPrograma');
    const borradorTip = {
      idTipCap: body.idTipCap,
      tipoCertificado: normalizarTipoCertificado(body.tipoCertificado),
      nombreProg,
    };
    const esJornada = await esProgramaJornadasCap(borradorTip);
    const valorMatricula = esJornada ? 0 : num(body.tarifa1 ?? body.valorMatricula);
    if (!esJornada && valorMatricula <= 0) {
      return res.status(400).json({ message: 'La tarifa 1 / valor de matrícula debe ser mayor a 0' });
    }

    const now = new Date();
    const user = usuario(req).username || 'sistema';

    const progDoc = {
      idPrograma,
      codigoProg,
      nombreProg,
      nomCert: (body.nomCert || nombreProg).trim(),
      idTipCap: body.idTipCap,
      semestres: body.semestres != null && body.semestres !== '' ? Number(body.semestres) : null,
      horas: body.horas != null && body.horas !== '' ? Number(body.horas) : null,
      horasTeoria:
        body.horasTeoria != null && body.horasTeoria !== '' ? Number(body.horasTeoria) : null,
      horasPractica:
        body.horasPractica != null && body.horasPractica !== '' ? Number(body.horasPractica) : null,
      horasTaller:
        body.horasTaller != null && body.horasTaller !== '' ? Number(body.horasTaller) : null,
      valorMatricula,
      descripcion: (body.descripcion || '').trim() || null,
      estado: (body.estado || 'ACTIVO').trim(),
      requistos: (body.requistos || '').trim() || null,
      diasVencimiento: body.diasVencimiento != null ? Number(body.diasVencimiento) : 365,
      tipoCertificado: normalizarTipoCertificado(body.tipoCertificado),
      fechaAudi: now,
      userAddReg: user,
      fechaMod: now,
      userChangeRecord: user,
    };

    const prog = await insertarCatalogo(cat.programas, progDoc);

    if (esJornada) {
      return res.status(201).json({
        programa: prog,
        servicio: null,
        servicios: [],
        message:
          'Programa de jornadas de capacitación creado. No genera servicio de matrícula (capacitación sin cobro al alumno).',
      });
    }

    let servicios;
    try {
      servicios = await sincronizarServicioPrograma(prog, bodyServicio(body), usuario(req));
    } catch (errServ) {
      await cat.programas.deleteOne({ idPrograma: prog.idPrograma });
      throw errServ;
    }

    const lista = Array.isArray(servicios) ? servicios : servicios ? [servicios] : [];
    if (!lista.length || !lista[0]?.idServ) {
      await cat.programas.deleteOne({ idPrograma: prog.idPrograma });
      return res.status(500).json({ message: 'No se pudo crear el servicio de matrícula' });
    }

    const matricula = lista.filter((s) => s.rolServicio !== 'hora_practica');
    const servicio = matricula[0] || lista[0];
    const msgSem = programaUsaSemestres(prog)
      ? `Programa y ${matricula.length} servicio(s) por semestre creados (#${matricula.map((s) => s.idServ).join(', ')})`
      : `Programa y servicio #${servicio?.idServ} creados correctamente`;

    res.status(201).json({
      programa: prog,
      servicio,
      servicios: lista,
      message: msgSem,
    });
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const prog = await buscarPrograma(req.params.id);
    if (!prog) return res.status(404).json({ message: 'Programa no encontrado' });

    const body = req.body || {};
    const nombreProg = String(body.nombreProg ?? prog.nombreProg ?? '').trim();
    if (!nombreProg) return res.status(400).json({ message: 'nombreProg es obligatorio' });

    if (body.codigoProg && body.codigoProg !== prog.codigoProg) {
      const dup = await cat.programas
        .findOne({ codigoProg: body.codigoProg, idPrograma: { $ne: prog.idPrograma } })
        .lean();
      if (dup) return res.status(409).json({ message: 'Código de programa ya en uso' });
    }

    const valorMatriculaRaw =
      body.tarifa1 != null || body.valorMatricula != null
        ? num(body.tarifa1 ?? body.valorMatricula)
        : num(prog.valorMatricula);

    const mergedTip = {
      idTipCap: body.idTipCap ?? prog.idTipCap,
      tipoCertificado:
        body.tipoCertificado !== undefined
          ? normalizarTipoCertificado(body.tipoCertificado)
          : prog.tipoCertificado,
      nombreProg,
    };
    const esJornada = await esProgramaJornadasCap(mergedTip);
    const valorMatricula = esJornada ? 0 : valorMatriculaRaw;
    if (!esJornada && valorMatricula <= 0) {
      return res.status(400).json({ message: 'La tarifa 1 / valor de matrícula debe ser mayor a 0' });
    }

    const user = usuario(req).username || 'sistema';
    const patch = {
      codigoProg: body.codigoProg ?? prog.codigoProg,
      nombreProg,
      nomCert: (body.nomCert ?? prog.nomCert ?? nombreProg).trim(),
      idTipCap: body.idTipCap ?? prog.idTipCap,
      semestres:
        body.semestres !== undefined && body.semestres !== ''
          ? Number(body.semestres)
          : prog.semestres,
      horas:
        body.horas !== undefined && body.horas !== '' ? Number(body.horas) : prog.horas,
      horasTeoria:
        body.horasTeoria !== undefined && body.horasTeoria !== ''
          ? Number(body.horasTeoria)
          : prog.horasTeoria,
      horasPractica:
        body.horasPractica !== undefined && body.horasPractica !== ''
          ? Number(body.horasPractica)
          : prog.horasPractica,
      horasTaller:
        body.horasTaller !== undefined && body.horasTaller !== ''
          ? Number(body.horasTaller)
          : prog.horasTaller,
      valorMatricula,
      descripcion: body.descripcion !== undefined ? body.descripcion : prog.descripcion,
      estado: body.estado !== undefined ? body.estado : prog.estado,
      requistos: body.requistos !== undefined ? body.requistos : prog.requistos,
      diasVencimiento:
        body.diasVencimiento !== undefined ? Number(body.diasVencimiento) : prog.diasVencimiento,
      tipoCertificado:
        body.tipoCertificado !== undefined
          ? normalizarTipoCertificado(body.tipoCertificado)
          : prog.tipoCertificado ?? null,
      fechaMod: new Date(),
      userChangeRecord: user,
    };

    await cat.programas.updateOne({ idPrograma: prog.idPrograma }, { $set: patch });
    const actualizado = await cat.programas.findOne({ idPrograma: prog.idPrograma }).lean();

    if (esJornada) {
      return res.json({
        programa: actualizado,
        servicio: null,
        servicios: [],
        message: 'Programa de jornadas guardado (sin servicio de matrícula).',
      });
    }

    const sync = await sincronizarServicioPrograma(actualizado, bodyServicio(body), usuario(req));
    const servicios = Array.isArray(sync) ? sync : sync ? [sync] : [];
    const matricula = servicios.filter((s) => s?.rolServicio !== 'hora_practica');
    const servicio = matricula[0] || servicios[0] || null;

    const message = programaUsaSemestres(actualizado)
      ? servicios.length
        ? `Guardado. ${servicios.length} servicio(s) por semestre sincronizados.`
        : 'Programa guardado; no hay servicios vinculados.'
      : servicio
        ? `Guardado. Servicio #${servicio.idServ} actualizado.`
        : 'Programa guardado; no hay servicio vinculado (se creó uno nuevo si faltaba).';

    res.json({
      programa: actualizado,
      servicio,
      servicios,
      message,
    });
  } catch (e) {
    next(e);
  }
};

/** Solo administrador: elimina programa y servicio vinculado si no tiene liquidaciones. */
exports.eliminar = async (req, res, next) => {
  try {
    const prog = await buscarPrograma(req.params.id);
    if (!prog) return res.status(404).json({ message: 'Programa no encontrado' });

    if (await serviciosTienenLiquidaciones(prog)) {
      return res.status(409).json({
        message:
          'No se puede eliminar: algún servicio del programa tiene liquidaciones o matrículas. Desactive el programa en su lugar.',
      });
    }

    const idProg = prog.idPrograma ?? prog.idProg;
    const n = Number(idProg);
    await cat.servicios.deleteMany({
      $or: [{ idProg }, { idProg: String(idProg) }, ...(Number.isFinite(n) ? [{ idProg: n }] : [])],
    });

    await cat.programas.deleteOne({ idPrograma: prog.idPrograma });

    res.json({
      ok: true,
      message: `Programa «${prog.nombreProg}» eliminado con sus servicios vinculados.`,
    });
  } catch (e) {
    next(e);
  }
};
