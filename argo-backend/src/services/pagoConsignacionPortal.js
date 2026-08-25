const mongoose = require('mongoose');
const Ingreso = require('../models/Ingreso');
const Liquidacion = require('../models/Liquidacion');
const DatosAlumno = require('../models/DatosAlumno');
const SolicitudPagoConsignacion = require('../models/SolicitudPagoConsignacion');
const { models: cat } = require('../models/catalogos');
const { siguienteNumComprobanteIngreso } = require('./configRecibo');
const { parseNumDoc, numDocQuery } = require('../utils/numDoc');
const { refrescarPagoMatricula } = require('./liquidacionMatricula');
const { exigirSesionAbierta } = require('./cajaSesion');
const { validarPagoTotalMatriculaVirtual, num } = require('./pagoVirtual');
const {
  resolverTipoIngresoDesdeLiquidacion,
  formaPagoDesdeCatalogo,
} = require('./tipoIngresoResolver');
const { ORIGEN_PAGO_CONSIGNACION } = require('../constants/pagoConsignacion');
const {
  assertConsignacionActiva,
  obtenerConfigPagoConsignacion,
  mapPublico,
  mapMediosPublicos,
  resolverMedioPublico,
} = require('./configPagoConsignacion');
const { buscarLiquidacionVirtual } = require('./aulaVirtualMatricula');
const { obtenerCursoVirtual } = require('./aulaVirtualCatalogo');
const {
  enviarCorreoSolicitudAprobada,
  enviarCorreoSolicitudRechazada,
} = require('./pagoConsignacionEmail');

function toDec(n) {
  return mongoose.Types.Decimal128.fromString(String(Number(n) || 0));
}

function estadoLiq(valor, abonado) {
  const s = valor - abonado;
  if (s <= 0.0001) return 'pagado';
  if (abonado > 0) return 'parcial';
  return 'pendiente';
}

function nombreAlumno(a) {
  if (!a) return '';
  return [a.nombre1, a.nombre2, a.apellido1, a.apellido2].filter(Boolean).join(' ').trim();
}

function camposTipoIngreso(tipoDoc) {
  if (!tipoDoc) return { idTipoIngreso: null, tipoIngreso: null };
  const id = tipoDoc.idTipoIngreso ?? tipoDoc.codigo ?? tipoDoc._id;
  const tipo = tipoDoc.tipo ?? tipoDoc.descripcion ?? null;
  return {
    idTipoIngreso: id != null ? String(id) : null,
    tipoIngreso: tipo ? String(tipo) : null,
  };
}

function mapSolicitudPublica(sol) {
  if (!sol) return null;
  return {
    id: String(sol._id),
    estado: sol.estado,
    referenciaBancaria: sol.referenciaBancaria,
    bancoNombre: sol.bancoNombre,
    medioEtiqueta: sol.medioEtiqueta,
    montoCop: sol.montoCop,
    motivoRechazo: sol.motivoRechazo || null,
    fechaCreacion: sol.createdAt,
    fechaRevision: sol.fechaRevision || null,
    urlComprobante: sol.urlComprobante,
  };
}

async function estadoConsignacionPublico(numDoc, idPrograma) {
  const cfg = await obtenerConfigPagoConsignacion();
  const medios = await mapMediosPublicos(cfg.medios || []);
  const pendiente = await SolicitudPagoConsignacion.findOne({
    ...numDocQuery(numDoc),
    idPrograma: String(idPrograma),
    estado: 'pendiente',
  }).lean();
  let solicitudMostrar = pendiente;
  if (!pendiente) {
    solicitudMostrar = await SolicitudPagoConsignacion.findOne({
      ...numDocQuery(numDoc),
      idPrograma: String(idPrograma),
      estado: 'rechazada',
    })
      .sort({ createdAt: -1 })
      .lean();
  }
  return {
    consignacionActiva: cfg.activo === true,
    medios,
    textos: cfg.textos,
    solicitud: mapSolicitudPublica(solicitudMostrar),
    puedeEnviarSolicitud: cfg.activo === true && !pendiente,
  };
}

