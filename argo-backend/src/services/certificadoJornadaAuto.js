const mongoose = require('mongoose');
const Certificado = require('../models/Certificado');
const DatosAlumno = require('../models/DatosAlumno');
const Cliente     = require('../models/Cliente');
const Contratacion = require('../models/Contratacion');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const JornadaCap = require('../models/JornadaCap');
const AsisClasJorCap = require('../models/AsisClasJorCap');
const Liquidacion = require('../models/Liquidacion');
const Matricula = require('../models/Matricula');
const { parseNumDoc, numDocQuery } = require('../utils/numDoc');
const { obtenerConfigCertificado, siguienteCodigoCertificado } = require('./configCertificado');
const { TIPOS, TIPOS_LABEL } = require('./clasificacionCertificado');
const { resolverPlantillaImpresion } = require('./plantillaCertificado');
const { TIPO_JORNADAS_CAPACITACION } = require('../constants/tipoRegularJornada');
const {
  TIPO_CERTIFICADO_GLOBAL,
  TIPO_CERTIFICADO_POR_CLASE,
} = require('../constants/jornadaCapacitacion');
const { resolverIdSedeMatriculaJornada } = require('./jornadaCapacitacion');
const { normalizarIdSede } = require('./sedeContext');
const { buscarPrograma } = require('./programaServicio');
const { parseFechaCalendario, fechaCalendarioParaGuardar } = require('../utils/fechaCalendario');

const tipoFormatoJornada = TIPOS.JORNADA_CAPACITACION;
const QUERY_MATRICULA_ACTIVA = { estado: { $regex: /^activo?a?$/i } };

const MOTIVOS_CERT = {
  sesiones_insuficientes: 'Aún no completa las sesiones requeridas del contrato.',
  sin_matricula: 'El alumno no tiene matrícula activa en el programa.',
  sin_liquidacion: 'Falta liquidación de matrícula (se intentó crear automáticamente).',
  sin_plantilla:
    'Configure la plantilla «Jornada Capacitación» en Config. Certificados (paso 2).',
  sin_contrato_jornada: 'La jornada no está vinculada a un contrato.',
  ya_certificado: 'El alumno ya tiene certificado vigente para este contrato.',
  ya_certificado_contrato:
    'El alumno ya tiene certificado vigente para este contrato (no se emite otro; puede seguir en otras clases).',
  ya_certificado_clase: 'El alumno ya tiene certificado vigente para esta clase.',
  sin_clase: 'Falta la clase para emitir certificado por asistencia.',
  contrato_no_encontrado: 'Contrato no encontrado.',
  numDoc_invalido: 'Documento del alumno inválido.',
};

function toDec(n) {
  return mongoose.Types.Decimal128.fromString(String(Number(n) || 0));
}

async function crearLiquidacionJornada(numDoc, idProg, mat) {
  const prog = await buscarPrograma(idProg);
  const desc =
    prog?.nombreProg || prog?.descripcion || prog?.nomCert || 'Jornadas de Capacitación';
  let idSede = normalizarIdSede(mat?.idSede);
  if (!idSede) idSede = await resolverIdSedeMatriculaJornada();
  const creada = await Liquidacion.create({
    numDoc,
    idSede,
    idMat: mat._id,
    idMatricula: mat._id,
    idProg: String(idProg),
    idServ: null,
    descripcion: `${desc} (cert. jornada)`,
    valor: toDec(0),
    abonado: toDec(0),
    saldo: toDec(0),
    estado: 'pagado',
  });
  return creada.toObject();
}

/**
 * Liquidación para vincular el certificado de jornada.
 * Hay índice único en certificados.idLiquidacion: si la liq. de matrícula ya tiene
 * certificado (p. ej. por pago), no se puede reutilizar — se crea una dedicada.
 */
async function asegurarLiquidacionJornada(numDoc, idProg, mat) {
  const idProgStr = String(idProg);
  const or = [{ idMat: mat._id }, { idMatricula: mat._id }];
  const ndq = numDocQuery(numDoc);
  if (ndq) or.push(ndq);

  const candidatas = await Liquidacion.find({
    idProg: idProgStr,
    $or: or,
  })
    .sort({ createdAt: -1 })
    .lean();

  for (const liq of candidatas) {
    const ocupada = await Certificado.exists({ idLiquidacion: liq._id });
    if (!ocupada) return liq;
  }

  return crearLiquidacionJornada(numDoc, idProgStr, mat);
}

