const Matricula = require('../models/Matricula');
const UsuarioPortal = require('../models/UsuarioPortal');
const Certificado = require('../models/Certificado');
const Liquidacion = require('../models/Liquidacion');
const ProgresoVirtualCurso = require('../models/ProgresoVirtualCurso');
const { TARIFA_VIRTUAL } = require('../constants/tarifa');
const { numDocQuery } = require('../utils/numDoc');
const { expirarAccesoVirtual } = require('./aulaVirtualAccesoPlazo');
const { buscarPrograma } = require('./programaServicio');
const { configPorPrograma } = require('./aulaVirtualCatalogo');
const {
  evaluarAprobacion,
  dedupeIntentosRaw,
  avanceIntentoEfectivo,
  intentoCumpleRequisitos,
  sincronizarAprobacionEnDoc,
  normalizarClases,
  metricasDesdeClases,
  clampPct,
} = require('./aulaVirtualProgreso');
const { construirFilaProgresoAlumno } = require('./aulaVirtualProgresoAdmin');

const QUERY_MATRICULA_ACTIVA = { estado: { $regex: /^activo?a?$/i } };

const ALCANCES_REINICIO = new Set(['completo', 'evaluaciones', 'lecciones']);

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

async function obtenerOCrearProgresoDoc(numDoc, idPrograma) {
  const idProg = String(idPrograma);
  let doc = await ProgresoVirtualCurso.findOne({ ...numDocQuery(numDoc), idPrograma: idProg });
  if (!doc) {
    doc = new ProgresoVirtualCurso({ numDoc, idPrograma: idProg });
  }
  return doc;
}

function normalizarIntentosAdmin(raw) {
  if (!Array.isArray(raw)) return null;
  const out = [];
  for (const item of raw) {
    const nota = clampPct(item?.nota);
    if (Number.isNaN(Number(item?.nota))) continue;
    out.push({
      nota,
      pctCompletitud: clampPct(item?.pctCompletitud ?? 0),
      aprobado: item?.aprobado === true,
      fecha: item?.fecha ? new Date(item.fecha) : new Date(),
    });
  }
  return out;
}