async function crearSolicitudConsignacion({
  numDoc: numDocRaw,
  idPrograma,
  medioId,
  referenciaBancaria,
  urlComprobante,
}) {
  const numDoc = parseNumDoc(numDocRaw);
  if (numDoc == null) {
    const err = new Error('Documento inválido');
    err.status = 400;
    throw err;
  }
  const ref = String(referenciaBancaria || '').trim();
  if (!ref) {
    const err = new Error('Indique la referencia bancaria de la consignación.');
    err.status = 400;
    throw err;
  }
  const url = String(urlComprobante || '').trim();
  if (!url) {
    const err = new Error('Adjunte la foto del comprobante de pago.');
    err.status = 400;
    throw err;
  }

  const cfg = await assertConsignacionActiva();
  const medioInfo = await resolverMedioPublico(medioId);

  const curso = await obtenerCursoVirtual(idPrograma, { requierePublicado: true });
  if (!curso) {
    const err = new Error('Curso no encontrado o no publicado');
    err.status = 404;
    throw err;
  }

  const liq = await buscarLiquidacionVirtual(numDoc, idPrograma);
  if (!liq) {
    const err = new Error('No hay matrícula con pago pendiente para este curso.');
    err.status = 404;
    throw err;
  }
  if (num(liq.saldo) <= 0.0001) {
    const err = new Error('Este curso ya está pagado.');
    err.status = 400;
    throw err;
  }

  const pendiente = await SolicitudPagoConsignacion.findOne({
    ...numDocQuery(numDoc),
    idPrograma: String(idPrograma),
    estado: 'pendiente',
  }).lean();
  if (pendiente) {
    const err = new Error('Ya tiene una solicitud de pago en revisión para este curso.');
    err.status = 409;
    err.code = 'SOLICITUD_PENDIENTE';
    throw err;
  }

  const alumno = await DatosAlumno.findOne(numDocQuery(numDoc)).lean();
  const montoCop = num(liq.saldo);

  const sol = await SolicitudPagoConsignacion.create({
    numDoc,
    idLiquidacion: liq._id,
    idPrograma: String(idPrograma),
    idMatricula: liq.idMat || liq.idMatricula || null,
    medioId: medioInfo.medio.id,
    medioEtiqueta: medioInfo.medio.etiqueta,
    idCuentaBancaria: medioInfo.medio.idCuentaBancaria,
    idBanco: medioInfo.idBanco,
    bancoNombre: medioInfo.bancoNombre,
    cuentaDescr: medioInfo.cuentaDescr,
    referenciaBancaria: ref,
    urlComprobante: url,
    montoCop,
    estado: 'pendiente',
    emailNotificado: alumno?.correo || '',
  });

  return {
    solicitud: mapSolicitudPublica(sol.toObject()),
    message: cfg.textos.mensajeEnRevision,
  };
}

async function listarSolicitudesAdmin({ estado, q, limit = 100 } = {}) {
  const filter = {};
  if (estado && estado !== 'todos') filter.estado = estado;
  if (q) {
    const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { referenciaBancaria: rx },
      { bancoNombre: rx },
      { medioEtiqueta: rx },
      { cuentaDescr: rx },
    ];
    const n = parseNumDoc(q);
    if (n != null) filter.$or.push({ numDoc: n });
  }
  const rows = await SolicitudPagoConsignacion.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 100, 500))
    .lean();
  const enriched = [];
  for (const r of rows) {
    const alumno = await DatosAlumno.findOne(numDocQuery(r.numDoc)).lean();
    const curso = await obtenerCursoVirtual(r.idPrograma, { requierePublicado: false }).catch(() => null);
    enriched.push({
      ...mapSolicitudPublica(r),
      numDoc: r.numDoc,
      nombreAlumno: nombreAlumno(alumno),
      correo: alumno?.correo || r.emailNotificado || '',
      nombreCurso: curso?.nombreProg || r.idPrograma,
      idLiquidacion: String(r.idLiquidacion),
      idIngreso: r.idIngreso ? String(r.idIngreso) : null,
    });
  }
  return enriched;
}

