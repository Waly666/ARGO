const { permisosParaRol } = require('../services/rolesPermisos');
const { tieneAccionModulo, tienePermisoClave } = require('../services/permisoAccion');
const { MODULOS_CRUD } = require('../constants/crudModulos');

/**
 * Exige permiso CRUD sobre un módulo operativo.
 * Si accion === 'eliminar' y no tiene permiso, responde AUTORIZACION_REQUERIDA
 * para que el cliente solicite autorización en Configuración.
 */
function requireAccion(modulo, accion) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });
    if (!MODULOS_CRUD[modulo]) {
      return res.status(500).json({ message: `Módulo CRUD no configurado: ${modulo}` });
    }
    try {
      const permisos = req.permisos || (await permisosParaRol(req.user.rol));
      req.permisos = permisos;
      if (tieneAccionModulo(permisos, modulo, accion)) return next();

      if (accion === 'eliminar') {
        return res.status(403).json({
          message:
            'No tiene permiso para eliminar. Solicite autorización en Configuración → Autorizaciones pendientes.',
          code: 'AUTORIZACION_REQUERIDA',
          modulo,
          accion,
        });
      }

      const labels = {
        ver: 'consultar',
        crear: 'crear',
        editar: 'editar',
        eliminar: 'eliminar',
      };
      return res.status(403).json({
        message: `Sin permiso para ${labels[accion] || accion} en ${MODULOS_CRUD[modulo].label}`,
        code: 'SIN_PERMISO_CRUD',
        modulo,
        accion,
      });
    } catch (e) {
      next(e);
    }
  };
}

function accionesModulo(modulo) {
  return {
    ver: requireAccion(modulo, 'ver'),
    crear: requireAccion(modulo, 'crear'),
    editar: requireAccion(modulo, 'editar'),
    eliminar: requireAccion(modulo, 'eliminar'),
  };
}

/** Turno de caja: cajero clásico o quien puede registrar pagos/ingresos en ficha de alumno. */
function requireCajaTurno(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });
  return (async () => {
    try {
      const permisos = req.permisos || (await permisosParaRol(req.user.rol));
      req.permisos = permisos;
      const ok =
        tienePermisoClave(permisos, 'caja.turno')
        || tienePermisoClave(permisos, 'caja.cobros')
        || tienePermisoClave(permisos, 'caja.admin')
        || tienePermisoClave(permisos, 'contabilidad')
        || tienePermisoClave(permisos, 'alumnos.pagos')
        || tieneAccionModulo(permisos, 'ingresos', 'crear');
      if (ok) return next();
      return res.status(403).json({
        message: 'Sin permisos para operar la caja',
        code: 'SIN_PERMISO',
      });
    } catch (e) {
      next(e);
    }
  })();
}

module.exports = { requireAccion, accionesModulo, requireCajaTurno };
