const SolicitudAutorizacion = require('../models/SolicitudAutorizacion');
const { MODULOS_CRUD } = require('../constants/crudModulos');
const { maxNumericId } = require('./programaServicio');
const { permisosParaRol } = require('./rolesPermisos');
const { tieneAccionModulo, puedeAutorizarOperaciones } = require('./permisoAccion');
const { ejecutarEliminacionModulo } = require('./eliminacionEntidades');
const { esAdmin } = require('../utils/roles');
const { notificarNuevaSolicitud, notificarResolucion } = require('./autorizacionNotificacion');

function supervisorDesdeReq(req) {
  return {
    autorizadoPor: req.user?.username || 'sistema',
    idUsuarioAutoriza: req.user?.sub ? String(req.user.sub) : null,
    nombreAutoriza: req.user?.nombre || req.user?.username || null,
    autorizadoEn: new Date(),
    viaColaAutorizacion: true,
  };
}

function planoSolicitud(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  return o;
}

async function solicitarEliminacion(req, body) {
  const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
  const modulo = String(body?.modulo || '').trim();
  const idEntidad = String(body?.idEntidad || '').trim();
  const resumen = String(body?.resumen || '').trim();
  const motivo = String(body?.motivo || '').trim() || null;
  const detalle = body?.detalle && typeof body.detalle === 'object' ? body.detalle : undefined;

  if (!MODULOS_CRUD[modulo]) {
    const err = new Error('Módulo no válido para autorización');
    err.status = 400;
    throw err;
  }
  if (!idEntidad) {
    const err = new Error('idEntidad es obligatorio');
    err.status = 400;
    throw err;
  }
  if (!resumen) {
    const err = new Error('Indique un resumen de lo que desea eliminar');
    err.status = 400;
    throw err;
  }

  if (tieneAccionModulo(permisos, modulo, 'eliminar')) {
    const err = new Error('Ya tiene permiso para eliminar. Use la acción normal de eliminar.');
    err.status = 409;
    err.code = 'YA_PUEDE_ELIMINAR';
    throw err;
  }

  if (!tieneAccionModulo(permisos, modulo, 'ver') && !tieneAccionModulo(permisos, modulo, 'editar')) {
    const err = new Error('No tiene permisos para solicitar eliminación en este módulo');
    err.status = 403;
    throw err;
  }

  const duplicada = await SolicitudAutorizacion.findOne({
    modulo,
    accion: 'eliminar',
    idEntidad,
    estado: 'pendiente',
  }).lean();
  if (duplicada) {
    const err = new Error('Ya existe una solicitud pendiente para este registro');
    err.status = 409;
    err.code = 'SOLICITUD_DUPLICADA';
    err.solicitud = planoSolicitud(duplicada);
    throw err;
  }

  const idSolicitud = await maxNumericId(SolicitudAutorizacion, 'idSolicitud');
  const def = MODULOS_CRUD[modulo];
  const doc = await SolicitudAutorizacion.create({
    idSolicitud,
    modulo,
    accion: 'eliminar',
    entidad: def.entidad || modulo,
    idEntidad,
    idSede: req.idSede || null,
    resumen,
    detalle,
    motivo,
    estado: 'pendiente',
    idUsuarioSolicita: req.user?.sub ? String(req.user.sub) : null,
    usuarioSolicita: req.user?.username || null,
    nombreSolicita: body?.nombreSolicita || null,
    fechaSolicitud: new Date(),
  });
  notificarNuevaSolicitud(doc);
  return planoSolicitud(doc);
}

async function listarSolicitudes(req, query = {}) {
  const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
  if (!puedeAutorizarOperaciones(permisos, req.user?.rol)) {
    const err = new Error('Sin permisos para ver autorizaciones pendientes');
    err.status = 403;
    throw err;
  }
  const filter = {};
  if (query.estado) filter.estado = String(query.estado);
  if (query.modulo) filter.modulo = String(query.modulo);
  const limit = Math.min(Number(query.limit) || 100, 200);
  const rows = await SolicitudAutorizacion.find(filter)
    .sort({ fechaSolicitud: -1 })
    .limit(limit)
    .lean();
  return rows.map(planoSolicitud);
}

async function contarPendientes(req) {
  const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
  if (!puedeAutorizarOperaciones(permisos, req.user?.rol)) return { pendientes: 0 };
  const pendientes = await SolicitudAutorizacion.countDocuments({ estado: 'pendiente' });
  return { pendientes };
}

async function obtenerSolicitud(req, idSolicitud) {
  const doc = await SolicitudAutorizacion.findOne({ idSolicitud: Number(idSolicitud) }).lean();
  if (!doc) {
    const err = new Error('Solicitud no encontrada');
    err.status = 404;
    throw err;
  }
  return planoSolicitud(doc);
}

