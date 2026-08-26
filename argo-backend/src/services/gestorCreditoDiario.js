const Ingreso = require('../models/Ingreso');
const Gestor = require('../models/Gestor');
const { resolverAlcanceGestorMovil } = require('./alcanceGestorUsuario');
const { esComprobanteAnulado } = require('../utils/comprobanteEstado');

function num(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'object' && v.$numberDecimal != null) return Number(v.$numberDecimal) || 0;
  return Number(v) || 0;
}

function normalizarUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function inicioDia(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function finDia(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function normalizarCreditoDiario(raw) {
  const n = Math.round(num(raw));
  return n < 0 ? 0 : n;
}

function esCreditoIlimitado(creditoDiario) {
  return normalizarCreditoDiario(creditoDiario) <= 0;
}

async function sumarIngresosGestorUsuarioHoy(username, ref = new Date()) {
  const u = normalizarUsername(username);
  if (!u) return 0;
  const desde = inicioDia(ref);
  const hasta = finDia(ref);
  const rows = await Ingreso.find({
    userAddReg: new RegExp(`^${u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    ingresoCaja: { $ne: true },
    numDoc: { $ne: null },
    fecha: { $gte: desde, $lte: hasta },
  })
    .select('valor estado anulado anuladoEn detalle')
    .lean();

  let total = 0;
  for (const row of rows) {
    if (esComprobanteAnulado(row)) continue;
    let v = num(row.valor);
    if (!(v > 0) && Array.isArray(row.detalle) && row.detalle.length) {
      v = row.detalle.reduce((a, d) => a + num(d.valor), 0);
    }
    total += v;
  }
  return Math.round(total);
}

async function resolverCreditoGestorMovil(req) {
  const alcance = await resolverAlcanceGestorMovil(req);
  if (!alcance?.activo) {
    return { aplica: false, alcance: null };
  }

  if (alcance.sinVinculo || !alcance.gestorId) {
    return {
      aplica: true,
      alcance,
      sinVinculo: true,
      gestorId: null,
      gestorNombre: null,
      creditoDiario: 0,
      consumidoHoy: 0,
      disponibleHoy: null,
      ilimitado: true,
    };
  }

  const gestor = await Gestor.findById(alcance.gestorId)
    .select('creditoDiario nombres apellidos seudonimo tipoGestor numero')
    .lean();
  if (!gestor) {
    return {
      aplica: true,
      alcance,
      sinVinculo: true,
      gestorId: alcance.gestorId,
      gestorNombre: alcance.nombre || null,
      creditoDiario: 0,
      consumidoHoy: 0,
      disponibleHoy: null,
      ilimitado: true,
    };
  }

  const creditoDiario = normalizarCreditoDiario(gestor.creditoDiario);
  const consumidoHoy = await sumarIngresosGestorUsuarioHoy(alcance.username);
  const ilimitado = esCreditoIlimitado(creditoDiario);
  const disponibleHoy = ilimitado ? null : Math.max(0, creditoDiario - consumidoHoy);

  const pseudo = String(gestor.seudonimo || '').trim();
  const tipo = String(gestor.tipoGestor || 'persona_natural').trim().toLowerCase();
  const gestorNombre =
    pseudo ||
    (tipo === 'empresa'
      ? String(gestor.nombres || '').trim()
      : [gestor.nombres, gestor.apellidos].filter(Boolean).join(' ').trim()) ||
    alcance.nombre ||
    null;

  return {
    aplica: true,
    alcance,
    sinVinculo: false,
    gestorId: String(gestor._id),
    gestorNombre,
    creditoDiario,
    consumidoHoy,
    disponibleHoy,
    ilimitado,
  };
}

async function obtenerResumenCreditoDiarioGestor(req) {
  const r = await resolverCreditoGestorMovil(req);
  if (!r.aplica) {
    return {
      aplica: false,
      ilimitado: true,
      creditoDiario: 0,
      consumidoHoy: 0,
      disponibleHoy: null,
    };
  }
  return {
    aplica: true,
    sinVinculo: !!r.sinVinculo,
    gestorId: r.gestorId,
    gestorNombre: r.gestorNombre,
    creditoDiario: r.creditoDiario,
    consumidoHoy: r.consumidoHoy,
    disponibleHoy: r.disponibleHoy,
    ilimitado: r.ilimitado,
  };
}

async function assertCreditoDiarioGestorMovil(req, montoNuevo) {
  const r = await resolverCreditoGestorMovil(req);
  if (!r.aplica || r.ilimitado) return r;

  const extra = Math.round(num(montoNuevo));
  if (!(extra > 0)) return r;

  const proyectado = r.consumidoHoy + extra;
  if (proyectado > r.creditoDiario + 0.0001) {
    const err = new Error(
      `Crédito diario agotado. Límite: $${r.creditoDiario.toLocaleString('es-CO')}, ` +
        `usado hoy: $${r.consumidoHoy.toLocaleString('es-CO')}, ` +
        `intento: $${extra.toLocaleString('es-CO')}.`,
    );
    err.status = 403;
    err.code = 'GESTOR_CREDITO_DIARIO_EXCEDIDO';
    err.creditoDiario = r.creditoDiario;
    err.consumidoHoy = r.consumidoHoy;
    err.disponibleHoy = r.disponibleHoy;
    throw err;
  }
  return r;
}

module.exports = {
  normalizarCreditoDiario,
  inicioDia,
  finDia,
  sumarIngresosGestorUsuarioHoy,
  obtenerResumenCreditoDiarioGestor,
  assertCreditoDiarioGestorMovil,
};
