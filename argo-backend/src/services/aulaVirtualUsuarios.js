const DatosAlumno = require('../models/DatosAlumno');
const UsuarioPortal = require('../models/UsuarioPortal');
const { numDocQuery } = require('../utils/numDoc');

function nombreCompleto(a) {
  if (!a) return '';
  return [a.apellido1, a.apellido2, a.nombre1, a.nombre2].filter(Boolean).join(' ').trim();
}

function coincideBusqueda(row, q) {
  const t = String(q || '').trim().toLowerCase();
  if (!t) return true;
  const soloDigitos = t.replace(/\D/g, '');
  if (soloDigitos && String(row.numDoc).includes(soloDigitos)) return true;
  if (row.email?.toLowerCase().includes(t)) return true;
  if (row.nombreCompleto?.toLowerCase().includes(t)) return true;
  if (row.celular?.toLowerCase().includes(t)) return true;
  return false;
}

async function listarUsuariosPortalAdmin({ q = '', limit = 200 } = {}) {
  const cap = Math.min(500, Math.max(1, Number(limit) || 200));
  const portalUsers = await UsuarioPortal.find().sort({ createdAt: -1 }).limit(cap).lean();

  const numDocs = [...new Set(portalUsers.map((u) => u.numDoc).filter((n) => n != null))];
  const alumnos = numDocs.length
    ? await DatosAlumno.find({ $or: numDocs.map((n) => numDocQuery(n)) }).lean()
    : [];
  const alumnoMap = new Map(alumnos.map((a) => [Number(a.numDoc), a]));

  let rows = portalUsers.map((u) => {
    const a = alumnoMap.get(Number(u.numDoc)) || null;
    return {
      id: String(u._id),
      email: u.email,
      numDoc: u.numDoc,
      activo: u.activo !== false,
      createdAt: u.createdAt,
      ultimoAcceso: u.ultimoAcceso || null,
      nombreCompleto: nombreCompleto(a),
      celular: a?.celular || '',
      tipoDoc: a?.tipoDoc || '',
    };
  });

  if (q) rows = rows.filter((r) => coincideBusqueda(r, q));

  return {
    total: rows.length,
    usuarios: rows,
  };
}

async function eliminarUsuarioPortal(id) {
  const idStr = String(id || '').trim();
  if (!idStr) {
    const err = new Error('ID de usuario requerido');
    err.status = 400;
    throw err;
  }
  const doc = await UsuarioPortal.findByIdAndDelete(idStr);
  if (!doc) {
    const err = new Error('Usuario del portal no encontrado');
    err.status = 404;
    throw err;
  }
  return {
    ok: true,
    message: `Cuenta del portal ${doc.email} eliminada. La ficha del alumno en el ERP no se modificó.`,
    email: doc.email,
    numDoc: doc.numDoc,
  };
}

module.exports = { listarUsuariosPortalAdmin, eliminarUsuarioPortal };
