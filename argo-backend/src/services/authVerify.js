const Usuario = require('../models/Usuario');
const { esAdmin } = require('../utils/roles');

async function verificarAdminCredenciales(username, password) {
  if (!username || !password) {
    return {
      ok: false,
      status: 400,
      message: 'Usuario y contraseña del administrador son requeridos',
    };
  }
  const u = await Usuario.findOne({
    username: String(username).trim().toLowerCase(),
    activo: { $ne: false },
  });
  if (!u) {
    return { ok: false, status: 401, message: 'Credenciales de administrador inválidas' };
  }
  if (!esAdmin(u.rol)) {
    return {
      ok: false,
      status: 403,
      message: 'Solo un usuario con rol administrador puede autorizar esta operación',
    };
  }
  const passOk = await u.compararPassword(password);
  if (!passOk) {
    return { ok: false, status: 401, message: 'Credenciales de administrador inválidas' };
  }
  const nombreAutoriza =
    [u.nombres, u.apellidos].filter(Boolean).join(' ').trim() || u.username;
  return {
    ok: true,
    idUsuario: String(u._id),
    username: u.username,
    nombreAutoriza,
  };
}

/** Admin directo, o cajero con credenciales de un administrador (sin cambiar sesión). */
async function exigirAdminOSupervisor(req, mensaje) {
  if (esAdmin(req.user?.rol)) {
    let nombreAutoriza = req.user?.username || 'admin';
    try {
      const u = await Usuario.findById(req.user.sub).lean();
      if (u) {
        nombreAutoriza =
          [u.nombres, u.apellidos].filter(Boolean).join(' ').trim() || u.username;
      }
    } catch {
      /* ignore */
    }
    return {
      ok: true,
      supervisor: {
        autorizadoPor: req.user.username,
        idUsuarioAutoriza: req.user.sub,
        nombreAutoriza,
        autorizadoEn: new Date(),
      },
    };
  }
  const { autorizadoUsername, autorizadoPassword } = req.body || {};
  const ver = await verificarAdminCredenciales(autorizadoUsername, autorizadoPassword);
  if (!ver.ok) {
    return {
      ok: false,
      status: ver.status,
      message:
        mensaje ||
        ver.message ||
        'Se requiere autorización de un administrador (usuario y contraseña).',
    };
  }
  return {
    ok: true,
    supervisor: {
      autorizadoPor: ver.username,
      idUsuarioAutoriza: ver.idUsuario,
      nombreAutoriza: ver.nombreAutoriza,
      autorizadoEn: new Date(),
    },
  };
}

module.exports = { verificarAdminCredenciales, exigirAdminOSupervisor };
