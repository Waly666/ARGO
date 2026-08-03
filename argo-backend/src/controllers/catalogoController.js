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
        label: String(r.nombreMunicipio || '').trim(),
      })),
    );
  } catch (e) {
    next(e);
  }
};

/** Búsqueda incremental de municipios (nombre, departamento o código).
 * Con `codDepto`: lista/filtra solo municipios de ese departamento (cascada ficha alumno).
 */
exports.buscarMunicipios = async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const rawDepto = String(req.query.codDepto || '').replace(/\D/g, '');
    const codDepto = rawDepto ? rawDepto.padStart(2, '0') : '';
    const limit = Math.min(parseInt(req.query.limit, 10) || (codDepto && !q ? 200 : 20), 300);

    // Sin depto: exigir texto (catálogo nacional grande). Con depto: permitir lista completa.
    if (!codDepto && q.length < 1) return res.json([]);

    const filter = {};
    if (codDepto) {
      filter.$or = [
        { codDepto },
        { codDepto: Number(codDepto) },
        { codDepto: String(Number(codDepto)) },
      ];
    }
    if (q.length >= 1) {
      const re = regexSinTildes(q);
      const textoOr = [{ nombreMunicipio: re }, { codMunicipio: re }];
      // Solo buscar por nombre depto si no hay filtro de departamento (búsqueda nacional).
      if (!codDepto) textoOr.push({ nombreDepto: re });
      filter.$and = [...(filter.$and || []), { $or: textoOr }];
    }

    const data = await models.divipola
      .find(filter)
      .sort({ nombreMunicipio: 1 })
      .limit(limit)
      .lean();

    const conDepto = !!codDepto;
    res.json(
      data.map((r) => ({
        codMunicipio: r.codMunicipio,
        nombreMunicipio: r.nombreMunicipio,
        codDepto: r.codDepto,
        nombreDepto: r.nombreDepto,
        // Cascada: solo nombre del municipio; nacional: municipio - departamento.
        label: conDepto
          ? String(r.nombreMunicipio || '').trim()
          : `${r.nombreMunicipio} - ${r.nombreDepto}`,
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
      label: String(r.nombreMunicipio || '').trim(),
      labelCompleto: `${r.nombreMunicipio} - ${r.nombreDepto}`,
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

/** Colegios e IES comparten la colección `colegios`. */
exports.buscarColegios = async (req, res, next) => {
  try {
    const {
      esNivelBasicaMedia,
      esNivelSuperior,
      normalizarTipoInstitucionEducativa,
    } = require('../constants/origenJornadaCap');
    const codMunicipio = padMunicipio(req.query.codMunicipio);
    const q = String(req.query.q || '').trim();
    const nivel = normalizarTipoInstitucionEducativa(req.query.nivel || req.query.tipo);
    const superior = !!(nivel && esNivelSuperior(nivel));
    const basica = !nivel || esNivelBasicaMedia(nivel);
    const limit = Math.min(
      parseInt(req.query.limit, 10) || (superior ? 400 : 40),
      superior ? 500 : 120,
    );

    // Sin municipio válido: en básica hace falta texto; en superior se puede listar el nivel.
    if (!codMunicipio && q.length < 2 && !superior) {
      return res.json([]);
    }

    let nombreMun = String(req.query.nombreMunicipio || '').trim();
    let nombreDep = String(req.query.nombreDepartamento || req.query.nombreDepto || '').trim();
    if (codMunicipio && (!nombreMun || !nombreDep)) {
      const munRef = await models.divipola
        .findOne({
          $or: [
            { codMunicipio },
            { codMunicipio: Number(codMunicipio) },
            { codMunicipio: String(Number(codMunicipio)) },
          ],
        })
        .select('nombreMunicipio nombreDepto')
        .lean();
      if (munRef) {
        if (!nombreMun) nombreMun = String(munRef.nombreMunicipio || '').trim();
        if (!nombreDep) nombreDep = String(munRef.nombreDepto || '').trim();
      }
    }
    const nucleoMun = nombreMun ? nombreMun.split(/[,(]/)[0].trim() : '';
    const nucleoDep = nombreDep ? nombreDep.split(/[,(]/)[0].trim() : '';

    const filtroBase = { activo: { $ne: false } };
    if (q.length >= 1) {
      filtroBase.nombreEstablecimiento = regexSinTildes(q);
    }
    if (superior) {
      // Una IES ofrece varios niveles (p. ej. institución universitaria = pregrado
      // profesional + tecnologías); `nivelEducativo` es el legado de un solo nivel.
      filtroBase.$and = [
        ...(filtroBase.$and || []),
        { $or: [{ nivelesEducativos: nivel }, { nivelEducativo: nivel }] },
      ];
    } else if (basica && nivel) {
      filtroBase.codigoEstablecimiento = { $not: /^IES-/i };
    }

    const filtroLugarMunicipio = () => {
      const lugarOr = [];
      if (codMunicipio) {
        lugarOr.push(
          { codMunicipio },
          { codMunicipio: Number(codMunicipio) },
          { codMunicipio: String(Number(codMunicipio)) },
        );
      }
      if (nucleoMun) {
        lugarOr.push({ nombreMunicipio: regexSinTildes(nucleoMun) });
      }
      return lugarOr.length ? { $or: lugarOr } : null;
    };

    const filtroLugarDepartamento = () =>
      nucleoDep
        ? {
            $or: [
              { nombreDepartamento: regexSinTildes(nucleoDep) },
              { nombreDepto: regexSinTildes(nucleoDep) },
            ],
          }
        : null;

    async function consultar(extra = {}) {
      return models.colegios
        .find({ ...filtroBase, ...extra })
        .sort({ nombreEstablecimiento: 1 })
        .limit(limit)
        .lean();
    }

    let rows = [];
    const lugarMun = filtroLugarMunicipio();
    if (superior) {
      // El catálogo SNIES solo registra el domicilio principal de cada IES, así que
      // filtrar por municipio esconde universidades con sede o convenios allí.
      // Se listan todas las del nivel, primero las del municipio y del departamento.
      const [locales, delDepto, todas] = await Promise.all([
        lugarMun ? consultar(lugarMun) : Promise.resolve([]),
        filtroLugarDepartamento() ? consultar(filtroLugarDepartamento()) : Promise.resolve([]),
        consultar(),
      ]);
      const vistos = new Set();
      for (const r of [...locales, ...delDepto, ...todas]) {
        const k = String(r.codigoEstablecimiento || r._id);
        if (vistos.has(k)) continue;
        vistos.add(k);
        rows.push(r);
        if (rows.length >= limit) break;
      }
    } else if (lugarMun) {
      rows = await consultar(lugarMun);
    } else if (q.length >= 2) {
      rows = await consultar();
    }

    res.json(
      rows.map((r) => {
        const nombre = String(r.nombreEstablecimiento || '').trim();
        const muni = String(r.nombreMunicipio || '').trim();
        const depto = String(r.nombreDepartamento || r.nombreDepto || '').trim();
        const ubi = [muni, depto].filter(Boolean).join(' · ');
        const niv = String(r.nivelEducativo || '').trim();
        const hintParts = [ubi];
        // Carácter académico SNIES: más claro que el nivel interno.
        const caracter = String(r.tipoEstablecimiento || '').trim();
        if (caracter && caracter !== 'IES') hintParts.push(caracter);
        if (r.seccional) hintParts.push(String(r.seccional));
        return {
          codigoEstablecimiento: String(r.codigoEstablecimiento || ''),
          nombreEstablecimiento: nombre,
          codMunicipio: String(r.codMunicipio || ''),
          nombreMunicipio: muni,
          nombreDepartamento: depto,
          nivelEducativo: niv || null,
          label: nombre || String(r.codigoEstablecimiento || ''),
          hint: hintParts.filter(Boolean).join(' · ') || undefined,
        };
      }),
    );
  } catch (e) {
    next(e);
  }
};

/** Titulaciones técnica / tecnológica / universitaria (catálogo fijo). */
exports.buscarTitulaciones = async (req, res, next) => {
  try {
    const { listarTitulaciones } = require('../constants/titulacionesColombia');
    const rows = listarTitulaciones({
      nivel: req.query.nivel || req.query.tipo || '',
      q: req.query.q || '',
      limit: req.query.limit || 80,
    });
    res.json(rows);
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
