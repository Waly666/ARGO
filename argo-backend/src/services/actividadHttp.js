const jwt = require('jsonwebtoken');
const ActividadHttp = require('../models/ActividadHttp');
const { rutaBase } = require('./auditoria');

const ACTIVOS_MINUTOS = 10;
const sesionesActivas = new Map();

async function siguienteId() {
  const last = await ActividadHttp.findOne({}).sort({ idActividad: -1 }).select('idActividad').lean();
  const n = Number(last?.idActividad);
  return Number.isFinite(n) ? n + 1 : 1;
}

function usuarioDeToken(payload) {
  if (!payload) return null;
  return {
    idUsuario: payload.sub ? String(payload.sub) : null,
    usuario: payload.username || payload.sub || null,
    rol: payload.rol ? String(payload.rol) : null,
  };
}

function describirActividad(metodo, rb, status) {
  const m = String(metodo || 'GET').toUpperCase();
  const ok = status >= 200 && status < 300;
  const fallo = status >= 400;

  const map = [
    { re: /\/auth\/login$/i, t: 'Iniciando sesión' },
    { re: /\/auth\/me$/i, t: 'Consultando perfil de sesión' },
    { re: /\/caja\/sesiones\/activa\/ingresos/i, t: 'Listando ingresos de su caja' },
    { re: /\/caja\/sesiones\/activa\/egresos/i, t: 'Listando egresos de su caja' },
    { re: /\/caja\/sesiones\/activa/i, t: 'Revisando su caja abierta' },
    { re: /\/caja\/sesiones\/abrir/i, t: 'Abriendo caja' },
    { re: /\/caja\/sesiones\/.*\/cerrar/i, t: 'Cerrando caja' },
    { re: /\/caja\/sesiones\/.*\/resumen/i, t: 'Consultando resumen de caja' },
    { re: /\/caja\/cierre-general/i, t: 'Cierre general de caja (admin)' },
    { re: /\/caja\/sesiones\/abiertas/i, t: 'Supervisando cajas abiertas' },
    { re: /\/ingresos/i, t: m === 'POST' ? 'Registrando ingreso / cobro' : 'Consultando ingresos' },
    { re: /\/egresos/i, t: m === 'POST' ? 'Registrando egreso' : 'Consultando egresos' },
    { re: /\/alumnos/i, t: m === 'POST' ? 'Creando / editando alumno' : 'Consultando alumnos' },
    { re: /\/matriculas/i, t: 'Gestión de matrículas' },
    { re: /\/liquidacion/i, t: 'Liquidación / cartera' },
    { re: /\/usuarios/i, t: 'Administración de usuarios' },
    { re: /\/actividad/i, t: 'Monitoreo de actividad' },
    { re: /\/auditoria/i, t: 'Consultando auditoría' },
    { re: /\/catalogos/i, t: 'Consultando catálogos' },
    { re: /\/programas/i, t: 'Programas educativos' },
    { re: /\/servicios/i, t: 'Servicios' },
    { re: /\/certificados/i, t: 'Certificados' },
    { re: /\/rrhh/i, t: 'Recursos humanos' },
    { re: /\/config/i, t: 'Configuración del sistema' },
  ];

  for (const { re, t } of map) {
    if (re.test(rb)) {
      if (fallo) return `${t} (error ${status})`;
      return t;
    }
  }

  const verbo =
    m === 'GET'
      ? 'Consultando'
      : m === 'POST'
        ? 'Creando / enviando'
        : m === 'PUT' || m === 'PATCH'
          ? 'Modificando'
          : m === 'DELETE'
            ? 'Eliminando'
            : m;
  return `${verbo} ${rb}${fallo ? ` (${status})` : ok ? '' : ` (${status})`}`;
}

function extraerUsuarioReq(req) {
  if (req.user) {
    return {
      idUsuario: req.user.sub ? String(req.user.sub) : null,
      usuario: req.user.username || null,
      rol: req.user.rol ? String(req.user.rol) : null,
    };
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return usuarioDeToken(jwt.verify(token, process.env.JWT_SECRET));
  } catch {
    return null;
  }
}

function actualizarSesionActiva(usr, doc) {
  if (!usr?.idUsuario) return;
  sesionesActivas.set(usr.idUsuario, {
    idUsuario: usr.idUsuario,
    usuario: doc.usuario,
    nombreUsuario: doc.nombreUsuario,
    rol: doc.rol,
    ultimaActividad: doc.actividad,
    ultimaRuta: doc.rutaBase || doc.ruta,
    ultimoMetodo: doc.metodo,
    ultimoCodigo: doc.codigoHttp,
    ultimaFecha: doc.fecha,
    peticionesEnVentana: (sesionesActivas.get(usr.idUsuario)?.peticionesEnVentana || 0) + 1,
  });
}

