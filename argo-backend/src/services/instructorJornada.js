const Empleado = require('../models/Empleado');
const InscripcionClase = require('../models/InscripcionClase');
const { buscarPrograma } = require('./programaServicio');
const Usuario = require('../models/Usuario');
const Cargo = require('../models/Cargo');
const { tieneAlguno, permisosParaRol } = require('./rolesPermisos');
const { normalizarRol } = require('../utils/roles');

function nombreEmpleado(emp) {
  if (!emp) return '';
  return [emp.primerNombre, emp.segundoNombre, emp.primerApellido, emp.segundoApellido]
    .filter(Boolean)
    .join(' ')
    .trim();
}

async function cargoNombre(cargoId) {
  if (!cargoId) return '';
  const c = await Cargo.findOne({ idCargo: cargoId }).lean();
  return String(c?.nombre || '').trim();
}

async function esEmpleadoInstructor(emp) {
  if (!emp) return false;
  const nom = await cargoNombre(emp.cargoId);
  return /\binstructor/i.test(nom);
}

/** Permisos que habilitan operar el portal / clases como instructor (sin exigir cargo). */
function permisosOperarComoInstructor(permisos) {
  return tieneAlguno(permisos || [], [
    '*',
    'instructores.mi_portal',
    'jornadas.operar',
    'programacion_cea.operar',
    'jornadas.gestionar',
  ]);
}

async function empleadoPuedeActuarComoInstructor(emp, permisos) {
  if (!emp) return false;
  if (await esEmpleadoInstructor(emp)) return true;
  return permisosOperarComoInstructor(permisos);
}

async function empleadoPorUsuarioId(userId) {
  if (!userId) return null;
  const uid = String(userId);
  const u = await Usuario.findById(userId).lean();

  // 1) Empleado que declara este usuario (fuente de verdad del vínculo).
  const porUsuario = await Empleado.findOne({ idUsuario: userId }).lean();
  if (porUsuario) return porUsuario;
  // idUsuario a veces se guardó como string
  const porUsuarioStr = await Empleado.findOne({ idUsuario: uid }).lean();
  if (porUsuarioStr) return porUsuarioStr;

  // 2) Usuario.idEmpleado solo con vínculo bidireccional (evita admin → empleado ajeno).
  if (u?.idEmpleado != null && Number.isFinite(Number(u.idEmpleado))) {
    const emp = await Empleado.findOne({ idEmpleado: Number(u.idEmpleado) }).lean();
    if (emp) {
      const empUid = emp.idUsuario != null ? String(emp.idUsuario).trim() : '';
      if (empUid && empUid === uid) return emp;
    }
  }
  return null;
}

async function resolverInstructorParaClase(req, body = {}) {
  const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
  const puedeAsignar = tieneAlguno(permisos, ['jornadas.gestionar']);

  let idEmpleadoRaw = body.idEmpleadoInstructor ?? body.idEmpleado;
  if (idEmpleadoRaw != null && idEmpleadoRaw !== '' && puedeAsignar) {
    const idEmpleado = Number(idEmpleadoRaw);
    if (!Number.isFinite(idEmpleado)) {
      const err = new Error('idEmpleadoInstructor inválido');
      err.status = 400;
      throw err;
    }
    const emp = await Empleado.findOne({ idEmpleado }).lean();
    if (!emp) {
      const err = new Error('Empleado instructor no encontrado');
      err.status = 404;
      throw err;
    }
    if (!emp.idUsuario) {
      const err = new Error('El empleado seleccionado no tiene usuario de login vinculado');
      err.status = 400;
      throw err;
    }
    return {
      idEmpleadoInstructor: emp.idEmpleado,
      idUsuarioInstructor: String(emp.idUsuario),
      idinstructor: nombreEmpleado(emp),
      instructorNombre: nombreEmpleado(emp),
    };
  }

  const emp = await empleadoPorUsuarioId(req.user?.sub);
  if (!emp) {
    const err = new Error(
      'Su usuario debe estar vinculado a un empleado en RRHH para crear u operar clases.',
    );
    err.status = 400;
    throw err;
  }
  if (!emp.idUsuario) {
    const err = new Error('El empleado vinculado no tiene usuario de login. Solicite acceso en RRHH.');
    err.status = 400;
    throw err;
  }
  if (!(await empleadoPuedeActuarComoInstructor(emp, permisos)) && !puedeAsignar) {
    const err = new Error(
      'No tiene permiso para operar como instructor. Solicite el permiso del portal de instructores o vincule un cargo de instructor en RRHH.',
    );
    err.status = 403;
    throw err;
  }

  return {
    idEmpleadoInstructor: emp.idEmpleado,
    idUsuarioInstructor: String(emp.idUsuario || req.user.sub),
    idinstructor: nombreEmpleado(emp),
    instructorNombre: nombreEmpleado(emp),
  };
}

