const caja = require('../services/cajaSesion');
const { registrarAuditoria } = require('../services/auditoria');
const { esAdmin } = require('../utils/roles');
const { num } = require('../utils/coerceTypes');
const ingresoCtrl = require('./ingresoController');
const egresoCtrl = require('./egresoController');
const CajaSesion = require('../models/CajaSesion');

function userCtx(req) {
  const u = req.user || {};
  return {
    usuario: u.username || 'sistema',
    idUsuario: u.sub ? String(u.sub) : null,
    user: u.username || 'sistema',
    rol: u.rol,
  };
}

async function resolverSesionConsulta(req) {
  const ctx = userCtx(req);
  const param = req.params.idSesion;
  if (param === 'activa') {
    const sesion = await caja.obtenerSesionActiva(ctx.idUsuario);
    if (!sesion) {
      const err = new Error('No tiene caja abierta');
      err.status = 404;
      throw err;
    }
    return sesion;
  }
  const idSesion = Number(param);
  const sesion = await CajaSesion.findOne({ idSesion }).lean();
  if (!sesion) {
    const err = new Error('Sesión no encontrada');
    err.status = 404;
    throw err;
  }
  if (!esAdmin(ctx.rol) && String(sesion.idUsuario) !== String(ctx.idUsuario)) {
    const err = new Error('Sin permisos para ver esta caja');
    err.status = 403;
    throw err;
  }
  return caja.planoSesion(sesion);
}

exports.activa = async (req, res, next) => {
  try {
    const { idUsuario } = userCtx(req);
    const sesion = await caja.obtenerSesionActiva(idUsuario);
    if (!sesion) return res.json({ abierta: false, sesion: null });
    const resumen = await caja.calcularResumenSesion(sesion);
    res.json({ abierta: true, sesion, resumenParcial: resumen });
  } catch (e) {
    next(e);
  }
};

