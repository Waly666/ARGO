const ROLES_SISTEMA = ['admin', 'usuario', 'cajero', 'instructor', 'recepcion'];
/** @deprecated use listarRolesActivos — se mantiene por compatibilidad */
const ROLES_VALIDOS = ROLES_SISTEMA;

function normalizarRol(r) {
  if (!r) return 'usuario';
  const v = String(r).trim().toLowerCase();
  if (ROLES_SISTEMA.includes(v)) return v;
  if (v.includes('admin')) return 'admin';
  if (v.includes('caj')) return 'cajero';
  if (v.includes('inst')) return 'instructor';
  if (v.includes('rec')) return 'recepcion';
  if (/^[a-z][a-z0-9_-]{1,39}$/.test(v)) return v;
  return 'usuario';
}

function esAdmin(rol) {
  return normalizarRol(rol) === 'admin';
}

function puedeGestionarProgramas(rol) {
  const r = normalizarRol(rol);
  return r === 'admin' || r === 'recepcion' || r === 'cajero' || r === 'usuario';
}

function puedeGestionarServicios(rol) {
  return puedeGestionarProgramas(rol);
}

module.exports = {
  ROLES_VALIDOS,
  normalizarRol,
  esAdmin,
  puedeGestionarProgramas,
  puedeGestionarServicios,
};
