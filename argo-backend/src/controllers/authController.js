const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { normalizarRol } = require('../utils/roles');
const { verificarAdminCredenciales } = require('../services/authVerify');

function sign(u) {
  const rol = normalizarRol(u.rol);
  return jwt.sign(
    { sub: u._id.toString(), username: u.username, rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '12h' },
  );
}

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }
    const u = await Usuario.findOne({
      username: String(username).trim().toLowerCase(),
      activo: { $ne: false },
    });
    if (!u) return res.status(401).json({ message: 'Credenciales inválidas' });

    const ok = await u.compararPassword(password);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    u.rol = normalizarRol(u.rol);
    const token = sign(u);
    return res.json({ token, user: u.toJSON() });
  } catch (e) {
    next(e);
  }
};

exports.me = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });
    const u = await Usuario.findById(req.user.sub);
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });
    return res.json(u.toJSON());
  } catch (e) {
    next(e);
  }
};

/** Valida credenciales de admin sin cambiar la sesión del cajero (autorización de retiros). */
exports.verificarAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const ver = await verificarAdminCredenciales(username, password);
    if (!ver.ok) return res.status(ver.status).json({ message: ver.message });
    res.json({
      ok: true,
      username: ver.username,
      nombreAutoriza: ver.nombreAutoriza,
      idUsuario: ver.idUsuario,
    });
  } catch (e) {
    next(e);
  }
};
