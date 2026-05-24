const mongoose = require('mongoose');
const CajaSesion = require('../models/CajaSesion');
const CajaCierreGeneral = require('../models/CajaCierreGeneral');
const Ingreso = require('../models/Ingreso');
const Egreso = require('../models/Egreso');
const { models: cat } = require('../models/catalogos');
const { num, toDec } = require('../utils/coerceTypes');
const { maxNumericId } = require('./programaServicio');
const { esAdmin } = require('../utils/roles');
const { esRetiroCajaTipo } = require('./tipoEgresoNomina');

function planoSesion(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    ...o,
    saldoInicial: num(o.saldoInicial),
    saldoFinal: o.saldoFinal != null ? num(o.saldoFinal) : null,
    efectivoContado: o.efectivoContado != null ? num(o.efectivoContado) : null,
    diferencia: o.diferencia != null ? num(o.diferencia) : null,
  };
}

function clasificarEgresos(egresos, porTipoEgreso) {
  let totalGastos = 0;
  let totalRetiros = 0;
  for (const eg of egresos) {
    const v = num(eg.valorEgreso);
    const key = String(eg.tipoEgreso ?? '');
    const n = Number(key);
    const tipoDoc =
      porTipoEgreso.get(key) ||
      (Number.isFinite(n) ? porTipoEgreso.get(String(n)) : null) ||
      null;
    if (esRetiroCajaTipo(tipoDoc)) {
      totalRetiros += v;
    } else {
      totalGastos += v;
    }
  }
  return { totalGastos, totalRetiros };
}

function mapaTiposEgreso(tipos) {
  const porId = new Map();
  for (const t of tipos) {
    for (const k of [t.idTipoEgreso, t._id].filter((x) => x != null && x !== '').map(String)) {
      porId.set(k, t);
    }
    const n = Number(t.idTipoEgreso);
    if (Number.isFinite(n)) porId.set(String(n), t);
  }
  return porId;
}

function mapaTiposPago(tipos) {
  const porId = new Map();
  for (const t of tipos) {
    for (const k of [t.idTipoPago, t.codigo].filter(Boolean).map(String)) {
      porId.set(k, t);
    }
  }
  return porId;
}

function esIngresoEfectivo(ing, porTipoPago) {
  const id = String(ing.idTipoPago ?? '');
  const tipo = porTipoPago.get(id);
  const txt = `${tipo?.descripcion || ''} ${tipo?.nombre || ''} ${tipo?.codigo || ''} ${id}`.toLowerCase();
  return txt.includes('efect') || txt === 'ef' || id === '1';
}

function esEgresoEfectivo(eg) {
  const fp = String(eg.formaPago || '').trim().toLowerCase();
  if (!fp) return true;
  return fp === 'efectivo' || fp.includes('efect');
}

async function sesionAbiertaUsuario(idUsuario) {
  if (!idUsuario) return null;
  return CajaSesion.findOne({ estado: 'abierta', idUsuario: String(idUsuario) })
    .sort({ fechaApertura: -1 })
    .lean();
}

async function listarSesionesAbiertas() {
  const rows = await CajaSesion.find({ estado: 'abierta' }).sort({ fechaApertura: -1 }).lean();
  return rows.map(planoSesion);
}

async function abrirSesion({ saldoInicial, observaciones, usuario, idUsuario, user, rol }) {
  if (!idUsuario) {
    const err = new Error('Usuario no identificado para abrir caja');
    err.status = 400;
    throw err;
  }

  const abiertaPropia = await sesionAbiertaUsuario(idUsuario);
  if (abiertaPropia) {
    const err = new Error(
      `Ya tiene su caja abierta (sesión #${abiertaPropia.idSesion}). Ciérrela antes de abrir otra.`,
    );
    err.status = 409;
    throw err;
  }

  const idSesion = await maxNumericId(CajaSesion, 'idSesion');
  const now = new Date();
  const doc = {
    idSesion,
    estado: 'abierta',
    usuario: usuario || user || 'sistema',
    idUsuario: String(idUsuario),
    rolCajero: rol ? String(rol) : null,
    nombreCaja: usuario || user || `Caja ${idUsuario}`,
    fechaApertura: now,
    saldoInicial: toDec(saldoInicial ?? 0),
    observacionesApertura: observaciones || null,
    fechaAudi: now,
    fechaMod: now,
    userAddReg: user || 'sistema',
    userChangeRecord: user || 'sistema',
  };
  const creada = await CajaSesion.create(doc);
  return planoSesion(creada);
}

