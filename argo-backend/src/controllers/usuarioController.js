const Usuario = require('../models/Usuario');
const { ROLES_VALIDOS, normalizarRol, esAdmin } = require('../utils/roles');

function limpiar(doc) {
  if (!doc) return null;
  const o = doc.toJSON ? doc.toJSON() : { ...doc };
  delete o.passwordHash;
  delete o.nickName;
  return o;
}

exports.listar = async (_req, res, next) => {
  try {
    const rows = await Usuario.find().sort({ username: 1 }).lean();
    res.json(rows.map((r) => {
      const o = { ...r };
      delete o.passwordHash;
      return o;
    }));
  } catch (e) {
    next(e);
  }
};

exports.obtener = async (req, res, next) => {
  try {
    const u = await Usuario.findById(req.params.id);
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(limpiar(u));
  } catch (e) {
    next(e);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const { username, password, nombres, apellidos, email, rol, activo } = req.body || {};
    const userKey = String(username || '').trim().toLowerCase();
    if (!userKey) return res.status(400).json({ message: 'Usuario (username) es obligatorio' });
    if (!password || String(password).length < 4) {
      return res.status(400).json({ message: 'Contraseña obligatoria (mínimo 4 caracteres)' });
    }
    const dup = await Usuario.findOne({ username: userKey });
    if (dup) return res.status(409).json({ message: 'Ya existe un usuario con ese login' });

    const payload = {
      username: userKey,
      nombres: String(nombres || '').trim(),
      apellidos: String(apellidos || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      rol: normalizarRol(rol),
      activo: activo !== false,
      passwordHash: await Usuario.hashPassword(password),
    };

    const digitsLogin = userKey.replace(/\D/g, '');
    const numeroBody = req.body?.numero != null ? Number(req.body.numero) : NaN;
    if (Number.isFinite(numeroBody)) {
      payload.numero = numeroBody;
    } else if (digitsLogin) {
      payload.numero = Number(digitsLogin);
    }

    if (payload.numero != null && Number.isFinite(payload.numero)) {
      const dupNum = await Usuario.findOne({ numero: payload.numero });
      if (dupNum) {
        return res.status(409).json({ message: 'Ya existe un usuario con ese número de documento' });
      }
    }

    const doc = await Usuario.create(payload);
    res.status(201).json(limpiar(doc));
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Usuario duplicado' });
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const u = await Usuario.findById(req.params.id);
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });

    const { username, password, nombres, apellidos, email, rol, activo } = req.body || {};
    if (username != null) {
      const userKey = String(username).trim().toLowerCase();
      if (!userKey) return res.status(400).json({ message: 'Usuario inválido' });
      const dup = await Usuario.findOne({ username: userKey, _id: { $ne: u._id } });
      if (dup) return res.status(409).json({ message: 'Ese usuario ya existe' });
      u.username = userKey;
    }
    if (nombres != null) u.nombres = String(nombres).trim();
    if (apellidos != null) u.apellidos = String(apellidos).trim();
    if (email != null) u.email = String(email).trim().toLowerCase();
    if (rol != null) u.rol = normalizarRol(rol);
    if (activo != null) u.activo = activo === true || activo === 'true';
    if (password != null && String(password).length > 0) {
      if (String(password).length < 4) {
        return res.status(400).json({ message: 'Contraseña muy corta' });
      }
      u.passwordHash = await Usuario.hashPassword(password);
    }

    await u.save();
    res.json(limpiar(u));
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Usuario duplicado' });
    next(e);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user.sub)) {
      return res.status(400).json({ message: 'No puede desactivar su propio usuario' });
    }
    const u = await Usuario.findByIdAndUpdate(
      req.params.id,
      { $set: { activo: false } },
      { new: true },
    );
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ ok: true, usuario: limpiar(u) });
  } catch (e) {
    next(e);
  }
};

exports.borrar = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user.sub)) {
      return res.status(400).json({ message: 'No puede eliminar su propio usuario' });
    }
    const u = await Usuario.findById(req.params.id);
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });

    const rol = normalizarRol(u.rol);
    if (rol === 'admin') {
      const otrosAdmin = await Usuario.countDocuments({
        _id: { $ne: u._id },
        rol: { $in: ['admin', 'Admin', 'ADMIN'] },
        activo: { $ne: false },
      });
      if (otrosAdmin < 1) {
        return res.status(400).json({
          message: 'No puede eliminar el último administrador activo del sistema',
        });
      }
    }

    await Usuario.findByIdAndDelete(u._id);
    res.json({ ok: true, message: `Usuario «${u.username}» eliminado permanentemente` });
  } catch (e) {
    next(e);
  }
};

exports.roles = async (_req, res) => {
  res.json(ROLES_VALIDOS.map((id) => ({
    id,
    label: id === 'admin' ? 'Administrador' : id.charAt(0).toUpperCase() + id.slice(1),
  })));
};
