const AsisClasJorCap = require('../models/AsisClasJorCap');
const InscripcionClase = require('../models/InscripcionClase');
const DatosAlumno = require('../models/DatosAlumno');
const Matricula = require('../models/Matricula');
const Certificado = require('../models/Certificado');
const { parseNumDoc, numDocQuery } = require('../utils/numDoc');
const { asegurarTipoAlumnoJornada, auditoriaUsuario, asignarEmpresaContratoAlumno } = require('./jornadaCapacitacion');
const { sincronizarEstadoJornada } = require('./estadoJornadaCap');
const { bloqueoOperacionJornada } = require('./jornadasOperacionEspecial');
const {
  intentarCertificadoJornadaAuto,
  progresoCertificacion,
  validarAlumnoSinCertificadoContrato,
  crearContextoCertificadoContrato,
} = require('./certificadoJornadaAuto');
const { TIPO_CERTIFICADO_POR_CLASE } = require('../constants/jornadaCapacitacion');

const QUERY_MATRICULA_ACTIVA = { estado: { $regex: /^activo?a?$/i } };

function progresoDesdeResultadoCert(resultadoCert, idContrato, numDoc, ctxCert) {
  if (resultadoCert?.sesiones != null) {
    return {
      sesiones: resultadoCert.sesiones,
      numSesCert: resultadoCert.numSesCert,
      cumplio: resultadoCert.cumplio,
      faltan: resultadoCert.faltan,
      certificado: resultadoCert.certificado || null,
    };
  }
  return progresoCertificacion(numDoc, idContrato, ctxCert);
}

/**
 * Registra asistencia de un alumno en una clase y evalúa certificado automático.
 * @returns {Promise<object>} payload con sesiones, certificadoGenerado, motivoCertificado, etc.
 */
async function registrarAsistenciaAlumnoEnClase(req, clase, numDocRaw, opts = {}) {
  const {
    omitirValidacionJornada = false,
    jornada: jornadaPrecargada = null,
    ctxCert = null,
    skipAsistenciaExistente = false,
  } = opts;
  const numDoc = parseNumDoc(numDocRaw);
  if (numDoc == null) {
    const err = new Error('numDoc inválido');
    err.status = 400;
    throw err;
  }

  let alumno = await DatosAlumno.findOne(numDocQuery(numDoc)).lean();
  if (!alumno) {
    const err = new Error('Alumno no encontrado');
    err.status = 404;
    throw err;
  }
  alumno = (await asegurarTipoAlumnoJornada(numDoc)) || alumno;

  const jornada = jornadaPrecargada || (await sincronizarEstadoJornada(clase.idJornada));
  if (jornada?.idContrato) {
    await asignarEmpresaContratoAlumno(numDoc, jornada.idContrato, auditoriaUsuario(req));
  }

  const progId = String(clase.idPrograma || '').trim();
  if (!progId) {
    const err = new Error('Asigne el programa a la clase antes de registrar asistencia.');
    err.status = 400;
    throw err;
  }
  const mat = await Matricula.findOne({ numDoc, idProg: progId, ...QUERY_MATRICULA_ACTIVA }).lean();
  if (!mat) {
    const err = new Error('El alumno no está matriculado en el programa de esta clase');
    err.status = 400;
    throw err;
  }

  if (!omitirValidacionJornada) {
    const bloqueoAsis = await bloqueoOperacionJornada(req, jornada);
    if (bloqueoAsis) {
      const err = new Error(bloqueoAsis);
      err.status = 400;
      throw err;
    }
  }

  const idContrato = jornada?.idContrato;
  const auditor = req?.user ? auditoriaUsuario(req) : 'sistema';

  if (idContrato) {
    const bloqueo = await validarAlumnoSinCertificadoContrato(numDoc, idContrato);
    if (bloqueo) {
      const yaAsis = skipAsistenciaExistente
        ? null
        : await AsisClasJorCap.findOne({
            idclaseJornada: clase._id,
            numDocAlumno: numDoc,
          }).lean();
      if (!yaAsis) {
        const err = new Error(bloqueo.message);
        err.status = 409;
        err.codigo = 'ya_certificado_contrato';
        err.certificado = bloqueo.certificado;
        throw err;
      }
    }
  }

  let asis = null;
  let duplicada = false;
  if (skipAsistenciaExistente) {
    try {
      asis = await AsisClasJorCap.create({
        idclaseJornada: clase._id,
        numDocAlumno: numDoc,
        userAddReg: auditor,
      });
    } catch (e) {
      if (e.code === 11000) {
        duplicada = true;
        asis = await AsisClasJorCap.findOne({
          idclaseJornada: clase._id,
          numDocAlumno: numDoc,
        }).lean();
      } else {
        throw e;
      }
    }
  } else {
    try {
      asis = await AsisClasJorCap.create({
        idclaseJornada: clase._id,
        numDocAlumno: numDoc,
        userAddReg: auditor,
      });
    } catch (e) {
      if (e.code === 11000) {
        duplicada = true;
        asis = await AsisClasJorCap.findOne({
          idclaseJornada: clase._id,
          numDocAlumno: numDoc,
        }).lean();
      } else {
        throw e;
      }
    }
  }

  try {
    await InscripcionClase.updateOne(
      { idClase: clase._id, numDoc },
      { $setOnInsert: { userAddReg: auditor } },
      { upsert: true },
    );
  } catch (_) {
    /* ignore */
  }

  // Certificados se emiten al finalizar la clase (no al marcar asistencia).
  let resultadoCert = { creado: false, motivo: null };
  if (opts.omitirCertificado !== false) {
    resultadoCert = {
      creado: false,
      motivo: idContrato ? 'diferido_al_finalizar' : 'sin_contrato_jornada',
    };
  } else if (idContrato) {
    resultadoCert = await intentarCertificadoJornadaAuto(
      numDoc,
      progId,
      idContrato,
      clase.idJornada,
      ctxCert,
      clase,
    );
  } else {
    resultadoCert = { creado: false, motivo: 'sin_contrato_jornada' };
  }

  const progreso = idContrato
    ? await progresoDesdeResultadoCert(resultadoCert, idContrato, numDoc, ctxCert)
    : { sesiones: 0, numSesCert: 1, cumplio: false };

  return {
    asistencia: asis,
    duplicada,
    sesiones: progreso.sesiones,
    numSesCert: progreso.numSesCert,
    faltan: progreso.faltan,
    cumplioSesiones: progreso.cumplio,
    certificadoGenerado: !!resultadoCert.creado,
    certificado: resultadoCert.certificado || progreso.certificado || null,
    motivoCertificado: resultadoCert.motivo || null,
    mensajeCertificado: resultadoCert.mensaje || null,
    nombreAlumno: [alumno.nombre1, alumno.nombre2, alumno.apellido1, alumno.apellido2]
      .filter(Boolean)
      .join(' '),
    numDoc,
  };
}

