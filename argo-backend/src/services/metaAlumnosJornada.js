const mongoose = require('mongoose');
const JornadaCap = require('../models/JornadaCap');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const AsisClasJorCap = require('../models/AsisClasJorCap');
const InscripcionClase = require('../models/InscripcionClase');
const Certificado = require('../models/Certificado');

function oid(v) {
  if (!v) return null;
  if (v instanceof mongoose.Types.ObjectId) return v;
  try {
    return new mongoose.Types.ObjectId(String(v));
  } catch {
    return null;
  }
}

/**
 * Alumnos distintos de la jornada (unión inscripciones + asistencias en sus clases).
 */
async function contarAlumnosJornada(idJornadaRaw) {
  const idJornada = oid(idJornadaRaw);
  if (!idJornada) return 0;
  const clases = await ClaseJornadaCap.find({ idJornada }).select('_id').lean();
  const claseIds = clases.map((c) => c._id);
  if (!claseIds.length) return 0;

  const [inscs, asis] = await Promise.all([
    InscripcionClase.find({ idClase: { $in: claseIds } }).select('numDoc').lean(),
    AsisClasJorCap.find({ idclaseJornada: { $in: claseIds } }).select('numDocAlumno').lean(),
  ]);

  const set = new Set();
  for (const i of inscs) {
    if (i.numDoc != null) set.add(Number(i.numDoc));
  }
  for (const a of asis) {
    if (a.numDocAlumno != null) set.add(Number(a.numDocAlumno));
  }
  return set.size;
}

/**
 * Conteos de clases y alumnos por varias jornadas (listados del día).
 */
async function statsOperacionJornadas(jornadaIds) {
  const clasesPorJornada = new Map();
  const alumnosPorJornada = new Map();
  const ids = (jornadaIds || []).map(oid).filter(Boolean);
  if (!ids.length) return { clasesPorJornada, alumnosPorJornada };

  const clases = await ClaseJornadaCap.find({ idJornada: { $in: ids } })
    .select('_id idJornada')
    .lean();
  const claseToJornada = new Map();
  for (const cl of clases) {
    const jid = String(cl.idJornada);
    claseToJornada.set(String(cl._id), jid);
    clasesPorJornada.set(jid, (clasesPorJornada.get(jid) || 0) + 1);
  }

  const claseIds = clases.map((c) => c._id);
  if (!claseIds.length) return { clasesPorJornada, alumnosPorJornada };

  const [inscs, asis] = await Promise.all([
    InscripcionClase.find({ idClase: { $in: claseIds } }).select('idClase numDoc').lean(),
    AsisClasJorCap.find({ idclaseJornada: { $in: claseIds } })
      .select('idclaseJornada numDocAlumno')
      .lean(),
  ]);

  const addAlumno = (claseId, numDoc) => {
    const jid = claseToJornada.get(String(claseId));
    if (!jid || numDoc == null || Number.isNaN(Number(numDoc))) return;
    if (!alumnosPorJornada.has(jid)) alumnosPorJornada.set(jid, new Set());
    alumnosPorJornada.get(jid).add(Number(numDoc));
  };

  for (const i of inscs) addAlumno(i.idClase, i.numDoc);
  for (const a of asis) addAlumno(a.idclaseJornada, a.numDocAlumno);

  return { clasesPorJornada, alumnosPorJornada };
}

/**
 * Métricas por jornada para listados del ERP (clases dictadas, alumnos, certificados).
 * @returns {Map<string, { totalClases: number, clasesDictadas: number, alumnosCapacitados: number, certificadosJornada: number }>}
 */
async function statsListadoJornadas(jornadaIds) {
  const out = new Map();
  const ids = (jornadaIds || []).map(oid).filter(Boolean);
  if (!ids.length) return out;

  for (const id of ids) {
    out.set(String(id), {
      totalClases: 0,
      clasesDictadas: 0,
      alumnosCapacitados: 0,
      certificadosJornada: 0,
    });
  }

  const clases = await ClaseJornadaCap.find({ idJornada: { $in: ids } })
    .select('_id idJornada estado')
    .lean();
  const claseToJornada = new Map();
  for (const cl of clases) {
    const jid = String(cl.idJornada);
    claseToJornada.set(String(cl._id), jid);
    const row = out.get(jid);
    if (!row) continue;
    row.totalClases += 1;
    if (String(cl.estado || '').trim().toUpperCase() === 'FINALIZADO') {
      row.clasesDictadas += 1;
    }
  }

  const claseIds = clases.map((c) => c._id);
  if (claseIds.length) {
    const asis = await AsisClasJorCap.find({ idclaseJornada: { $in: claseIds } })
      .select('idclaseJornada numDocAlumno')
      .lean();
    const alumnosPorJornada = new Map();
    for (const a of asis) {
      const jid = claseToJornada.get(String(a.idclaseJornada));
      const doc = a.numDocAlumno;
      if (!jid || doc == null || Number.isNaN(Number(doc))) continue;
      if (!alumnosPorJornada.has(jid)) alumnosPorJornada.set(jid, new Set());
      alumnosPorJornada.get(jid).add(Number(doc));
    }
    for (const [jid, set] of alumnosPorJornada) {
      const row = out.get(jid);
      if (row) row.alumnosCapacitados = set.size;
    }
  }

  const certRows = await Certificado.aggregate([
    { $match: { idJornada: { $in: ids }, estado: { $ne: 'anulado' } } },
    { $group: { _id: { idJornada: '$idJornada', numDoc: '$numDoc' } } },
    { $group: { _id: '$_id.idJornada', count: { $sum: 1 } } },
  ]);
  for (const r of certRows) {
    const row = out.get(String(r._id));
    if (row) row.certificadosJornada = r.count || 0;
  }

  return out;
}

/**
 * Evalúa si la jornada llegó o superó el tope de alumnos proyectados (numeObjeJornada).
 */
async function evaluarMetaAlumnosJornada(jornadaOrId) {
  let jornada = jornadaOrId;
  if (!jornada || !jornada._id) {
    jornada = await JornadaCap.findById(jornadaOrId).lean();
  }
  if (!jornada?._id) {
    return {
      idJornada: null,
      alumnosLleva: 0,
      metaAlumnos: 0,
      metaAlcanzada: false,
      metaSuperada: false,
      mensaje: null,
    };
  }

  const metaAlumnos = Math.max(0, parseInt(jornada.numeObjeJornada, 10) || 0);
  const alumnosLleva = await contarAlumnosJornada(jornada._id);
  const metaAlcanzada = metaAlumnos > 0 && alumnosLleva >= metaAlumnos;
  const metaSuperada = metaAlumnos > 0 && alumnosLleva > metaAlumnos;

  let mensaje = null;
  if (metaSuperada) {
    mensaje =
      `Se superó el tope de alumnos proyectados para esta jornada (${alumnosLleva}/${metaAlumnos}).`;
  } else if (metaAlcanzada) {
    mensaje =
      `Se alcanzó el tope de alumnos proyectados para esta jornada (${alumnosLleva}/${metaAlumnos}).`;
  }

  return {
    idJornada: String(jornada._id),
    alumnosLleva,
    metaAlumnos,
    metaAlcanzada,
    metaSuperada,
    mensaje,
  };
}

module.exports = {
  contarAlumnosJornada,
  statsOperacionJornadas,
  statsListadoJornadas,
  evaluarMetaAlumnosJornada,
};
