const EmpleadoAnotacion = require('../models/EmpleadoAnotacion');
const Empleado = require('../models/Empleado');

const TIPOS = new Set(['positivo', 'negativo']);
const CATEGORIAS = new Set([
  'reconocimiento',
  'logro',
  'felicitacion',
  'llamado_atencion',
  'falta',
  'queja',
  'otro',
]);

function filtroIdEmpleado(id) {
  const q = String(id ?? '').trim();
  const n = Number(q);
  const or = [{ idEmpleado: q }];
  if (Number.isFinite(n)) or.push({ idEmpleado: n });
  return { $or: or };
}

async function buscarEmpleado(id) {
  return Empleado.findOne(filtroIdEmpleado(id)).lean();
}

function pickAnotacion(body) {
  const dto = {};
  if (body.fecha != null && body.fecha !== '') {
    const d = new Date(body.fecha);
    if (!Number.isNaN(d.getTime())) dto.fecha = d;
  }
  if (body.tipo != null) {
    const t = String(body.tipo).trim().toLowerCase();
    if (TIPOS.has(t)) dto.tipo = t;
  }
  if (body.categoria != null) {
    const c = String(body.categoria).trim().toLowerCase().replace(/\s+/g, '_');
    dto.categoria = CATEGORIAS.has(c) ? c : 'otro';
  }
  if (body.titulo != null) dto.titulo = String(body.titulo).trim().slice(0, 160);
  if (body.descripcion != null) dto.descripcion = String(body.descripcion).trim();
  return dto;
}

function serialize(row) {
  if (!row) return null;
  return {
    _id: String(row._id),
    idEmpleado: row.idEmpleado,
    fecha: row.fecha ? new Date(row.fecha).toISOString().slice(0, 10) : null,
    tipo: row.tipo === 'negativo' ? 'negativo' : 'positivo',
    categoria: row.categoria || 'otro',
    titulo: row.titulo || '',
    descripcion: row.descripcion || '',
    registradoPor: row.registradoPor || null,
    registradoPorNombre: row.registradoPorNombre || '',
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
}

exports.listarPorEmpleado = async (req, res, next) => {
  try {
    const emp = await buscarEmpleado(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Empleado no encontrado' });
    const rows = await EmpleadoAnotacion.find({ idEmpleado: emp.idEmpleado })
      .sort({ fecha: -1, createdAt: -1 })
      .lean();
    res.json(rows.map(serialize));
  } catch (e) {
    next(e);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const emp = await buscarEmpleado(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Empleado no encontrado' });
    const dto = pickAnotacion(req.body);
    if (!dto.fecha) return res.status(400).json({ message: 'fecha es obligatoria' });
    if (!dto.tipo) return res.status(400).json({ message: 'tipo debe ser positivo o negativo' });
    if (!dto.descripcion) return res.status(400).json({ message: 'descripcion es obligatoria' });
    const user = req.user?.username || 'sistema';
    const nombre = [req.user?.nombres, req.user?.apellidos].filter(Boolean).join(' ').trim();
    const now = new Date();
    const doc = await EmpleadoAnotacion.create({
      idEmpleado: emp.idEmpleado,
      fecha: dto.fecha,
      tipo: dto.tipo,
      categoria: dto.categoria || 'otro',
      titulo: dto.titulo || '',
      descripcion: dto.descripcion,
      registradoPor: user,
      registradoPorNombre: nombre,
      createdAt: now,
      updatedAt: now,
      userAddReg: user,
      userChangeRecord: user,
    });
    res.status(201).json(serialize(doc.toObject ? doc.toObject() : doc));
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const emp = await buscarEmpleado(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Empleado no encontrado' });
    const row = await EmpleadoAnotacion.findOne({
      _id: req.params.anotId,
      idEmpleado: emp.idEmpleado,
    });
    if (!row) return res.status(404).json({ message: 'Anotación no encontrada' });
    const dto = pickAnotacion(req.body);
    if (req.body.tipo != null && !dto.tipo) {
      return res.status(400).json({ message: 'tipo debe ser positivo o negativo' });
    }
    if (req.body.descripcion != null && !dto.descripcion) {
      return res.status(400).json({ message: 'descripcion es obligatoria' });
    }
    const user = req.user?.username || 'sistema';
    Object.assign(row, dto, { updatedAt: new Date(), userChangeRecord: user });
    await row.save();
    res.json(serialize(row.toObject()));
  } catch (e) {
    next(e);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const emp = await buscarEmpleado(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Empleado no encontrado' });
    const result = await EmpleadoAnotacion.deleteOne({
      _id: req.params.anotId,
      idEmpleado: emp.idEmpleado,
    });
    if (!result.deletedCount) return res.status(404).json({ message: 'Anotación no encontrada' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