async function registrarIngresoConsignacion({ solicitud, cfg, usuario, sesion }) {
  if (solicitud.estado === 'aprobada' && solicitud.idIngreso) {
    const ing = await Ingreso.findById(solicitud.idIngreso).lean();
    return { ingreso: ing, duplicado: true };
  }

  const liq = await Liquidacion.findById(solicitud.idLiquidacion);
  if (!liq) {
    const err = new Error('Liquidación no encontrada');
    err.status = 404;
    throw err;
  }

  const valor = num(solicitud.montoCop);
  const val = validarPagoTotalMatriculaVirtual(liq, valor);
  if (!val.ok) {
    const err = new Error(val.message);
    err.status = 400;
    throw err;
  }

  const nuevoAbonado = num(liq.abonado) + valor;
  liq.abonado = toDec(nuevoAbonado);
  liq.saldo = toDec(num(liq.valor) - nuevoAbonado);
  liq.estado = estadoLiq(num(liq.valor), nuevoAbonado);
  await liq.save();

  if (!sesion?.idSesion) {
    const err = new Error('Debe abrir su caja antes de aprobar pagos del portal.');
    err.status = 428;
    err.code = 'CAJA_CERRADA';
    throw err;
  }

  const idSede = String(sesion.idSede || '').trim();
  if (!idSede) {
    const err = new Error('La sesión de caja no tiene sede asociada.');
    err.status = 500;
    throw err;
  }

  const alumno = await DatosAlumno.findOne(numDocQuery(solicitud.numDoc)).lean();
  const recibiDe = nombreAlumno(alumno) || String(solicitud.numDoc);
  const tipoIngDoc = await resolverTipoIngresoDesdeLiquidacion(liq._id);
  const tipoIng = camposTipoIngreso(tipoIngDoc);
  const idTipoPago = cfg.idTipoPago || '2';
  const tipoDoc = await cat.catTipoPago
    .findOne({ $or: [{ idTipoPago }, { codigo: idTipoPago }] })
    .lean();
  const formaPago = formaPagoDesdeCatalogo(tipoDoc, idTipoPago) || 'Transferencia';
  const numRecibo = await siguienteNumComprobanteIngreso(idSede);

  const ing = await Ingreso.create({
    numDoc: solicitud.numDoc,
    idLiquidacion: liq._id,
    numRecibo,
    valor: toDec(valor),
    tipoAbono: 'total',
    concepto: liq.descripcion || 'Matrícula virtual — consignación portal',
    ...tipoIng,
    ingresoCaja: false,
    recibiDe,
    recibidoDe: recibiDe,
    idTipoPago,
    formaPago,
    idBanco: solicitud.idBanco || null,
    numTransferencia: solicitud.referenciaBancaria,
    numComprobante: solicitud.referenciaBancaria,
    idCuentaBancaria: solicitud.idCuentaBancaria,
    cuentaRecibe: solicitud.idCuentaBancaria,
    observaciones: `Pago portal consignación QR · ${solicitud.medioEtiqueta} · ref ${solicitud.referenciaBancaria}`,
    fecha: new Date(),
    idSesion: sesion.idSesion,
    idSede,
    idUsuario: usuario?.sub || usuario?.id || null,
    userAddReg: usuario?.username || usuario?.email || 'admin-consignacion',
    origenPasarela: false,
    origenPago: ORIGEN_PAGO_CONSIGNACION,
    pagoEnLineaReference: String(solicitud._id),
  });

  if (liq.idMat || liq.idMatricula) {
    await refrescarPagoMatricula(liq.idMat || liq.idMatricula);
  }

  try {
    const { limpiarAlertaPagoPorNumDoc } = require('./alertaPagoAlumno');
    await limpiarAlertaPagoPorNumDoc(solicitud.numDoc);
  } catch (_) {
    /* noop */
  }

  const { programarEnvioReciboPorCorreo } = require('./reciboEmail');
  programarEnvioReciboPorCorreo(ing._id);

  try {
    const { intentarCertificadoPagoAuto } = require('./certificadoPagoAuto');
    let rc = await intentarCertificadoPagoAuto({
      numDoc: solicitud.numDoc,
      liq,
      saldo: num(liq.saldo),
    });
    if (!rc?.creado && rc?.motivo === 'virtual_certificado_al_aprobar') {
      const { intentarCertificadoVirtualAprobar } = require('./certificadoVirtualAuto');
      rc = await intentarCertificadoVirtualAprobar({
        numDoc: solicitud.numDoc,
        idPrograma: liq.idProg,
      });
    }
  } catch (errCert) {
    console.error('[consignacion] certificado auto:', errCert?.message || errCert);
  }

  return { ingreso: ing.toObject(), duplicado: false };
}

