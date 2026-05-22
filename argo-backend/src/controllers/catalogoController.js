const { CATALOGOS, models } = require('../models/catalogos');

/** Regex que tolera tildes (medellin → MEDELLÍN) */
function regexSinTildes(q) {
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const map = {
    a: '[aáÁàÀäÄ]',
    e: '[eéÉèÈëË]',
    i: '[iíÍìÌïÏ]',
    o: '[oóÓòÒöÖ]',
    u: '[uúÚùÙüÜ]',
    n: '[nñÑ]',
  };
  const pattern = safe.replace(/[aeioun]/gi, (c) => map[c.toLowerCase()] || c);
  return new RegExp(pattern, 'i');
}

exports.listar = async (req, res, next) => {
  try {
    const { nombre } = req.params;
    if (!CATALOGOS[nombre]) {
      return res.status(404).json({ message: `Catálogo desconocido: ${nombre}` });
    }
    const data = await models[nombre].find({}).lean();
    res.json(data);
  } catch (e) {
    next(e);
  }
};

exports.departamentos = async (_req, res, next) => {
  try {
    const data = await models.divipola.aggregate([
      { $group: { _id: '$codDepto', nombreDepto: { $first: '$nombreDepto' } } },
      { $project: { _id: 0, codDepto: '$_id', nombreDepto: 1 } },
      { $sort: { nombreDepto: 1 } },
    ]);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

exports.municipios = async (req, res, next) => {
  try {
    const { codDepto } = req.params;
    const data = await models.divipola
      .find({ codDepto: String(codDepto) })
      .sort({ nombreMunicipio: 1 })
      .lean();
    res.json(
      data.map((r) => ({
        codMunicipio: r.codMunicipio,
        nombreMunicipio: r.nombreMunicipio,
        codDepto: r.codDepto,
        nombreDepto: r.nombreDepto,
        label: `${r.nombreMunicipio} - ${r.nombreDepto}`,
      })),
    );
  } catch (e) {
    next(e);
  }
};

/** Búsqueda incremental de municipios (nombre, departamento o código) */
exports.buscarMunicipios = async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    if (!q || q.length < 2) return res.json([]);
    const re = regexSinTildes(q);
    const data = await models.divipola
      .find({ $or: [{ nombreMunicipio: re }, { nombreDepto: re }, { codMunicipio: re }] })
      .sort({ nombreMunicipio: 1 })
      .limit(limit)
      .lean();

    res.json(
      data.map((r) => ({
        codMunicipio: r.codMunicipio,
        nombreMunicipio: r.nombreMunicipio,
        codDepto: r.codDepto,
        nombreDepto: r.nombreDepto,
        label: `${r.nombreMunicipio} - ${r.nombreDepto}`,
      })),
    );
  } catch (e) {
    next(e);
  }
};

/** Obtener municipio por código (para mostrar etiqueta al editar) */
exports.municipioPorCodigo = async (req, res, next) => {
  try {
    const { codMunicipio } = req.params;
    const r = await models.divipola.findOne({ codMunicipio: String(codMunicipio) }).lean();
    if (!r) return res.status(404).json({ message: 'Municipio no encontrado' });
    res.json({
      codMunicipio: r.codMunicipio,
      nombreMunicipio: r.nombreMunicipio,
      codDepto: r.codDepto,
      nombreDepto: r.nombreDepto,
      label: `${r.nombreMunicipio} - ${r.nombreDepto}`,
    });
  } catch (e) {
    next(e);
  }
};
