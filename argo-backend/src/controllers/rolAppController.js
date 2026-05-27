const RolApp = require('../models/RolApp');
const Usuario = require('../models/Usuario');
const { GRUPOS } = require('../constants/permisosCatalogo');
const { GRUPOS: ALARMAS_GRUPOS } = require('../constants/alarmasCatalogo');
const {
  sanitizarPermisos,
  sanitizarAlarmas,
  codigoRolValido,
  limpiarCache,
  initRolesSistema,
} = require('../services/rolesPermisos');
const { normalizarRol } = require('../utils/roles');

function limpiar(doc) {
  if (!doc) return null;
  return doc.toJSON ? doc.toJSON() : { ...doc };
}

exports.catalogo = (_req, res) => {
  res.json({ grupos: GRUPOS, alarmasGrupos: ALARMAS_GRUPOS });
};

exports.listar = async (_req, res, next) => {
  try {
    const rows = await RolApp.find().sort({ esSistema: -1, nombre: 1 });
    res.json(rows.map(limpiar));
  } catch (e) {
    next(e);
  }
};

exports.obtener = async (req, res, next) => {
  try {
    const doc = await RolApp.findOne({ codigo: normalizarRol(req.params.codigo) });
    if (!doc) return res.status(404).json({ message: 'Rol no encontrado' });
    res.json(limpiar(doc));
  } catch (e) {
    next(e);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const { codigo, nombre, descripcion, permisos, alarmas, activo } = req.body || {};
    const c = String(codigo || '').trim().toLowerCase();
    if (!codigoRolValido(c)) {
      return res.status(400).json({
        message: 'Código inválido. Use 2–40 caracteres: letras minúsculas, números, guión o guión bajo.',
      });
    }
    if (!String(nombre || '').trim()) {
      return res.status(400).json({ message: 'Nombre del rol es obligatorio' });
    }
    const dup = await RolApp.findOne({ codigo: c });
    if (dup) return res.status(409).json({ message: 'Ya existe un rol con ese código' });

    const doc = await RolApp.create({
      codigo: c,
      nombre: String(nombre).trim(),
      descripcion: String(descripcion || '').trim(),
      permisos: sanitizarPermisos(permisos),
      alarmas: sanitizarAlarmas(alarmas),
      esSistema: false,
      activo: activo !== false,
    });
    limpiarCache();
    res.status(201).json(limpiar(doc));
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const doc = await RolApp.findOne({ codigo: normalizarRol(req.params.codigo) });
    if (!doc) return res.status(404).json({ message: 'Rol no encontrado' });

    const { nombre, descripcion, permisos, alarmas, activo } = req.body || {};
    if (nombre != null) doc.nombre = String(nombre).trim();
    if (descripcion != null) doc.descripcion = String(descripcion).trim();
    if (permisos != null) doc.permisos = sanitizarPermisos(permisos);
    if (alarmas != null) doc.alarmas = sanitizarAlarmas(alarmas);
    if (activo != null) doc.activo = activo === true || activo === 'true';

    await doc.save();
    limpiarCache(doc.codigo);
    res.json(limpiar(doc));
  } catch (e) {
    next(e);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const doc = await RolApp.findOne({ codigo: normalizarRol(req.params.codigo) });
    if (!doc) return res.status(404).json({ message: 'Rol no encontrado' });
    if (doc.esSistema) {
      return res.status(400).json({ message: 'No se puede eliminar un rol del sistema' });
    }

    const enUso = await Usuario.countDocuments({ rol: doc.codigo, activo: { $ne: false } });
    if (enUso > 0) {
      return res.status(400).json({
        message: `Hay ${enUso} usuario(s) activo(s) con este rol. Reasígnelos antes de eliminar.`,
      });
    }

    await RolApp.findByIdAndDelete(doc._id);
    limpiarCache(doc.codigo);
    res.json({ ok: true, message: `Rol «${doc.nombre}» eliminado` });
  } catch (e) {
    next(e);
  }
};

exports.reiniciarSistema = async (_req, res, next) => {
  try {
    await initRolesSistema({ force: true });
    res.json({ ok: true, message: 'Roles del sistema restaurados' });
  } catch (e) {
    next(e);
  }
};
