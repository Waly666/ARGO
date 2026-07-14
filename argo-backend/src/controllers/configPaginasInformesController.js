const {
  GRUPOS,
  SIZE_PRESETS,
  ORIENTACIONES,
  obtenerPaginasInformes,
  actualizarPaginasInformes,
} = require('../services/configPaginasInformes');

exports.catalogos = (_req, res) => {
  res.json({
    grupos: GRUPOS,
    sizePresets: SIZE_PRESETS,
    orientaciones: ORIENTACIONES,
  });
};

exports.obtener = async (_req, res, next) => {
  try {
    res.json({ paginas: await obtenerPaginasInformes() });
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const user = req.user?.username || req.user?.nombre || 'admin';
    const paginas = await actualizarPaginasInformes(req.body || {}, user);
    res.json({ paginas });
  } catch (e) {
    next(e);
  }
};
