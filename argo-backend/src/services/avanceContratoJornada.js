const mongoose = require('mongoose');
const Contratacion = require('../models/Contratacion');
const JornadaCap = require('../models/JornadaCap');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const AsisClasJorCap = require('../models/AsisClasJorCap');
const Certificado = require('../models/Certificado');
const DatosAlumno = require('../models/DatosAlumno');
const { parseNumDoc } = require('../utils/numDoc');
const { TIPO_CERTIFICADO_POR_CLASE } = require('../constants/jornadaCapacitacion');

function toObjectId(raw) {
  if (!raw) return null;
  try {
    return raw instanceof mongoose.Types.ObjectId ? raw : new mongoose.Types.ObjectId(String(raw));
  }
  catch {
    return null;
  }
}

function nombreAlumno(a) {
  if (!a) return '';
  return [a.nombre1, a.nombre2, a.apellido1, a.apellido2].filter(Boolean).join(' ').trim();
}

/**
 * Avance operativo del contrato: clases dictadas/faltantes y alumnos capacitados/certificados.
 */
async function obtenerAvanceContratoJornada(idContratoRaw) {
  const idContrato = toObjectId(idContratoRaw);
  if (!idContrato) return null;

  const contrato = await Contratacion.findById(idContrato).lean();
  if (!contrato) return null;

  const jornadaIds = await JornadaCap.find({ idContrato }).distinct('_id');
  const claseIds = jornadaIds.length
    ? await ClaseJornadaCap.find({ idJornada: { $in: jornadaIds } }).distinct('_id')
    : [];

  const clases = claseIds.length
    ? await ClaseJornadaCap.find({ _id: { $in: claseIds } }).select('estado').lean()
    : [];

  let clasesDictadas = 0;
  let clasesEnProceso = 0;
  let clasesProgramadas = 0;
  for (const cl of clases) {
    const est = String(cl.estado || '').toUpperCase();
    if (est === 'FINALIZADO') clasesDictadas += 1;
    else if (est === 'EN PROCESO') clasesEnProceso += 1;
    else clasesProgramadas += 1;
  }

  const clasesTotales = clases.length;
  const metaJornadas = Math.max(0, parseInt(contrato.numerojornadas, 10) || 0);
  const clasesPorJornada = Math.max(0, parseInt(contrato.clasesPorJornada, 10) || 0);
  const metaClasesContrato =
    metaJornadas > 0 && clasesPorJornada > 0 ? metaJornadas * clasesPorJornada : 0;
  const numSesCert = Math.max(1, parseInt(contrato.numSesCert, 10) || 1);
  const esPorClase = contrato.tipoCertificado === TIPO_CERTIFICADO_POR_CLASE;

  const asistPorAlumno = claseIds.length
    ? await AsisClasJorCap.aggregate([
        { $match: { idclaseJornada: { $in: claseIds } } },
        { $group: { _id: '$numDocAlumno', clasesAsistidas: { $sum: 1 } } },
      ])
    : [];

  const certRows = await Certificado.find({
    idContrato,
    estado: { $ne: 'anulado' },
  })
    .select('numDoc idClaseJornada codigoCert fechaEmision')
    .sort({ fechaEmision: -1 })
    .lean();

  const certPorAlumno = new Map();
  for (const c of certRows) {
    const nd = parseNumDoc(c.numDoc);
    if (nd == null) continue;
    if (!certPorAlumno.has(nd)) {
      certPorAlumno.set(nd, {
        certificados: 0,
        codigos: [],
        tieneGlobal: false,
      });
    }
    const row = certPorAlumno.get(nd);
    row.certificados += 1;
    if (c.codigoCert) row.codigos.push(c.codigoCert);
    if (!c.idClaseJornada) row.tieneGlobal = true;
  }

  const numDocsCapacitados = asistPorAlumno
    .map((r) => parseNumDoc(r._id))
    .filter((n) => n != null);
  const alumnosCertificadosSet = new Set(
    [...certPorAlumno.keys()].filter((nd) => {
      const info = certPorAlumno.get(nd);
      if (esPorClase) return info.certificados > 0;
      return info.tieneGlobal || info.certificados > 0;
    }),
  );

  const alumnosDocs = numDocsCapacitados.length
    ? await DatosAlumno.find({ numDoc: { $in: numDocsCapacitados } }).lean()
    : [];
  const alumnoMap = new Map();
  for (const a of alumnosDocs) {
    const nd = parseNumDoc(a.numDoc);
    if (nd != null) alumnoMap.set(nd, a);
  }

  const alumnos = asistPorAlumno
    .map((r) => {
      const numDoc = parseNumDoc(r._id);
      if (numDoc == null) return null;
      const clasesAsistidas = r.clasesAsistidas || 0;
      const certInfo = certPorAlumno.get(numDoc) || {
        certificados: 0,
        codigos: [],
        tieneGlobal: false,
      };
      const certificado =
        esPorClase ? certInfo.certificados > 0 : certInfo.tieneGlobal || certInfo.certificados > 0;
      const cumplioSesiones = clasesAsistidas >= numSesCert;
      return {
        numDoc,
        nombreCompleto: nombreAlumno(alumnoMap.get(numDoc)) || `Doc. ${numDoc}`,
        clasesAsistidas,
        certificado,
        certificadosEmitidos: certInfo.certificados,
        codigosCertificado: certInfo.codigos.slice(0, 5),
        cumplioSesiones,
        faltanSesiones: Math.max(0, numSesCert - clasesAsistidas),
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      String(a.nombreCompleto).localeCompare(String(b.nombreCompleto), 'es', { sensitivity: 'base' }),
    );

  return {
    resumen: {
      jornadasProgramadas: jornadaIds.length,
      jornadasMeta: metaJornadas,
      clasesTotales,
      clasesDictadas,
      clasesEnProceso,
      clasesProgramadas,
      clasesFaltanDictar: Math.max(0, clasesTotales - clasesDictadas),
      metaClasesContrato,
      clasesFaltanMeta: metaClasesContrato > 0 ? Math.max(0, metaClasesContrato - clasesDictadas) : null,
      alumnosCapacitados: numDocsCapacitados.length,
      alumnosCertificados: alumnosCertificadosSet.size,
      numeroAlumnosMeta: Math.max(0, parseInt(contrato.numeroAlumnos, 10) || 0),
      numSesCert,
      tipoCertificado: contrato.tipoCertificado || 'global',
    },
    alumnos,
  };
}

module.exports = { obtenerAvanceContratoJornada };
