const Config = require('../models/Config');
const { CLAVE, DEFAULTS, obtenerConfigCertificado } = require('../services/configCertificado');
const {
  layoutDefaultsApi,
  normalizeLayoutPorTipo,
  mergeLayoutPorTipoDeep,
} = require('../services/certificadoLayout');
const { generarHtmlCertificado } = require('../services/certificadoRender');
const { MUESTRA_PREVIEW } = require('../constants/certificadoLayoutDefaults');
const { TIPOS_VALIDOS, normalizePlantillaPorTipo } = require('../services/clasificacionCertificado');

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
  'layoutPorTipo',
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

exports.layoutDefaults = (_req, res) => {
  res.json(layoutDefaultsApi());
};

exports.vistaPrevia = async (req, res, next) => {
  try {
    const { tipo, orientacion, layoutPorTipo, urlFondo } = req.body || {};
    const tipoOk = TIPOS_VALIDOS.includes(tipo) ? tipo : 'curso';
    const ori = orientacion === 'horizontal' ? 'horizontal' : 'vertical';
    const config = await obtenerConfigCertificado();
    if (layoutPorTipo) {
      const normalizado = normalizeLayoutPorTipo(layoutPorTipo);
      config.layoutPorTipo = mergeLayoutPorTipoDeep(config.layoutPorTipo, normalizado);
    }

    const html = await generarHtmlCertificado({
      config,
      plantilla: { orientacion: ori, urlFondo: urlFondo || '' },
      tipoCertificado: tipoOk,
      ...MUESTRA_PREVIEW,
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
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
      dto.qrTamanoPx = Math.min(140, Math.max(40, parseInt(dto.qrTamanoPx, 10) || 72));
    }
    const existe = await Config.findOne({ clave: CLAVE }).lean();
    if (dto.plantillaPorTipo != null) {
      dto.plantillaPorTipo = normalizePlantillaPorTipo(dto.plantillaPorTipo);
    }
    if (dto.layoutPorTipo != null) {
      const prev = existe?.layoutPorTipo || {};
      const normalizado = normalizeLayoutPorTipo(dto.layoutPorTipo);
      dto.layoutPorTipo = mergeLayoutPorTipoDeep(prev, normalizado);
    }
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
