const {
  obtenerConfigFacturacion,
  actualizarConfigFacturacion,
} = require('../services/configFacturacion');
const { probarConexionFactus, listarRangosFactus } = require('../services/facturaProveedor');

exports.obtener = async (_req, res, next) => {
  try {
    res.json(await obtenerConfigFacturacion());
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    res.json(await actualizarConfigFacturacion(req.body || {}));
  } catch (e) {
    next(e);
  }
};

exports.probar = async (_req, res, next) => {
  try {
    res.json(await probarConexionFactus());
  } catch (e) {
    next(e);
  }
};

exports.rangos = async (_req, res, next) => {
  try {
    res.json(await listarRangosFactus());
  } catch (e) {
    next(e);
  }
};