async function aprobarSolicitud(id, usuario) {
  const sol = await SolicitudPagoConsignacion.findById(id);
  if (!sol) {
    const err = new Error('Solicitud no encontrada');
    err.status = 404;
    throw err;
  }
  if (sol.estado !== 'pendiente') {
    const err = new Error('La solicitud ya fue procesada.');
    err.status = 400;
    throw err;
  }
  const cfg = await assertConsignacionActiva();
  const userId = String(usuario?.sub || usuario?.id || '').trim();
  let sesion;
  try {
    sesion = await exigirSesionAbierta(userId);
  } catch (e) {
    if (e?.code === 'CAJA_CERRADA' || e?.status === 428) {
      const err = new Error('Debe abrir su caja antes de aprobar pagos del portal.');
      err.status = 428;
      err.code = 'CAJA_CERRADA';
      throw err;
    }
    throw e;
  }
  const { ingreso } = await registrarIngresoConsignacion({ solicitud: sol, cfg, usuario, sesion });
  sol.estado = 'aprobada';
  sol.idIngreso = ingreso._id;
  sol.revisadoPor = String(usuario?.sub || usuario?.id || usuario?.username || '');
  sol.revisadoPorNombre = String(usuario?.nombre || usuario?.username || usuario?.email || 'Administrador');
  sol.fechaRevision = new Date();
  sol.motivoRechazo = '';
  await sol.save();

  const alumno = await DatosAlumno.findOne(numDocQuery(sol.numDoc)).lean();
  const curso = await obtenerCursoVirtual(sol.idPrograma, { requierePublicado: false }).catch(() => null);
  enviarCorreoSolicitudAprobada({
    alumno,
    solicitud: sol.toObject(),
    ingreso,
    curso,
    textos: cfg.textos,
    enviarCorreosAlumno: cfg.enviarCorreosAlumno,
  }).catch((e) => console.warn('[consignacion] correo aprobación:', e.message));

  return {
    solicitud: mapSolicitudPublica(sol.toObject()),
    idIngreso: String(ingreso._id),
    numRecibo: ingreso.numRecibo,
    message: 'Pago aprobado y comprobante de ingreso generado.',
  };
}

async function rechazarSolicitud(id, motivoRechazo, usuario) {
  const motivo = String(motivoRechazo || '').trim();
  if (!motivo) {
    const err = new Error('Indique el motivo del rechazo para notificar al alumno.');
    err.status = 400;
    throw err;
  }
  const sol = await SolicitudPagoConsignacion.findById(id);
  if (!sol) {
    const err = new Error('Solicitud no encontrada');
    err.status = 404;
    throw err;
  }
  if (sol.estado !== 'pendiente') {
    const err = new Error('La solicitud ya fue procesada.');
    err.status = 400;
    throw err;
  }
  const cfg = await obtenerConfigPagoConsignacion();
  sol.estado = 'rechazada';
  sol.motivoRechazo = motivo;
  sol.revisadoPor = String(usuario?.sub || usuario?.id || usuario?.username || '');
  sol.revisadoPorNombre = String(usuario?.nombre || usuario?.username || usuario?.email || 'Administrador');
  sol.fechaRevision = new Date();
  await sol.save();

  const alumno = await DatosAlumno.findOne(numDocQuery(sol.numDoc)).lean();
  const curso = await obtenerCursoVirtual(sol.idPrograma, { requierePublicado: false }).catch(() => null);
  enviarCorreoSolicitudRechazada({
    alumno,
    solicitud: sol.toObject(),
    curso,
    textos: cfg.textos,
    motivo,
    enviarCorreosAlumno: cfg.enviarCorreosAlumno,
  }).catch((e) => console.warn('[consignacion] correo rechazo:', e.message));

  return {
    solicitud: mapSolicitudPublica(sol.toObject()),
    message: 'Solicitud rechazada y correo enviado al alumno.',
  };
}

module.exports = {
  estadoConsignacionPublico,
  crearSolicitudConsignacion,
  listarSolicitudesAdmin,
  aprobarSolicitud,
  rechazarSolicitud,
  mapSolicitudPublica,
};
