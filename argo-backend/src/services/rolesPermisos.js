const RolApp = require('../models/RolApp');
const { todasLasClaves, clavesValidas } = require('../constants/permisosCatalogo');
const { normalizarRol, esAdmin } = require('../utils/roles');

const ROLES_SISTEMA = {
  admin: {
    nombre: 'Administrador',
    descripcion: 'Acceso total al sistema',
    permisos: ['*'],
    esSistema: true,
  },
  cajero: {
    nombre: 'Cajero',
    descripcion: 'Gestión de alumnos, pagos y caja del turno',
    permisos: [
      'dashboard',
      'alumnos.ver',
      'alumnos.gestionar',
      'alumnos.pagos',
      'alumnos.certificados',
      'programas.ver',
      'servicios.ver',
      'caja.turno',
      'caja.cobros',
    ],
    esSistema: true,
  },
  instructor: {
    nombre: 'Instructor',
    descripcion: 'Dashboard, jornadas en carpa, consulta y alta de programas',
    permisos: [
      'dashboard',
      'programas.ver',
      'programas.agregar',
      'jornadas.ver',
      'jornadas.operar',
    ],
    esSistema: true,
  },
  recepcion: {
    nombre: 'Recepción',
    descripcion: 'Atención, alumnos y catálogo académico',
    permisos: [
      'dashboard',
      'alumnos.ver',
      'alumnos.gestionar',
      'programas.ver',
      'programas.gestionar',
      'servicios.ver',
      'servicios.gestionar',
    ],
    esSistema: true,
  },
  usuario: {
    nombre: 'Usuario',
    descripcion: 'Consulta básica',
    permisos: ['dashboard', 'programas.ver', 'servicios.ver'],
    esSistema: true,
  },
};

/** Caché en memoria { codigo → { permisos, nombre, ts } } */
const cache = new Map();
const CACHE_MS = 30_000;

function limpiarCache(codigo) {
  if (codigo) cache.delete(normalizarRol(codigo));
  else cache.clear();
}

function tienePermiso(permisos, clave) {
  if (!permisos?.length) return false;
  if (permisos.includes('*') || esAdminPorPermisos(permisos)) return true;
  if (permisos.includes(clave)) return true;
  const base = String(clave).split('.')[0];
  return permisos.includes(base);
}

function esAdminPorPermisos(permisos) {
  return permisos.includes('*');
}

function tieneAlguno(permisos, claves) {
  const list = Array.isArray(claves) ? claves : [claves];
  return list.some((k) => tienePermiso(permisos, k));
}

async function initRolesSistema() {
  for (const [codigo, def] of Object.entries(ROLES_SISTEMA)) {
    const permisos = def.permisos.includes('*') ? ['*'] : clavesValidas(def.permisos);
    await RolApp.findOneAndUpdate(
      { codigo },
      {
        $set: {
          nombre: def.nombre,
          descripcion: def.descripcion || '',
          permisos,
          esSistema: true,
          activo: true,
        },
      },
      { upsert: true, new: true },
    );
  }
  limpiarCache();
}

async function listarRolesActivos() {
  return RolApp.find({ activo: { $ne: false } }).sort({ esSistema: -1, nombre: 1 }).lean();
}

async function permisosParaRol(rolRaw) {
  const codigo = normalizarRol(rolRaw);
  const hit = cache.get(codigo);
  if (hit && Date.now() - hit.ts < CACHE_MS) return hit.permisos;

  const doc = await RolApp.findOne({ codigo, activo: { $ne: false } }).lean();
  let permisos;
  if (doc?.permisos?.length) {
    permisos = doc.permisos.includes('*') ? ['*'] : [...doc.permisos];
  } else if (codigo === 'admin' || esAdmin(codigo)) {
    permisos = ['*'];
  } else {
    permisos = ROLES_SISTEMA[codigo]?.permisos || [];
  }

  cache.set(codigo, { permisos, nombre: doc?.nombre, ts: Date.now() });
  return permisos;
}

async function nombreRol(rolRaw) {
  const codigo = normalizarRol(rolRaw);
  const hit = cache.get(codigo);
  if (hit?.nombre) return hit.nombre;
  const doc = await RolApp.findOne({ codigo }).lean();
  return doc?.nombre || ROLES_SISTEMA[codigo]?.nombre || codigo;
}

async function rolExiste(codigo) {
  const c = normalizarRol(codigo);
  const n = await RolApp.countDocuments({ codigo: c, activo: { $ne: false } });
  return n > 0 || !!ROLES_SISTEMA[c];
}

async function puedeGestionarProgramasPorPermisos(rolRaw) {
  const p = await permisosParaRol(rolRaw);
  return tieneAlguno(p, ['programas.gestionar', 'programas.ver', '*']);
}

async function puedeGestionarServiciosPorPermisos(rolRaw) {
  const p = await permisosParaRol(rolRaw);
  return tieneAlguno(p, ['servicios.gestionar', 'servicios.ver', '*']);
}

function sanitizarPermisos(list) {
  if (!Array.isArray(list)) return [];
  if (list.includes('*')) return ['*'];
  return clavesValidas(list);
}

function codigoRolValido(codigo) {
  const c = String(codigo || '').trim().toLowerCase();
  return /^[a-z][a-z0-9_-]{1,39}$/.test(c);
}

module.exports = {
  ROLES_SISTEMA,
  initRolesSistema,
  listarRolesActivos,
  permisosParaRol,
  nombreRol,
  rolExiste,
  tienePermiso,
  tieneAlguno,
  limpiarCache,
  sanitizarPermisos,
  codigoRolValido,
  puedeGestionarProgramasPorPermisos,
  puedeGestionarServiciosPorPermisos,
  todasLasClaves,
};
