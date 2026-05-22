const Config = require('../models/Config');
const { CLAVE, DEFAULTS, obtenerConfigRecibo } = require('../services/configRecibo');

const CAMPOS = [
  'nombreEmpresa',
  'nit',
  'direccion',
  'ciudad',
  'telefono',
  'email',
  'urlLogo',
  'prefijoFactura',
  'consecutivoFactura',
  'prefijoComprobanteIngreso',
  'consecutivoComprobanteIngreso',
  'prefijoComprobanteEgreso',
  'consecutivoComprobanteEgreso',
  'slogan1',
  'mensajeEncabezado',
  'mensajePie',
  'anchoReciboMm',
  'mostrarQr',
];

exports.obtenerRecibo = async (_req, res, next) => {
  try {
    const doc = await obtenerConfigRecibo();
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

exports.actualizarRecibo = async (req, res, next) => {
  try {
    const dto = {};
    for (const k of CAMPOS) {
      if (req.body[k] !== undefined) dto[k] = req.body[k];
    }
    for (const k of [
      'consecutivoFactura',
      'consecutivoComprobanteIngreso',
      'consecutivoComprobanteEgreso',
    ]) {
      if (dto[k] != null) dto[k] = Math.max(0, parseInt(dto[k], 10) || 0);
    }
    if (dto.anchoReciboMm != null) {
      dto.anchoReciboMm = Math.min(120, Math.max(58, parseInt(dto.anchoReciboMm, 10) || 80));
    }
    const existe = await Config.findOne({ clave: CLAVE });
    if (existe) {
      await Config.findOneAndUpdate(
        { clave: CLAVE },
        { $set: { ...dto, clave: CLAVE } },
      );
    } else {
      await Config.create({ ...DEFAULTS, ...dto, clave: CLAVE });
    }
    res.json(await obtenerConfigRecibo());
  } catch (e) {
    next(e);
  }
};
