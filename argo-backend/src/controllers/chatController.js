const MensajeChat = require('../models/MensajeChat');
const { convKeyDe } = MensajeChat;
const Usuario = require('../models/Usuario');
const Empleado = require('../models/Empleado');
const { usuariosOnline } = require('../services/chatSocket');

function nombreVisible(u) {
  const nom = [u?.nombres, u?.apellidos].filter(Boolean).join(' ').trim();
  return nom || u?.username || 'Usuario';
}

function mapMensaje(m) {
  return {
    _id: String(m._id),
    convKey: m.convKey,
    deId: m.deId,
    paraId: m.paraId,
    deNombre: m.deNombre,
    texto: m.texto,
    leido: !!m.leido,
    leidoAt: m.leidoAt || null,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

/** GET /api/chat/contactos — usuarios activos + presencia + no leídos */
exports.contactos = async (req, res, next) => {
  try {
    const yo = String(req.user.sub);
    const online = new Set(usuariosOnline());

    const rows = await Usuario.find({ activo: { $ne: false }, _id: { $ne: yo } })
      .select('username nombres apellidos rol idEmpleado')
      .sort({ nombres: 1, username: 1 })
      .lean();

    const noLeidosAgg = await MensajeChat.aggregate([
      { $match: { paraId: yo, leido: false } },
      { $group: { _id: '$deId', count: { $sum: 1 } } },
    ]);
    const noLeidosMap = new Map(noLeidosAgg.map((r) => [String(r._id), r.count]));

    const idsEmpleado = rows.map((r) => r.idEmpleado).filter((n) => n != null);
    const fotos = new Map();
    if (idsEmpleado.length) {
      const emps = await Empleado.find({ idEmpleado: { $in: idsEmpleado } })
        .select('idEmpleado urlFoto')
        .lean();
      for (const e of emps) {
        if (e.urlFoto) fotos.set(e.idEmpleado, e.urlFoto);
      }
    }

    // Último mensaje por contacto (para ordenar conversaciones recientes)
    const convKeys = rows.map((r) => convKeyDe(yo, r._id));
    const ultimos = await MensajeChat.aggregate([
      { $match: { convKey: { $in: convKeys } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$convKey',
          texto: { $first: '$texto' },
          createdAt: { $first: '$createdAt' },
          deId: { $first: '$deId' },
        },
      },
    ]);
    const ultimoMap = new Map(ultimos.map((u) => [u._id, u]));

    const contactos = rows.map((r) => {
      const id = String(r._id);
      const key = convKeyDe(yo, id);
      const ult = ultimoMap.get(key);
      return {
        _id: id,
        username: r.username,
        nombres: r.nombres || '',
        apellidos: r.apellidos || '',
        nombre: nombreVisible(r),
        rol: r.rol || 'usuario',
        urlFoto: r.idEmpleado != null ? fotos.get(r.idEmpleado) || null : null,
        enLinea: online.has(id),
        noLeidos: noLeidosMap.get(id) || 0,
        ultimoMensaje: ult
          ? { texto: ult.texto, createdAt: ult.createdAt, deId: ult.deId }
          : null,
      };
    });

    contactos.sort((a, b) => {
      const ta = a.ultimoMensaje?.createdAt ? new Date(a.ultimoMensaje.createdAt).getTime() : 0;
      const tb = b.ultimoMensaje?.createdAt ? new Date(b.ultimoMensaje.createdAt).getTime() : 0;
      if (tb !== ta) return tb - ta;
      if (a.enLinea !== b.enLinea) return a.enLinea ? -1 : 1;
      return a.nombre.localeCompare(b.nombre, 'es');
    });

    res.json(contactos);
  } catch (e) {
    next(e);
  }
};

/** GET /api/chat/conversacion/:otroId — historial y marca leídos */
exports.conversacion = async (req, res, next) => {
  try {
    const yo = String(req.user.sub);
    const otro = String(req.params.otroId || '').trim();
    if (!otro || otro === yo) {
      return res.status(400).json({ message: 'Destinatario inválido' });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);
    const key = convKeyDe(yo, otro);

    const rows = await MensajeChat.find({ convKey: key })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const ahora = new Date();
    await MensajeChat.updateMany(
      { convKey: key, paraId: yo, leido: false },
      { $set: { leido: true, leidoAt: ahora } },
    );

    // Notificar al otro extremo vía socket si está conectado
    try {
      const { getChatNs } = require('../services/chatSocket');
      const ns = typeof getChatNs === 'function' ? getChatNs() : null;
      if (ns) {
        ns.to(`user:${otro}`).emit('chat:leido-confirm', {
          deId: otro,
          paraId: yo,
          leidoAt: ahora,
        });
      }
    } catch {
      // silent
    }

    const mensajes = rows.reverse().map(mapMensaje);
    res.json({ convKey: key, mensajes });
  } catch (e) {
    next(e);
  }
};

/** GET /api/chat/no-leidos — total para badge */
exports.noLeidos = async (req, res, next) => {
  try {
    const yo = String(req.user.sub);
    const total = await MensajeChat.countDocuments({ paraId: yo, leido: false });
    res.json({ total });
  } catch (e) {
    next(e);
  }
};