async function agregarMovimientosSesion(idSesion) {
  const sid = Number(idSesion);
  const [ingresos, egresos] = await Promise.all([
    Ingreso.find({ idSesion: sid }).lean(),
    Egreso.find({ idSesion: sid }).lean(),
  ]);
  return { ingresos, egresos };
}

async function agruparIngresosPorTipo(ingresos) {
  const map = new Map();
  for (const ing of ingresos) {
    const key = String(ing.idTipoPago ?? 'sin_tipo');
    const prev = map.get(key) || { idTipoPago: key, cantidad: 0, total: 0 };
    prev.cantidad += 1;
    prev.total += num(ing.valor);
    map.set(key, prev);
  }
  const tipos = await cat.catTipoPago.find({}).lean();
  const porId = Object.fromEntries(tipos.map((t) => [String(t.idTipoPago ?? t.codigo), t]));
  return [...map.values()].map((row) => {
    const t = porId[row.idTipoPago];
    return {
      idTipoPago: row.idTipoPago,
      descripcion: t?.descripcion || t?.nombre || row.idTipoPago,
      cantidad: row.cantidad,
      total: row.total,
    };
  });
}

async function agruparEgresosPorTipo(egresos) {
  const map = new Map();
  for (const eg of egresos) {
    const key = String(eg.tipoEgreso ?? 'sin_tipo');
    const prev = map.get(key) || { tipoEgreso: key, cantidad: 0, total: 0 };
    prev.cantidad += 1;
    prev.total += num(eg.valorEgreso);
    map.set(key, prev);
  }
  const tipos = await cat.tipoEgreso.find({}).lean();
  const porId = Object.fromEntries(tipos.map((t) => [String(t.idTipoEgreso ?? t.id), t]));
  return [...map.values()].map((row) => {
    const t = porId[row.tipoEgreso];
    return {
      tipoEgreso: row.tipoEgreso,
      descripcion: t?.tipo || row.tipoEgreso,
      cantidad: row.cantidad,
      total: row.total,
    };
  });
}

function fusionarPorTipo(rows, keyField) {
  const map = new Map();
  for (const row of rows) {
    const key = String(row[keyField] ?? row.descripcion ?? 'sin_tipo');
    const prev = map.get(key) || {
      ...row,
      cantidad: 0,
      total: 0,
    };
    prev.cantidad += row.cantidad || 0;
    prev.total += row.total || 0;
    map.set(key, prev);
  }
  return [...map.values()];
}

async function calcularResumenSesion(sesion) {
  const hasta = sesion.fechaCierre ? new Date(sesion.fechaCierre) : new Date();
  const { ingresos, egresos } = await agregarMovimientosSesion(sesion.idSesion);

  const tiposPago = await cat.catTipoPago.find({}).lean();
  const porTipoPago = mapaTiposPago(tiposPago);
  const tiposEgreso = await cat.tipoEgreso.find({}).lean();
  const porTipoEgreso = mapaTiposEgreso(tiposEgreso);

  let totalIngresos = 0;
  let totalIngresosEfectivo = 0;
  for (const ing of ingresos) {
    const v = num(ing.valor);
    totalIngresos += v;
    if (esIngresoEfectivo(ing, porTipoPago)) totalIngresosEfectivo += v;
  }

  let totalEgresos = 0;
  let totalEgresosEfectivo = 0;
  const egresosEfectivo = [];
  for (const eg of egresos) {
    const v = num(eg.valorEgreso);
    totalEgresos += v;
    if (esEgresoEfectivo(eg)) {
      totalEgresosEfectivo += v;
      egresosEfectivo.push(eg);
    }
  }

  const { totalGastos, totalRetiros } = clasificarEgresos(egresosEfectivo, porTipoEgreso);
  const saldoInicial = num(sesion.saldoInicial);
  const saldoTeorico = saldoInicial + totalIngresos - totalEgresos;
  const efectivoEsperado = saldoInicial + totalIngresosEfectivo - totalEgresosEfectivo;

  const ingresosPorTipo = await agruparIngresosPorTipo(ingresos);
  const egresosPorTipo = await agruparEgresosPorTipo(egresos);

  return {
    idSesion: sesion.idSesion,
    usuario: sesion.usuario,
    idUsuario: sesion.idUsuario,
    nombreCaja: sesion.nombreCaja || sesion.usuario,
    estado: sesion.estado,
    fechaApertura: sesion.fechaApertura,
    fechaCierre: sesion.fechaCierre || hasta,
    saldoInicial,
    ventasBrutas: totalIngresos,
    totalIngresos,
    totalIngresosEfectivo,
    totalEgresos,
    totalEgresosEfectivo,
    totalGastos,
    totalRetiros,
    saldoTeorico,
    efectivoEsperado,
    cantidadIngresos: ingresos.length,
    cantidadRecibos: ingresos.length,
    cantidadEgresos: egresos.length,
    ingresosPorTipo,
    egresosPorTipo,
  };
}

