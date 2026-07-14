const JornadaCap = require('../models/JornadaCap');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const { buscarPrograma } = require('./programaServicio');
const { esProgramaJornadasCap } = require('./jornadaCapacitacion');
const { resolverCarpaDesdePrograma } = require('./carpaJornada');

function normalizeIdProgramasContrato(raw) {
  const list = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
  const out = [];
  const seen = new Set();
  for (const item of list) {
    const id = String(item ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function idProgramaCanonico(prog) {
  if (!prog) return '';
  const id = prog.idPrograma != null && String(prog.idPrograma).trim() !== ''
    ? String(prog.idPrograma).trim()
    : prog._id != null
      ? String(prog._id)
      : '';
  return id;
}

/** Reparto equitativo en orden (A, B, C, A, B, C…). */
function programaRoundRobin(idProgramas, indiceGlobal) {
  const list = normalizeIdProgramasContrato(idProgramas);
  if (!list.length) return '';
  const idx = Math.max(0, parseInt(indiceGlobal, 10) || 0);
  return list[idx % list.length];
}

async function normalizarYValidarProgramasContrato(raw) {
  const ids = normalizeIdProgramasContrato(raw);
  if (!ids.length) return [];

  const out = [];
  const seen = new Set();
  for (const id of ids) {
    const prog = await buscarPrograma(id);
    if (!prog) {
      const err = new Error(`Programa no encontrado: ${id}`);
      err.status = 400;
      throw err;
    }
    if (!(await esProgramaJornadasCap(prog))) {
      const err = new Error(
        `El programa «${prog.nombreProg || prog.codigoProg || id}» no es de Jornadas de Capacitación.`,
      );
      err.status = 400;
      throw err;
    }
    const canon = idProgramaCanonico(prog);
    if (!canon || seen.has(canon)) continue;
    seen.add(canon);
    out.push(canon);
  }
  return out;
}

async function contarClasesContrato(idContrato) {
  if (!idContrato) return 0;
  const jornadaIds = await JornadaCap.find({ idContrato }).distinct('_id');
  if (!jornadaIds.length) return 0;
  return ClaseJornadaCap.countDocuments({ idJornada: { $in: jornadaIds } });
}

async function resolverProgramaAutogeneracion(idPrograma) {
  const id = String(idPrograma ?? '').trim();
  if (!id) return null;
  const prog = await buscarPrograma(id);
  if (!prog || !(await esProgramaJornadasCap(prog))) return null;
  const canon = idProgramaCanonico(prog);
  const carpa = await resolverCarpaDesdePrograma(prog);
  return {
    idPrograma: canon,
    idCarpa: carpa?.idCarpa ?? null,
    horas: prog?.horas != null ? Number(prog.horas) : null,
  };
}

module.exports = {
  normalizeIdProgramasContrato,
  programaRoundRobin,
  normalizarYValidarProgramasContrato,
  contarClasesContrato,
  resolverProgramaAutogeneracion,
  idProgramaCanonico,
};