function esDupKeyIdLiquidacion(err) {
  if (!err || err.code !== 11000) return false;
  const msg = String(err.message || err.errmsg || '');
  return msg.includes('idLiquidacion');
}

/** Crea certificado; si otra emisión ocupó la liquidación, reintenta con una nueva. */
async function crearCertificadoJornadaConLiqLibre(params, numDoc, progIdLiq, mat) {
  let liq = params.liq || (await asegurarLiquidacionJornada(numDoc, progIdLiq, mat));
  try {
    return await crearCertificadoJornadaBase({ ...params, liq });
  } catch (err) {
    if (!esDupKeyIdLiquidacion(err)) throw err;
    liq = await crearLiquidacionJornada(numDoc, String(progIdLiq), mat);
    return crearCertificadoJornadaBase({ ...params, liq });
  }
}

/** Cuenta asistencias (clases distintas) del alumno en todas las jornadas del contrato. */
async function contarAsistenciasContrato(numDoc, idContrato, claseIdsPrecargados = null) {
  let claseIds = claseIdsPrecargados;
  if (!claseIds) {
    const jornadaIds = await JornadaCap.find({ idContrato }).distinct('_id');
    if (!jornadaIds.length) return 0;
    claseIds = await ClaseJornadaCap.find({ idJornada: { $in: jornadaIds } }).distinct('_id');
  }
  if (!claseIds?.length) return 0;
  return AsisClasJorCap.countDocuments({
    numDocAlumno: numDoc,
    idclaseJornada: { $in: claseIds },
  });
}

/** Precarga contrato, clases del contrato, config y plantilla (lote de asistencias). */
async function crearContextoCertificadoContrato(idContratoRaw) {
  if (!idContratoRaw) return null;
  const idContrato =
    idContratoRaw instanceof mongoose.Types.ObjectId
      ? idContratoRaw
      : new mongoose.Types.ObjectId(String(idContratoRaw));
  const contrato = await Contratacion.findById(idContrato).lean();
  if (!contrato) return null;
  const jornadaIds = await JornadaCap.find({ idContrato }).distinct('_id');
  const claseIds = jornadaIds.length
    ? await ClaseJornadaCap.find({ idJornada: { $in: jornadaIds } }).distinct('_id')
    : [];
  const cfg = await obtenerConfigCertificado();
  const plantilla = await resolverPlantillaImpresion(cfg, tipoFormatoJornada);
  return {
    idContrato,
    contrato,
    numSesCert: Math.max(1, parseInt(contrato.numSesCert, 10) || 1),
    claseIds,
    cfg,
    plantilla,
  };
}

async function obtenerNumSesCert(idContrato) {
  const contrato = await Contratacion.findById(idContrato).lean();
  return Math.max(1, parseInt(contrato?.numSesCert, 10) || 1);
}

/** Certificado vigente del alumno en el contrato (automático o manual, modo global). */
async function certificadoExistenteContrato(numDoc, idContrato) {
  return Certificado.findOne({
    numDoc,
    idContrato,
    estado: { $ne: 'anulado' },
    $or: [{ idClaseJornada: null }, { idClaseJornada: { $exists: false } }],
  }).lean();
}

/** Certificado vigente del alumno para una clase (modo por_clase). */
async function certificadoExistenteClase(numDoc, idClaseJornada) {
  if (!idClaseJornada) return null;
  return Certificado.findOne({
    numDoc,
    idClaseJornada,
    estado: { $ne: 'anulado' },
  }).lean();
}

/**
 * @returns {null | { certificado: object, message: string }}
 */
async function validarAlumnoSinCertificadoContrato(numDocRaw, idContratoRaw) {
  const numDoc = parseNumDoc(numDocRaw);
  if (numDoc == null || !idContratoRaw) return null;
  const idContrato =
    idContratoRaw instanceof mongoose.Types.ObjectId
      ? idContratoRaw
      : new mongoose.Types.ObjectId(String(idContratoRaw));
  const contrato = await Contratacion.findById(idContrato).select('tipoCertificado').lean();
  if (contrato?.tipoCertificado === TIPO_CERTIFICADO_POR_CLASE) return null;
  const certificado = await certificadoExistenteContrato(numDoc, idContrato);
  if (!certificado) return null;
  const cod = certificado.codigoCert ? ` (${certificado.codigoCert})` : '';
  return {
    certificado,
    message: `${MOTIVOS_CERT.ya_certificado_contrato}${cod}`,
  };
}