async function rechazarSolicitud(req, idSolicitud, motivoRechazo) {
  const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
  if (!puedeAutorizarOperaciones(permisos, req.user?.rol)) {
    const err = new Error('Sin permisos para rechazar solicitudes');
    err.status = 403;
    throw err;
  }
  const doc = await SolicitudAutorizacion.findOne({ idSolicitud: Number(idSolicitud) });
  if (!doc) {
    const err = new Error('Solicitud no encontrada');
    err.status = 404;
    throw err;
  }
  if (doc.estado !== 'pendiente') {
    const err = new Error('La solicitud ya fue resuelta');
    err.status = 409;
    throw err;
  }
  doc.estado = 'rechazada';
  doc.motivoRechazo = String(motivoRechazo || '').trim() || null;
  doc.idUsuarioResuelve = req.user?.sub ? String(req.user.sub) : null;
  doc.usuarioResuelve = req.user?.username || null;
  doc.fechaResolucion = new Date();
  await doc.save();
  notificarResolucion(doc);
  return planoSolicitud(doc);
}

async function listarAlertasAdmin(req) {
  const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
  if (!puedeAutorizarOperaciones(permisos, req.user?.rol)) return [];
  const limit = Math.min(Number(req.query?.limit) || 10, 20);
  const rows = await SolicitudAutorizacion.find({ estado: 'pendiente' })
    .sort({ fechaSolicitud: -1 })
    .limit(limit)
    .lean();
  return rows.map(planoSolicitud);
}

async function listarMisAlertas(req) {
  const uid = req.user?.sub ? String(req.user.sub) : null;
  if (!uid) return [];
  const limit = Math.min(Number(req.query?.limit) || 15, 30);
  const rows = await SolicitudAutorizacion.find({
    idUsuarioSolicita: uid,
    estado: { $in: ['ejecutada', 'rechazada', 'fallida'] },
    notificacionVistaSolicitante: { $ne: true },
  })
    .sort({ fechaResolucion: -1 })
    .limit(limit)
    .lean();
  return rows.map(planoSolicitud);
}

async function marcarNotificacionVista(req, idSolicitud) {
  const uid = req.user?.sub ? String(req.user.sub) : null;
  const doc = await SolicitudAutorizacion.findOne({ idSolicitud: Number(idSolicitud) });
  if (!doc) {
    const err = new Error('Solicitud no encontrada');
    err.status = 404;
    throw err;
  }
  const esPropia = doc.idUsuarioSolicita && uid && String(doc.idUsuarioSolicita) === uid;
  if (!esPropia) {
    const err = new Error('Sin permisos');
    err.status = 403;
    throw err;
  }
  if (!doc.notificacionVistaSolicitante) {
    doc.notificacionVistaSolicitante = true;
    await doc.save();
  }
  return planoSolicitud(doc);
}

async function autorizarYEjecutar(req, idSolicitud) {
  const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
  if (!puedeAutorizarOperaciones(permisos, req.user?.rol)) {
    const err = new Error('Sin permisos para autorizar eliminaciones');
    err.status = 403;
    throw err;
  }
  const doc = await SolicitudAutorizacion.findOne({ idSolicitud: Number(idSolicitud) });
  if (!doc) {
    const err = new Error('Solicitud no encontrada');
    err.status = 404;
    throw err;
  }
  if (doc.estado !== 'pendiente') {
    const err = new Error('La solicitud ya fue resuelta');
    err.status = 409;
    throw err;
  }

  const supervisor = supervisorDesdeReq(req);
  const reqEjec = {
    ...req,
    solicitudAutorizacion: {
      idSolicitud: doc.idSolicitud,
      motivo: doc.motivo,
      resumen: doc.resumen,
    },
    body: { ...(req.body || {}), motivo: doc.motivo },
  };

  const resultado = await ejecutarEliminacionModulo(
    reqEjec,
    doc.modulo,
    doc.idEntidad,
    supervisor,
  );

  doc.idUsuarioResuelve = req.user?.sub ? String(req.user.sub) : null;
  doc.usuarioResuelve = req.user?.username || null;
  doc.nombreResuelve = req.user?.nombre || req.user?.username || null;
  doc.fechaResolucion = new Date();

  if (!resultado.ok) {
    doc.estado = 'fallida';
    doc.errorEjecucion = resultado.message;
    doc.resultadoEjecucion = resultado;
    await doc.save();
    notificarResolucion(doc);
    const err = new Error(resultado.message || 'No se pudo ejecutar la eliminación');
    err.status = resultado.status || 400;
    err.resultado = planoSolicitud(doc);
    throw err;
  }

  doc.estado = 'ejecutada';
  doc.resultadoEjecucion = resultado;
  await doc.save();
  notificarResolucion(doc);
  return { solicitud: planoSolicitud(doc), resultado };
}

function requiereAutorizacionParaEliminar(permisos, modulo, rol) {
  if (!permisos?.length) return true;
  if (permisos.includes('*') || esAdmin(rol)) return false;
  return !tieneAccionModulo(permisos, modulo, 'eliminar');
}

module.exports = {
  solicitarEliminacion,
  listarSolicitudes,
  contarPendientes,
  listarAlertasAdmin,
  listarMisAlertas,
  marcarNotificacionVista,
  obtenerSolicitud,
  rechazarSolicitud,
  autorizarYEjecutar,
  requiereAutorizacionParaEliminar,
};
