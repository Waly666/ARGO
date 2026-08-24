const Usuario = require('../models/Usuario');
const { normalizarRol } = require('../utils/roles');
const { datosRol, nombreRol } = require('./rolesPermisos');
const { empleadoPorUsuarioId, nombreEmpleado, esEmpleadoInstructor } = require('./instructorJornada');
const { sedesPermitidasUsuario, asegurarSedePrincipal } = require('./sedeContext');
const { normalizarCanalConexionUsuario } = require('../utils/canalConexion');
const { resolverGestorComercialPorUsuario } = require('./gestorUsuarioReferidor');

async function enriquecerUsuarioDoc(u) {
  const json = u.toJSON ? u.toJSON() : { ...u };
  json.rol = normalizarRol(json.rol);
  json.canalConexion = normalizarCanalConexionUsuario(json.canalConexion);
  const datos = await datosRol(json.rol);
  json.permisos = datos.permisos;
  json.alarmas = datos.alarmas;
  json.permisosRev = datos.permisosRev || null;
  json.rolNombre = await nombreRol(json.rol);

  await asegurarSedePrincipal();
  const sedes = await sedesPermitidasUsuario(json._id, json.rol);
  json.sedes = sedes.map((s) => ({
    idSede: s.idSede,
    nombre: s.nombre,
    codigo: s.codigo || '',
    esPrincipal: !!s.esPrincipal,
  }));
  json.sedesPermitidas = json.sedes.map((s) => s.idSede);

  const emp = await empleadoPorUsuarioId(json._id);
  if (emp) {
    const porCargo = await esEmpleadoInstructor(emp);
    json.idEmpleado = emp.idEmpleado;
    /** Portal: permiso explícito o instructor con operar (no basta ser admin *). */
    const permisos = datos.permisos || [];
    const porRolPortal = permisos.includes('instructores.mi_portal');
    const porOperarInstructor =
      porCargo &&
      permisos.some((p) =>
        ['jornadas.operar', 'programacion_cea.operar'].includes(p),
      );
    const puedePortal = porRolPortal || porOperarInstructor;
    // Puede actuar como instructor por cargo o por permiso del portal (doble rol real).
    const esInstructor = porCargo || puedePortal;
    json.empleado = {
      idEmpleado: emp.idEmpleado,
      nombreCompleto: nombreEmpleado(emp),
      numeroDocumento: emp.numeroDocumento,
      idUsuario: emp.idUsuario ? String(emp.idUsuario) : json._id,
      esInstructor,
    };
    json.puedeUsarPortalInstructor = puedePortal;
  } else {
    // No inventar idEmpleado desde un vínculo RRHH inconsistente.
    if (json.idEmpleado != null) {
      delete json.idEmpleado;
    }
    json.empleado = undefined;
    json.puedeUsarPortalInstructor = false;
  }

  const gestorComercial = await resolverGestorComercialPorUsuario(json);
  if (gestorComercial) json.gestorComercial = gestorComercial;
  else delete json.gestorComercial;

  return json;
}

async function enriquecerUsuarioPorId(userId) {
  const u = await Usuario.findById(userId);
  if (!u) return null;
  return enriquecerUsuarioDoc(u);
}

module.exports = { enriquecerUsuarioDoc, enriquecerUsuarioPorId };