/**
 * Progreso del alumno frente a numSesCert del contrato.
 */
async function progresoCertificacion(numDocRaw, idContratoRaw, ctx = null) {
  const numDoc = parseNumDoc(numDocRaw);
  if (numDoc == null || !idContratoRaw) {
    return { sesiones: 0, numSesCert: 1, cumplio: false, certificado: null };
  }
  const idContrato =
    idContratoRaw instanceof mongoose.Types.ObjectId
      ? idContratoRaw
      : new mongoose.Types.ObjectId(String(idContratoRaw));
  const numSesCert = ctx?.numSesCert ?? (await obtenerNumSesCert(idContrato));
  const sesiones = await contarAsistenciasContrato(numDoc, idContrato, ctx?.claseIds);
  const certificado = await certificadoExistenteContrato(numDoc, idContrato);
  return {
    sesiones,
    numSesCert,
    cumplio: sesiones >= numSesCert,
    certificado,
    faltan: Math.max(0, numSesCert - sesiones),
  };
}

async function resolverEmpresaAlumno(numDoc) {
  let empresaId = null;
  let empresaNombre = null;
  const alumnoJornada = await DatosAlumno.findOne(numDocQuery(numDoc), { empresaId: 1 }).lean();
  if (alumnoJornada?.empresaId) {
    empresaId = alumnoJornada.empresaId;
    const cli = await Cliente.findById(empresaId, {
      razonSocial: 1,
      nombres: 1,
      nombreComercial: 1,
      identificacion: 1,
    }).lean();
    if (cli) {
      empresaNombre =
        cli.razonSocial?.trim() ||
        cli.nombreComercial?.trim() ||
        cli.nombres?.trim() ||
        cli.identificacion ||
        null;
    }
  }
  return { empresaId, empresaNombre };
}

/** Título del curso impreso en certificado por_clase (programa de la clase). */
function encabezadoCursoPrograma(prog) {
  return (prog?.nomCert || prog?.descripcion || prog?.nombreProg || '').trim();
}

/** Horas del programa para imprimir en certificado. */
function horasDesdePrograma(prog) {
  const hProg = prog?.horas != null ? Number(prog.horas) : NaN;
  if (Number.isFinite(hProg) && hProg > 0) return String(hProg);
  return '';
}

/**
 * Encabezado del certificado global: programa del contrato → nombreCertificacion (legado).
 */
function encabezadoCertificadoGlobal(contrato, prog = null) {
  const desdeProg = encabezadoCursoPrograma(prog);
  if (desdeProg) return desdeProg;
  return String(contrato?.nombreCertificacion || '').trim() || 'Jornadas de Capacitación';
}

/** Horas del certificado global: programa del contrato → numeroHorascert (legado). */
function horasCertificadoGlobal(contrato, prog = null) {
  const desdeProg = horasDesdePrograma(prog);
  if (desdeProg) return desdeProg;
  return String(contrato?.numeroHorascert || '').trim();
}

/** Programa elegido en el contrato para certificación global. */
function idProgramaCertificacionContrato(contrato) {
  return String(contrato?.idProgramaCertificacion || '').trim();
}

/** Alias de un id de programa (idPrograma numérico y _id). */
async function aliasIdsPrograma(idRaw) {
  const id = String(idRaw || '').trim();
  if (!id) return [];
  const out = new Set([id]);
  const prog = await buscarPrograma(id);
  if (prog) {
    if (prog.idPrograma != null && String(prog.idPrograma).trim()) {
      out.add(String(prog.idPrograma).trim());
    }
    if (prog._id != null) out.add(String(prog._id));
  }
  return [...out];
}

/**
 * Matrícula activa del alumno para alguno de los programas candidatos
 * (certificación global, programa de la clase, etc.).
 */
async function buscarMatriculaJornadaActiva(numDoc, ...progIdsPreferidos) {
  const tried = new Set();
  for (const raw of progIdsPreferidos) {
    const aliases = await aliasIdsPrograma(raw);
    for (const a of aliases) {
      if (tried.has(a)) continue;
      tried.add(a);
      const mat = await Matricula.findOne({
        numDoc,
        idProg: a,
        ...QUERY_MATRICULA_ACTIVA,
      })
        .sort({ createdAt: -1 })
        .lean();
      if (mat) return { mat, progIdMatricula: String(mat.idProg) };
    }
  }
  return null;
}

