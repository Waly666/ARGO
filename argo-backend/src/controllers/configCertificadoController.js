const Config = require('../models/Config');
const { CLAVE, DEFAULTS, obtenerConfigCertificado } = require('../services/configCertificado');

const CAMPOS = [
  'nombreInstitucion',
  'ciudad',
  'nombreDirector',
  'nombreInstructor',
  'urlFirmaDirector',
  'urlFirmaInstructor',
  'prefijoCertificado',
  'consecutivoCertificado',
  'plantillaPorTipo',
  'mostrarQr',
  'qrPosicion',
  'qrTamanoPx',
];

exports.obtener = async (_req, res, next) => {
  try {
    res.json(await obtenerConfigCertificado());
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const dto = {};
    for (const k of CAMPOS) {
      if (req.body[k] !== undefined) dto[k] = req.body[k];
    }
    if (dto.consecutivoCertificado != null) {
      dto.consecutivoCertificado = Math.max(0, parseInt(dto.consecutivoCertificado, 10) || 0);
    }
    if (dto.mostrarQr != null) {
      dto.mostrarQr = dto.mostrarQr === true || dto.mostrarQr === 'true';
    }
    if (dto.qrTamanoPx != null) {
      dto.qrTamanoPx = Math.min(120, Math.max(48, parseInt(dto.qrTamanoPx, 10) || 72));
    }
    const existe = await Config.findOne({ clave: CLAVE });
    if (existe) {
      await Config.findOneAndUpdate({ clave: CLAVE }, { $set: { ...dto, clave: CLAVE } });
    } else {
      await Config.create({ ...DEFAULTS, ...dto, clave: CLAVE });
    }
    res.json(await obtenerConfigCertificado());
  } catch (e) {
    next(e);
  }
};