async function cerrarSesion(idSesion, { observaciones, efectivoContado, user, idUsuario, rol }) {
  const sesion = await CajaSesion.findOne({ idSesion: Number(idSesion), estado: 'abierta' });
  if (!sesion) {
    const err = new Error('No hay sesión de caja abierta con ese id');
    err.status = 404;
    throw err;
  }

  const admin = esAdmin(rol);
  if (!admin && String(sesion.idUsuario) !== String(idUsuario)) {
    const err = new Error('Solo puede cerrar su propia caja');
    err.status = 403;
    throw err;
  }

  const resumen = await calcularResumenSesion(sesion);
  const contado = efectivoContado != null ? Number(efectivoContado) : null;
  const diferencia =
    contado != null && Number.isFinite(contado) ? contado - resumen.efectivoEsperado : null;
  if (contado != null && Number.isFinite(contado)) {
    resumen.efectivoContado = contado;
    resumen.diferencia = diferencia;
  }
  const now = new Date();
  sesion.estado = 'cerrada';
  sesion.fechaCierre = now;
  sesion.saldoFinal = toDec(resumen.efectivoEsperado);
  sesion.efectivoContado = contado != null && Number.isFinite(contado) ? toDec(contado) : null;
  sesion.diferencia = diferencia != null ? toDec(diferencia) : null;
  sesion.observacionesCierre = observaciones || null;
  sesion.resumen = resumen;
  sesion.fechaMod = now;
  sesion.userChangeRecord = user || 'sistema';
  await sesion.save();

  return { sesion: planoSesion(sesion), resumen };
}

async function obtenerSesionActiva(idUsuario) {
  const s = await sesionAbiertaUsuario(idUsuario);
  return planoSesion(s);
}

async function listarSesiones(opts = {}) {
  const limit = Math.min(Number(opts.limit) || 50, 200);
  const filter = {};

  if (opts.estado) filter.estado = String(opts.estado);
  if (opts.usuario) filter.usuario = new RegExp(String(opts.usuario).trim(), 'i');
  if (opts.idUsuario) filter.idUsuario = String(opts.idUsuario);
  if (opts.soloMias && opts.idUsuario) filter.idUsuario = String(opts.idUsuario);

  if (opts.desde || opts.hasta) {
    filter.fechaApertura = {};
    if (opts.desde) filter.fechaApertura.$gte = new Date(opts.desde);
    if (opts.hasta) {
      const h = new Date(opts.hasta);
      h.setHours(23, 59, 59, 999);
      filter.fechaApertura.$lte = h;
    }
  }

  const rows = await CajaSesion.find(filter).sort({ fechaApertura: -1 }).limit(limit).lean();
  return rows.map(planoSesion);
}

async function exigirSesionAbierta(idUsuario) {
  const s = await sesionAbiertaUsuario(idUsuario);
  if (!s) {
    const err = new Error('Debe abrir su caja antes de registrar movimientos');
    err.status = 428;
    err.code = 'CAJA_CERRADA';
    throw err;
  }
  return s;
}

/** Cajero solo puede tocar movimientos de su sesión abierta; admin cualquiera. */
async function verificarMovimientoSesionCajero(req, idSesion) {
  if (esAdmin(req.user?.rol)) return { ok: true };
  if (idSesion == null || idSesion === '') {
    return {
      ok: false,
      status: 403,
      message: 'Este movimiento no está vinculado a su sesión de caja actual',
    };
  }
  const sesion = await sesionAbiertaUsuario(req.user?.sub);
  if (!sesion) {
    return {
      ok: false,
      status: 428,
      message: 'Debe tener su caja abierta para modificar o anular movimientos',
      code: 'CAJA_CERRADA',
    };
  }
  if (Number(sesion.idSesion) !== Number(idSesion)) {
    return {
      ok: false,
      status: 403,
      message: 'Solo puede modificar o anular movimientos de su sesión de caja actual',
    };
  }
  return { ok: true };
}