function recalcularCamposDerivados(doc, cfg) {
  const pctMinCompletitud = clampPct(cfg.pctMinCompletitud, 80);
  const pctMinEvaluaciones = clampPct(cfg.pctMinEvaluaciones, 60);
  const pctCurso = clampPct(doc.pctCompletitud);

  const intentos = Array.isArray(doc.intentos) ? doc.intentos : [];
  for (let i = 0; i < intentos.length; i++) {
    const it = intentos[i];
    const pctEfectivo = avanceIntentoEfectivo(it, pctCurso);
    const aprobadoIntento = intentoCumpleRequisitos(
      it,
      pctMinCompletitud,
      pctMinEvaluaciones,
      pctCurso,
    );
    intentos[i].pctCompletitud = pctEfectivo;
    intentos[i].aprobado = aprobadoIntento || !!it.aprobado;
  }
  doc.intentos = intentos;

  const deduped = dedupeIntentosRaw(intentos);
  doc.intentosEval = deduped.length;
  if (deduped.length) {
    doc.ultimaNotaEval = clampPct(deduped[deduped.length - 1].nota);
    doc.mejorNotaEval = Math.max(...deduped.map((it) => clampPct(it.nota)));
  } else {
    doc.ultimaNotaEval = null;
    doc.mejorNotaEval = null;
    doc.intentosEval = 0;
  }

  const mejor = doc.mejorNotaEval != null ? clampPct(doc.mejorNotaEval) : null;
  const cumpleCompletitud = pctCurso >= pctMinCompletitud;
  const cumpleNota = mejor != null && mejor >= pctMinEvaluaciones;
  if (doc.aprobado !== true) {
    doc.aprobado = cumpleCompletitud && cumpleNota;
  }
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
 * Reinicia progreso: completo (documento), solo evaluaciones finales o solo lecciones.
 */
async function reiniciarProgresoVirtualAdmin({ numDoc, idPrograma, alcance = 'completo' }) {
  const alc = String(alcance || 'completo').toLowerCase();
  if (!ALCANCES_REINICIO.has(alc)) {
    throw errHttp(400, 'Alcance inválido. Use: completo, evaluaciones o lecciones.');
  }

  await buscarMatriculaVirtualActiva(numDoc, idPrograma);
  const idProg = String(idPrograma);
  const prog = await buscarPrograma(idPrograma);
  const cfg = (await configPorPrograma(idProg)) || {};

  if (alc === 'completo') {
    const del = await ProgresoVirtualCurso.deleteOne({ ...numDocQuery(numDoc), idPrograma: idProg });
    return {
      ok: true,
      numDoc,
      idPrograma: idProg,
      nombrePrograma: prog?.nombreProg || idProg,
      alcance: alc,
      progresoEliminado: del.deletedCount > 0,
      message: del.deletedCount > 0
        ? 'Progreso del curso reiniciado por completo. La matrícula sigue activa.'
        : 'No había progreso registrado; la matrícula sigue activa.',
    };
  }

  const doc = await ProgresoVirtualCurso.findOne({ ...numDocQuery(numDoc), idPrograma: idProg });
  if (!doc) {
    return {
      ok: true,
      numDoc,
      idPrograma: idProg,
      nombrePrograma: prog?.nombreProg || idProg,
      alcance: alc,
      progresoEliminado: false,
      message: 'No había progreso registrado.',
    };
  }

  if (alc === 'evaluaciones') {
    doc.intentos = [];
    doc.intentosEval = 0;
    doc.mejorNotaEval = null;
    doc.ultimaNotaEval = null;
    doc.aprobado = false;
    doc.certificadoEmitido = false;
  } else if (alc === 'lecciones') {
    doc.clases = [];
    doc.promedioClases = null;
    doc.pctCompletitud = 0;
    doc.aprobado = false;
    recalcularCamposDerivados(doc, cfg);
  }

  doc.fechaUltimaActividad = new Date();
  await doc.save();
  await sincronizarAprobacionEnDoc(numDoc, idProg, doc.toObject(), cfg);

  const msg =
    alc === 'evaluaciones'
      ? 'Se borraron las evaluaciones finales e intentos. El avance por lección se conservó.'
      : 'Se borró el avance por lección. Las evaluaciones registradas se conservaron (puede recalcular notas).';

  return {
    ok: true,
    numDoc,
    idPrograma: idProg,
    nombrePrograma: prog?.nombreProg || idProg,
    alcance: alc,
    progresoEliminado: true,
    message: msg,
  };
}

/**
 * Edición manual de avance, lecciones e intentos (soporte / reconstrucción del alumno).
 */
async function actualizarProgresoVirtualAdmin({ numDoc, idPrograma, body = {} }) {
  const mat = await buscarMatriculaVirtualActiva(numDoc, idPrograma);
  const idProg = String(idPrograma);
  const cfg = (await configPorPrograma(idProg)) || {};
  const doc = await obtenerOCrearProgresoDoc(numDoc, idProg);

  if (body.quitarTodosIntentos === true) {
    doc.intentos = [];
  }

  if (body.quitarIntento != null && body.quitarIntento !== '') {
    const q = String(body.quitarIntento);
    const idx = Number(q);
    if (Number.isFinite(idx) && idx >= 1) {
      const pos = idx - 1;
      if (pos >= 0 && pos < doc.intentos.length) {
        doc.intentos.splice(pos, 1);
      }
    } else {
      doc.intentos = (doc.intentos || []).filter((it) => String(it._id) !== q);
    }
  }

  if (Array.isArray(body.intentos)) {
    const normalizados = normalizarIntentosAdmin(body.intentos);
    if (normalizados) doc.intentos = normalizados;
  }

  if (Array.isArray(body.clases)) {
    const clases = normalizarClases(body.clases);
    doc.clases = clases;
    const m = metricasDesdeClases(clases);
    doc.pctCompletitud = m.pctCompletitud;
    doc.promedioClases = m.promedioClases;
  }
  /** Avance global manual (ERP): prevalece sobre el calculado por lecciones si se envía. */
  if (body.pctCompletitud != null) {
    doc.pctCompletitud = clampPct(body.pctCompletitud);
  }

  recalcularCamposDerivados(doc, cfg);

  if (body.aprobado === true) doc.aprobado = true;
  else if (body.aprobado === false) doc.aprobado = false;

  if (body.certificadoEmitido === true) doc.certificadoEmitido = true;
  else if (body.certificadoEmitido === false) doc.certificadoEmitido = false;

  doc.fechaUltimaActividad = new Date();
  await doc.save();
  await sincronizarAprobacionEnDoc(numDoc, idProg, doc.toObject(), cfg);

  const estado = await evaluarAprobacion(numDoc, idProg);
  const progDoc = await ProgresoVirtualCurso.findOne({ ...numDocQuery(numDoc), idPrograma: idProg }).lean();
  const prog = await buscarPrograma(idProg);
  const [portal, cert, liq] = await Promise.all([
    UsuarioPortal.findOne(numDocQuery(numDoc)).lean(),
    Certificado.findOne({ idProg, ...numDocQuery(numDoc) })
      .sort({ fechaEmision: -1 })
      .select('codigoCert fechaEmision generadoAutoVirtual')
      .lean(),
    Liquidacion.findOne({ idMat: mat._id }).lean(),
  ]);
  const fila = await construirFilaProgresoAlumno({
    m: {
      idMatricula: String(mat._id),
      numDoc: mat.numDoc,
      fechaMat: mat.fechaMat,
      valorMat: mat.valorMat,
      pagada: mat.pagada,
      saldo: liq?.saldo ?? 0,
    },
    idProg,
    progDoc,
    portal,
    cert,
    reglasExtra: { ...cfg, nombrePrograma: prog?.nombreProg || idProg },
  });

  return {
    ok: true,
    message: 'Progreso actualizado.',
    item: fila,
    progreso: estado,
  };
}

module.exports = {
  anularMatriculaVirtualAdmin,
  reiniciarProgresoVirtualAdmin,
  actualizarProgresoVirtualAdmin,
};
