const Config = require('../models/Config');
const Sede = require('../models/Sede');

const CLAVE = 'recibo';

const DEFAULTS = {
  clave: CLAVE,
  nombreEmpresa: 'ARGO — Centro de Formación en Conducción',
  nit: '',
  direccion: '',
  ciudad: '',
  telefono: '',
  email: '',
  urlLogo: '',
  prefijoFactura: 'FV',
  consecutivoFactura: 0,
  prefijoComprobanteIngreso: 'CI',
  consecutivoComprobanteIngreso: 0,
  prefijoComprobanteEgreso: 'CE',
  consecutivoComprobanteEgreso: 0,
  slogan1: '',
  mensajeEncabezado: 'COMPROBANTE DE INGRESO',
  mensajeEncabezadoEgreso: 'COMPROBANTE DE EGRESO',
  mensajePie:
    'Documento soporte de pago. No sustituye factura electrónica. Conserve este comprobante.',
  mensajePieEgreso:
    'Constancia de egreso. El beneficiario debe firmar este recibo o adjuntar factura/voucher como soporte del pago.',
  mensajeCreacionAlumnoTitulo: '¡Alumno registrado!',
  mensajeCreacionAlumno:
    'Se registró correctamente a {nombre} con documento {numDoc}.\n\nBienvenido(a) a {empresa}.{slogan}',
  anchoReciboMm: 80,
  mostrarQr: true,
};

function claveRecibo(idSede) {
  const sid = String(idSede || '').trim();
  return sid ? `${CLAVE}:${sid}` : CLAVE;
}

/** Quita metadatos de Mongo al clonar un doc config (evita E11000 duplicate _id). */
function omitMongoMeta(doc) {
  if (!doc || typeof doc !== 'object') return {};
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  return rest;
}

function normalizar(doc, claveOverride) {
  const raw = { ...DEFAULTS, ...doc, clave: claveOverride || doc?.clave || CLAVE };
  if (doc?.prefijoRecibo != null && doc.prefijoFactura == null) {
    raw.prefijoFactura = String(doc.prefijoRecibo).trim() || DEFAULTS.prefijoFactura;
  }
  if (doc?.consecutivoRecibo != null && doc.consecutivoFactura == null) {
    raw.consecutivoFactura = Number(doc.consecutivoRecibo) || 0;
  }
  const enc = String(raw.mensajeEncabezado || '').trim().toUpperCase();
  if (enc === 'COMPROBANTE DE EGRESO' || enc.includes('EGRESO')) {
    raw.mensajeEncabezado = 'COMPROBANTE DE INGRESO';
  }
  return raw;
}

function aplicarEncabezadoSede(config, sede, global) {
  if (!sede) return { ...config };
  const g = global || DEFAULTS;
  const institucion = String(g.nombreEmpresa || config.nombreEmpresa || DEFAULTS.nombreEmpresa).trim();
  return {
    ...config,
    nombreEmpresa: institucion,
    nombreSede: String(sede.nombre || config.nombreSede || '').trim(),
    nit: String(g.nit ?? config.nit ?? '').trim(),
    email: String(g.email ?? config.email ?? '').trim(),
    urlLogo: String(g.urlLogo ?? config.urlLogo ?? '').trim(),
    telefono: String(sede.telefono || config.telefono || g.telefono || '').trim(),
    direccion: String(sede.direccion || config.direccion || g.direccion || '').trim(),
    ciudad: String(sede.ciudad || config.ciudad || g.ciudad || '').trim(),
    departamento: String(sede.departamento || config.departamento || '').trim(),
    idSede: sede.idSede || config.idSede || null,
  };
}

async function cargarGlobalRecibo() {
  const doc = await Config.findOne({ clave: CLAVE }).lean();
  return doc ? normalizar(doc, CLAVE) : { ...DEFAULTS };
}

