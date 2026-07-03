const Empleado = require('../models/Empleado');
const { buscarPrograma } = require('./programaServicio');
const Usuario = require('../models/Usuario');
const Cargo = require('../models/Cargo');
const { tieneAlguno, permisosParaRol } = require('./rolesPermisos');

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

async function empleadoPorUsuarioId(userId) {
  if (!userId) return null;
  const u = await Usuario.findById(userId).lean();
  if (u?.idEmpleado) {
    const emp = await Empleado.findOne({ idEmpleado: u.idEmpleado }).lean();
    if (emp) return emp;
  }
  return Empleado.findOne({ idUsuario: userId }).lean();
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
  const instructor = await esEmpleadoInstructor(emp);
  if (!instructor && !puedeAsignar) {
    const err = new Error('Su cargo en RRHH no es de instructor. Solo instructores pueden crear clases.');
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
    if (!/\binstructor/i.test(cargo)) continue;
    out.push({
      idEmpleado: e.idEmpleado,
      idUsuario: String(e.idUsuario),
      nombreCompleto: nombreEmpleado(e),
      numeroDocumento: e.numeroDocumento,
      cargo,
    });
  }
  return out.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'));
}

function sinInstructorAsignadoQuery() {
  return {
    $and: [
      {
        $or: [
          { idEmpleadoInstructor: null },
          { idEmpleadoInstructor: { $exists: false } },
          { idEmpleadoInstructor: '' },
        ],
      },
      {
        $or: [
          { idUsuarioInstructor: null },
          { idUsuarioInstructor: { $exists: false } },
          { idUsuarioInstructor: '' },
        ],
      },
    ],
  };
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
 * Admin/gestor: sin filtro.
 * Instructor (jornadas.operar):
 *  - clases PROGRAMADA sin instructor (disponibles para tomar), y
 *  - clases propias (asignadas a su empleado/usuario), en cualquier estado.
 * No ve clases de otros instructores.
 */
async function filtroClasesQueryPorRol(req) {
  const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
  if (tieneAlguno(permisos, ['jornadas.gestionar'])) {
    return { aplicar: false };
  }
  const emp = await empleadoPorUsuarioId(req.user?.sub);
  const propias = [];
  if (emp?.idEmpleado != null) {
    const idNum = Number(emp.idEmpleado);
    propias.push({ idEmpleadoInstructor: idNum });
    propias.push({ idEmpleadoInstructor: String(idNum) });
  }
  const userId = req.user?.sub ? String(req.user.sub) : '';
  if (userId) propias.push({ idUsuarioInstructor: userId });

  const disponibles = {
    estado: 'PROGRAMADA',
    ...sinInstructorAsignadoQuery(),
  };

  const condiciones = [disponibles, ...propias];
  if (!propias.length) {
    // Sin vínculo RRHH solo ve programadas libres (si las hay).
    return { aplicar: true, $or: [disponibles] };
  }
  return { aplicar: true, $or: condiciones };
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

  if (!esClaseSinInstructor(claseDoc)) {
    if (!esClaseDelInstructor(claseDoc, emp, userId) && !esAdmin) {
      const err = new Error('Esta clase está asignada a otro instructor.');
      err.status = 403;
      throw err;
    }
    return claseDoc;
  }

  // Clase libre: asignar siempre a quien está operando.
  let idEmpleadoInstructor = emp?.idEmpleado ?? null;
  let idUsuarioInstructor = userId;
  let idinstructor = emp ? nombreEmpleado(emp) : '';

  if (emp) {
    try {
      const instructor = await resolverInstructorParaClase(req, {});
      idEmpleadoInstructor = instructor.idEmpleadoInstructor;
      idUsuarioInstructor = instructor.idUsuarioInstructor || userId;
      idinstructor = instructor.idinstructor || idinstructor;
    } catch (e) {
      // Admin u operador con empleado pero sin cargo instructor: usar datos RRHH / sesión.
      if (!esAdmin && !emp) throw e;
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
  const ids = [...new Set(rows.map((r) => r.idEmpleadoInstructor).filter((x) => x != null))];
  const empleados = ids.length
    ? await Empleado.find({ idEmpleado: { $in: ids } }).lean()
    : [];
  const map = new Map(empleados.map((e) => [e.idEmpleado, e]));
  const progCache = new Map();
  const carpaIds = [];

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
    out.push({
      ...c,
      instructorNombre,
      programaNombre: progInfo.programaNombre,
      idCarpa,
      carpaNombre,
      idEmpleadoInstructor: c.idEmpleadoInstructor ?? null,
      idUsuarioInstructor: c.idUsuarioInstructor || '',
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
  filtroInstructorQuery,
  enriquecerClases,
  esEmpleadoInstructor,
  asegurarInstructorOperandoClase,
  esClaseSinInstructor,
  esClaseDelInstructor,
};
