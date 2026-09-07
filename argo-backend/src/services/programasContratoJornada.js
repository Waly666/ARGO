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
  const raw = prog.idPrograma != null && String(prog.idPrograma).trim() !== ''
    ? prog.idPrograma
    : prog.idProg != null && String(prog.idProg).trim() !== ''
      ? prog.idProg
      : prog._id != null
        ? prog._id
        : '';
  return raw != null && String(raw).trim() !== '' ? String(raw).trim() : '';
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

async function programaEstaEnListaPermitida(idPrograma, lista) {
  const raw = String(idPrograma ?? '').trim();
  const allowed = normalizeIdProgramasContrato(lista);
  if (!raw || !allowed.length) return false;
  if (allowed.some((x) => x === raw)) return true;
  const prog = await buscarPrograma(raw);
  const canon = idProgramaCanonico(prog);
  if (canon && allowed.some((x) => x === canon)) return true;
  for (const id of allowed) {
    if (id === raw || (canon && id === canon)) continue;
    const p = await buscarPrograma(id);
    const c = idProgramaCanonico(p);
    if (c && (c === raw || c === canon)) return true;
  }
  return false;
}

/**
 * En origen por_clase el programa de la clase debe estar en la lista de ese origen.
 * Origen global: cualquier programa de Jornadas (ya validado por el caller).
 */
async function assertProgramaPermitidoEnOrigen(contrato, origenOperacion, idPrograma) {
  const id = String(idPrograma ?? '').trim();
  if (!id) return;
  const {
    origenEsCertPorClase,
    idsProgramasPorClaseOrigen,
    ORIGEN_JORNADA_LABELS,
    normalizarOrigenJornadaCap,
  } = require('../constants/origenJornadaCap');
  const origen = normalizarOrigenJornadaCap(origenOperacion);
  if (!origen || !origenEsCertPorClase(contrato, origen)) return;
  const permitidos = idsProgramasPorClaseOrigen(contrato, origen);
  const label = ORIGEN_JORNADA_LABELS[origen] || origen;
  if (!permitidos.length) {
    const err = new Error(
      `El origen «${label}» está en certificación por clase y no tiene programas configurados en el contrato.`,
    );
    err.status = 400;
    err.codigo = 'programas_origen_vacios';
    throw err;
  }
  if (!(await programaEstaEnListaPermitida(id, permitidos))) {
    const err = new Error(
      `El programa no está permitido para el origen «${label}». Elija uno de los programas configurados en el contrato.`,
    );
    err.status = 400;
    err.codigo = 'programa_no_permitido_origen';
    throw err;
  }
}

async function normalizarYValidarCertificacionOrigenProgramas(certificacionOrigen) {
  const { ORIGENES_JORNADA_CAP, normalizarTipoCertContrato } = require('../constants/origenJornadaCap');
  if (!certificacionOrigen || typeof certificacionOrigen !== 'object') return certificacionOrigen;
  for (const k of ORIGENES_JORNADA_CAP) {
    const row = certificacionOrigen[k];
    if (!row || typeof row !== 'object') continue;
    if (normalizarTipoCertContrato(row.tipoCertificado) !== 'por_clase') {
      row.idProgramas = normalizeIdProgramasContrato(row.idProgramas);
      continue;
    }
    row.idProgramas = await normalizarYValidarProgramasContrato(row.idProgramas);
  }
  return certificacionOrigen;
}

module.exports = {
  normalizeIdProgramasContrato,
  programaRoundRobin,
  normalizarYValidarProgramasContrato,
  contarClasesContrato,
  resolverProgramaAutogeneracion,
  idProgramaCanonico,
  programaEstaEnListaPermitida,
  assertProgramaPermitidoEnOrigen,
  normalizarYValidarCertificacionOrigenProgramas,
};
