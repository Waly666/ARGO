const mongoose = require('mongoose');
const DatosAlumno = require('../models/DatosAlumno');
const { normalizarRol } = require('../utils/roles');
const { detectarCanalCliente } = require('../utils/canalConexion');
const { resolverGestorCatalogoPorUsuario } = require('./gestorUsuarioReferidor');

/** Filtro Mongo que no coincide con ningún documento. */
const FILTRO_VACIO = { _id: { $in: [] } };

function esPerfilGestor(rol) {
  const r = normalizarRol(rol);
  if (r === 'gestor' || r === 'tramitador') return true;
  return /^gestor[_-]/.test(r);
}

function normalizarUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function alumnoCreadoPorUsuario(alumno, username) {
  const u = normalizarUsername(username);
  if (!u || !alumno) return false;
  return normalizarUsername(alumno.userAddReg) === u;
}

/**
 * Alcance de datos para usuario gestor conectado desde app móvil.
 * Solo aplica si rol=gestor (o variante) y X-ARGO-Cliente es canal móvil.
 */
async function resolverAlcanceGestorMovil(req) {
  if (!req?.user) return null;
  if (detectarCanalCliente(req) !== 'movil') return null;
  if (!esPerfilGestor(req.user.rol)) return null;

  const username = normalizarUsername(req.user.username);
  const gestor = await resolverGestorCatalogoPorUsuario(req.user);
  if (!gestor?._id) {
    return {
      activo: true,
      sinVinculo: true,
      gestorId: null,
      gestorObjectId: null,
      username,
    };
  }

  const gestorId = String(gestor._id);
  return {
    activo: true,
    sinVinculo: false,
    gestorId,
    gestorObjectId: new mongoose.Types.ObjectId(gestorId),
    nombre: gestor.nombre,
    username,
  };
}

function filtroAlumnosAlcanceGestor(alcance) {
  if (!alcance?.activo) return null;
  const username = normalizarUsername(alcance.username);

  if (alcance.sinVinculo) {
    if (!username) return FILTRO_VACIO;
    return { userAddReg: username };
  }

  const ids = [alcance.gestorObjectId, alcance.gestorId].filter(Boolean);
  const or = [{ gestorId: { $in: ids } }];
  if (username) or.push({ userAddReg: username });
  return { $or: or };
}

function alumnoAccesiblePorGestor(alumno, alcance) {
  if (!alcance?.activo) return true;
  if (!alumno) return false;
  if (alumnoCreadoPorUsuario(alumno, alcance.username)) return true;
  if (alcance.sinVinculo) return false;
  if (!alumno.gestorId) return false;
  return String(alumno.gestorId) === String(alcance.gestorId);
}

async function obtenerNumDocsAlcanceGestor(alcance) {
  if (!alcance?.activo) return [];
  const filtro = filtroAlumnosAlcanceGestor(alcance);
  if (!filtro || filtro === FILTRO_VACIO) return [];
  const rows = await DatosAlumno.find(filtro).select('numDoc').lean();
  return [...new Set(rows.map((r) => r.numDoc).filter((n) => n != null))];
}

async function filtroCertificadosAlcanceGestor(alcance) {
  if (!alcance?.activo) return null;
  if (alcance.sinVinculo && !alcance.username) return FILTRO_VACIO;
  const numDocs = await obtenerNumDocsAlcanceGestor(alcance);
  const or = [];
  if (!alcance.sinVinculo) {
    const ids = [alcance.gestorObjectId, alcance.gestorId].filter(Boolean);
    if (ids.length) or.push({ gestorId: { $in: ids } });
  }
  if (numDocs.length) or.push({ numDoc: { $in: numDocs } });
  if (!or.length) return FILTRO_VACIO;
  return { $or: or };
}

function mergeFiltroMongo(base, extra) {
  if (!extra) return base;
  if (!base || Object.keys(base).length === 0) return extra;
  return { $and: [base, extra] };
}

async function assertAlumnoAccesibleGestor(req, alumno) {
  const alcance = await resolverAlcanceGestorMovil(req);
  if (!alcance?.activo) return { alcance: null };
  if (!alumnoAccesiblePorGestor(alumno, alcance)) {
    const err = new Error('Alumno no encontrado');
    err.status = 404;
    err.code = 'GESTOR_ALCANCE_DENEGADO';
    throw err;
  }
  return { alcance };
}

async function assertAlumnoPorNumDocGestor(req, numDoc) {
  const alcance = await resolverAlcanceGestorMovil(req);
  if (!alcance?.activo) return { alcance: null, alumno: null };
  const alumno = await DatosAlumno.findOne({ numDoc }).select('gestorId numDoc _id userAddReg').lean();
  if (!alumnoAccesiblePorGestor(alumno, alcance)) {
    const err = new Error('Alumno no encontrado');
    err.status = 404;
    err.code = 'GESTOR_ALCANCE_DENEGADO';
    throw err;
  }
  return { alcance, alumno };
}

async function certificadoAccesiblePorGestor(cert, alcance) {
  if (!alcance?.activo) return true;
  if (!cert) return false;
  if (alcance.sinVinculo && !alcance.username) return false;
  if (!alcance.sinVinculo && cert.gestorId && String(cert.gestorId) === String(alcance.gestorId)) {
    return true;
  }
  if (cert.numDoc == null) return false;
  const alumno = await DatosAlumno.findOne({ numDoc: cert.numDoc })
    .select('gestorId userAddReg')
    .lean();
  return alumnoAccesiblePorGestor(alumno, alcance);
}

async function assertCertificadoAccesibleGestor(req, cert) {
  const alcance = await resolverAlcanceGestorMovil(req);
  if (!alcance?.activo) return { alcance: null };
  const ok = await certificadoAccesiblePorGestor(cert, alcance);
  if (!ok) {
    const err = new Error('Certificado no encontrado');
    err.status = 404;
    err.code = 'GESTOR_ALCANCE_DENEGADO';
    throw err;
  }
  return { alcance };
}

async function intersectarNumDocsConAlcanceGestor(alcance, numDocs) {
  if (!alcance?.activo) return numDocs;
  const permitidos = new Set(await obtenerNumDocsAlcanceGestor(alcance));
  return (numDocs || []).filter((n) => permitidos.has(n));
}

module.exports = {
  FILTRO_VACIO,
  esPerfilGestor,
  resolverAlcanceGestorMovil,
  filtroAlumnosAlcanceGestor,
  alumnoAccesiblePorGestor,
  obtenerNumDocsAlcanceGestor,
  filtroCertificadosAlcanceGestor,
  mergeFiltroMongo,
  assertAlumnoAccesibleGestor,
  assertAlumnoPorNumDocGestor,
  certificadoAccesiblePorGestor,
  assertCertificadoAccesibleGestor,
  intersectarNumDocsConAlcanceGestor,
};
