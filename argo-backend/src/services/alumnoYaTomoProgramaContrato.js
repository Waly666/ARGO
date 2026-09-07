/**
 * Un alumno no puede inscribirse de nuevo al mismo programa en el mismo contrato
 * si ya estuvo en otra clase de ese programa (inscrito, asistencia o certificado).
 */
const JornadaCap = require('../models/JornadaCap');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const InscripcionClase = require('../models/InscripcionClase');
const AsisClasJorCap = require('../models/AsisClasJorCap');
const Certificado = require('../models/Certificado');
const { buscarPrograma } = require('./programaServicio');
const { idProgramaCanonico } = require('./programasContratoJornada');
const { parseNumDoc } = require('../utils/numDoc');

function addClave(set, raw) {
  const s = String(raw ?? '').trim();
  if (!s) return;
  set.add(s);
  const n = Number(s);
  if (Number.isFinite(n)) set.add(String(n));
}

async function clavesDePrograma(idRaw, cache) {
  const key = String(idRaw ?? '').trim();
  if (cache.has(key)) return cache.get(key);
  const set = new Set();
  addClave(set, key);
  if (key) {
    const prog = await buscarPrograma(key);
    addClave(set, idProgramaCanonico(prog));
    if (prog) {
      addClave(set, prog.idPrograma);
      addClave(set, prog.idProg);
      addClave(set, prog._id);
      addClave(set, prog.codigoProg);
    }
  }
  cache.set(key, set);
  return set;
}

function setsSeSolapan(a, b) {
  for (const k of a) {
    if (b.has(k)) return true;
  }
  return false;
}

async function idsClasesMismoProgramaEnContrato(idContrato, idPrograma, exceptClaseId) {
  const cache = new Map();
  const clavesDestino = await clavesDePrograma(idPrograma, cache);
  const prog = idPrograma ? await buscarPrograma(idPrograma) : null;
  const programaNombre = String(prog?.nombreProg || prog?.codigoProg || idPrograma || '').trim();
  if (!idContrato || !idPrograma) {
    return { claseIds: [], programaNombre, clavesDestino };
  }

  const jornadas = await JornadaCap.find({ idContrato }).select('_id').lean();
  const jornadaIds = jornadas.map((j) => j._id);
  if (!jornadaIds.length) return { claseIds: [], programaNombre, clavesDestino };

  const except = String(exceptClaseId || '').trim();
  const clases = await ClaseJornadaCap.find({ idJornada: { $in: jornadaIds } })
    .select('_id idPrograma')
    .lean();

  const unicosProg = [
    ...new Set(clases.map((c) => String(c.idPrograma || '').trim()).filter(Boolean)),
  ];
  const clavesPorProg = new Map();
  for (const id of unicosProg) {
    clavesPorProg.set(id, await clavesDePrograma(id, cache));
  }

  const claseIds = [];
  for (const c of clases) {
    if (except && String(c._id) === except) continue;
    const raw = String(c.idPrograma || '').trim();
    if (!raw) continue;
    const claves = clavesPorProg.get(raw);
    if (claves && setsSeSolapan(clavesDestino, claves)) claseIds.push(c._id);
  }
  return { claseIds, programaNombre, clavesDestino };
}

function agregarNumDocs(dest, rows, field) {
  for (const row of rows || []) {
    const nd = parseNumDoc(row[field]);
    if (nd != null) dest.add(nd);
  }
}

async function numDocsQueYaTomaronProgramaEnContrato({
  idContrato,
  idPrograma,
  exceptClaseId,
  numDocs,
} = {}) {
  const docs = [...new Set((numDocs || []).map((n) => parseNumDoc(n)).filter((n) => n != null))];
  const tomaron = new Set();
  const { claseIds, programaNombre, clavesDestino } = await idsClasesMismoProgramaEnContrato(
    idContrato,
    idPrograma,
    exceptClaseId,
  );
  if (!docs.length) return { tomaron, programaNombre };

  if (claseIds.length) {
    const idsStr = claseIds.map((id) => String(id));
    const [insc, asis, certsClase] = await Promise.all([
      InscripcionClase.find({ idClase: { $in: claseIds }, numDoc: { $in: docs } })
        .select('numDoc')
        .lean(),
      AsisClasJorCap.find({
        numDocAlumno: { $in: docs },
        $or: [{ idclaseJornada: { $in: claseIds } }, { idclaseJornada: { $in: idsStr } }],
      })
        .select('numDocAlumno')
        .lean(),
      Certificado.find({
        numDoc: { $in: docs },
        idClaseJornada: { $in: claseIds },
        estado: { $ne: 'anulado' },
      })
        .select('numDoc')
        .lean(),
    ]);
    agregarNumDocs(tomaron, insc, 'numDoc');
    agregarNumDocs(tomaron, asis, 'numDocAlumno');
    agregarNumDocs(tomaron, certsClase, 'numDoc');
  }

  const idProgs = [...clavesDestino].filter(Boolean);
  if (idProgs.length && idContrato) {
    const certsProg = await Certificado.find({
      numDoc: { $in: docs },
      idContrato,
      idProg: { $in: idProgs },
      estado: { $ne: 'anulado' },
      idClaseJornada: { $ne: null },
    })
      .select('numDoc')
      .lean();
    agregarNumDocs(tomaron, certsProg, 'numDoc');
  }

  return { tomaron, programaNombre };
}

async function alumnoYaTomoProgramaEnContrato({
  numDoc,
  idContrato,
  idPrograma,
  exceptClaseId,
} = {}) {
  const nd = parseNumDoc(numDoc);
  const { tomaron, programaNombre } = await numDocsQueYaTomaronProgramaEnContrato({
    idContrato,
    idPrograma,
    exceptClaseId,
    numDocs: nd == null ? [] : [nd],
  });
  return {
    yaTomo: nd != null && tomaron.has(nd),
    programaNombre,
  };
}

function mensajeYaTomoPrograma({ nombreAlumno, programaNombre } = {}) {
  const quien = String(nombreAlumno || 'El alumno').trim() || 'El alumno';
  const prog = String(programaNombre || '').trim();
  const extra = prog ? ` «${prog}»` : '';
  return `${quien} ya tomó esta clase${extra} en este contrato. No se puede inscribir de nuevo.`;
}

module.exports = {
  alumnoYaTomoProgramaEnContrato,
  numDocsQueYaTomaronProgramaEnContrato,
  mensajeYaTomoPrograma,
};
