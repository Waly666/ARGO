const { informeReferidorComercial } = require('../services/informeReferidorComercial');

exports.dashboard = async (req, res, next) => {
  try {
    const data = await informeReferidorComercial(req.query || {}, {
      idSede: req.sedeActiva?.idSede || req.sedeActiva?.id || null,
    });
    res.json(data);
  } catch (e) {
    next(e);
  }
};