async function listarInstructoresConUsuario() {
  const empleados = await Empleado.find({
    idUsuario: { $exists: true, $ne: null },
    estado: { $not: /^inactivo$/i },
  }).lean();

  const out = [];
  for (const e of empleados) {
    const cargo = await cargoNombre(e.cargoId);
    const porCargo = /\binstructor/i.test(cargo);
    let porPermiso = false;
    if (!porCargo && e.idUsuario) {
      try {
        const u = await Usuario.findById(e.idUsuario).lean();
        if (u) {
          const perms = await permisosParaRol(u.rol);
          porPermiso = permisosOperarComoInstructor(perms);
        }
      } catch {
        porPermiso = false;
      }
    }
    if (!porCargo && !porPermiso) continue;
    out.push({
      idEmpleado: e.idEmpleado,
      idUsuario: String(e.idUsuario),
      nombreCompleto: nombreEmpleado(e),
      numeroDocumento: e.numeroDocumento,
      cargo: cargo || (porPermiso ? 'Instructor (por permiso)' : ''),
    });
  }
  return out.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'));
}

function esClaseSinInstructor(clase) {
  const emp =
    clase?.idEmpleadoInstructor == null ||
    clase?.idEmpleadoInstructor === '' ||
    !Number.isFinite(Number(clase.idEmpleadoInstructor));
  const user = !String(clase?.idUsuarioInstructor || '').trim();
  return emp && user;
}

function esClaseDelInstructor(clase, emp, userId) {
  const uid = userId ? String(userId).trim() : '';
  if (uid && String(clase?.idUsuarioInstructor || '').trim() === uid) return true;
  if (emp?.idEmpleado != null && clase?.idEmpleadoInstructor != null) {
    return Number(clase.idEmpleadoInstructor) === Number(emp.idEmpleado);
  }
  return false;
}

/**
 * Rol instructor (sistema o personalizado) sin permisos de gestión:
 * solo sus clases. Si tiene jornadas.gestionar / registrar_alumnos / *,
 * no se restringe aunque el código del rol diga «instructor».
 */
function esRolInstructorSoloClasesPropias(req, permisos = []) {
  if (tieneAlguno(permisos, ['*', 'jornadas.gestionar', 'jornadas.registrar_alumnos'])) {
    return false;
  }
  const rol = normalizarRol(req.user?.rol);
  if (rol === 'instructor') return true;
  const raw = String(req.user?.rol || '')
    .trim()
    .toLowerCase();
  return /(^|[_-])instructor(es)?($|[_-])/.test(raw);
}

/**
 * Quién puede ver el listado completo de clases (todas las de la empresa).
 * Instructores de campo (solo operar): no. Gestores sí, aunque el rol se llame instructor.
 */
function puedeVerTodasLasClasesJornada(req, permisos) {
  if (tieneAlguno(permisos, ['*', 'jornadas.gestionar', 'jornadas.registrar_alumnos'])) {
    return true;
  }
  if (esRolInstructorSoloClasesPropias(req, permisos)) return false;
  const rol = normalizarRol(req.user?.rol);
  if (['admin', 'recepcion', 'registro', 'cajero', 'supervisor'].includes(rol)) {
    return true;
  }
  // Roles personalizados: p. ej. registro_sede, supervisor_ops
  const rolRaw = String(req.user?.rol || '')
    .trim()
    .toLowerCase();
  if (/(^|[_-])(admin|recepcion|registro|cajero|supervisor)($|[_-])/.test(rolRaw)) {
    return true;
  }
  return false;
}

/**
 * Admin / gestión / registro / cajero / supervisor: sin filtro (todas las clases).
 * Instructor de campo (solo operar): solo clases propias.
 */
async function filtroClasesQueryPorRol(req) {
  const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
  const restringir =
    esRolInstructorSoloClasesPropias(req, permisos) ||
    (!puedeVerTodasLasClasesJornada(req, permisos) &&
      tieneAlguno(permisos, ['jornadas.operar', 'instructores.mi_portal']));

  if (!restringir) {
    return { aplicar: false };
  }

  const emp = await empleadoPorUsuarioId(req.user?.sub);
  const filtroInst = filtroInstructorQuery(emp, req.user?.sub);
  if (filtroInst._id === null) {
    return { aplicar: true, vacio: true };
  }
  return { aplicar: true, $or: filtroInst.$or };
}

/**
 * Al operar una clase libre, el usuario queda asignado como instructor (historial / listados).
 * - Si ya tiene otro instructor: instructor normal → 403; admin puede operar sin pisar.
 * - Admin u operador sin cargo instructor: igual se guarda usuario y nombre si hay empleado RRHH.
 * @param {import('mongoose').Document} claseDoc
 */