async function registrarPeticion({ req, statusCode, duracionMs, nombreUsuario }) {
  const ruta = req.originalUrl || req.url || '';
  const rb = rutaBase(ruta);
  let usr = extraerUsuarioReq(req);

  if (!usr?.idUsuario && !usr?.usuario && /\/auth\/login$/i.test(rb) && statusCode >= 200 && statusCode < 300) {
    const login = req.body?.username || req.body?.usuario;
    if (login) usr = { idUsuario: null, usuario: String(login).trim(), rol: null };
  }
  if (!usr?.idUsuario && !usr?.usuario) return null;
  const metodo = req.method || 'GET';
  const actividad = describirActividad(metodo, rb, statusCode);

  const idActividad = await siguienteId();
  const doc = {
    idActividad,
    fecha: new Date(),
    ...usr,
    nombreUsuario: nombreUsuario || null,
    metodo,
    ruta,
    rutaBase: rb,
    codigoHttp: statusCode,
    duracionMs,
    actividad,
    ip: req.ip || req.headers?.['x-forwarded-for'] || null,
  };

  actualizarSesionActiva(usr, doc);

  setImmediate(() => {
    ActividadHttp.create(doc).catch((err) => {
      console.error('[ARGO actividad]', err.message);
    });
  });

  return doc;
}

async function listarActivos(minutos = ACTIVOS_MINUTOS) {
  const desde = new Date(Date.now() - minutos * 60 * 1000);

  const agg = await ActividadHttp.aggregate([
    { $match: { fecha: { $gte: desde }, idUsuario: { $exists: true, $ne: null } } },
    { $sort: { fecha: -1 } },
    {
      $group: {
        _id: '$idUsuario',
        usuario: { $first: '$usuario' },
        nombreUsuario: { $first: '$nombreUsuario' },
        rol: { $first: '$rol' },
        ultimaActividad: { $first: '$actividad' },
        ultimaRuta: { $first: '$rutaBase' },
        ultimoMetodo: { $first: '$metodo' },
        ultimoCodigo: { $first: '$codigoHttp' },
        ultimaFecha: { $first: '$fecha' },
        peticionesRecientes: { $sum: 1 },
      },
    },
    { $sort: { ultimaFecha: -1 } },
  ]);

  const mem = [...sesionesActivas.values()].filter(
    (s) => s.ultimaFecha && new Date(s.ultimaFecha) >= desde,
  );

  const porId = new Map();
  for (const row of agg) {
    porId.set(row._id, {
      idUsuario: row._id,
      usuario: row.usuario,
      nombreUsuario: row.nombreUsuario,
      rol: row.rol,
      ultimaActividad: row.ultimaActividad,
      ultimaRuta: row.ultimaRuta,
      ultimoMetodo: row.ultimoMetodo,
      ultimoCodigo: row.ultimoCodigo,
      ultimaFecha: row.ultimaFecha,
      peticionesRecientes: row.peticionesRecientes,
      enLinea: true,
    });
  }
  for (const s of mem) {
    const prev = porId.get(s.idUsuario);
    if (!prev || new Date(s.ultimaFecha) >= new Date(prev.ultimaFecha)) {
      porId.set(s.idUsuario, { ...s, enLinea: true });
    }
  }

  return [...porId.values()].sort(
    (a, b) => new Date(b.ultimaFecha).getTime() - new Date(a.ultimaFecha).getTime(),
  );
}

async function listarHistorial(filtros = {}) {
  const { desde, hasta, usuario, idUsuario, limit: limitRaw, page: pageRaw } = filtros;
  const filter = {};
  if (desde || hasta) {
    filter.fecha = {};
    if (desde) filter.fecha.$gte = new Date(desde);
    if (hasta) filter.fecha.$lte = new Date(hasta);
  }
  if (usuario) filter.usuario = new RegExp(String(usuario).trim(), 'i');
  if (idUsuario) filter.idUsuario = String(idUsuario);

  const limit = Math.min(Math.max(Number(limitRaw) || 80, 1), 300);
  const page = Math.max(Number(pageRaw) || 1, 1);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    ActividadHttp.find(filter).sort({ fecha: -1, idActividad: -1 }).skip(skip).limit(limit).lean(),
    ActividadHttp.countDocuments(filter),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 };
}

module.exports = {
  registrarPeticion,
  listarActivos,
  listarHistorial,
  describirActividad,
  ACTIVOS_MINUTOS,
};
