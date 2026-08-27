const { randomUUID } = require('crypto');
const Config = require('../models/Config');
const { models: cat } = require('../models/catalogos');
const { ensureConfigDocument } = require('./configEnsure');
const { TEXTOS_DEFAULT } = require('../constants/pagoConsignacion');

const CLAVE = 'pago_consignacion_portal';

const DEFAULTS = {
  clave: CLAVE,
  activo: false,
  idSedeVirtual: '',
  idTipoPago: '2',
  enviarCorreosAlumno: true,
  medios: [],
  textos: { ...TEXTOS_DEFAULT },
};

function normalizarTextos(raw) {
  const t = { ...TEXTOS_DEFAULT, ...(raw || {}) };
  for (const k of Object.keys(TEXTOS_DEFAULT)) {
    t[k] = String(t[k] ?? TEXTOS_DEFAULT[k]).trim() || TEXTOS_DEFAULT[k];
  }
  return t;
}

function normalizarMedio(m, idx = 0) {
  const id = String(m?.id || '').trim() || randomUUID();
  return {
    id,
    etiqueta: String(m?.etiqueta || '').trim() || `Medio ${idx + 1}`,
    idCuentaBancaria: String(m?.idCuentaBancaria || '').trim(),
    urlQr: String(m?.urlQr || '').trim(),
    activo: m?.activo !== false,
    orden: Number.isFinite(Number(m?.orden)) ? Number(m.orden) : idx,
    instruccionesExtra: String(m?.instruccionesExtra || '').trim(),
  };
}

function normalizar(doc) {
  const raw = { ...DEFAULTS, ...(doc || {}), clave: CLAVE };
  raw.activo = raw.activo === true;
  raw.enviarCorreosAlumno = raw.enviarCorreosAlumno !== false;
  raw.idSedeVirtual = String(raw.idSedeVirtual || '').trim();
  raw.idTipoPago = String(raw.idTipoPago || '2').trim() || '2';
  raw.textos = normalizarTextos(raw.textos);
  const medios = Array.isArray(raw.medios) ? raw.medios : [];
  raw.medios = medios.map((m, i) => normalizarMedio(m, i)).sort((a, b) => a.orden - b.orden);
  return raw;
}

async function mapMediosPublicos(medios) {
  const out = [];
  for (const m of medios.filter((x) => x.activo && x.idCuentaBancaria && x.urlQr)) {
    const cuenta = await resolverCuentaBancaria(m.idCuentaBancaria);
    const idBanco = idBancoCuenta(cuenta);
    const bancoDoc = idBanco ? await resolverBanco(idBanco) : null;
    out.push({
      id: m.id,
      etiqueta: m.etiqueta,
      urlQr: m.urlQr,
      instruccionesExtra: m.instruccionesExtra,
      orden: m.orden,
      bancoNombre: String(bancoDoc?.nombre || bancoDoc?.descripcion || cuenta?.banco || '').trim(),
      cuentaDescr: descrCuenta(cuenta),
      idBanco,
    });
  }
  return out.sort((a, b) => a.orden - b.orden);
}

function mapPublico(doc) {
  const n = normalizar(doc);
  return {
    clave: CLAVE,
    activo: n.activo,
    idSedeVirtual: n.idSedeVirtual,
    idTipoPago: n.idTipoPago,
    medios: n.medios
      .filter((m) => m.activo && m.idCuentaBancaria && m.urlQr)
      .map((m) => ({
        id: m.id,
        etiqueta: m.etiqueta,
        urlQr: m.urlQr,
        instruccionesExtra: m.instruccionesExtra,
        orden: m.orden,
      })),
    textos: n.textos,
    updatedAt: doc?.updatedAt || null,
  };
}

async function obtenerConfigPagoConsignacion() {
  const doc = await Config.findOne({ clave: CLAVE }).lean();
  return normalizar(doc);
}

async function guardarConfigPagoConsignacion(body) {
  const prev = normalizar(await Config.findOne({ clave: CLAVE }).lean());
  const incoming = normalizar(body);
  const mediosById = new Map(prev.medios.map((m) => [m.id, m]));
  incoming.medios = incoming.medios.map((m, i) => {
    const prevM = mediosById.get(m.id);
    if (prevM && !m.urlQr) return { ...m, urlQr: prevM.urlQr };
    return m;
  });
  await ensureConfigDocument(CLAVE, DEFAULTS);
  const updated = await Config.findOneAndUpdate(
    { clave: CLAVE },
    { $set: incoming },
    { new: true, upsert: true },
  ).lean();
  return normalizar(updated);
}

