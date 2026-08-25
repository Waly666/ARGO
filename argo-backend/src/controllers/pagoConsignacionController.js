const {
  listarSolicitudesAdmin,
  aprobarSolicitud,
  rechazarSolicitud,
} = require('../services/pagoConsignacionPortal');

exports.listar = async (req, res, next) => {
  try {
    const { estado, q, limit } = req.query || {};
    res.json(await listarSolicitudesAdmin({ estado, q, limit }));
  } catch (e) {
    next(e);
  }
};

exports.aprobar = async (req, res, next) => {
  try {
    res.json(await aprobarSolicitud(req.params.id, req.user));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.rechazar = async (req, res, next) => {
  try {
    const { motivoRechazo, motivo } = req.body || {};
    res.json(await rechazarSolicitud(req.params.id, motivoRechazo || motivo, req.user));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};