exports.listar = async (req, res, next) => {
  try {
    const ctx = userCtx(req);
    const admin = esAdmin(ctx.rol);
    const soloMias = req.query.todas !== '1' && !admin;
    const rows = await caja.listarSesiones({
      limit: req.query.limit,
      estado: req.query.estado,
      usuario: req.query.usuario,
      desde: req.query.desde,
      hasta: req.query.hasta,
      idUsuario: soloMias ? ctx.idUsuario : req.query.idUsuario,
      soloMias,
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

exports.listarAbiertas = async (req, res, next) => {
  try {
    if (!esAdmin(req.user?.rol)) {
      return res.status(403).json({ message: 'Solo administradores' });
    }
    const sesiones = await caja.listarSesionesAbiertas();
    const conResumen = await Promise.all(
      sesiones.map(async (s) => ({
        sesion: s,
        resumenParcial: await caja.calcularResumenSesion(s),
      })),
    );
    res.json(conResumen);
  } catch (e) {
    next(e);
  }
};

exports.ingresosSesionActiva = async (req, res, next) => {
  req.params.idSesion = 'activa';
  return exports.ingresosSesion(req, res, next);
};

exports.egresosSesionActiva = async (req, res, next) => {
  req.params.idSesion = 'activa';
  return exports.egresosSesion(req, res, next);
};

exports.ingresosSesion = async (req, res, next) => {
  try {
    const sesion = await resolverSesionConsulta(req);
    req.params.idSesion = String(sesion.idSesion);
    return ingresoCtrl.listarPorSesion(req, res, next);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.egresosSesion = async (req, res, next) => {
  try {
    const sesion = await resolverSesionConsulta(req);
    req.query.idSesion = String(sesion.idSesion);
    return egresoCtrl.listar(req, res, next);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.abrir = async (req, res, next) => {
  try {
    const { saldoInicial, observaciones } = req.body || {};
    const ctx = userCtx(req);
    const sesion = await caja.abrirSesion({
      saldoInicial: Number(saldoInicial) || 0,
      observaciones,
      ...ctx,
    });
    await registrarAuditoria({
      req,
      accion: 'apertura_caja',
      entidad: 'cajaSesion',
      idEntidad: sesion.idSesion,
      resumen: `Apertura caja #${sesion.idSesion} (${ctx.usuario}) saldo ${sesion.saldoInicial}`,
      datosDespues: sesion,
      codigoHttp: 201,
    });
    res.status(201).json(sesion);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.cerrar = async (req, res, next) => {
  try {
    const idSesion = Number(req.params.idSesion);
    const { observaciones, efectivoContado } = req.body || {};
    const ctx = userCtx(req);
    const { sesion, resumen } = await caja.cerrarSesion(idSesion, {
      observaciones,
      efectivoContado,
      user: ctx.user,
      idUsuario: ctx.idUsuario,
      rol: ctx.rol,
    });
    await registrarAuditoria({
      req,
      accion: 'cierre_caja',
      entidad: 'cajaSesion',
      idEntidad: idSesion,
      resumen: `Cierre caja #${idSesion} (${sesion.usuario}) — ing ${resumen.totalIngresos} / egr ${resumen.totalEgresos}`,
      datosDespues: { sesion, resumen },
      codigoHttp: 200,
    });
    res.json({ sesion, resumen });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.resumen = async (req, res, next) => {
  try {
    const idSesion = Number(req.params.idSesion);
    const sesion = await CajaSesion.findOne({ idSesion }).lean();
    if (!sesion) return res.status(404).json({ message: 'Sesión no encontrada' });
    const ctx = userCtx(req);
    if (!esAdmin(ctx.rol) && String(sesion.idUsuario) !== String(ctx.idUsuario)) {
      return res.status(403).json({ message: 'Sin permisos para ver esta caja' });
    }
    const resumenCalc = await caja.calcularResumenSesion(sesion);
    const resumen =
      sesion.estado === 'cerrada' && sesion.resumen
        ? {
            ...resumenCalc,
            efectivoContado:
              sesion.resumen.efectivoContado != null
                ? num(sesion.resumen.efectivoContado)
                : resumenCalc.efectivoContado,
            diferencia:
              sesion.resumen.diferencia != null
                ? num(sesion.resumen.diferencia)
                : resumenCalc.diferencia,
          }
        : resumenCalc;
    res.json({ sesion: caja.planoSesion(sesion), resumen });
  } catch (e) {
    next(e);
  }
};

exports.previewCierreGeneral = async (req, res, next) => {
  try {
    if (!esAdmin(req.user?.rol)) {
      return res.status(403).json({ message: 'Solo administradores' });
    }
    const desde = req.query.desde || new Date().toISOString().slice(0, 10);
    const hasta = req.query.hasta || desde;
    const resumen = await caja.calcularCierreGeneral(desde, hasta, {
      soloCerradas: req.query.soloCerradas === '1',
    });
    res.json(resumen);
  } catch (e) {
    next(e);
  }
};

exports.registrarCierreGeneral = async (req, res, next) => {
  try {
    if (!esAdmin(req.user?.rol)) {
      return res.status(403).json({ message: 'Solo administradores' });
    }
    const { desde, hasta, observaciones, forzar } = req.body || {};
    const ctx = userCtx(req);
    const desdeUse = desde || new Date().toISOString().slice(0, 10);
    const hastaUse = hasta || desdeUse;

    const { cierre, resumen } = await caja.registrarCierreGeneral({
      desde: desdeUse,
      hasta: hastaUse,
      observaciones,
      usuarioAdmin: ctx.usuario,
      idUsuarioAdmin: ctx.idUsuario,
      forzar: !!forzar,
    });

    await registrarAuditoria({
      req,
      accion: 'cierre_caja',
      entidad: 'cajaCierreGeneral',
      idEntidad: cierre.idCierreGeneral,
      resumen: `Cierre general ${desdeUse}–${hastaUse} — ${resumen.cantidadCajas} cajas`,
      datosDespues: { cierre, resumen },
      codigoHttp: 201,
    });

    res.status(201).json({ cierre, resumen });
  } catch (e) {
    if (e.status) {
      return res.status(e.status).json({
        message: e.message,
        cajasAbiertas: e.cajasAbiertas,
      });
    }
    next(e);
  }
};

exports.listarCierresGenerales = async (req, res, next) => {
  try {
    if (!esAdmin(req.user?.rol)) {
      return res.status(403).json({ message: 'Solo administradores' });
    }
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    res.json(await caja.listarCierresGenerales(limit));
  } catch (e) {
    next(e);
  }
};
