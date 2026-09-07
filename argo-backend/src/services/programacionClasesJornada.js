const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const JornadaCap = require('../models/JornadaCap');
const { inicioDia } = require('./estadoJornadaCap');
const {
  programaRoundRobin,
  contarClasesContrato,
  resolverProgramaAutogeneracion,
} = require('./programasContratoJornada');
const { programasAutogeneracionContrato } = require('../constants/origenJornadaCap');
const { clasesPorJornadaParaJornada } = require('../constants/municipiosPlanContrato');
const {
  normalizarInstructoresPlan,
  mapaDatosInstructoresPlan,
  instructorElegibleParaPrograma,
  cuposAutogeneracionClases,
} = require('./instructoresPlanContrato');

/**
 * El programa de la clase es el del par (instructor, programa del contrato).
 * Si el catálogo devuelve otro id, solo se usa si ese instructor también lo dicta.
 */
async function asignarDesdeParInstructor(par) {
  if (!par?.row || par.idPrograma == null) return null;
  const idPlan = String(par.idPrograma).trim();
  if (!idPlan || !instructorElegibleParaPrograma(par.row, idPlan)) return null;
  const resolved = await resolverProgramaAutogeneracion(idPlan);
  const canon = resolved?.idPrograma != null ? String(resolved.idPrograma).trim() : '';
  if (canon && instructorElegibleParaPrograma(par.row, canon)) {
    return { row: par.row, idPrograma: canon, idCarpa: resolved.idCarpa ?? null };
  }
  return { row: par.row, idPrograma: idPlan, idCarpa: null };
}

/** Índices 1..N de clases en la jornada. La hora se asigna al operar, no al programar. */
function indicesClasesJornada(clasesPorJornada) {
  const n = Math.max(1, Math.min(20, parseInt(clasesPorJornada, 10) || 1));
  return Array.from({ length: n }, (_, i) => i + 1);
}

/**
 * Crea clases faltantes en una jornada hasta las clases/jornada del municipio (o del contrato).
 */
async function generarClasesFaltantesJornada(jornada, contrato, userLogin = '') {
  const meta = clasesPorJornadaParaJornada(jornada, contrato);
  if (meta < 1 || !jornada?._id) return { creadas: 0, total: 0 };

  const existentes = await ClaseJornadaCap.find({ idJornada: jornada._id })
    .sort({ indiceClaseEnJornada: 1, createdAt: 1 })
    .lean();

  const total = existentes.length;
  if (total >= meta) return { creadas: 0, total };

  /** Intensidad horaria del certificado (copiada a la clase); no es hora de inicio/fin. */
  const horasCert = Math.max(0, Number(contrato.horasPorClase) || 0);
  const indices = indicesClasesJornada(meta);
  const indicesOcupados = new Set(
    existentes.map((c) => Math.max(1, parseInt(c.indiceClaseEnJornada, 10) || 0)),
  );

  const contratoPlain =
    contrato && typeof contrato.toObject === 'function' ? contrato.toObject() : contrato || {};
  const planInst = normalizarInstructoresPlan(contratoPlain.instructoresPlan);
  const cupos = cuposAutogeneracionClases(planInst, meta);
  const usarPares = cupos.length > 0;
  const programasContrato = usarPares ? [] : programasAutogeneracionContrato(contratoPlain);

  let indiceGlobal =
    !usarPares && programasContrato.length && contratoPlain?._id
      ? await contarClasesContrato(contratoPlain._id)
      : 0;

  const datosInst = planInst.length ? await mapaDatosInstructoresPlan(planInst) : new Map();

  const docs = [];
  for (const indiceClaseEnJornada of indices) {
    if (indicesOcupados.has(indiceClaseEnJornada)) continue;
    if (docs.length >= meta - total) break;

    let idPrograma = '';
    let idCarpa = null;
    let rowElegido = null;
    if (usarPares) {
      const par = cupos[indiceClaseEnJornada - 1] || cupos[docs.length % cupos.length] || null;
      const asig = await asignarDesdeParInstructor(par);
      if (!asig) continue;
      rowElegido = asig.row;
      idPrograma = asig.idPrograma;
      idCarpa = asig.idCarpa;
    } else if (programasContrato.length) {
      const idProg = programaRoundRobin(programasContrato, indiceGlobal);
      const resolved = await resolverProgramaAutogeneracion(idProg);
      if (resolved) {
        idPrograma = resolved.idPrograma;
        idCarpa = resolved.idCarpa;
      }
      indiceGlobal += 1;
    }

    if (rowElegido && idPrograma && !instructorElegibleParaPrograma(rowElegido, idPrograma)) {
      continue;
    }

    let idEmpleadoInstructor = null;
    let idUsuarioInstructor = null;
    let idinstructor = null;
    if (rowElegido) {
      const datos = datosInst.get(Number(rowElegido.idEmpleado));
      if (datos) {
        idEmpleadoInstructor = datos.idEmpleadoInstructor;
        idUsuarioInstructor = datos.idUsuarioInstructor || null;
        idinstructor = datos.idinstructor || null;
      }
    }

    if (
      idEmpleadoInstructor &&
      idPrograma &&
      !instructorElegibleParaPrograma(
        planInst.find((r) => Number(r.idEmpleado) === Number(idEmpleadoInstructor)),
        idPrograma,
      )
    ) {
      continue;
    }

    docs.push({
      idJornada: jornada._id,
      fechaClase: inicioDia(jornada.fechaProgramacion),
      idPrograma,
      idCarpa,
      ubicacion: 'Carpa',
      estado: 'PROGRAMADA',
      indiceClaseEnJornada,
      horaInicio: null,
      horaFin: null,
      horarioManual: false,
      horasCertificadas: horasCert > 0 ? horasCert : null,
      idEmpleadoInstructor,
      idUsuarioInstructor,
      idinstructor,
      userAddReg: userLogin,
    });
    indicesOcupados.add(indiceClaseEnJornada);
  }

  if (!docs.length) return { creadas: 0, total };

  await ClaseJornadaCap.insertMany(docs);
  return { creadas: docs.length, total: total + docs.length };
}

/** Genera clases faltantes en todas las jornadas del contrato (meta por municipio del plan). */
async function generarClasesFaltantesContrato(contrato, userLogin = '') {
  if (!contrato?._id) return { clasesCreadas: 0, jornadasProcesadas: 0 };
  const contratoPlain =
    contrato && typeof contrato.toObject === 'function' ? contrato.toObject() : contrato;

  const jornadas = await JornadaCap.find({ idContrato: contratoPlain._id })
    .sort({ fechaProgramacion: 1, indiceEnDia: 1 })
    .lean();

  let clasesCreadas = 0;
  let jornadasProcesadas = 0;
  for (const j of jornadas) {
    if (clasesPorJornadaParaJornada(j, contratoPlain) < 1) continue;
    jornadasProcesadas += 1;
    const r = await generarClasesFaltantesJornada(j, contratoPlain, userLogin);
    clasesCreadas += r.creadas;
  }
  return { clasesCreadas, jornadasProcesadas };
}

module.exports = {
  indicesClasesJornada,
  generarClasesFaltantesJornada,
  generarClasesFaltantesContrato,
};
