const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const JornadaCap = require('../models/JornadaCap');
const { inicioDia } = require('./estadoJornadaCap');
const {
  normalizeIdProgramasContrato,
  programaRoundRobin,
  contarClasesContrato,
  resolverProgramaAutogeneracion,
} = require('./programasContratoJornada');

/** Ventana horaria diaria para repartir clases autogeneradas (8:00–17:00). */
const HORA_DIA_INICIO = 8;
const HORA_DIA_FIN = 17;

/**
 * Calcula horaInicio/horaFin para N clases en un mismo día.
 * @returns {{ horaInicio: Date, horaFin: Date, indiceClaseEnJornada: number }[]}
 */
function horariosClasesJornada(fechaProgramacion, clasesPorJornada) {
  const n = Math.max(1, Math.min(20, parseInt(clasesPorJornada, 10) || 1));
  const base = inicioDia(fechaProgramacion);
  if (!base) return [];

  const totalMin = (HORA_DIA_FIN - HORA_DIA_INICIO) * 60;
  const slotMin = Math.max(30, Math.floor(totalMin / n));
  const out = [];

  for (let i = 0; i < n; i += 1) {
    const startMin = HORA_DIA_INICIO * 60 + i * slotMin;
    const endMin = Math.min(HORA_DIA_FIN * 60, startMin + slotMin);
    const horaInicio = new Date(base);
    horaInicio.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
    const horaFin = new Date(base);
    horaFin.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
    out.push({ horaInicio, horaFin, indiceClaseEnJornada: i + 1 });
  }
  return out;
}

/**
 * Crea clases faltantes en una jornada hasta `contrato.clasesPorJornada`.
 */
async function generarClasesFaltantesJornada(jornada, contrato, userLogin = '') {
  const meta = Math.max(0, parseInt(contrato?.clasesPorJornada, 10) || 0);
  if (meta < 1 || !jornada?._id) return { creadas: 0, total: 0 };

  const existentes = await ClaseJornadaCap.find({ idJornada: jornada._id })
    .sort({ indiceClaseEnJornada: 1, createdAt: 1 })
    .lean();

  const total = existentes.length;
  if (total >= meta) return { creadas: 0, total };

  /** Intensidad horaria del certificado (copiada a la clase); no afecta horaInicio/horaFin. */
  const horasCert = Math.max(0, Number(contrato.horasPorClase) || 0);
  const horarios = horariosClasesJornada(jornada.fechaProgramacion, meta);
  const indicesOcupados = new Set(
    existentes.map((c) => Math.max(1, parseInt(c.indiceClaseEnJornada, 10) || 0)),
  );

  const programasContrato = normalizeIdProgramasContrato(contrato?.idProgramas);
  let indiceGlobal =
    programasContrato.length && contrato?._id ? await contarClasesContrato(contrato._id) : 0;

  const docs = [];
  for (const slot of horarios) {
    if (indicesOcupados.has(slot.indiceClaseEnJornada)) continue;
    if (docs.length >= meta - total) break;

    let idPrograma = '';
    let idCarpa = null;
    if (programasContrato.length) {
      const idProg = programaRoundRobin(programasContrato, indiceGlobal);
      const resolved = await resolverProgramaAutogeneracion(idProg);
      if (resolved) {
        idPrograma = resolved.idPrograma;
        idCarpa = resolved.idCarpa;
      }
      indiceGlobal += 1;
    }

    docs.push({
      idJornada: jornada._id,
      fechaClase: inicioDia(jornada.fechaProgramacion),
      idPrograma,
      idCarpa,
      ubicacion: 'Carpa',
      estado: 'PROGRAMADA',
      indiceClaseEnJornada: slot.indiceClaseEnJornada,
      horaInicio: slot.horaInicio,
      horaFin: slot.horaFin,
      horasCertificadas: horasCert > 0 ? horasCert : null,
      // Sin instructor: se asigna al programar/operar la clase.
      idEmpleadoInstructor: null,
      idUsuarioInstructor: null,
      idinstructor: null,
      userAddReg: userLogin,
    });
    indicesOcupados.add(slot.indiceClaseEnJornada);
  }

  if (!docs.length) return { creadas: 0, total };

  await ClaseJornadaCap.insertMany(docs);
  return { creadas: docs.length, total: total + docs.length };
}

/** Genera clases faltantes en todas las jornadas del contrato. */
async function generarClasesFaltantesContrato(contrato, userLogin = '') {
  if (!contrato?._id) return { clasesCreadas: 0, jornadasProcesadas: 0 };
  const meta = Math.max(0, parseInt(contrato.clasesPorJornada, 10) || 0);
  if (meta < 1) return { clasesCreadas: 0, jornadasProcesadas: 0 };

  const jornadas = await JornadaCap.find({ idContrato: contrato._id })
    .sort({ fechaProgramacion: 1, indiceEnDia: 1 })
    .lean();

  let clasesCreadas = 0;
  for (const j of jornadas) {
    const r = await generarClasesFaltantesJornada(j, contrato, userLogin);
    clasesCreadas += r.creadas;
  }
  return { clasesCreadas, jornadasProcesadas: jornadas.length };
}

module.exports = {
  horariosClasesJornada,
  generarClasesFaltantesJornada,
  generarClasesFaltantesContrato,
  HORA_DIA_INICIO,
  HORA_DIA_FIN,
};