async function sesionesEnPeriodo(desde, hasta, { soloCerradas = false } = {}) {
  const d0 = new Date(desde);
  const d1 = new Date(hasta);
  d1.setHours(23, 59, 59, 999);

  const filter = {
    fechaApertura: { $lte: d1 },
    $or: [{ fechaCierre: { $gte: d0 } }, { estado: 'abierta' }],
  };
  if (soloCerradas) {
    delete filter.$or;
    filter.estado = 'cerrada';
    filter.fechaCierre = { $gte: d0, $lte: d1 };
  }

  return CajaSesion.find(filter).sort({ fechaApertura: 1 }).lean();
}

async function calcularCierreGeneral(desde, hasta, opts = {}) {
  const sesionesRaw = await sesionesEnPeriodo(desde, hasta, {
    soloCerradas: !!opts.soloCerradas,
  });

  const detalleSesiones = [];
  let totalIngresos = 0;
  let totalEgresos = 0;
  let saldoInicialTotal = 0;
  let cantidadIngresos = 0;
  let cantidadEgresos = 0;
  const ingresosPorTipoRows = [];
  const egresosPorTipoRows = [];
  const cajasAbiertas = [];

  for (const s of sesionesRaw) {
    const resumen =
      s.estado === 'cerrada' && s.resumen
        ? { ...s.resumen, estado: 'cerrada', usuario: s.usuario, idUsuario: s.idUsuario }
        : await calcularResumenSesion(s);

    detalleSesiones.push(resumen);
    if (s.estado === 'abierta') cajasAbiertas.push({ idSesion: s.idSesion, usuario: s.usuario });

    totalIngresos += resumen.totalIngresos;
    totalEgresos += resumen.totalEgresos;
    saldoInicialTotal += resumen.saldoInicial;
    cantidadIngresos += resumen.cantidadIngresos;
    cantidadEgresos += resumen.cantidadEgresos;
    ingresosPorTipoRows.push(...(resumen.ingresosPorTipo || []));
    egresosPorTipoRows.push(...(resumen.egresosPorTipo || []));
  }

  const ingresosPorTipo = fusionarPorTipo(ingresosPorTipoRows, 'idTipoPago');
  const egresosPorTipo = fusionarPorTipo(egresosPorTipoRows, 'tipoEgreso');

  return {
    periodoDesde: new Date(desde),
    periodoHasta: new Date(hasta),
    cantidadCajas: detalleSesiones.length,
    cajasAbiertas,
    tieneCajasAbiertas: cajasAbiertas.length > 0,
    saldoInicialTotal,
    totalIngresos,
    totalEgresos,
    saldoTeoricoConsolidado: saldoInicialTotal + totalIngresos - totalEgresos,
    cantidadIngresos,
    cantidadEgresos,
    ingresosPorTipo,
    egresosPorTipo,
    detalleSesiones,
    idsSesiones: detalleSesiones.map((d) => d.idSesion),
  };
}

async function registrarCierreGeneral({
  desde,
  hasta,
  observaciones,
  usuarioAdmin,
  idUsuarioAdmin,
  forzar,
}) {
  const preview = await calcularCierreGeneral(desde, hasta);
  if (preview.tieneCajasAbiertas && !forzar) {
    const err = new Error(
      `Hay ${preview.cajasAbiertas.length} caja(s) aún abierta(s). Ciérrelas o use forzar=true`,
    );
    err.status = 409;
    err.cajasAbiertas = preview.cajasAbiertas;
    throw err;
  }

  const idCierreGeneral = await maxNumericId(CajaCierreGeneral, 'idCierreGeneral');
  const doc = await CajaCierreGeneral.create({
    idCierreGeneral,
    periodoDesde: preview.periodoDesde,
    periodoHasta: preview.periodoHasta,
    fechaRegistro: new Date(),
    usuarioAdmin,
    idUsuarioAdmin,
    observaciones: observaciones || null,
    idsSesiones: preview.idsSesiones,
    cantidadCajas: preview.cantidadCajas,
    resumen: preview,
    userAddReg: usuarioAdmin,
  });

  return { cierre: doc.toObject(), resumen: preview };
}

async function listarCierresGenerales(limit = 20) {
  const rows = await CajaCierreGeneral.find({})
    .sort({ fechaRegistro: -1 })
    .limit(Math.min(limit, 100))
    .lean();
  return rows;
}

module.exports = {
  abrirSesion,
  cerrarSesion,
  obtenerSesionActiva,
  listarSesiones,
  listarSesionesAbiertas,
  exigirSesionAbierta,
  verificarMovimientoSesionCajero,
  calcularResumenSesion,
  calcularCierreGeneral,
  registrarCierreGeneral,
  listarCierresGenerales,
  planoSesion,
};