async function resolverCuentaBancaria(idCuentaBancaria) {
  const id = String(idCuentaBancaria || '').trim();
  if (!id) return null;
  const n = Number(id);

  let cuenta = await cat.cuentasBancarias
    .findOne({
      $or: [
        { idCuentaBancaria: id },
        ...(Number.isFinite(n) ? [{ idCuentaBancaria: n }] : []),
      ],
    })
    .lean();
  if (cuenta) return cuenta;

  cuenta = await cat.cuentasBancarias
    .findOne({
      $or: [
        { idCuenta: id },
        ...(Number.isFinite(n) ? [{ idCuenta: n }] : []),
      ],
    })
    .lean();
  if (cuenta) return cuenta;

  if (/^[a-f0-9]{24}$/i.test(id)) {
    cuenta = await cat.cuentasBancarias.findById(id).lean();
    if (cuenta) return cuenta;
  }

  // Compatibilidad: configs antiguas guardaban el número de cuenta.
  return cat.cuentasBancarias
    .findOne({
      $or: [
        { numCuenta: id },
        ...(Number.isFinite(n) ? [{ numCuenta: n }] : []),
      ],
    })
    .lean();
}

async function resolverBanco(idBanco) {
  const id = String(idBanco || '').trim();
  if (!id) return null;
  const n = Number(id);
  return cat.bancos
    .findOne({
      $or: [
        { idBanco: id },
        { idbanco: id },
        ...(Number.isFinite(n) ? [{ idbanco: n }, { idBanco: n }] : []),
        { codigo: id },
      ],
    })
    .lean();
}

function descrCuenta(cuenta) {
  if (!cuenta) return '';
  const parts = [
    (cuenta.banco || '').trim(),
    (cuenta.tipo || '').trim(),
    cuenta.numCuenta ?? cuenta.llave ?? '',
  ].filter(Boolean);
  return parts.join(' — ');
}

function idBancoCuenta(cuenta) {
  if (!cuenta) return '';
  return String(cuenta.idBanco ?? cuenta.banco ?? cuenta.idbanco ?? '').trim();
}

async function resolverMedioPublico(medioId) {
  const cfg = await obtenerConfigPagoConsignacion();
  if (!cfg.activo) {
    const err = new Error('El pago por consignación no está disponible.');
    err.status = 503;
    err.code = 'CONSIGNACION_INACTIVA';
    throw err;
  }
  const medio = cfg.medios.find((m) => m.id === medioId && m.activo);
  if (!medio || !medio.idCuentaBancaria || !medio.urlQr) {
    const err = new Error('Medio de pago no encontrado o incompleto.');
    err.status = 404;
    err.code = 'MEDIO_NO_ENCONTRADO';
    throw err;
  }
  const cuenta = await resolverCuentaBancaria(medio.idCuentaBancaria);
  if (!cuenta) {
    const err = new Error('La cuenta bancaria del medio de pago no está configurada.');
    err.status = 503;
    err.code = 'CUENTA_MEDIO_INVALIDA';
    throw err;
  }
  const idBanco = idBancoCuenta(cuenta);
  const bancoDoc = idBanco ? await resolverBanco(idBanco) : null;
  const bancoNombre =
    String(bancoDoc?.nombre || bancoDoc?.descripcion || cuenta.banco || '').trim() || idBanco;
  return {
    medio,
    cuenta,
    idBanco,
    bancoNombre,
    cuentaDescr: descrCuenta(cuenta),
    textos: cfg.textos,
  };
}

async function assertConsignacionActiva() {
  const cfg = await obtenerConfigPagoConsignacion();
  if (!cfg.activo) {
    const err = new Error('El pago por consignación no está activo.');
    err.status = 503;
    err.code = 'CONSIGNACION_INACTIVA';
    throw err;
  }
  const mediosOk = cfg.medios.filter((m) => m.activo && m.idCuentaBancaria && m.urlQr);
  if (!mediosOk.length) {
    const err = new Error('Agregue al menos un medio de pago con cuenta y QR.');
    err.status = 503;
    err.code = 'CONSIGNACION_SIN_MEDIOS';
    throw err;
  }
  return cfg;
}

async function actualizarQrMedio(medioId, urlQr, patch = {}) {
  const cfg = await obtenerConfigPagoConsignacion();
  const idx = cfg.medios.findIndex((m) => m.id === medioId);
  if (idx < 0) {
    const err = new Error('Medio de pago no encontrado.');
    err.status = 404;
    throw err;
  }
  const merged = {
    ...cfg.medios[idx],
    ...patch,
    urlQr: String(urlQr || '').trim(),
  };
  if (patch.activo != null) {
    merged.activo = patch.activo !== false && patch.activo !== 'false';
  }
  cfg.medios[idx] = normalizarMedio(merged, idx);
  return guardarConfigPagoConsignacion(cfg);
}

module.exports = {
  CLAVE,
  DEFAULTS,
  obtenerConfigPagoConsignacion,
  guardarConfigPagoConsignacion,
  mapPublico,
  mapMediosPublicos,
  resolverMedioPublico,
  resolverCuentaBancaria,
  resolverBanco,
  assertConsignacionActiva,
  actualizarQrMedio,
  descrCuenta,
  idBancoCuenta,
};
