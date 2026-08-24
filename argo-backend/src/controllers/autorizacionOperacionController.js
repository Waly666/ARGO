const svc = require('../services/autorizacionOperacion');
const { puedeAutorizarOperaciones } = require('../services/permisoAccion');
const { permisosParaRol } = require('../services/rolesPermisos');

exports.solicitar = async (req, res, next) => {
  try {
    const doc = await svc.solicitarEliminacion(req, req.body || {});
    res.status(201).json(doc);
  } catch (e) {
    if (e.status) {
      return res.status(e.status).json({
        message: e.message,
        code: e.code,
        solicitud: e.solicitud,
      });
    }
    next(e);
  }
};

exports.listar = async (req, res, next) => {
  try {
    const rows = await svc.listarSolicitudes(req, req.query || {});
    res.json(rows);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.contarPendientes = async (req, res, next) => {
  try {
    res.json(await svc.contarPendientes(req));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.listarAlertasAdmin = async (req, res, next) => {
  try {
    res.json(await svc.listarAlertasAdmin(req));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.listarMisAlertas = async (req, res, next) => {
  try {
    res.json(await svc.listarMisAlertas(req));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.marcarVista = async (req, res, next) => {
  try {
    res.json(await svc.marcarNotificacionVista(req, req.params.idSolicitud));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.obtener = async (req, res, next) => {
  try {
    const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
    const doc = await svc.obtenerSolicitud(req, req.params.idSolicitud);
    const esPropia =
      doc.idUsuarioSolicita && String(doc.idUsuarioSolicita) === String(req.user?.sub);
    if (!puedeAutorizarOperaciones(permisos, req.user?.rol) && !esPropia) {
      return res.status(403).json({ message: 'Sin permisos' });
    }
    res.json(doc);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.rechazar = async (req, res, next) => {
  try {
    const doc = await svc.rechazarSolicitud(
      req,
      req.params.idSolicitud,
      req.body?.motivoRechazo || req.body?.motivo,
    );
    res.json(doc);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.autorizar = async (req, res, next) => {
  try {
    const out = await svc.autorizarYEjecutar(req, req.params.idSolicitud);
    res.json(out);
  } catch (e) {
    if (e.status) {
      return res.status(e.status).json({
        message: e.message,
        solicitud: e.resultado,
        resultado: e.resultado,
      });
    }
    next(e);
  }
};
