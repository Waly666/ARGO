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
    'El alumno ya está certificado en este contrato. Solo se permite un certificado por alumno y contrato; no puede inscribirse ni registrar asistencia en nuevas clases.',
  ya_certificado_clase: 'El alumno ya tiene certificado vigente para esta clase.',
  sin_clase: 'Falta la clase para emitir certificado por asistencia.',
  contrato_no_encontrado: 'Contrato no encontrado.',
  numDoc_invalido: 'Documento del alumno inválido.',
};

function toDec(n) {
  return mongoose.Types.Decimal128.fromString(String(Number(n) || 0));
}

async function asegurarLiquidacionJornada(numDoc, idProg, mat) {
  let liq = await Liquidacion.findOne({ idMat: mat._id, idProg: String(idProg) }).lean();
  if (!liq) {
    liq = await Liquidacion.findOne({ ...numDocQuery(numDoc), idProg: String(idProg) }).lean();
  }
  if (liq) return liq;

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
    descripcion: desc,
    valor: toDec(0),
    abonado: toDec(0),
    saldo: toDec(0),
    estado: 'pagado',
  });
  return creada.toObject();
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
}) {
  const encabezado = String(contrato.nombreCertificacion || '').trim() || 'Jornadas de Capacitación';
  const codigoCert = await siguienteCodigoCertificado();
  const fechaEm = new Date();
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

  const mat = await Matricula.findOne({
    numDoc,
    idProg: progId,
    ...QUERY_MATRICULA_ACTIVA,
  })
    .sort({ createdAt: -1 })
    .lean();
  if (!mat) {
    return { creado: false, motivo: 'sin_matricula', mensaje: MOTIVOS_CERT.sin_matricula };
  }

  let liq = await asegurarLiquidacionJornada(numDoc, progId, mat);
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

  const horasNum = Number(clase.horasCertificadas ?? contrato.horasPorClase ?? 0);
  const horasCert =
    horasNum > 0
      ? String(horasNum)
      : String(contrato.numeroHorascert || '').trim();

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

  const certificado = await crearCertificadoJornadaBase({
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
  });

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

  const tipoCert = contrato.tipoCertificado || TIPO_CERTIFICADO_GLOBAL;
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

  const progId = String(idProg);
  const mat = await Matricula.findOne({
    numDoc,
    idProg: progId,
    ...QUERY_MATRICULA_ACTIVA,
  })
    .sort({ createdAt: -1 })
    .lean();
  if (!mat) {
    return { creado: false, motivo: 'sin_matricula', mensaje: MOTIVOS_CERT.sin_matricula, ...progreso };
  }

  let liq = await asegurarLiquidacionJornada(numDoc, progId, mat);
  if (!liq) {
    return { creado: false, motivo: 'sin_liquidacion', mensaje: MOTIVOS_CERT.sin_liquidacion, ...progreso };
  }

  const dupLiq = await Certificado.findOne({ idLiquidacion: liq._id, estado: { $ne: 'anulado' } }).lean();
  if (dupLiq) {
    return { creado: false, motivo: 'ya_certificado', certificado: dupLiq, ...progreso };
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

  const horasCert = String(contrato.numeroHorascert || '').trim();
  const certificado = await crearCertificadoJornadaBase({
    numDoc,
    progId,
    idContrato,
    idJornada,
    idClaseJornada: null,
    contrato,
    liq,
    cfg,
    plantilla,
    horasCert,
    observaciones: `Certificado automático al completar ${numSesCert} sesión(es) en el contrato`,
  });

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
