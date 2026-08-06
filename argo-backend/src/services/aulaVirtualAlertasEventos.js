const AlertaAulaVirtualEvento = require('../models/AlertaAulaVirtualEvento');
const { parseNumDoc } = require('../utils/numDoc');

function dtoEvento(row) {
  if (!row) return null;
  return {
    id: String(row._id),
    tipo: row.tipo,
    numDoc: row.numDoc,
    nombreAlumno: String(row.nombreAlumno || '').trim(),
    email: String(row.email || '').trim(),
    idPrograma: String(row.idPrograma || '').trim(),
    nombrePrograma: String(row.nombrePrograma || '').trim(),
    alumnoNuevo: row.alumnoNuevo === true,
    createdAt: row.createdAt,
  };
}

async function registrarRegistroPortal({ numDoc, nombreAlumno, email, alumnoNuevo }) {
  const nd = parseNumDoc(numDoc);
  if (nd == null) return null;
  const doc = await AlertaAulaVirtualEvento.create({
    tipo: 'registro',
    numDoc: nd,
    nombreAlumno: String(nombreAlumno || '').trim(),
    email: String(email || '').trim().toLowerCase(),
    alumnoNuevo: alumnoNuevo === true,
  });
  return dtoEvento(doc.toObject());
}

async function registrarMatriculaPortal({ numDoc, nombreAlumno, email, idPrograma, nombrePrograma }) {
  const nd = parseNumDoc(numDoc);
  if (nd == null || !String(idPrograma || '').trim()) return null;
  const doc = await AlertaAulaVirtualEvento.create({
    tipo: 'matricula',
    numDoc: nd,
    nombreAlumno: String(nombreAlumno || '').trim(),
    email: String(email || '').trim().toLowerCase(),
    idPrograma: String(idPrograma).trim(),
    nombrePrograma: String(nombrePrograma || idPrograma).trim(),
  });
  return dtoEvento(doc.toObject());
}

async function listarEventosRecientes({ desde, tipos, limit = 40 } = {}) {
  const q = {};
  if (desde) {
    const d = new Date(desde);
    if (!Number.isNaN(d.getTime())) q.createdAt = { $gte: d };
  }
  const tiposOk = (Array.isArray(tipos) ? tipos : [])
    .map((t) => String(t || '').trim())
    .filter((t) => t === 'registro' || t === 'matricula');
  if (tiposOk.length) q.tipo = { $in: tiposOk };

  const rows = await AlertaAulaVirtualEvento.find(q)
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 40, 1), 100))
    .lean();

  const registro = [];
  const matricula = [];
  for (const row of rows) {
    const dto = dtoEvento(row);
    if (!dto) continue;
    if (dto.tipo === 'registro') registro.push(dto);
    else if (dto.tipo === 'matricula') matricula.push(dto);
  }
  return { registro, matricula };
}

module.exports = {
  registrarRegistroPortal,
  registrarMatriculaPortal,
  listarEventosRecientes,
};
