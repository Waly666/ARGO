const Usuario = require('../models/Usuario');
const { normalizarRol } = require('../utils/roles');
const { permisosParaRol, nombreRol } = require('./rolesPermisos');
const { empleadoPorUsuarioId, nombreEmpleado } = require('./instructorJornada');

async function enriquecerUsuarioDoc(u) {
  const json = u.toJSON ? u.toJSON() : { ...u };
  json.rol = normalizarRol(json.rol);
  json.permisos = await permisosParaRol(json.rol);
  json.rolNombre = await nombreRol(json.rol);

  const emp = await empleadoPorUsuarioId(json._id);
  if (emp) {
    json.idEmpleado = emp.idEmpleado;
    json.empleado = {
      idEmpleado: emp.idEmpleado,
      nombreCompleto: nombreEmpleado(emp),
      numeroDocumento: emp.numeroDocumento,
      idUsuario: emp.idUsuario ? String(emp.idUsuario) : json._id,
    };
  }
  return json;
}

async function enriquecerUsuarioPorId(userId) {
  const u = await Usuario.findById(userId);
  if (!u) return null;
  return enriquecerUsuarioDoc(u);
}

module.exports = { enriquecerUsuarioDoc, enriquecerUsuarioPorId };
