const DatosAlumno = require('../models/DatosAlumno');
const upload = require('../middleware/upload');

function aplicarArchivos(dto, files) {
  if (files?.foto?.[0]) dto.urlFoto = upload.publicUrl('alumnos', files.foto[0].filename);
}

function nombreCompleto(a) {
  const n = [a.nombre1, a.nombre2].filter(Boolean).join(' ').trim();
  const ap = [a.apellido1, a.apellido2].filter(Boolean).join(' ').trim();
  return { nombres: n, apellidos: ap, nombreCompleto: `${n} ${ap}`.trim() };
}

function mapListaItem(doc) {
  const extra = nombreCompleto(doc);
  return {
    _id: doc._id,
    numDoc: doc.numDoc,
    tipoDoc: doc.tipoDoc,
    nombre1: doc.nombre1,
    nombre2: doc.nombre2,
    apellido1: doc.apellido1,
    apellido2: doc.apellido2,
    nombres: extra.nombres,
    apellidos: extra.apellidos,
    nombreCompleto: extra.nombreCompleto,
    urlFoto: doc.urlFoto,
    fechaMod: doc.fechaMod || doc.fechaAudi,
  };
}

exports.listar = async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);
    let filter = {};
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(safe, 'i');
      filter = {
        $or: [
          { numDoc: re },
          { nombre1: re },
          { nombre2: re },
          { apellido1: re },
          { apellido2: re },
          { correo: re },
          { celular: re },
        ],
      };
    }
    const [docs, total] = await Promise.all([
      DatosAlumno.find(filter).sort({ apellido1: 1, nombre1: 1 }).skip(skip).limit(limit).lean(),
      DatosAlumno.countDocuments(filter),
    ]);
    res.json({ items: docs.map(mapListaItem), total, skip, limit });
  } catch (e) {
    next(e);
  }
};

exports.porId = async (req, res, next) => {
  try {
    const a = await DatosAlumno.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Alumno no encontrado' });
    res.json(a);
  } catch (e) {
    next(e);
  }
};

exports.porDocumento = async (req, res, next) => {
  try {
    const a = await DatosAlumno.findOne({ numDoc: req.params.numDoc });
    if (!a) return res.status(404).json({ message: 'Alumno no encontrado' });
    res.json(a);
  } catch (e) {
    next(e);
  }
};

exports.verificarDocumento = async (req, res, next) => {
  try {
    const numDoc = String(req.params.numDoc || '').trim();
    const excludeId = req.query.excludeId;
    if (!numDoc) return res.status(400).json({ message: 'numDoc requerido' });
    const filter = { numDoc };
    if (excludeId) filter._id = { $ne: excludeId };
    const a = await DatosAlumno.findOne(filter).lean();
    if (!a) return res.json({ existe: false });
    res.json({ existe: true, _id: a._id, numDoc: a.numDoc, ...nombreCompleto(a) });
  } catch (e) {
    next(e);
  }
};

const CAMPOS_ALUMNO = [
  'tipoDoc', 'numDoc', 'expedida', 'apellido1', 'apellido2', 'nombre1', 'nombre2',
  'fechaNac', 'observaciones', 'genero', 'tipoSangre', 'jornada', 'estadoCivil', 'estrato',
  'regimenSalud', 'nivelFormacion', 'ocupacion', 'discapacidad', 'munOrigen', 'codMunicipio',
  'correo', 'direccion', 'celular', 'multiCulturalidad', 'urlFoto',
];

function pickAlumno(body) {
  const dto = {};
  for (const k of CAMPOS_ALUMNO) {
    if (body[k] !== undefined && body[k] !== '') dto[k] = body[k];
  }
  // codMunicipio debe coincidir con munOrigen (código divipola)
  if (dto.munOrigen) dto.codMunicipio = String(dto.munOrigen).trim();
  else if (dto.codMunicipio) dto.munOrigen = String(dto.codMunicipio).trim();
  return dto;
}

exports.crear = async (req, res, next) => {
  try {
    const dto = pickAlumno(req.body);
    if (!dto.numDoc || !dto.nombre1 || !dto.apellido1) {
      return res.status(400).json({ message: 'Documento, primer nombre y primer apellido son obligatorios' });
    }
    dto.numDoc = String(dto.numDoc).trim();
    const existe = await DatosAlumno.findOne({ numDoc: dto.numDoc });
    if (existe) {
      return res.status(409).json({
        message: 'Ya existe un alumno con ese número de documento',
        existingId: existe._id,
        numDoc: existe.numDoc,
        ...nombreCompleto(existe),
      });
    }
    aplicarArchivos(dto, req.files);
    const now = new Date();
    dto.fechaReg = dto.fechaReg ? new Date(dto.fechaReg) : now;
    dto.fechaAudi = now;
    dto.fechaMod = now;
    dto.userAddReg = dto.userAddReg || req.user?.username || req.user?.sub || 'sistema';
    if (dto.fechaNac) dto.fechaNac = new Date(dto.fechaNac);

    const a = await DatosAlumno.create(dto);
    res.status(201).json(a);
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const dto = pickAlumno(req.body);
    aplicarArchivos(dto, req.files);
    dto.fechaMod = new Date();
    dto.userChangeRecord = dto.userChangeRecord || req.user?.username || req.user?.sub || 'sistema';
    if (dto.fechaNac) dto.fechaNac = new Date(dto.fechaNac);

    const a = await DatosAlumno.findByIdAndUpdate(req.params.id, dto, { new: true });
    if (!a) return res.status(404).json({ message: 'Alumno no encontrado' });
    res.json(a);
  } catch (e) {
    next(e);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const r = await DatosAlumno.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: 'Alumno no encontrado' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
