/**
 * Instructores asignados al contrato + reparto equitativo al autogenerar clases.
 * Solo instructores (cargo); auxiliar-carpa u otros roles no entran aquí.
 */
const Empleado = require('../models/Empleado');
const { nombreEmpleado } = require('./instructorJornada');

function normalizeIdProgramas(raw) {
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

function normalizarInstructoresPlan(raw) {
  if (!Array.isArray(raw)) return [];
  const seenEmp = new Set();
  const out = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const idEmpleado = Number(row.idEmpleado ?? row.idEmpleadoInstructor);
    if (!Number.isFinite(idEmpleado) || idEmpleado < 1) continue;
    if (seenEmp.has(idEmpleado)) continue;
    const idProgramas = normalizeIdProgramas(row.idProgramas);
    seenEmp.add(idEmpleado);
    out.push({
      orden: out.length + 1,
      idEmpleado,
      idUsuario: String(row.idUsuario || row.idUsuarioInstructor || '').trim(),
      nombre: String(row.nombre || row.nombreCompleto || row.idinstructor || '').trim(),
      idProgramas,
    });
  }
  return out;
}

function instructorElegibleParaPrograma(row, idPrograma) {
  const prog = String(idPrograma || '').trim();
  if (!prog || !row) return false;
  return (row.idProgramas || []).some((id) => {
    const a = String(id ?? '').trim();
    if (!a) return false;
    if (a === prog) return true;
    const na = Number(a);
    const np = Number(prog);
    return Number.isFinite(na) && Number.isFinite(np) && na === np;
  });
}

/** Carga (nº de clases) por idEmpleado en una jornada. */
function cargasInstructores(clases) {
  const map = new Map();
  for (const c of clases || []) {
    const id = Number(c.idEmpleadoInstructor);
    if (!Number.isFinite(id) || id < 1) continue;
    map.set(id, (map.get(id) || 0) + 1);
  }
  return map;
}

function aplicarCarga(cargas, idEmpleado) {
  const id = Number(idEmpleado);
  if (!Number.isFinite(id) || id < 1) return;
  cargas.set(id, (cargas.get(id) || 0) + 1);
}

/**
 * Un cupo por cada programa marcado en cada instructor (no se unifican programas).
 * Así 3 + 2 programas son 5 cupos, aunque compartan algún programa.
 */
function paresInstructorPrograma(plan, programasPermitidos) {
  const permitidos = Array.isArray(programasPermitidos) && programasPermitidos.length
    ? new Set(programasPermitidos.map((x) => String(x).trim()).filter(Boolean))
    : null;
  const pares = [];
  for (const row of plan || []) {
    for (const raw of row.idProgramas || []) {
      const idPrograma = String(raw ?? '').trim();
      if (!idPrograma) continue;
      if (permitidos && !permitidos.has(idPrograma)) continue;
      pares.push({ row, idPrograma });
    }
  }
  return pares;
}

/**
 * Una vuelta intercalada: evita bloques del mismo instructor (C,C,C,F,F)
 * y produce C,F,C,F,C cuando hay 3 y 2 programas.
 */
function secuenciaParesIntercalada(pares) {
  if (!Array.isArray(pares) || !pares.length) return [];
  const groups = [];
  const idx = new Map();
  for (const p of pares) {
    const id = Number(p.row?.idEmpleado);
    if (!Number.isFinite(id) || id < 1) continue;
    if (!idx.has(id)) {
      idx.set(id, groups.length);
      groups.push({ row: p.row, programas: [] });
    }
    groups[idx.get(id)].programas.push(p.idPrograma);
  }
  const queues = groups.map((g) => ({ row: g.row, programas: g.programas.slice() }));
  const total = queues.reduce((n, q) => n + q.programas.length, 0);
  const seq = [];
  let lastEmp = null;
  while (seq.length < total) {
    let best = null;
    let bestConsec = 0;
    let bestUsed = 0;
    let bestOrden = 0;
    for (const q of queues) {
      if (!q.programas.length) continue;
      const emp = Number(q.row.idEmpleado);
      const used = seq.filter((s) => Number(s.row.idEmpleado) === emp).length;
      const consec = lastEmp != null && emp === lastEmp ? 1 : 0;
      const orden = q.row.orden || 0;
      const better =
        !best ||
        consec < bestConsec ||
        (consec === bestConsec && used < bestUsed) ||
        (consec === bestConsec && used === bestUsed && orden < bestOrden);
      if (better) {
        best = q;
        bestConsec = consec;
        bestUsed = used;
        bestOrden = orden;
      }
    }
    if (!best) break;
    seq.push({ row: best.row, idPrograma: best.programas.shift() });
    lastEmp = Number(best.row.idEmpleado);
  }
  return seq;
}

function parEnIndice(secuencia, indiceGlobal) {
  if (!Array.isArray(secuencia) || !secuencia.length) return null;
  const idx = Math.max(0, parseInt(indiceGlobal, 10) || 0) % secuencia.length;
  return secuencia[idx] || null;
}

function secuenciaParaJornada(secuenciaBase, n) {
  const base = (Array.isArray(secuenciaBase) ? secuenciaBase : []).filter(
    (p) => p && instructorElegibleParaPrograma(p.row, p.idPrograma),
  );
  const total = Math.max(0, parseInt(n, 10) || 0);
  if (!base.length || total < 1) return [];
  const chosen = [];
  for (let i = 0; i < total; i += 1) {
    chosen.push(base[i % base.length]);
  }
  return secuenciaParesIntercalada(chosen).filter(
    (p) => p && instructorElegibleParaPrograma(p.row, p.idPrograma),
  );
}

