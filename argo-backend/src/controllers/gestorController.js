const Gestor = require('../models/Gestor');
const upload = require('../middleware/upload');

const TIPOS_DOC = ['CC', 'CE', 'TI', 'PAS', 'PPT', 'NIT'];

function mapGestor(c) {
  if (!c) return null;
  const o = c.toObject ? c.toObject() : c;
  return {
    _id: o._id,
    nombres: o.nombres || '',
    apellidos: o.apellidos || '',
    tipoDoc: o.tipoDoc || 'CC',
    numero: o.numero || '',
    correo: o.correo || '',
    celular: o.celular || '',
    direccion: o.direccion || '',
    seudonimo: o.seudonimo || '',
    foto: o.foto || '',
    activo: o.activo !== false,
    nombreCompleto: [o.nombres, o.apellidos].filter(Boolean).join(' ').trim(),
    fechaAudi: o.createdAt,
    fechaMod: o.updatedAt,
    userAddReg: o.userAddReg || '',
    userChangeRecord: o.userChangeRecord || '',
  };
}

function aplicarBody(doc, body, files) {
  const campos = ['nombres', 'apellidos', 'tipoDoc', 'numero', 'celular', 'direccion', 'seudonimo'];
  for (const k of campos) {
    if (body[k] != null) doc[k] = String(body[k]).trim();
  }
  if (body.correo != null) doc.correo = String(body.correo || '').trim().toLowerCase();
  if (body.tipoDoc != null) {
    const t = String(body.tipoDoc).trim().toUpperCase();
    doc.tipoDoc = TIPOS_DOC.includes(t) ? t : 'CC';
  }
  if (body.activo != null) doc.activo = body.activo !== false && body.activo !== 'false';
  if (files?.foto?.[0]) {
    doc.foto = upload.publicUrl('gestores', files.foto[0].filename);
  } else if (body.foto != null && body.foto !== '') {
    doc.foto = String(body.foto).trim();
  }
}

exports.catalogos = (_req, res) => {
  res.json({
    tiposDoc: TIPOS_DOC.map((code) => ({ code, label: code })),
  });
};

exports.listar = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const filtro = { activo: { $ne: false } };
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filtro.$or = [
        { nombres: re },
        { apellidos: re },
        { numero: re },
        { seudonimo: re },
        { correo: re },
        { celular: re },
      ];
    }
    const rows = await Gestor.find(filtro).sort({ apellidos: 1, nombres: 1 }).limit(500).lean();
    res.json(rows.map(mapGestor));
  } catch (e) {
    next(e);
  }
};

exports.obtener = async (req, res, next) => {
  try {
    const doc = await Gestor.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Gestor no encontrado' });
    res.json(mapGestor(doc));
  } catch (e) {
    next(e);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const body = req.body || {};
    const nombres = String(body.nombres || '').trim();
    const apellidos = String(body.apellidos || '').trim();
    const numero = String(body.numero || '').trim();
    if (!nombres) return res.status(400).json({ message: 'Los nombres son obligatorios' });
    if (!apellidos) return res.status(400).json({ message: 'Los apellidos son obligatorios' });
    if (!numero) return res.status(400).json({ message: 'El número de documento es obligatorio' });
    const dup = await Gestor.findOne({ numero, activo: { $ne: false } }).lean();
    if (dup) {
      return res.status(409).json({ message: `Ya existe un gestor con documento ${numero}` });
    }
    const doc = new Gestor({
      activo: true,
      userAddReg: req.user?.username || 'sistema',
    });
    aplicarBody(doc, body, req.files);
    await doc.save();
    res.status(201).json(mapGestor(doc));
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const doc = await Gestor.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Gestor no encontrado' });
    const body = req.body || {};
    if (body.numero != null) {
      const numero = String(body.numero || '').trim();
      if (!numero) return res.status(400).json({ message: 'El número de documento es obligatorio' });
      const dup = await Gestor.findOne({
        numero,
        _id: { $ne: doc._id },
        activo: { $ne: false },
      }).lean();
      if (dup) {
        return res.status(409).json({ message: `Ya existe un gestor con documento ${numero}` });
      }
    }
    if (body.nombres != null && !String(body.nombres).trim()) {
      return res.status(400).json({ message: 'Los nombres son obligatorios' });
    }
    if (body.apellidos != null && !String(body.apellidos).trim()) {
      return res.status(400).json({ message: 'Los apellidos son obligatorios' });
    }
    aplicarBody(doc, body, req.files);
    doc.userChangeRecord = req.user?.username || 'sistema';
    await doc.save();
    res.json(mapGestor(doc));
  } catch (e) {
    next(e);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const doc = await Gestor.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Gestor no encontrado' });
    doc.activo = false;
    doc.userChangeRecord = req.user?.username || 'sistema';
    await doc.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