function normalizarTipoCertificado(raw) {
  const t = String(raw ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
  if (t === 'por_clase' || t === 'porclase') return TIPO_CERTIFICADO_POR_CLASE;
  return TIPO_CERTIFICADO_GLOBAL;
}

/** Horas impresas en certificado por_clase: clase → programa (legado: horasPorClase del contrato). */
function resolverHorasCertificadoPorClase(clase, contrato, prog) {
  const hClase = Number(clase?.horasCertificadas);
  if (Number.isFinite(hClase) && hClase > 0) return String(hClase);
  const desdeProg = horasDesdePrograma(prog);
  if (desdeProg) return desdeProg;
  const hContrato = Number(contrato?.horasPorClase);
  if (Number.isFinite(hContrato) && hContrato > 0) return String(hContrato);
  return '';
}

/** Fecha impresa en el certificado: día civil de la clase (o de la jornada). */
async function resolverFechaEmisionCertificadoJornada(clase, idJornadaRaw) {
  if (clase?.fechaClase) {
    const fe =
      fechaCalendarioParaGuardar(clase.fechaClase) || parseFechaCalendario(clase.fechaClase);
    if (fe) return fe;
  }
  const idJornada = idJornadaRaw || clase?.idJornada;
  if (idJornada) {
    const jornada = await JornadaCap.findById(idJornada).select('fechaProgramacion').lean();
    if (jornada?.fechaProgramacion) {
      const fe = fechaCalendarioParaGuardar(jornada.fechaProgramacion);
      if (fe) return fe;
    }
  }
  return new Date();
}

async function crearCertificadoJornadaBase({
  numDoc,
  progId,
  idContrato,
  idJornada,
  idClaseJornada,
  contrato,
  liq,
  cfg,
  plantilla,
  horasCert,
  observaciones,
  fechaEmision,
  encabezado: encabezadoExplicito,
}) {
  const encabezado =
    String(encabezadoExplicito || '').trim() || encabezadoCertificadoGlobal(contrato);
  const codigoCert = await siguienteCodigoCertificado();
  const fechaEm = fechaEmision instanceof Date && !Number.isNaN(fechaEmision.getTime())
    ? fechaEmision
    : new Date();
  const { empresaId, empresaNombre } = await resolverEmpresaAlumno(numDoc);

  const cert = await Certificado.create({
    numDoc,
    idLiquidacion: liq?._id || null,
    idProg: progId,
    idContrato,
    idJornada,
    idClaseJornada: idClaseJornada || null,
    codigoCert,
    encabezado,
    horasCert: String(horasCert || '').trim(),
    idPlantilla: plantilla._id,
    orientacion: plantilla.orientacion || 'vertical',
    tipoFormatoCert: tipoFormatoJornada,
    tipoCertificado: TIPO_JORNADAS_CAPACITACION,
    generadoAutoJornada: true,
    observaciones,
    fechaEmision: fechaEm,
    empresaId,
    empresaNombre,
  });

  return {
    ...cert.toObject(),
    tipoFormatoCertLabel: TIPOS_LABEL[tipoFormatoJornada],
    programaDescr: encabezado,
  };
}

/** Emite certificado al registrar asistencia en una clase (contrato tipo por_clase). */
async function intentarCertificadoPorClase(numDoc, idProg, idContrato, idJornadaRaw, clase, ctx, contrato) {
  if (!clase?._id) {
    return { creado: false, motivo: 'sin_clase', mensaje: MOTIVOS_CERT.sin_clase };
  }

  const idClaseJornada =
    clase._id instanceof mongoose.Types.ObjectId
      ? clase._id
      : new mongoose.Types.ObjectId(String(clase._id));

  const existenteClase = await certificadoExistenteClase(numDoc, idClaseJornada);
  if (existenteClase) {
    return {
      creado: false,
      motivo: 'ya_certificado_clase',
      mensaje: MOTIVOS_CERT.ya_certificado_clase,
      certificado: existenteClase,
    };
  }

  const progId = String(idProg || clase.idPrograma || '').trim();
  if (!progId) {
    return { creado: false, motivo: 'sin_matricula', mensaje: 'La clase no tiene programa asignado.' };
  }

  const matHit = await buscarMatriculaJornadaActiva(numDoc, progId, clase?.idPrograma);
  if (!matHit) {
    return { creado: false, motivo: 'sin_matricula', mensaje: MOTIVOS_CERT.sin_matricula };
  }
  const mat = matHit.mat;
  const progIdLiq = matHit.progIdMatricula;

  let liq = await asegurarLiquidacionJornada(numDoc, progIdLiq, mat);
  if (!liq) {
    return { creado: false, motivo: 'sin_liquidacion', mensaje: MOTIVOS_CERT.sin_liquidacion };
  }

  const cfg = ctx?.cfg || (await obtenerConfigCertificado());
  const plantilla =
    ctx?.plantilla !== undefined
      ? ctx.plantilla
      : await resolverPlantillaImpresion(cfg, tipoFormatoJornada);
  if (!plantilla) {
    console.warn('[ARGO] Auto-cert jornada por clase: configure plantilla «Jornada Capacitación»');
    return { creado: false, motivo: 'sin_plantilla', mensaje: MOTIVOS_CERT.sin_plantilla };
  }

  const prog = await buscarPrograma(progId);
  const encabezado = encabezadoCursoPrograma(prog);
  if (!encabezado) {
    return {
      creado: false,
      motivo: 'sin_programa',
      mensaje: 'La clase no tiene un programa con nombre para el certificado.',
    };
  }

  const horasCert = resolverHorasCertificadoPorClase(clase, contrato, prog);

  let idJornada = null;
  if (idJornadaRaw) {
    try {
      idJornada =
        idJornadaRaw instanceof mongoose.Types.ObjectId
          ? idJornadaRaw
          : new mongoose.Types.ObjectId(String(idJornadaRaw));
    } catch {
      idJornada = null;
    }
  }

  const fechaEmision = await resolverFechaEmisionCertificadoJornada(clase, idJornadaRaw);
  const certificado = await crearCertificadoJornadaConLiqLibre(
    {
      numDoc,
      progId,
      idContrato,
      idJornada,
      idClaseJornada,
      contrato,
      liq,
      cfg,
      plantilla,
      horasCert,
      observaciones: 'Certificado automático por asistencia a la clase',
      fechaEmision,
      encabezado,
    },
    numDoc,
    progIdLiq,
    mat,
  );

  return {
    creado: true,
    certificado,
    mensaje: 'Certificado emitido automáticamente por asistencia a la clase',
  };
}

/**
 * Si asistencias >= contrato.numSesCert, emite certificado automático (sin intervención del usuario).
 */
async function intentarCertificadoJornadaAuto(
  numDocRaw,
  idProg,
  idContratoRaw,
  idJornadaRaw,
  ctx = null,
  clase = null,
) {
  const numDoc = parseNumDoc(numDocRaw);
  if (numDoc == null) return { creado: false, motivo: 'numDoc_invalido' };

  const idContrato =
    idContratoRaw instanceof mongoose.Types.ObjectId
      ? idContratoRaw
      : new mongoose.Types.ObjectId(String(idContratoRaw));

  const contrato = ctx?.contrato || (await Contratacion.findById(idContrato).lean());
  if (!contrato) return { creado: false, motivo: 'contrato_no_encontrado' };

  const tipoCert = normalizarTipoCertificado(contrato.tipoCertificado);
  if (tipoCert === TIPO_CERTIFICADO_POR_CLASE) {
    return intentarCertificadoPorClase(numDoc, idProg, idContrato, idJornadaRaw, clase, ctx, contrato);
  }

  const numSesCert = ctx?.numSesCert ?? Math.max(1, parseInt(contrato.numSesCert, 10) || 1);
  const sesiones = await contarAsistenciasContrato(numDoc, idContrato, ctx?.claseIds);

  const progreso = {
    sesiones,
    numSesCert,
    cumplio: sesiones >= numSesCert,
    faltan: Math.max(0, numSesCert - sesiones),
  };

  if (sesiones < numSesCert) {
    return {
      creado: false,
      motivo: 'sesiones_insuficientes',
      mensaje: MOTIVOS_CERT.sesiones_insuficientes,
      ...progreso,
    };
  }

  const existente = await certificadoExistenteContrato(numDoc, idContrato);
  if (existente) {
    return {
      creado: false,
      motivo: 'ya_certificado',
      mensaje: MOTIVOS_CERT.ya_certificado,
      certificado: existente,
      ...progreso,
    };
  }

  // Programa para encabezado/horas: certificación del contrato → programa de la clase.
  const progIdContrato = idProgramaCertificacionContrato(contrato);
  const progIdClase = String(clase?.idPrograma || idProg || '').trim();
  const progIdPreferido = progIdContrato || progIdClase;
  if (!progIdPreferido) {
    return {
      creado: false,
      motivo: 'sin_programa',
      mensaje:
        'Configure el programa de certificación en el contrato (tipo global) o asigne un programa a la clase.',
      ...progreso,
    };
  }

  const progEncabezado = await buscarPrograma(progIdPreferido);
  if (progIdContrato && !progEncabezado) {
    return {
      creado: false,
      motivo: 'sin_programa',
      mensaje: 'El programa de certificación del contrato no existe o fue eliminado.',
      ...progreso,
    };
  }
  if (!encabezadoCursoPrograma(progEncabezado) && !String(contrato?.nombreCertificacion || '').trim()) {
    return {
      creado: false,
      motivo: 'sin_programa',
      mensaje: 'Configure un programa de certificación con nombre para el certificado (contrato global).',
      ...progreso,
    };
  }

  // Matrícula: aceptar la del programa de certificación o la del programa de la clase (compat.).
  const matHit = await buscarMatriculaJornadaActiva(numDoc, progIdContrato, progIdClase, progIdPreferido);
  if (!matHit) {
    return {
      creado: false,
      motivo: 'sin_matricula',
      mensaje:
        MOTIVOS_CERT.sin_matricula +
        ' Verifique que el alumno esté matriculado al programa de la clase o al de certificación del contrato.',
      ...progreso,
    };
  }
  const mat = matHit.mat;
  const progIdLiq = matHit.progIdMatricula;

  let liq = await asegurarLiquidacionJornada(numDoc, progIdLiq, mat);
  if (!liq) {
    return { creado: false, motivo: 'sin_liquidacion', mensaje: MOTIVOS_CERT.sin_liquidacion, ...progreso };
  }

  const cfg = ctx?.cfg || (await obtenerConfigCertificado());
  const plantilla =
    ctx?.plantilla !== undefined
      ? ctx.plantilla
      : await resolverPlantillaImpresion(cfg, tipoFormatoJornada);
  if (!plantilla) {
    console.warn('[ARGO] Auto-cert jornada: configure plantilla «Jornada Capacitación» en Config. Certificados');
    return {
      creado: false,
      motivo: 'sin_plantilla',
      mensaje: MOTIVOS_CERT.sin_plantilla,
      ...progreso,
    };
  }

  let idJornada = null;
  if (idJornadaRaw) {
    try {
      idJornada =
        idJornadaRaw instanceof mongoose.Types.ObjectId
          ? idJornadaRaw
          : new mongoose.Types.ObjectId(String(idJornadaRaw));
    } catch {
      idJornada = null;
    }
  }

  const horasCert = horasCertificadoGlobal(contrato, progEncabezado);
  const fechaEmision = await resolverFechaEmisionCertificadoJornada(clase, idJornadaRaw);
  const certificado = await crearCertificadoJornadaConLiqLibre(
    {
      numDoc,
      progId: progIdPreferido,
      idContrato,
      idJornada,
      idClaseJornada: null,
      contrato,
      liq,
      cfg,
      plantilla,
      horasCert,
      observaciones: `Certificado automático al completar ${numSesCert} sesión(es) en el contrato`,
      fechaEmision,
      encabezado: encabezadoCertificadoGlobal(contrato, progEncabezado),
    },
    numDoc,
    progIdLiq,
    mat,
  );

  return {
    creado: true,
    certificado,
    ...progreso,
    mensaje: `Certificado emitido automáticamente (${sesiones}/${numSesCert} sesiones)`,
  };
}

module.exports = {
  contarAsistenciasContrato,
  certificadoExistenteContrato,
  certificadoExistenteClase,
  validarAlumnoSinCertificadoContrato,
  progresoCertificacion,
  intentarCertificadoJornadaAuto,
  intentarCertificadoPorClase,
  crearContextoCertificadoContrato,
  MOTIVOS_CERT,
};
