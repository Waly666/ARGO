const Matricula = require('../models/Matricula');
const ProgresoVirtualCurso = require('../models/ProgresoVirtualCurso');
const { TARIFA_VIRTUAL } = require('../constants/tarifa');
const { numDocQuery } = require('../utils/numDoc');
const { expirarAccesoVirtual } = require('./aulaVirtualAccesoPlazo');
const { buscarPrograma } = require('./programaServicio');

const QUERY_MATRICULA_ACTIVA = { estado: { $regex: /^activo?a?$/i } };

function errHttp(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

async function buscarMatriculaVirtualActiva(numDoc, idPrograma) {
  const idProg = String(idPrograma);
  const mat = await Matricula.findOne({
    ...numDocQuery(numDoc),
    idProg,
    ...QUERY_MATRICULA_ACTIVA,
    tarifa: TARIFA_VIRTUAL,
  }).lean();
  if (!mat) throw errHttp(404, 'No hay matrícula virtual activa para este alumno y curso');
  return mat;
}

/**
 * Anula la matrícula virtual: borra progreso, marca matrícula anulada y limpia liquidación sin abono.
 */
async function anularMatriculaVirtualAdmin({ numDoc, idPrograma, usuario, motivo, enviarCorreo = false }) {
  const mat = await buscarMatriculaVirtualActiva(numDoc, idPrograma);
  const prog = await buscarPrograma(idPrograma);
  const etiquetaUsuario = String(usuario?.username || usuario?.nick || 'admin').trim() || 'admin';
  const motivoFinal =
    String(motivo || '').trim() ||
    `Matrícula anulada por administrador (${etiquetaUsuario})`;

  const r = await expirarAccesoVirtual({
    numDoc,
    idPrograma,
    matricula: mat,
    enviarCorreo,
    motivo: motivoFinal,
  });
  if (!r.ok) throw errHttp(404, 'No se pudo anular la matrícula virtual');

  return {
    ok: true,
    numDoc,
    idPrograma: String(idPrograma),
    nombrePrograma: prog?.nombreProg || String(idPrograma),
    idMatricula: String(mat._id),
    message: 'Matrícula virtual anulada. El alumno ya no verá este curso en el portal.',
  };
}

/**
 * Reinicia solo el progreso del curso virtual; conserva la matrícula y la liquidación.
 */
async function reiniciarProgresoVirtualAdmin({ numDoc, idPrograma }) {
  await buscarMatriculaVirtualActiva(numDoc, idPrograma);
  const idProg = String(idPrograma);
  const del = await ProgresoVirtualCurso.deleteOne({ ...numDocQuery(numDoc), idPrograma: idProg });
  const prog = await buscarPrograma(idPrograma);

  return {
    ok: true,
    numDoc,
    idPrograma: idProg,
    nombrePrograma: prog?.nombreProg || idProg,
    progresoEliminado: del.deletedCount > 0,
    message: del.deletedCount > 0
      ? 'Progreso del curso reiniciado. La matrícula sigue activa.'
      : 'No había progreso registrado; la matrícula sigue activa.',
  };
}

module.exports = {
  anularMatriculaVirtualAdmin,
  reiniciarProgresoVirtualAdmin,
};
