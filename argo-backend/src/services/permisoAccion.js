const { esAdmin } = require('../utils/roles');
const {
  MODULOS_CRUD,
  ACCIONES_CRUD,
  claveAccionModulo,
} = require('../constants/crudModulos');

/** Permisos amplios que conceden acciones más específicas (compatibilidad). */
const LEGACY_PERMISO_EXPANSION = {
  'config.usuarios': [
    'config.usuarios.ver',
    'config.usuarios.crear',
    'config.usuarios.editar',
    'config.usuarios.eliminar',
  ],
};

function concedidoPorPermisoLegacy(permisos, clave) {
  for (const [legacy, concedidos] of Object.entries(LEGACY_PERMISO_EXPANSION)) {
    if (permisos.includes(legacy) && concedidos.includes(clave)) return true;
  }
  return false;
}

function tienePermisoClave(permisos, clave) {
  if (!permisos?.length || !clave) return false;
  if (permisos.includes('*')) return true;
  if (permisos.includes(clave)) return true;
  return concedidoPorPermisoLegacy(permisos, clave);
}

function tieneAccionModulo(permisos, modulo, accion) {
  if (!permisos?.length) return false;
  if (permisos.includes('*')) return true;
  if (!MODULOS_CRUD[modulo] || !ACCIONES_CRUD.includes(accion)) return false;

  const clave = claveAccionModulo(modulo, accion);
  if (tienePermisoClave(permisos, clave)) return true;

  const legacy = MODULOS_CRUD[modulo].legacyPorAccion?.[accion] || [];
  return legacy.some((k) => permisos.includes(k));
}

function puedeAutorizarOperaciones(permisos, rol) {
  if (esAdmin(rol) || permisos?.includes('*')) return true;
  return tienePermisoClave(permisos, 'config.autorizaciones')
    || tienePermisoClave(permisos, 'config.roles');
}

function clavesAccesoModulo(modulo, accion) {
  const m = MODULOS_CRUD[modulo];
  if (!m) return [];
  const clave = claveAccionModulo(modulo, accion);
  const legacy = m.legacyPorAccion?.[accion] || [];
  return [...new Set([clave, ...legacy].filter(Boolean))];
}

module.exports = {
  tienePermisoClave,
  tieneAccionModulo,
  puedeAutorizarOperaciones,
  clavesAccesoModulo,
  LEGACY_PERMISO_EXPANSION,
};
