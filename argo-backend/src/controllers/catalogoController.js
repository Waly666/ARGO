const { CATALOGOS, models } = require('../models/catalogos');
const { listarMeta, nombreValido } = require('../services/catalogoMeta');
const catalogoAdmin = require('../services/catalogoAdmin');
const { recargarDesdeExcel } = require('../services/catalogoCarga');

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

exports.meta = async (_req, res, next) => {
  try {
    res.json({
      catalogos: listarMeta(),
      nota: 'Programas y servicios se gestionan en sus menús dedicados.',
    });
  } catch (e) {
    next(e);
  }
};

exports.listar = async (req, res, next) => {
  try {
    const { nombre } = req.params;
    if (!CATALOGOS[nombre]) {
      return res.status(404).json({ message: `Catálogo desconocido: ${nombre}` });
    }

    const admin = req.query.admin === 'true' && nombreValido(nombre);
    if (admin) {
      const data = await catalogoAdmin.listar(nombre, {
        q: req.query.q,
        skip: req.query.skip,
        limit: req.query.limit,
      });
      if (!data) return res.status(404).json({ message: 'Catálogo no disponible en administración' });
      return res.json(data);
    }

    const data = await models[nombre].find(
      req.idSede && (nombre === 'aulas' || nombre === 'talleres') ? { idSede: req.idSede } : {},
    ).lean();
    res.json(data);
  } catch (e) {
    next(e);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const { nombre } = req.params;
    if (!nombreValido(nombre)) {
      return res.status(404).json({ message: `Catálogo no editable: ${nombre}` });
    }
    const doc = await catalogoAdmin.crear(nombre, req.body);
    res.status(201).json({ documento: doc, message: 'Registro creado' });
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const { nombre, id } = req.params;
    if (!nombreValido(nombre)) {
      return res.status(404).json({ message: `Catálogo no editable: ${nombre}` });
    }
    const doc = await catalogoAdmin.actualizar(nombre, id, req.body);
    res.json({ documento: doc, message: 'Registro actualizado' });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const { nombre, id } = req.params;
    if (!nombreValido(nombre)) {
      return res.status(404).json({ message: `Catálogo no editable: ${nombre}` });
    }
    await catalogoAdmin.eliminar(nombre, id);
    res.json({ ok: true, message: 'Registro eliminado' });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.importar = async (req, res, next) => {
  try {
    const { nombre } = req.params;
    if (!nombreValido(nombre)) {
      return res.status(404).json({ message: `Catálogo no editable: ${nombre}` });
    }
    const { rows, modo } = req.body || {};
    const r = await catalogoAdmin.importar(nombre, rows, modo === 'agregar' ? 'agregar' : 'reemplazar');
    res.json({
      ...r,
      message: `Importados ${r.insertados} registros (${r.modo}). Total en colección: ${r.total}`,
    });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.recargarExcel = async (req, res, next) => {
  try {
    const hoja = (req.body?.hoja || req.query?.hoja || '').trim() || undefined;
    const r = await recargarDesdeExcel({ soloHoja: hoja });
    res.json({
      ...r,
      message: hoja
        ? `Hoja «${hoja}» recargada desde Excel`
        : 'Catálogos recargados desde excel/catalogos.xlsx',
    });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
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
    if (!q || q.length < 1) return res.json([]);
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

function padMunicipio(cod) {
  const s = String(cod || '').replace(/\D/g, '');
  if (!s) return '';
  return s.padStart(5, '0');
}

/** Colegios: por municipio y/o búsqueda incremental (catálogo nacional ~22k). */
exports.buscarColegios = async (req, res, next) => {
  try {
    const codMunicipio = padMunicipio(req.query.codMunicipio);
    const q = String(req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 40, 100);

    // Sin municipio: exigir texto (evitar listar todo el país al abrir).
    if (!codMunicipio && q.length < 2) {
      return res.json([]);
    }

    const filter = { activo: { $ne: false } };
    if (codMunicipio) {
      filter.$or = [
        { codMunicipio },
        { codMunicipio: Number(codMunicipio) },
        { codMunicipio: String(Number(codMunicipio)) },
      ];
    }
    if (q.length >= 1) {
      filter.nombreEstablecimiento = regexSinTildes(q);
    }

    const rows = await models.colegios
      .find(filter)
      .sort({ nombreEstablecimiento: 1 })
      .limit(limit)
      .lean();

    res.json(
      rows.map((r) => {
        const nombre = String(r.nombreEstablecimiento || '').trim();
        const muni = String(r.nombreMunicipio || '').trim();
        const depto = String(r.nombreDepartamento || r.nombreDepto || '').trim();
        const ubi = [muni, depto].filter(Boolean).join(' · ');
        return {
          codigoEstablecimiento: String(r.codigoEstablecimiento || ''),
          nombreEstablecimiento: nombre,
          codMunicipio: String(r.codMunicipio || ''),
          nombreMunicipio: muni,
          nombreDepartamento: depto,
          label: nombre || String(r.codigoEstablecimiento || ''),
          hint: ubi || undefined,
        };
      }),
    );
  } catch (e) {
    next(e);
  }
};

/** Estamentos públicos por municipio + búsqueda. */
exports.buscarEstamentos = async (req, res, next) => {
  try {
    const codMunicipio = padMunicipio(req.query.codMunicipio);
    const q = String(req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 40, 100);
    const filter = { activo: { $ne: false } };
    if (codMunicipio) {
      filter.$or = [
        { codMunicipio },
        { codMunicipio: Number(codMunicipio) },
        { codMunicipio: String(Number(codMunicipio)) },
        { codMunicipio: '' },
        { codMunicipio: null },
        { nacional: true },
      ];
    }
    if (q.length >= 1) {
      filter.nombre = regexSinTildes(q);
    }
    const rows = await models.estamentosPublicos
      .find(filter)
      .sort({ nombre: 1 })
      .limit(limit)
      .lean();
    res.json(
      rows.map((r) => ({
        idEstamento: String(r.idEstamento || r._id || ''),
        nombre: r.nombre || '',
        tipo: r.tipo || '',
        codMunicipio: String(r.codMunicipio || ''),
        nombreMunicipio: r.nombreMunicipio || '',
        label: r.nombre || String(r.idEstamento || ''),
      })),
    );
  } catch (e) {
    next(e);
  }
};
