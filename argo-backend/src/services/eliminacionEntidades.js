const DatosAlumno = require('../models/DatosAlumno');
const Ingreso = require('../models/Ingreso');
const Liquidacion = require('../models/Liquidacion');
const Certificado = require('../models/Certificado');
const Vehiculo = require('../models/Vehiculo');
const { models: cat } = require('../models/catalogos');
const { num, toDec } = require('../utils/coerceTypes');
const { esComprobanteAnulado } = require('../utils/comprobanteEstado');
const { metadatosAnulacion, sufijoAutoriza } = require('./anulacionComprobante');
const { registrarEliminacion } = require('./auditoria');
const {
  idsLiquidacionDeIngreso,
  recalcularAbonoLiquidacion,
  refrescarPagoMatricula,
} = require('./liquidacionMatricula');
const { buscarPrograma, serviciosTienenLiquidaciones } = require('./programaServicio');
const { eliminarCombo } = require('./combosPrograma');
const { TIPOS } = require('./clasificacionCertificado');
const mongoose = require('mongoose');

function ok(data = {}) {
  return { ok: true, ...data };
}

function fail(status, message, code) {
  return { ok: false, status: status || 400, message, code };
}

function esCertificadoJornadaCapacitacion(cert) {
  if (!cert) return false;
  if (cert.generadoAutoJornada) return true;
  if (cert.idJornada) return true;
  if (cert.tipoFormatoCert === TIPOS.JORNADA_CAPACITACION) return true;
  return false;
}

async function buscarAlumnoId(idEntidad) {
  if (!idEntidad) return null;
  if (mongoose.Types.ObjectId.isValid(String(idEntidad))) {
    const porId = await DatosAlumno.findById(idEntidad).lean();
    if (porId) return porId;
  }
  const n = Number(idEntidad);
  if (Number.isFinite(n)) {
    return DatosAlumno.findOne({ numDoc: n }).lean();
  }
  return null;
}

async function eliminarAlumno(idEntidad) {
  const prev = await buscarAlumnoId(idEntidad);
  if (!prev) return fail(404, 'Alumno no encontrado');
  await DatosAlumno.findByIdAndDelete(prev._id);
  return ok({ message: 'Alumno eliminado' });
}

async function eliminarPrograma(idEntidad) {
  const prog = await buscarPrograma(idEntidad);
  if (!prog) return fail(404, 'Programa no encontrado');
  if (await serviciosTienenLiquidaciones(prog)) {
    return fail(
      409,
      'No se puede eliminar: algún servicio del programa tiene liquidaciones o matrículas. Desactive el programa en su lugar.',
    );
  }
  const idProg = prog.idPrograma ?? prog.idProg;
  const n = Number(idProg);
  await cat.servicios.deleteMany({
    $or: [{ idProg }, { idProg: String(idProg) }, ...(Number.isFinite(n) ? [{ idProg: n }] : [])],
  });
  await cat.programas.deleteOne({ idPrograma: prog.idPrograma });
  return ok({
    message: `Programa «${prog.nombreProg}» eliminado con sus servicios vinculados.`,
  });
}

async function eliminarServicio(idEntidad) {
  const id = String(idEntidad);
  const n = Number(id);
  const serv = await cat.servicios
    .findOne({
      $or: [{ idServ: id }, ...(Number.isFinite(n) ? [{ idServ: n }] : [])],
    })
    .lean();
  if (!serv) return fail(404, 'Servicio no encontrado');
  if (serv.idProg != null && serv.idProg !== '') {
    return fail(
      409,
      'No se puede eliminar: es servicio de matrícula de un programa. Use el menú Programas.',
    );
  }
  const usado = await Liquidacion.countDocuments({ idServ: String(serv.idServ) });
  if (usado > 0) {
    return fail(409, 'No se puede eliminar: el servicio tiene liquidaciones asociadas');
  }
  await cat.servicios.deleteOne({ idServ: serv.idServ });
  return ok({ message: `Servicio «${serv.descrServicio}» eliminado` });
}

async function eliminarLiquidacion(idEntidad) {
  const it = await Liquidacion.findById(idEntidad);
  if (!it) return fail(404, 'Item no encontrado');
  if (num(it.abonado) > 0) {
    return fail(400, 'No se puede eliminar un ítem con pagos registrados');
  }
  await it.deleteOne();
  return ok({ message: 'Ítem de liquidación eliminado' });
}

async function anularCertificado(req, idEntidad, supervisor) {
  const c = await Certificado.findById(idEntidad);
  if (!c) return fail(404, 'Certificado no encontrado');
  if (esCertificadoJornadaCapacitacion(c)) {
    return fail(403, 'Los certificados de jornadas de capacitación se gestionan en el módulo Jornadas.');
  }
  if (esComprobanteAnulado(c)) {
    return fail(409, 'Este certificado ya está anulado.');
  }
  const antes = c.toObject();
  const motivo =
    String(req.body?.motivo || req.body?.motivoAnulacion || req.solicitudAutorizacion?.motivo || '').trim() ||
    null;
  c.set(metadatosAnulacion(req, supervisor, { motivo }));
  c.estado = 'anulado';
  await c.save();
  registrarEliminacion(req, 'certificado', antes, {
    resumen: `Anulación certificado ${antes.codigoCert || idEntidad}${sufijoAutoriza(supervisor)}`,
  });
  return ok({ message: 'Certificado anulado', estado: 'anulado' });
}

