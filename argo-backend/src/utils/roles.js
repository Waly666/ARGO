const ROLES_VALIDOS = ['admin', 'usuario', 'cajero', 'instructor', 'recepcion'];

function normalizarRol(r) {
  if (!r) return 'usuario';
  const v = String(r).trim().toLowerCase();
  if (ROLES_VALIDOS.includes(v)) return v;
  if (v.includes('admin')) return 'admin';
  if (v.includes('caj')) return 'cajero';
  if (v.includes('inst')) return 'instructor';
  if (v.includes('rec')) return 'recepcion';
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