async function asegurarInstructorOperandoClase(claseDoc, req) {
  if (!claseDoc) return claseDoc;

  const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
  const esAdmin = tieneAlguno(permisos, ['jornadas.gestionar']);
  const emp = await empleadoPorUsuarioId(req.user?.sub);
  const userId = req.user?.sub ? String(req.user.sub) : '';
  /** Empleado usable solo si el login coincide con idUsuario en RRHH. */
  const empOperador =
    emp && emp.idUsuario != null && String(emp.idUsuario).trim() === userId ? emp : null;

  if (!esClaseSinInstructor(claseDoc)) {
    if (!esClaseDelInstructor(claseDoc, empOperador, userId) && !esAdmin) {
      const err = new Error('Esta clase está asignada a otro instructor.');
      err.status = 403;
      throw err;
    }
    return claseDoc;
  }

  // Clase libre: asignar a quien está operando.
  let idEmpleadoInstructor = empOperador?.idEmpleado ?? null;
  let idUsuarioInstructor = userId;
  let idinstructor = empOperador ? nombreEmpleado(empOperador) : '';

  if (empOperador) {
    try {
      const instructor = await resolverInstructorParaClase(req, {});
      idEmpleadoInstructor = instructor.idEmpleadoInstructor;
      idUsuarioInstructor = instructor.idUsuarioInstructor || userId;
      idinstructor = instructor.idinstructor || idinstructor;
    } catch (e) {
      // Admin u operador con empleado pero sin cargo instructor: usar datos RRHH / sesión.
      if (!esAdmin && !empOperador) throw e;
      idinstructor =
        idinstructor ||
        String(req.user?.nombres || req.user?.username || req.user?.rolNombre || 'Operador').trim();
    }
  } else if (esAdmin) {
    idinstructor = String(
      req.user?.nombres || req.user?.username || req.user?.rolNombre || 'Administrador',
    ).trim();
    idUsuarioInstructor = userId;
  } else {
    const err = new Error(
      'Su usuario debe estar vinculado a un empleado en RRHH para operar clases.',
    );
    err.status = 400;
    throw err;
  }

  claseDoc.idEmpleadoInstructor =
    idEmpleadoInstructor != null && Number.isFinite(Number(idEmpleadoInstructor))
      ? Number(idEmpleadoInstructor)
      : null;
  claseDoc.idUsuarioInstructor = String(idUsuarioInstructor || '').trim();
  claseDoc.idinstructor = String(idinstructor || '').trim();
  if (typeof claseDoc.markModified === 'function') {
    claseDoc.markModified('idEmpleadoInstructor');
    claseDoc.markModified('idUsuarioInstructor');
    claseDoc.markModified('idinstructor');
  }
  return claseDoc;
}

async function aplicarFiltroClasesQueryPorRol(q, req) {
  const filtro = await filtroClasesQueryPorRol(req);
  if (!filtro.aplicar) return { q, vacio: false };
  if (filtro.vacio) return { q, vacio: true };
  q.$or = filtro.$or;
  return { q, vacio: false };
}

/** Clases asignadas al instructor (empleado + usuario + nombre legacy en jornadas). */
function filtroInstructorQuery(emp, userId) {
  const or = [];
  if (emp?.idEmpleado != null) {
    const idNum = Number(emp.idEmpleado);
    or.push({ idEmpleadoInstructor: idNum });
    or.push({ idEmpleadoInstructor: String(idNum) });
  }
  const uid = userId ? String(userId).trim() : '';
  if (uid) or.push({ idUsuarioInstructor: uid });
  if (emp?.idUsuario) {
    const uEmp = String(emp.idUsuario).trim();
    if (uEmp && !or.some((c) => c.idUsuarioInstructor === uEmp)) {
      or.push({ idUsuarioInstructor: uEmp });
    }
  }
  const nom = nombreEmpleado(emp);
  if (nom) {
    const esc = nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    or.push({ idinstructor: new RegExp(`^${esc}$`, 'i') });
  }
  return or.length ? { $or: or } : { _id: null };
}

