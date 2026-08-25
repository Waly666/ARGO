const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const soporteMaestro = require('../services/soporteMaestro');
const { normalizarRol, puedeGestionarProgramas, esAdmin } = require('../utils/roles');
const { permisosParaRol, tieneAlguno } = require('../services/rolesPermisos');
const {
  resolverSedeActiva,
  normalizarIdSede,
  sedesPermitidasUsuario,
} = require('../services/sedeContext');
const { evaluarCanalConexion } = require('../utils/canalConexion');
const {
  evaluarHorarioOperacionUsuario,
  aplicarHeadersHorario,
  rutaExentaHorario,
} = require('../services/horarioOperacion');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Token requerido' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }

  // Cuenta de soporte maestro (break-glass): no vive en la BD.
  if (payload.bg === true && payload.sub === soporteMaestro.SUB) {
    if (!soporteMaestro.habilitado()) {
      return res.status(401).json({ message: 'Acceso de soporte deshabilitado' });
    }
    req.user = soporteMaestro.reqUser();
    return next();
  }

  Usuario.findById(payload.sub)
    .select('rol activo username sessionVersion canalConexion')
    .lean()
    .then((u) => {
      if (!u || u.activo === false) {
        return res.status(401).json({ message: 'Usuario inactivo o no encontrado' });
      }
      const canal = evaluarCanalConexion(req, u);
      if (!canal.ok) {
        return res.status(canal.status).json({
          message: canal.message,
          code: canal.code,
        });
      }
      const svDb = Number(u.sessionVersion) || 0;
      // Tokens previos al control de sesión (sin `sv`): solo válidos si aún no hubo un login nuevo.
      if (payload.sv == null) {
        if (svDb > 0) {
          return res.status(401).json({
            message:
              'Su sesión se cerró porque inició sesión en otro dispositivo o aplicación.',
            code: 'SESION_REEMPLAZADA',
          });
        }
      } else if (Number(payload.sv) !== svDb) {
        return res.status(401).json({
          message:
            'Su sesión se cerró porque inició sesión en otro dispositivo o aplicación.',
          code: 'SESION_REEMPLAZADA',
        });
      }
      req.user = {
        ...payload,
        rol: normalizarRol(u.rol),
        username: u.username || payload.username,
      };
      const path = req.originalUrl || req.url || '';
      if (rutaExentaHorario(path)) return next();
      void evaluarHorarioOperacionUsuario(req.user, {
        idSede: req.headers['x-argo-sede'] || null,
      })
        .then((ev) => {
          if (ev.estado === 'bloqueado') {
            return res.status(403).json({
              message: ev.mensaje,
              code: ev.code || 'HORARIO_OPERACION_CERRADO',
              proximaApertura: ev.proximaApertura || null,
            });
          }
          aplicarHeadersHorario(res, ev);
          if (ev.estado === 'gracia') req.horarioGracia = ev;
          next();
        })
        .catch(next);
    })
    .catch(next);
}
async function loadSedeActiva(req, res, next) {
  if (!req.user) return next();
  try {
    const idHeader = normalizarIdSede(req.headers['x-argo-sede']);
    if (idHeader) {
      const sede = await resolverSedeActiva(req);
      req.sedeActiva = sede;
      req.idSede = sede?.idSede || null;
      return next();
    }
    const permitidas = await sedesPermitidasUsuario(req.user.sub, req.user.rol);
    const sede =
      permitidas.find((s) => s.esPrincipal) ||
      (permitidas.length === 1 ? permitidas[0] : null);
    req.sedeActiva = sede || null;
    req.idSede = sede?.idSede || null;
    next();
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message, code: e.code });
    next(e);
  }
}

function exigirSedeActiva(req, res, next) {
  if (!req.idSede) {
    return res.status(428).json({
      message: 'Seleccione la sede de trabajo antes de continuar',
      code: 'SEDE_REQUERIDA',
    });
  }
  next();
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
      return res.status(403).json({ message: 'Sin permisos', code: 'SIN_PERMISO' });
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
      return res.status(403).json({
        message: 'Sin permisos para esta acción',
        code: 'SIN_PERMISO',
      });
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
      code: 'SIN_PERMISO',
    });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });
  if (!esAdmin(req.user.rol)) {
    return res.status(403).json({
      message: 'Solo administradores pueden acceder a este recurso',
      code: 'SIN_PERMISO',
    });
  }
  next();
}

/**
 * Solo administrador del sistema (permiso `*` o rol admin).
 * Para borrar contratos / jornadas / clases: ningún otro perfil.
 */
function requireAdminTotal(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });
  return (async () => {
    try {
      const permisos = req.permisos || (await permisosParaRol(req.user.rol));
      req.permisos = permisos;
      if (permisos.includes('*') || esAdmin(req.user.rol)) return next();
      return res.status(403).json({
        message: 'Solo el administrador puede eliminar este registro.',
        code: 'SIN_PERMISO',
      });
    } catch (e) {
      next(e);
    }
  })();
}

module.exports = {
  requireAuth,
  loadSedeActiva,
  exigirSedeActiva,
  loadPermisos,
  requireRole,
  requirePermiso,
  requireGestionProgramas,
  requireAdmin,
  requireAdminTotal,
};
