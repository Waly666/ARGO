const Tercero = require('../models/Tercero');
const {
  TIPOS_IDENTIFICACION,
  ORGANIZACIONES_LEGALES,
  TRIBUTOS,
  RESPONSABILIDADES_FISCALES,
} = require('../constants/catalogosDian');

function mapTercero(c) {
  if (!c) return null;
  const o = c.toObject ? c.toObject() : c;
  return {
    _id: o._id,
    identificationDocumentCode: o.identificationDocumentCode || '13',
    identificacion: o.identificacion || '',
    dv: o.dv || '',
    legalOrganizationCode: o.legalOrganizationCode || '2',
    razonSocial: o.razonSocial || '',
    nombreComercial: o.nombreComercial || '',
    nombres: o.nombres || '',
    tributeCode: o.tributeCode || 'ZZ',
    responsabilidadFiscal: o.responsabilidadFiscal || 'R-99-PN',
    direccion: o.direccion || '',
    correo: o.correo || '',
    telefono: o.telefono || '',
    municipioCodigo: o.municipioCodigo || '',
    municipioNombre: o.municipioNombre || '',
    activo: o.activo !== false,
    nombre: o.razonSocial || o.nombres || o.nombreComercial || '',
  };
}

function aplicarBody(doc, body) {
  const campos = [
    'identificationDocumentCode',
    'identificacion',
    'dv',
    'legalOrganizationCode',
    'razonSocial',
    'nombreComercial',
    'nombres',
    'tributeCode',
    'responsabilidadFiscal',
    'direccion',
    'telefono',
    'municipioCodigo',
    'municipioNombre',
  ];
  for (const k of campos) {
    if (body[k] != null) doc[k] = String(body[k]).trim();
  }
  if (body.correo != null) doc.correo = String(body.correo || '').trim().toLowerCase();
  if (body.activo != null) doc.activo = body.activo !== false && body.activo !== 'false';
}

exports.catalogos = (_req, res) => {
  res.json({
    tiposIdentificacion: TIPOS_IDENTIFICACION,
    organizacionesLegales: ORGANIZACIONES_LEGALES,
    tributos: TRIBUTOS,
    responsabilidadesFiscales: RESPONSABILIDADES_FISCALES,
  });
};

exports.listar = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const filtro = { activo: { $ne: false } };
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filtro.$or = [
        { razonSocial: re },
        { nombres: re },
        { identificacion: re },
        { nombreComercial: re },
        { correo: re },
      ];
    }
    const rows = await Tercero.find(filtro).sort({ razonSocial: 1, nombres: 1 }).limit(500).lean();
    res.json(rows.map(mapTercero));
  } catch (e) {
    next(e);
  }
};

exports.obtener = async (req, res, next) => {
  try {
    const doc = await Tercero.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Tercero no encontrado' });
    res.json(mapTercero(doc));
  } catch (e) {
    next(e);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const body = req.body || {};
    const identificacion = String(body.identificacion || '').trim();
    if (!identificacion) {
      return res.status(400).json({ message: 'La identificación es obligatoria' });
    }
    const nombre = String(body.razonSocial || body.nombres || '').trim();
    if (!nombre) {
      return res.status(400).json({ message: 'Indique razón social o nombres' });
    }
    const dup = await Tercero.findOne({ identificacion, activo: { $ne: false } }).lean();
    if (dup) {
      return res.status(409).json({ message: `Ya existe un tercero con identificación ${identificacion}` });
    }
    const doc = new Tercero({
      activo: true,
      userAddReg: req.user?.username || 'sistema',
    });
    aplicarBody(doc, body);
    await doc.save();
    res.status(201).json(mapTercero(doc));
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const doc = await Tercero.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Tercero no encontrado' });
    const body = req.body || {};
    if (body.identificacion != null) {
      const identificacion = String(body.identificacion || '').trim();
      if (!identificacion) {
        return res.status(400).json({ message: 'La identificación es obligatoria' });
      }
      const dup = await Tercero.findOne({
        identificacion,
        _id: { $ne: doc._id },
        activo: { $ne: false },
      }).lean();
      if (dup) {
        return res.status(409).json({ message: `Ya existe un tercero con identificación ${identificacion}` });
      }
    }
    aplicarBody(doc, body);
    doc.userChangeRecord = req.user?.username || 'sistema';
    await doc.save();
    res.json(mapTercero(doc));
  } catch (e) {
    next(e);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const doc = await Tercero.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Tercero no encontrado' });
    doc.activo = false;
    doc.userChangeRecord = req.user?.username || 'sistema';
    await doc.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