/** Registra asistencia de todos los inscritos que aún no tienen asistencia en la clase. */
async function registrarAsistenciasInscritosPendientes(req, claseDoc, opts = {}) {
  const clase = claseDoc?.toObject ? claseDoc.toObject() : { ...claseDoc };
  const inscripciones = await InscripcionClase.find({ idClase: clase._id }).lean();
  const asistenciasExistentes = await AsisClasJorCap.find({ idclaseJornada: clase._id })
    .select('numDocAlumno')
    .lean();
  const yaAsistio = new Set(asistenciasExistentes.map((a) => Number(a.numDocAlumno)));

  const pendientes = inscripciones.filter((ins) => !yaAsistio.has(Number(ins.numDoc)));
  const resultados = [];
  let certificadosNuevos = 0;
  const certificadosEmitidos = [];

  if (!pendientes.length) {
    return {
      ok: true,
      registradas: 0,
      omitidas: inscripciones.length,
      omitidosCertificados: 0,
      certificadosNuevos: 0,
      certificadosEmitidos: [],
      resultados: [],
    };
  }

  const jornada = await sincronizarEstadoJornada(clase.idJornada);
  const ctxCert = jornada?.idContrato
    ? await crearContextoCertificadoContrato(jornada.idContrato)
    : null;

  let aProcesar = pendientes;
  let omitidosCertificados = 0;
  if (jornada?.idContrato) {
    const docsPend = pendientes.map((i) => Number(i.numDoc)).filter((n) => Number.isFinite(n));
    const esPorClase = ctxCert?.contrato?.tipoCertificado === TIPO_CERTIFICADO_POR_CLASE;
    const certs = docsPend.length
      ? await Certificado.find(
          esPorClase
            ? {
                numDoc: { $in: docsPend },
                idClaseJornada: clase._id,
                estado: { $ne: 'anulado' },
              }
            : {
                numDoc: { $in: docsPend },
                idContrato: jornada.idContrato,
                estado: { $ne: 'anulado' },
                $or: [{ idClaseJornada: null }, { idClaseJornada: { $exists: false } }],
              },
        )
          .select('numDoc')
          .lean()
      : [];
    const certificados = new Set(certs.map((c) => Number(c.numDoc)));
    aProcesar = pendientes.filter((ins) => !certificados.has(Number(ins.numDoc)));
    omitidosCertificados = pendientes.length - aProcesar.length;
  }

  if (!aProcesar.length) {
    return {
      ok: true,
      registradas: 0,
      omitidas: inscripciones.length - pendientes.length + omitidosCertificados,
      omitidosCertificados,
      certificadosNuevos: 0,
      certificadosEmitidos: [],
      resultados: [],
    };
  }

  for (const ins of aProcesar) {
    try {
      const r = await registrarAsistenciaAlumnoEnClase(req, clase, ins.numDoc, {
        ...opts,
        jornada,
        ctxCert,
        skipAsistenciaExistente: true,
      });
      if (r.certificadoGenerado) {
        certificadosNuevos += 1;
        if (r.certificado) {
          certificadosEmitidos.push({
            certificado: r.certificado,
            nombreAlumno: r.nombreAlumno,
            numDoc: r.numDoc,
          });
        }
      }
      resultados.push(r);
    } catch (e) {
      resultados.push({
        numDoc: ins.numDoc,
        error: e.message || 'Error registrando asistencia',
      });
    }
  }

  return {
    ok: true,
    registradas: resultados.filter((r) => !r.error && !r.duplicada).length,
    omitidas: inscripciones.length - pendientes.length + omitidosCertificados,
    omitidosCertificados,
    certificadosNuevos,
    certificadosEmitidos,
    resultados,
  };
}

