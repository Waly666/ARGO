const jwt = require('jsonwebtoken');
const { normalizarRol, puedeGestionarProgramas, esAdmin } = require('../utils/roles');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Token requerido' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

function requireRole(...roles) {
  const permitidos = roles.map((r) => normalizarRol(r));
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });
    const rol = normalizarRol(req.user.rol);
    if (permitidos.length && !permitidos.includes(rol)) {
      return res.status(403).json({ message: 'Sin permisos' });
    }
    next();
  };
}

function requireGestionProgramas(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });
  if (!puedeGestionarProgramas(req.user.rol)) {
    return res.status(403).json({
      message: 'Sin permisos. Se requiere rol administrador, recepción, cajero o usuario.',
    });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });
  if (!esAdmin(req.user.rol)) {
    return res.status(403).json({ message: 'Solo administradores pueden acceder a este recurso' });
  }
  next();
}

module.exports = { requireAuth, requireRole, requireGestionProgramas, requireAdmin };
