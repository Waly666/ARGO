const {
  obtenerConfigGestoresEmpresas,
  guardarConfigGestoresEmpresas,
} = require('../services/configGestoresEmpresas');

exports.obtener = async (_req, res, next) => {
  try {
    const cfg = await obtenerConfigGestoresEmpresas();
    res.json(cfg);
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const saved = await guardarConfigGestoresEmpresas(req.body || {});
    res.json(saved);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};