/** N cupos: cicla los pares intercalados. Nunca mezcla el programa de un instructor con otro. */
function cuposAutogeneracionClases(plan, n) {
  return secuenciaParaJornada(secuenciaParesIntercalada(paresInstructorPrograma(plan)), n);
}

function programaPropioDelInstructor(row, idPrograma) {
  if (instructorElegibleParaPrograma(row, idPrograma)) return String(idPrograma || '').trim();
  const propios = (row?.idProgramas || []).map((id) => String(id ?? '').trim()).filter(Boolean);
  return propios[0] || '';
}

/**
 * Elige al instructor con menos clases en la jornada entre quienes dictan ese programa.
 * Empate: el de menor orden en la lista (rotación estable).
 * Legado: solo si no hay pares instructor-programa para intercalar.
 */
function elegirInstructorEquitativo(plan, idPrograma, cargas) {
  const elegibles = (plan || []).filter((r) => instructorElegibleParaPrograma(r, idPrograma));
  if (!elegibles.length) return null;
  let best = elegibles[0];
  let bestCarga = cargas.get(Number(best.idEmpleado)) || 0;
  for (let i = 1; i < elegibles.length; i += 1) {
    const row = elegibles[i];
    const carga = cargas.get(Number(row.idEmpleado)) || 0;
    const ordenA = best.orden || 0;
    const ordenB = row.orden || 0;
    if (carga < bestCarga || (carga === bestCarga && ordenB < ordenA)) {
      best = row;
      bestCarga = carga;
    }
  }
  return best;
}

function mismaIdUsuario(a, b) {
  const x = String(a || '').trim();
  const y = String(b || '').trim();
  if (!x || !y) return false;
  return x === y || x.toLowerCase() === y.toLowerCase();
}

function filaInstructorEnPlan(plan, ident) {
  const rows = normalizarInstructoresPlan(plan);
  if (!rows.length) return { hayPlan: false, row: null };
  const emp = Number(ident?.idEmpleado ?? ident?.idEmpleadoInstructor);
  const uids = [ident?.idUsuario, ident?.idUsuarioInstructor]
    .map((x) => String(x || '').trim())
    .filter(Boolean);
  const row =
    rows.find((r) => {
      if (Number.isFinite(emp) && emp > 0 && Number(r.idEmpleado) === emp) return true;
      return uids.some((uid) => mismaIdUsuario(uid, r.idUsuario));
    }) || null;
  return { hayPlan: true, row };
}

function idsProgramasDeInstructorEnPlan(plan, ident) {
  const { hayPlan, row } = filaInstructorEnPlan(plan, ident);
  if (!hayPlan) return null;
  if (!row) return [];
  return [...(row.idProgramas || [])];
}

/**
 * Si el operador está en Instructores y programas, solo puede usar esos ids.
 * Admin que no está en el plan: opts.permitirSiNoEstaEnPlan.
 */
async function assertProgramaPermitidoInstructor(contrato, ident, idPrograma, opts = {}) {
  const id = String(idPrograma ?? '').trim();
  if (!id) return;
  const { hayPlan, row } = filaInstructorEnPlan(contrato?.instructoresPlan, ident);
  if (!hayPlan) return;
  if (!row) {
    if (opts.permitirSiNoEstaEnPlan) return;
    const err = new Error(
      'No tiene programas asignados en este contrato. Pida que lo agreguen en Instructores y programas.',
    );
    err.status = 400;
    err.codigo = 'instructor_sin_programas_contrato';
    throw err;
  }
  const ids = row.idProgramas || [];
  if (!ids.length) {
    const err = new Error(
      'No tiene programas asignados en este contrato. Pida que lo agreguen en Instructores y programas.',
    );
    err.status = 400;
    err.codigo = 'instructor_sin_programas_contrato';
    throw err;
  }
  const { programaEstaEnListaPermitida } = require('./programasContratoJornada');
  if (!(await programaEstaEnListaPermitida(id, ids))) {
    const err = new Error('Solo puede elegir los programas que dicta en este contrato.');
    err.status = 400;
    err.codigo = 'programa_no_permitido_instructor';
    throw err;
  }
}

async function mapaDatosInstructoresPlan(plan) {
  const ids = [
    ...new Set(
      (plan || [])
        .map((r) => Number(r.idEmpleado))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  ];
  const map = new Map();
  if (!ids.length) return map;
  const emps = await Empleado.find({ idEmpleado: { $in: ids } }).lean();
  for (const e of emps) {
    map.set(Number(e.idEmpleado), {
      idEmpleadoInstructor: e.idEmpleado,
      idUsuarioInstructor: e.idUsuario != null ? String(e.idUsuario) : '',
      idinstructor: nombreEmpleado(e),
    });
  }
  for (const row of plan || []) {
    const id = Number(row.idEmpleado);
    if (!Number.isFinite(id) || map.has(id)) continue;
    map.set(id, {
      idEmpleadoInstructor: id,
      idUsuarioInstructor: String(row.idUsuario || ''),
      idinstructor: String(row.nombre || ''),
    });
  }
  return map;
}

module.exports = {
  normalizarInstructoresPlan,
  cargasInstructores,
  aplicarCarga,
  elegirInstructorEquitativo,
  mapaDatosInstructoresPlan,
  instructorElegibleParaPrograma,
  paresInstructorPrograma,
  secuenciaParesIntercalada,
  parEnIndice,
  secuenciaParaJornada,
  cuposAutogeneracionClases,
  programaPropioDelInstructor,
  idsProgramasDeInstructorEnPlan,
  filaInstructorEnPlan,
  assertProgramaPermitidoInstructor,
};