async function anularIngreso(req, idEntidad, supervisor) {
  const ing = await Ingreso.findById(idEntidad);
  if (!ing) return fail(404, 'Ingreso no encontrado');
  if (esComprobanteAnulado(ing)) {
    return fail(409, 'Este ingreso ya está anulado.');
  }
  const antesIngreso = ing.toObject();
  const v =
    num(antesIngreso.valor) ||
    num(antesIngreso.valorAnulado) ||
    (Array.isArray(antesIngreso.detalle) && antesIngreso.detalle.length
      ? antesIngreso.detalle.reduce((a, d) => a + num(d.valor), 0)
      : 0);
  const liqIds = idsLiquidacionDeIngreso(antesIngreso);
  const motivo =
    String(req.body?.motivo || req.body?.motivoAnulacion || req.solicitudAutorizacion?.motivo || '').trim() ||
    null;
  ing.set(metadatosAnulacion(req, supervisor, { valorOriginal: v, motivo }));
  ing.valor = toDec(0);
  if (Array.isArray(ing.detalle) && ing.detalle.length) {
    ing.detalle = ing.detalle.map((d) => {
      const plano = typeof d.toObject === 'function' ? d.toObject() : d;
      return { ...plano, valor: toDec(0) };
    });
  }
  ing.tipoAbono = undefined;
  ing.userChangeRecord = req.user?.username || 'sistema';
  ing.fechaMod = new Date();
  await ing.save();

  const mats = new Set();
  for (const idLiq of liqIds) {
    const liqSnap = await Liquidacion.findById(idLiq).lean();
    if (liqSnap?.origenContratoCap) {
      await Liquidacion.deleteOne({ _id: idLiq });
      continue;
    }
    const r = await recalcularAbonoLiquidacion(idLiq);
    if (r?.idMat) mats.add(String(r.idMat));
  }
  for (const idMat of mats) {
    await refrescarPagoMatricula(idMat);
  }

  if (antesIngreso.origenContratoCap) {
    const { revertirComprobanteIngresoContratoCap } = require('./contratoCobroCap');
    await revertirComprobanteIngresoContratoCap(ing).catch(() => null);
  }

  try {
    const { revertirCertificadosPorAnulacionIngreso } = require('./certificadoPagoAuto');
    await revertirCertificadosPorAnulacionIngreso({
      idsLiquidacion: liqIds,
      req,
      supervisor,
      numDoc: ing.numDoc,
    });
  } catch (errCert) {
    console.error('[certificadoPagoAuto] revertir por anulación ingreso:', errCert?.message || errCert);
  }

  if (ing.cuadreDescuadre && ing.idSesion) {
    const CajaSesion = require('../models/CajaSesion');
    const ses = await CajaSesion.findOne({ idSesion: Number(ing.idSesion) }).lean();
    if (ses?.efectivoContado != null) {
      const nuevoContado = Math.max(0, num(ses.efectivoContado) - v);
      await CajaSesion.updateOne(
        { idSesion: Number(ing.idSesion) },
        { $set: { efectivoContado: toDec(nuevoContado) } },
      );
    }
  }

  if (ing.idSesion) {
    const { sincronizarDescuadreSesion } = require('./descuadreCaja');
    await sincronizarDescuadreSesion(ing.idSesion).catch(() => null);
  }

  registrarEliminacion(req, 'ingreso', antesIngreso, {
    resumen: `Anulación ingreso ${antesIngreso.numRecibo || idEntidad}${sufijoAutoriza(supervisor)}`,
  });
  return ok({ message: 'Ingreso anulado' });
}

async function eliminarComboEntidad(idEntidad) {
  try {
    const out = await eliminarCombo(idEntidad);
    return ok(out || { message: 'Combo eliminado' });
  } catch (e) {
    return fail(e.status || 400, e.message || 'No se pudo eliminar el combo');
  }
}

async function eliminarVehiculo(idEntidad) {
  const v = await Vehiculo.findById(idEntidad);
  if (!v) return fail(404, 'Vehículo no encontrado');
  await v.deleteOne();
  return ok({ message: 'Vehículo eliminado' });
}

const EJECUTORES = {
  alumnos: (req, idEntidad, supervisor) => eliminarAlumno(idEntidad),
  programas: (req, idEntidad) => eliminarPrograma(idEntidad),
  servicios: (req, idEntidad) => eliminarServicio(idEntidad),
  liquidaciones: (req, idEntidad) => eliminarLiquidacion(idEntidad),
  certificados: (req, idEntidad, supervisor) => anularCertificado(req, idEntidad, supervisor),
  ingresos: (req, idEntidad, supervisor) => anularIngreso(req, idEntidad, supervisor),
  combos: (req, idEntidad) => eliminarComboEntidad(idEntidad),
  vehiculos: (req, idEntidad) => eliminarVehiculo(idEntidad),
};

async function ejecutarEliminacionModulo(req, modulo, idEntidad, supervisor = null) {
  const fn = EJECUTORES[modulo];
  if (!fn) {
    return fail(400, `Módulo «${modulo}» no admite eliminación autorizada`, 'MODULO_NO_SOPORTADO');
  }
  return fn(req, String(idEntidad), supervisor);
}

module.exports = {
  ejecutarEliminacionModulo,
  eliminarAlumno,
  eliminarPrograma,
  eliminarServicio,
  eliminarLiquidacion,
  anularCertificado,
  anularIngreso,
};