async function enriquecerClases(rows) {
  const { mapaNombresCarpas, normalizarIdCarpa } = require('./carpaJornada');
  const { normalizarOrigenJornadaCap } = require('../constants/origenJornadaCap');
  const DatosAlumno = require('../models/DatosAlumno');
  const ids = [...new Set(rows.map((r) => r.idEmpleadoInstructor).filter((x) => x != null))];
  const empleados = ids.length
    ? await Empleado.find({ idEmpleado: { $in: ids } }).lean()
    : [];
  const map = new Map(empleados.map((e) => [e.idEmpleado, e]));
  const progCache = new Map();
  const carpaIds = [];

  const claseIds = rows.map((r) => r._id).filter(Boolean);
  const conteoInscritos = new Map();
  /** idClase → origen mayoritario de alumnos inscritos */
  const origenPorClase = new Map();
  if (claseIds.length) {
    const agg = await InscripcionClase.aggregate([
      { $match: { idClase: { $in: claseIds } } },
      { $group: { _id: '$idClase', n: { $sum: 1 } } },
    ]);
    for (const row of agg) {
      conteoInscritos.set(String(row._id), row.n || 0);
    }

    const inscritos = await InscripcionClase.find({ idClase: { $in: claseIds } })
      .select('idClase numDoc')
      .lean();
    const numDocs = [...new Set(inscritos.map((i) => i.numDoc).filter((n) => n != null))];
    const origenAlumno = new Map();
    if (numDocs.length) {
      const alumnos = await DatosAlumno.find({ numDoc: { $in: numDocs } })
        .select('numDoc origenJornadaCap')
        .lean();
      for (const a of alumnos) {
        const o = normalizarOrigenJornadaCap(a.origenJornadaCap) || 'operativo';
        origenAlumno.set(Number(a.numDoc), o);
        origenAlumno.set(String(a.numDoc), o);
      }
    }
    const counts = new Map();
    for (const ins of inscritos) {
      const id = String(ins.idClase);
      const o =
        origenAlumno.get(Number(ins.numDoc)) ||
        origenAlumno.get(String(ins.numDoc)) ||
        'operativo';
      if (!counts.has(id)) counts.set(id, new Map());
      const m = counts.get(id);
      m.set(o, (m.get(o) || 0) + 1);
    }
    for (const [id, m] of counts) {
      let best = '';
      let bestN = -1;
      for (const [o, n] of m) {
        if (n > bestN) {
          best = o;
          bestN = n;
        }
      }
      if (best) origenPorClase.set(id, best);
    }
  }

  for (const c of rows) {
    const idClase = normalizarIdCarpa(c.idCarpa);
    if (idClase != null) carpaIds.push(idClase);
    const progId = String(c.idPrograma || '');
    if (progCache.has(progId)) continue;
    const prog = progId ? await buscarPrograma(progId) : null;
    const idCarpaProg = normalizarIdCarpa(prog?.idCarpa);
    progCache.set(progId, {
      programaNombre:
        (prog?.nombreProg || prog?.descripcion || prog?.nomCert || progId || '').trim() || progId,
      idCarpa: idCarpaProg,
    });
    if (idCarpaProg != null) carpaIds.push(idCarpaProg);
  }

  const carpaNombres = await mapaNombresCarpas(carpaIds);
  const out = [];
  for (const c of rows) {
    const emp = c.idEmpleadoInstructor != null ? map.get(c.idEmpleadoInstructor) : null;
    const instructorNombre = emp ? nombreEmpleado(emp) : c.idinstructor || '';
    const progId = String(c.idPrograma || '');
    const progInfo = progCache.get(progId) || { programaNombre: progId, idCarpa: null };
    let idCarpa = normalizarIdCarpa(c.idCarpa);
    if (idCarpa == null) idCarpa = progInfo.idCarpa;
    const carpaNombre = idCarpa != null ? carpaNombres.get(idCarpa) || `Carpa ${idCarpa}` : '';
    const alumnosInscritos =
      c.alumnosInscritos != null
        ? Number(c.alumnosInscritos) || 0
        : conteoInscritos.get(String(c._id)) || 0;
    const origenGuardado = normalizarOrigenJornadaCap(c.origenOperacion);
    const origenInscritos = origenPorClase.get(String(c._id)) || '';
    const origenOperacion = origenGuardado || origenInscritos || null;
    out.push({
      ...c,
      instructorNombre,
      programaNombre: progInfo.programaNombre,
      idCarpa,
      carpaNombre,
      idEmpleadoInstructor: c.idEmpleadoInstructor ?? null,
      idUsuarioInstructor: c.idUsuarioInstructor || '',
      alumnosInscritos,
      origenOperacion,
    });
  }
  return out;
}

module.exports = {
  nombreEmpleado,
  empleadoPorUsuarioId,
  resolverInstructorParaClase,
  listarInstructoresConUsuario,
  aplicarFiltroClasesQueryPorRol,
  puedeVerTodasLasClasesJornada,
  filtroInstructorQuery,
  enriquecerClases,
  esEmpleadoInstructor,
  empleadoPuedeActuarComoInstructor,
  permisosOperarComoInstructor,
  asegurarInstructorOperandoClase,
  esClaseSinInstructor,
  esClaseDelInstructor,
};
