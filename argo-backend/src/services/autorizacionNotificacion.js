const { getChatNs } = require('./chatSocket');

const ROOM_ADMINS = 'autorizacion:admins';

function roomUser(userId) {
  return `user:${String(userId)}`;
}

function payloadSolicitud(doc) {
  const o = doc?.toObject ? doc.toObject() : { ...(doc || {}) };
  return {
    idSolicitud: o.idSolicitud,
    modulo: o.modulo,
    accion: o.accion,
    resumen: o.resumen,
    estado: o.estado,
    idUsuarioSolicita: o.idUsuarioSolicita,
    usuarioSolicita: o.usuarioSolicita,
    nombreSolicita: o.nombreSolicita,
    motivo: o.motivo,
    idUsuarioResuelve: o.idUsuarioResuelve,
    usuarioResuelve: o.usuarioResuelve,
    nombreResuelve: o.nombreResuelve,
    motivoRechazo: o.motivoRechazo,
    errorEjecucion: o.errorEjecucion,
    fechaSolicitud: o.fechaSolicitud,
    fechaResolucion: o.fechaResolucion,
  };
}

function notificarNuevaSolicitud(doc) {
  const ns = getChatNs();
  if (!ns) return;
  ns.to(ROOM_ADMINS).emit('autorizacion:nueva', payloadSolicitud(doc));
}

function notificarResolucion(doc) {
  const ns = getChatNs();
  if (!ns) return;
  const uid = doc?.idUsuarioSolicita ? String(doc.idUsuarioSolicita) : null;
  if (!uid) return;
  ns.to(roomUser(uid)).emit('autorizacion:resuelta', payloadSolicitud(doc));
}

module.exports = {
  ROOM_ADMINS,
  notificarNuevaSolicitud,
  notificarResolucion,
};
