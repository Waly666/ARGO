const Usuario = require('../models/Usuario');
const Gestor = require('../models/Gestor');
const { normalizarRol } = require('../utils/roles');
const { obtenerConfigGestoresEmpresas } = require('./configGestoresEmpresas');
const { esAlumnoReferidorComercial } = require('./gestorEmpresaMatricula');

function normalizarDoc(s) {
  return String(s || '').replace(/\D/g, '');
}

function nombreGestor(g) {
  if (!g) return '';
  const pseudo = String(g.seudonimo || '').trim();
  if (pseudo) return pseudo;
  const tipo = String(g.tipoGestor || 'persona_natural').trim().toLowerCase();
  if (tipo === 'empresa') {
    return String(g.nombres || '').trim() || String(g.numero || '');
  }
  return [g.nombres, g.apellidos].filter(Boolean).join(' ').trim() || String(g.numero || '');
}

function mapGestorComercial(g) {
  if (!g) return null;
  const tipoGestor = String(g.tipoGestor || 'persona_natural').trim().toLowerCase();
  return {
    _id: g._id,
    numero: String(g.numero || '').trim(),
    nombre: nombreGestor(g),
    tipoGestor: tipoGestor === 'empresa' ? 'empresa' : 'persona_natural',
    nombres: g.nombres,
    apellidos: g.apellidos,
    seudonimo: g.seudonimo,
  };
}

async function obtenerDocumentoUsuario(usuario) {
  if (!usuario) return '';
  let doc = String(usuario.numeroDocumento || usuario.numero || '').trim();
  if (!doc && usuario.empleado?.numeroDocumento) {
    doc = String(usuario.empleado.numeroDocumento).trim();
  }
  const id = usuario.sub || usuario._id;
  if (!doc && id) {
    const u = await Usuario.findById(id).select('numeroDocumento numero').lean();
    if (u) doc = String(u.numeroDocumento || u.numero || '').trim();
  }
  return doc;
}

async function buscarGestorPorDocumento(doc) {
  const target = normalizarDoc(doc);
  if (!target) return null;
  const rows = await Gestor.find({ activo: { $ne: false } })
    .select('nombres apellidos seudonimo numero')
    .lean();
  return rows.find((g) => normalizarDoc(g.numero) === target) || null;
}

/**
 * Usuario con rol gestor vinculado al catálogo comercial (mismo documento).
 */
async function resolverGestorComercialPorUsuario(usuario) {
  if (!usuario || normalizarRol(usuario.rol) !== 'gestor') return null;
  const cfg = await obtenerConfigGestoresEmpresas();
  if (!cfg.activo) return null;
  const doc = await obtenerDocumentoUsuario(usuario);
  if (!doc) return null;
  const g = await buscarGestorPorDocumento(doc);
  return mapGestorComercial(g);
}

/**
 * Asigna al alumno el gestor del usuario logueado (rol gestor + documento coincidente).
 */
async function aplicarReferidorGestorUsuario(dto, usuario, opts = {}) {
  const { forzarPropioGestor = false, exigirVinculo = false } = opts;
  if (!dto || !usuario || normalizarRol(usuario.rol) !== 'gestor') return dto;

  const cfg = await obtenerConfigGestoresEmpresas();
  if (!cfg.activo) return dto;

  if (!forzarPropioGestor && esAlumnoReferidorComercial(dto)) return dto;

  const g = await resolverGestorComercialPorUsuario(usuario);
  if (!g) {
    if (exigirVinculo) {
      const err = new Error(
        'Su usuario gestor no está vinculado al catálogo de tramitadores. Verifique que el número de documento del usuario coincida con el del gestor.',
      );
      err.status = 400;
      err.code = 'GESTOR_USUARIO_NO_VINCULADO';
      throw err;
    }
    return dto;
  }

  dto.manejoGestorEmpresa = true;
  dto.tipoReferidorComercial = 'gestor';
  dto.gestorId = g._id;
  dto.gestorNombre = g.nombre;
  dto.referidorEmpresaId = null;
  dto.referidorEmpresaNombre = null;
  return dto;
}

module.exports = {
  normalizarDoc,
  nombreGestor,
  mapGestorComercial,
  obtenerDocumentoUsuario,
  buscarGestorPorDocumento,
  resolverGestorComercialPorUsuario,
  aplicarReferidorGestorUsuario,
};
