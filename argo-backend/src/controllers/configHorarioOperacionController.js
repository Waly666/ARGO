const {
  obtenerConfigHorarioOperacion,
  guardarConfigHorarioOperacion,
} = require('../services/configHorarioOperacion');
const { evaluarHorarioOperacionUsuario } = require('../services/horarioOperacion');
const { listarRolesActivos } = require('../services/rolesPermisos');
const { registrarAuditoria } = require('../services/auditoria');

exports.catalogos = async (_req, res, next) => {
  try {
    const roles = await listarRolesActivos();
    res.json({
      dias: [
        { id: 1, label: 'Lunes' },
        { id: 2, label: 'Martes' },
        { id: 3, label: 'Miércoles' },
        { id: 4, label: 'Jueves' },
        { id: 5, label: 'Viernes' },
        { id: 6, label: 'Sábado' },
        { id: 0, label: 'Domingo' },
      ],
      roles: roles.map((r) => ({ codigo: r.codigo, nombre: r.nombre || r.codigo })),
    });
  } catch (e) {
    next(e);
  }
};

exports.obtener = async (_req, res, next) => {
  try {
    res.json(await obtenerConfigHorarioOperacion());
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const cfg = await guardarConfigHorarioOperacion(req.body || {});
    await registrarAuditoria({
      req,
      accion: 'config_horario_operacion',
      entidad: 'config',
      idEntidad: 'horarioOperacion',
      resumen: `Horario de operación ${cfg.activo ? 'activado' : 'desactivado'}`,
      datosDespues: cfg,
    }).catch(() => {});
    res.json(cfg);
  } catch (e) {
    next(e);
  }
};

exports.estado = async (req, res, next) => {
  try {
    const evaluacion = await evaluarHorarioOperacionUsuario(req.user, {
      idSede: req.headers['x-argo-sede'] || null,
    });
    res.json(evaluacion);
  } catch (e) {
    next(e);
  }
};
