const jwt = require('jsonwebtoken');
const MensajeChat = require('../models/MensajeChat');
const { convKeyDe } = MensajeChat;
const Usuario = require('../models/Usuario');

/** userId → Set<socketId> (presencia en memoria) */
const conexiones = new Map();
let chatNsInstance = null;

function roomUser(userId) {
  return `user:${String(userId)}`;
}

function usuariosOnline() {
  return [...conexiones.keys()].filter((id) => (conexiones.get(id)?.size || 0) > 0);
}

function getChatNs() {
  return chatNsInstance;
}

function nombreVisible(u) {
  const nom = [u?.nombres, u?.apellidos].filter(Boolean).join(' ').trim();
  return nom || u?.username || 'Usuario';
}

/**
 * Namespace /chat sobre la misma instancia Socket.IO del foro.
 * @param {import('socket.io').Server} io
 */
function initChatSocket(io) {
  if (!io) {
    console.warn('[Chat] initChatSocket: sin instancia io');
    return null;
  }

  const chatNs = io.of('/chat');
  chatNsInstance = chatNs;

  chatNs.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('No autenticado'));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (!payload?.sub) return next(new Error('Token inválido'));

      const u = await Usuario.findById(payload.sub)
        .select('username nombres apellidos rol activo')
        .lean();
      if (!u || u.activo === false) return next(new Error('Usuario inactivo'));

      socket.data.user = {
        id: String(payload.sub),
        username: u.username || payload.username || '',
        nombre: nombreVisible(u),
        rol: u.rol || payload.rol || 'usuario',
      };
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  chatNs.on('connection', (socket) => {
    const { user } = socket.data;
    const uid = user.id;

    socket.join(roomUser(uid));

    let set = conexiones.get(uid);
    const eraOffline = !set || set.size === 0;
    if (!set) {
      set = new Set();
      conexiones.set(uid, set);
    }
    set.add(socket.id);

    if (eraOffline) {
      chatNs.emit('chat:presencia', { userId: uid, online: true });
    }
    socket.emit('chat:online', { userIds: usuariosOnline() });

    socket.on('chat:enviar', async ({ paraId, texto } = {}) => {
      const dest = String(paraId || '').trim();
      const textoLimpio = String(texto || '').trim().slice(0, 4000);
      if (!dest || !textoLimpio || dest === uid) return;

      try {
        const destUser = await Usuario.findById(dest).select('_id activo').lean();
        if (!destUser || destUser.activo === false) {
          socket.emit('chat:error', { message: 'Destinatario no disponible' });
          return;
        }

        const msg = await MensajeChat.create({
          convKey: convKeyDe(uid, dest),
          deId: uid,
          paraId: dest,
          deNombre: user.nombre,
          texto: textoLimpio,
        });

        const payload = {
          _id: String(msg._id),
          convKey: msg.convKey,
          deId: msg.deId,
          paraId: msg.paraId,
          deNombre: msg.deNombre,
          texto: msg.texto,
          leido: false,
          leidoAt: null,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
        };

        chatNs.to(roomUser(dest)).emit('chat:mensaje', payload);
        chatNs.to(roomUser(uid)).emit('chat:mensaje', payload);
      } catch (e) {
        console.error('[Chat] Error enviando mensaje:', e.message);
        socket.emit('chat:error', { message: 'Error enviando mensaje' });
      }
    });

    socket.on('chat:leido', async ({ deId } = {}) => {
      const otro = String(deId || '').trim();
      if (!otro) return;

      try {
        const ahora = new Date();
        const r = await MensajeChat.updateMany(
          { deId: otro, paraId: uid, leido: false },
          { $set: { leido: true, leidoAt: ahora } },
        );
        if (r.modifiedCount > 0) {
          chatNs.to(roomUser(otro)).emit('chat:leido-confirm', {
            deId: otro,
            paraId: uid,
            leidoAt: ahora,
          });
          socket.emit('chat:leido-confirm', {
            deId: otro,
            paraId: uid,
            leidoAt: ahora,
          });
        }
      } catch (e) {
        console.error('[Chat] Error marcando leído:', e.message);
      }
    });

    socket.on('disconnect', () => {
      const s = conexiones.get(uid);
      if (!s) return;
      s.delete(socket.id);
      if (s.size === 0) {
        conexiones.delete(uid);
        chatNs.emit('chat:presencia', { userId: uid, online: false });
      }
    });
  });

  console.log('[Chat] Namespace /chat listo');
  return chatNs;
}

module.exports = { initChatSocket, usuariosOnline, getChatNs };
