const jwt = require('jsonwebtoken');
const { normalizarRol, puedeGestionarProgramas, esAdmin } = require('../utils/roles');
const { permisosParaRol, tieneAlguno } = require('../services/rolesPermisos');

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

async function loadPermisos(req, res, next) {
  if (!req.user) return next();
  try {
    req.permisos = await permisosParaRol(req.user.rol);
    next();
  } catch (e) {
    next(e);
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

function requirePermiso(...claves) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });
    try {
      const permisos = req.permisos || (await permisosParaRol(req.user.rol));
      req.permisos = permisos;
      if (tieneAlguno(permisos, claves)) return next();
      return res.status(403).json({ message: 'Sin permisos para esta acción' });
    } catch (e) {
      next(e);
    }
  };
}

function requireGestionProgramas(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });
  if (!puedeGestionarProgramas(req.user.rol)) {
    return res.status(403).json({
      message: 'Sin permisos para gestionar programas.',
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

module.exports = {
  requireAuth,
  loadPermisos,
  requireRole,
  requirePermiso,
  requireGestionProgramas,
  requireAdmin,
};