/**
 * Emite certificados de todos los alumnos con asistencia en la clase
 * (se llama al finalizar, no al registrar cada alumno).
 */
async function emitirCertificadosAsistentesClase(req, claseDoc, opts = {}) {
  const clase = claseDoc?.toObject ? claseDoc.toObject() : { ...claseDoc };
  const asistencias = await AsisClasJorCap.find({ idclaseJornada: clase._id }).lean();
  if (!asistencias.length) {
    return { certificadosNuevos: 0, certificadosEmitidos: [], evaluados: 0 };
  }

  const jornada = opts.jornada || (await sincronizarEstadoJornada(clase.idJornada));
  const idContrato = jornada?.idContrato;
  if (!idContrato) {
    return { certificadosNuevos: 0, certificadosEmitidos: [], evaluados: asistencias.length };
  }

  const ctxCert = opts.ctxCert || (await crearContextoCertificadoContrato(idContrato));
  const progId = String(clase.idPrograma || '').trim();
  let certificadosNuevos = 0;
  const certificadosEmitidos = [];

  for (const a of asistencias) {
    const numDoc = Number(a.numDocAlumno);
    if (!Number.isFinite(numDoc)) continue;
    try {
      const resultadoCert = await intentarCertificadoJornadaAuto(
        numDoc,
        progId,
        idContrato,
        clase.idJornada,
        ctxCert,
        clase,
      );
      if (resultadoCert?.creado && resultadoCert.certificado) {
        certificadosNuevos += 1;
        const alumno = await DatosAlumno.findOne(numDocQuery(numDoc)).lean();
        const nombreAlumno = alumno
          ? [alumno.nombre1, alumno.nombre2, alumno.apellido1, alumno.apellido2]
              .filter(Boolean)
              .join(' ')
          : String(numDoc);
        certificadosEmitidos.push({
          certificado: resultadoCert.certificado,
          nombreAlumno,
          numDoc,
        });
      }
    } catch (_) {
      /* sigue con el siguiente alumno */
    }
  }

  return {
    certificadosNuevos,
    certificadosEmitidos,
    evaluados: asistencias.length,
  };
}

/**
 * Tras cerrar una clase: asistencias pendientes de inscritos + certificados automáticos.
 * Usado al finalizar explícitamente y cuando actualizarClase pasa a FINALIZADO (p. ej. modo especial).
 */
async function postCierreClaseJornada(req, claseDoc, opts = {}) {
  const clase = claseDoc?.toObject ? claseDoc.toObject() : { ...claseDoc };
  let syncAsis = {
    registradas: 0,
    certificadosNuevos: 0,
    certificadosEmitidos: [],
  };
  let certs = { certificadosNuevos: 0, certificadosEmitidos: [], evaluados: 0 };
  let jornada = opts.jornada || null;

  try {
    syncAsis = await registrarAsistenciasInscritosPendientes(req, clase, {
      omitirValidacionJornada: true,
      ...opts,
    });
    jornada = opts.jornada || (await sincronizarEstadoJornada(clase.idJornada));
    const ctxCert =
      opts.ctxCert ||
      (jornada?.idContrato ? await crearContextoCertificadoContrato(jornada.idContrato) : null);
    certs = await emitirCertificadosAsistentesClase(req, clase, { jornada, ctxCert });
  } catch (e) {
    return {
      ok: false,
      error: e?.message || String(e),
      syncAsis,
      certs,
      jornada,
      asistenciasRegistradas: syncAsis.registradas || 0,
      certificadosNuevos: certs.certificadosNuevos || 0,
      certificadosEmitidos: certs.certificadosEmitidos || [],
    };
  }

  return {
    ok: true,
    syncAsis,
    certs,
    jornada,
    asistenciasRegistradas: syncAsis.registradas || 0,
    certificadosNuevos: certs.certificadosNuevos || 0,
    certificadosEmitidos: certs.certificadosEmitidos || [],
  };
}

module.exports = {
  QUERY_MATRICULA_ACTIVA,
  registrarAsistenciaAlumnoEnClase,
  registrarAsistenciasInscritosPendientes,
  emitirCertificadosAsistentesClase,
  postCierreClaseJornada,
};
