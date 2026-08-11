const mongoose = require('mongoose');
const { parseNumDoc } = require('../utils/numDoc');
const JornadaCap = require('../models/JornadaCap');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const AsisClasJorCap = require('../models/AsisClasJorCap');
const Empleado = require('../models/Empleado');
const { resolverCarpaDesdePrograma } = require('./carpaJornada');
const { buscarPrograma } = require('./programaServicio');
const { nombreEmpleado } = require('./instructorJornada');

/** Clave única programa + instructor (misma capacitación con distinto instructor = otra fila). */
function claveProgramaInstructor(idProg, idEmpleadoInstructor, idinstructor) {
  const prog = String(idProg || '').trim();
  const inst =
    idEmpleadoInstructor != null && Number.isFinite(Number(idEmpleadoInstructor))
      ? String(Number(idEmpleadoInstructor))
      : String(idinstructor || '').trim();
  return `${prog}|${inst}`;
}

function filtroNumDocAsistencia(numDoc) {
  const n = parseNumDoc(numDoc);
  if (n == null) return null;
  return { numDocAlumno: { $in: [n, String(n)] } };
}

function nombreCapacitacionDesdePrograma(prog, progId) {
  const nom = String(prog?.nombreProg || prog?.descripcion || prog?.nomCert || '').trim();
  if (nom) return nom;
  const id = String(progId || prog?.idProg || '').trim();
  return id ? `Programa ${id}` : 'Capacitación';
}
function normalizarIdContrato(idContratoRaw) {
  if (!idContratoRaw) return null;
  if (idContratoRaw instanceof mongoose.Types.ObjectId) return idContratoRaw;
  const s = String(idContratoRaw);
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
}

/**
 * Carpeta distintas en las que el alumno registró asistencia dentro del contrato
 * (no por certificado emitido).
 */
async function carpasAsistidasAlumnoContrato(numDoc, idContratoRaw) {
  if (numDoc == null) return [];
  const idContrato = normalizarIdContrato(idContratoRaw);
  if (!idContrato) return [];

  const jornadaIds = await JornadaCap.find({ idContrato }).distinct('_id');
  if (!jornadaIds.length) return [];

  const clases = await ClaseJornadaCap.find({ idJornada: { $in: jornadaIds } })
    .select('_id idPrograma idCarpa idEmpleadoInstructor idinstructor fechaClase updatedAt')
    .lean();
  if (!clases.length) return [];

  const claseMap = new Map(clases.map((c) => [String(c._id), c]));
  const filtroDoc = filtroNumDocAsistencia(numDoc);
  if (!filtroDoc) return [];

  const asistencias = await AsisClasJorCap.find({
    ...filtroDoc,
    idclaseJornada: { $in: clases.map((c) => c._id) },
  })
    .select('idclaseJornada')
    .lean();

  const progCache = new Map();
  const carpasMap = new Map();

  const fechaClaseMs = (cl) => {
    const f = cl?.fechaClase ? new Date(cl.fechaClase).getTime() : 0;
    const u = cl?.updatedAt ? new Date(cl.updatedAt).getTime() : 0;
    return Math.max(f, u);
  };

  for (const a of asistencias) {
    const cl = claseMap.get(String(a.idclaseJornada));
    if (!cl) continue;

    const progId = String(cl.idPrograma || '').trim();
    let prog = progCache.get(progId);
    if (prog === undefined) {
      prog = progId ? await buscarPrograma(progId) : null;
      progCache.set(progId, prog);
    }

    const carpa = await resolverCarpaDesdePrograma(prog, cl.idCarpa);
    let key = claveProgramaInstructor(progId, cl.idEmpleadoInstructor, cl.idinstructor);
    if (!key || key === '|') {
      const idCarpaFb = carpa.idCarpa ?? cl.idCarpa;
      if (idCarpaFb != null) key = `carpa:${idCarpaFb}`;
      else key = `clase:${String(cl._id)}`;
    }

    const nombreCapacitacion =
      carpa.carpaNombre || nombreCapacitacionDesdePrograma(prog, progId);

    const prev = carpasMap.get(key);
    const entry = {
      idCarpa: carpa.idCarpa,
      nombre: nombreCapacitacion,
      idProg: progId || String(prog?.idProg || '').trim(),
      programaNombre: prog?.nombreProg || prog?.descripcion || prog?.nomCert || '',
      idEmpleadoInstructor: cl.idEmpleadoInstructor ?? null,
      idinstructor: String(cl.idinstructor || '').trim(),
      _claseTs: fechaClaseMs(cl),
    };
    if (!prev || entry._claseTs >= prev._claseTs) {
      carpasMap.set(key, entry);
    }
  }

  const empIds = [
    ...new Set(
      [...carpasMap.values()]
        .map((c) => c.idEmpleadoInstructor)
        .filter((x) => x != null && Number.isFinite(Number(x))),
    ),
  ];
  const empleados = empIds.length
    ? await Empleado.find({ idEmpleado: { $in: empIds } }).lean()
    : [];
  const empMap = new Map(empleados.map((e) => [Number(e.idEmpleado), e]));

  const out = [];
  for (const c of carpasMap.values()) {
    const emp =
      c.idEmpleadoInstructor != null ? empMap.get(Number(c.idEmpleadoInstructor)) : null;
    out.push({
      idCarpa: c.idCarpa,
      nombre: c.nombre,
      idProg: c.idProg,
      programaNombre: c.programaNombre,
      idEmpleadoInstructor: c.idEmpleadoInstructor ?? null,
      instructorNombre: emp ? nombreEmpleado(emp) : c.idinstructor || '',
      clave: claveProgramaInstructor(c.idProg, c.idEmpleadoInstructor, c.idinstructor),
    });
  }

  return out.sort((x, y) => String(x.nombre).localeCompare(String(y.nombre), 'es'));
}

/** Ids de contrato donde el alumno tiene al menos una asistencia en alguna clase. */
async function contratosConCarpasAsistidas(numDoc) {
  const filtroDoc = filtroNumDocAsistencia(numDoc);
  if (!filtroDoc) return [];

  const asistencias = await AsisClasJorCap.find(filtroDoc)
    .select('idclaseJornada')
    .lean();
  if (!asistencias.length) return [];

  const claseIds = [...new Set(asistencias.map((a) => a.idclaseJornada))];
  const clases = await ClaseJornadaCap.find({ _id: { $in: claseIds } })
    .select('idJornada')
    .lean();
  if (!clases.length) return [];

  const jornadaIds = [...new Set(clases.map((c) => c.idJornada))];
  const jornadas = await JornadaCap.find({ _id: { $in: jornadaIds } })
    .select('idContrato')
    .lean();

  return [
    ...new Set(
      jornadas.map((j) => String(j.idContrato)).filter((id) => id && id !== 'null'),
    ),
  ];
}

module.exports = {
  carpasAsistidasAlumnoContrato,
  contratosConCarpasAsistidas,
  claveProgramaInstructor,
};