async function sincronizarEncabezadoReciboDesdeSede(idSede) {
  const sid = String(idSede || '').trim();
  if (!sid) return;
  const sede = await Sede.findOne({ idSede: sid }).lean();
  if (!sede) return;
  await obtenerConfigRecibo(sid);
  const global = await cargarGlobalRecibo();
  const overlay = aplicarEncabezadoSede({}, sede, global);
  await Config.findOneAndUpdate(
    { clave: claveRecibo(sid) },
    {
      $set: {
        nombreEmpresa: overlay.nombreEmpresa,
        nombreSede: overlay.nombreSede,
        telefono: overlay.telefono,
        direccion: overlay.direccion,
        ciudad: overlay.ciudad,
        departamento: overlay.departamento,
        nit: overlay.nit,
        email: overlay.email,
        urlLogo: overlay.urlLogo,
        idSede: sid,
      },
    },
  );
}

async function defaultsParaSede(idSede) {
  const global = await cargarGlobalRecibo();
  const sede = idSede ? await Sede.findOne({ idSede: String(idSede) }).lean() : null;
  const cod = (sede?.codigo || idSede || 'SEDE').toString().trim().toUpperCase().slice(0, 6);
  const base = normalizar(
    {
      ...omitMongoMeta(global),
      clave: claveRecibo(idSede),
      idSede: idSede || null,
      prefijoComprobanteIngreso: `CI-${cod}`,
      prefijoComprobanteEgreso: `CE-${cod}`,
      consecutivoComprobanteIngreso: 0,
      consecutivoComprobanteEgreso: 0,
    },
    claveRecibo(idSede),
  );
  return aplicarEncabezadoSede(base, sede, global);
}

async function obtenerConfigRecibo(idSede = null) {
  const clave = claveRecibo(idSede);
  let found = await Config.findOne({ clave }).lean();
  if (!found && idSede) {
    const base = await defaultsParaSede(idSede);
    found = (await Config.create(base)).toObject();
    return normalizar(found, clave);
  }
  if (!found) {
    return normalizar((await Config.create({ ...DEFAULTS, clave: CLAVE })).toObject(), CLAVE);
  }
  let normalized = normalizar(found, clave);
  if (idSede) {
    const sede = await Sede.findOne({ idSede: String(idSede).trim() }).lean();
    const global = await cargarGlobalRecibo();
    normalized = aplicarEncabezadoSede(normalized, sede, global);
  }
  return normalized;
}

async function reservarConsecutivo(idSede, campoConsecutivo, prefijo) {
  const clave = claveRecibo(idSede);
  let doc = await Config.findOne({ clave });
  if (!doc) {
    const base = idSede ? await defaultsParaSede(idSede) : { ...DEFAULTS, clave: CLAVE };
    doc = await Config.create({ ...omitMongoMeta(base), [campoConsecutivo]: 1 });
  } else {
    doc[campoConsecutivo] = (doc[campoConsecutivo] || 0) + 1;
    await doc.save();
  }
  const n = doc[campoConsecutivo] || 1;
  const pref = (doc[prefijo] || '').trim() || 'DOC';
  return `${pref}-${String(n).padStart(6, '0')}`;
}

async function siguienteNumComprobanteIngreso(idSede = null) {
  await obtenerConfigRecibo(idSede);
  return reservarConsecutivo(idSede, 'consecutivoComprobanteIngreso', 'prefijoComprobanteIngreso');
}

async function siguienteNumComprobanteEgreso(idSede = null) {
  await obtenerConfigRecibo(idSede);
  return reservarConsecutivo(idSede, 'consecutivoComprobanteEgreso', 'prefijoComprobanteEgreso');
}

async function siguienteNumFactura(idSede = null) {
  await obtenerConfigRecibo(idSede);
  return reservarConsecutivo(idSede, 'consecutivoFactura', 'prefijoFactura');
}

async function siguienteNumRecibo(idSede = null) {
  return siguienteNumComprobanteIngreso(idSede);
}

module.exports = {
  CLAVE,
  DEFAULTS,
  claveRecibo,
  normalizar,
  aplicarEncabezadoSede,
  obtenerConfigRecibo,
  sincronizarEncabezadoReciboDesdeSede,
  siguienteNumComprobanteIngreso,
  siguienteNumComprobanteEgreso,
  siguienteNumFactura,
  siguienteNumRecibo,
};
