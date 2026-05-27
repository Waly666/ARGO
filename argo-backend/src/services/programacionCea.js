const TemaProgramaCea = require('../models/TemaProgramaCea');
const { TIPOS_TEMA_CEA } = require('../constants/programacionCea');
const { obtenerConfig, guardarConfig } = require('./configProgramacionCea');
const { listarFestivos } = require('./festivosColombia');
const {
  listarProgramasCea,
  buscarProgramaCea,
  rastreoAlumno,
  rastreoGlobal,
  alertasPendientes,
} = require('./programacionCeaRastreo');

async function listarTemas(idProg) {
  const prog = await buscarProgramaCea(idProg);
  if (!prog) return null;
  return TemaProgramaCea.find({ idProg: String(idProg) })
    .sort({ tipo: 1, orden: 1, nombre: 1 })
    .lean();
}

async function crearTema(idProg, body, usuario) {
  const prog = await buscarProgramaCea(idProg);
  if (!prog) return { error: 'Programa CEA no encontrado', status: 404 };
  const tipo = String(body?.tipo || '').trim();
  if (!TIPOS_TEMA_CEA.includes(tipo)) {
    return { error: 'tipo debe ser teoria o taller', status: 400 };
  }
  const nombre = String(body?.nombre || '').trim();
  if (!nombre) return { error: 'nombre es obligatorio', status: 400 };
  const doc = await TemaProgramaCea.create({
    idProg: String(idProg),
    tipo,
    nombre,
    orden: Number(body?.orden) || 1,
    horasTema: body?.horasTema != null && body.horasTema !== '' ? Number(body.horasTema) : null,
    activo: body?.activo !== false,
    userAddReg: usuario?.username || 'sistema',
  });
  return { doc: doc.toObject() };
}

async function actualizarTema(id, body, usuario) {
  const tema = await TemaProgramaCea.findById(id);
  if (!tema) return { error: 'Tema no encontrado', status: 404 };
  if (body?.tipo != null) {
    const tipo = String(body.tipo).trim();
    if (!TIPOS_TEMA_CEA.includes(tipo)) return { error: 'tipo inválido', status: 400 };
    tema.tipo = tipo;
  }
  if (body?.nombre != null) {
    const nombre = String(body.nombre).trim();
    if (!nombre) return { error: 'nombre no puede quedar vacío', status: 400 };
    tema.nombre = nombre;
  }
  if (body?.orden != null) tema.orden = Number(body.orden) || 1;
  if (body?.horasTema !== undefined) {
    tema.horasTema = body.horasTema != null && body.horasTema !== '' ? Number(body.horasTema) : null;
  }
  if (body?.activo !== undefined) tema.activo = body.activo !== false;
  tema.userChangeRecord = usuario?.username || 'sistema';
  await tema.save();
  return { doc: tema.toObject() };
}

async function eliminarTema(id) {
  const tema = await TemaProgramaCea.findByIdAndDelete(id);
  if (!tema) return { error: 'Tema no encontrado', status: 404 };
  return { ok: true };
}

module.exports = {
  obtenerConfig,
  guardarConfig,
  listarFestivos,
  listarProgramasCea,
  buscarProgramaCea,
  listarTemas,
  crearTema,
  actualizarTema,
  eliminarTema,
  rastreoAlumno,
  rastreoGlobal,
  alertasPendientes,
};
