const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

function sign(u) {
  return jwt.sign(
    { sub: u._id.toString(), username: u.username, rol: u.rol || 'usuario' },
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
      $or: [
        { username: String(username).trim().toLowerCase() },
        { nickName: String(username).trim() },
      ],
      activo: { $ne: false },
    });
    if (!u) return res.status(401).json({ message: 'Credenciales inválidas' });

    const ok = await u.compararPassword(password);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

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
