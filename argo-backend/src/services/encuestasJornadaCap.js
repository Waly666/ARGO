const mongoose = require('mongoose');
const EncuestaJornadaCap = require('../models/EncuestaJornadaCap');
const RespuestaEncuestaJornada = require('../models/RespuestaEncuestaJornada');
const Contratacion = require('../models/Contratacion');
const DatosAlumno = require('../models/DatosAlumno');
const { parseNumDoc, numDocQuery } = require('../utils/numDoc');
const { TIPO_JORNADAS_CAPACITACION: TIPO_ALUMNO_JORNADAS } = require('../constants/tipoAlumno');
const {
  ASPECTOS_ENCUESTA_JORNADA,
  ASPECTO_KEYS_ENCUESTA_JORNADA,
} = require('../constants/aspectosEncuestaJornada');
const {
  carpasAsistidasAlumnoContrato,
  contratosConCarpasAsistidas,
  claveProgramaInstructor,
} = require('./carpasAsistidasContrato');
const { mapaNombresCarpas } = require('./carpaJornada');
const { buscarPrograma } = require('./programaServicio');

function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function nombreCompletoAlumno(da) {
  if (!da) return '';
  return [da.apellido1, da.apellido2, da.nombre1, da.nombre2].filter(Boolean).join(' ').trim();
}

function encuestaVigente(e) {
  if (!e || e.estado !== 'PUBLICADA') return false;
  const now = new Date();
  if (e.fechaApertura && now < new Date(e.fechaApertura)) return false;
  if (e.fechaCierre && now > new Date(e.fechaCierre)) return false;
  return true;
}

function etiquetaContrato(c) {
  if (!c) return '—';
  const cod = String(c.codContrato || '').trim();
  const cli = String(c.razoSocial || c.nombreComercial || '').trim();
  if (cod && cli) return `${cod} — ${cli}`;
  return cod || cli || String(c._id);
}

async function resolverNombresProgramas(idProgs) {
  const out = new Map();
  for (const idProg of idProgs) {
    const prog = await buscarPrograma(idProg);
    out.set(
      String(idProg),
      prog?.nombreProg || prog?.descripcion || prog?.nomCert || String(idProg),
    );
  }
  return out;
}

/** Carpeta distintas asistidas por el alumno en el contrato (no por certificado). */
async function carpasElegiblesAlumno(numDoc, idContrato) {
  return carpasAsistidasAlumnoContrato(numDoc, idContrato);
}

function normalizarAspectos(raw) {
  const out = {};
  for (const key of ASPECTO_KEYS_ENCUESTA_JORNADA) {
    const nota = Math.round(num(raw?.[key]));
    if (nota < 1 || nota > 5) {
      throw httpError('Cada aspecto debe calificarse del 1 al 5', 400);
    }
    out[key] = nota;
  }
  return out;
}

function tituloProgramaCarpa(c) {
  const prog = String(c.programaNombre || '').trim();
  if (prog) return prog;
  return String(c.nombre || '').trim() || 'Programa';
}

function claveEvaluacion(c) {
  if (c?.clave) return String(c.clave).trim();
  return claveProgramaInstructor(c?.idProg, c?.idEmpleadoInstructor, c?.idinstructor);
}

function claveEvaluacionLegacy(c) {
  const clave = claveEvaluacion(c);
  if (clave && clave !== '|') return clave;
  const idCarpa = Number(c?.idCarpa);
  return Number.isFinite(idCarpa) ? `carpa:${idCarpa}` : '';
}

function mapCarpasPortal(carpas) {
  return carpas.map((c) => ({
    idCarpa: c.idCarpa,
    nombre: c.nombre,
    idProg: c.idProg || '',
    programaNombre: c.programaNombre || '',
    idEmpleadoInstructor: c.idEmpleadoInstructor ?? null,
    instructorNombre: c.instructorNombre || '',
    clave: c.clave || claveEvaluacion(c),
    titulo: tituloProgramaCarpa(c),
  }));
}

function promedioAspectos(aspectos) {
  const vals = ASPECTO_KEYS_ENCUESTA_JORNADA.map((k) => Math.round(num(aspectos?.[k])));
  if (vals.some((v) => v < 1 || v > 5)) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return Math.round((sum / vals.length) * 100) / 100;
}

async function asegurarAlumnoJornadas(numDocRaw) {
  const numDoc = parseNumDoc(numDocRaw);
  if (numDoc == null) throw httpError('Número de documento inválido', 400);

  const da = await DatosAlumno.findOne(numDocQuery(numDoc)).lean();
  if (!da) throw httpError('No encontramos una ficha con ese documento', 404);
  if (String(da.tipoAlumno || '') !== TIPO_ALUMNO_JORNADAS) {
    throw httpError(
      'Esta encuesta es solo para alumnos de Jornadas de Capacitación. Puede inscribirse en el portal.',
      403,
    );
  }
  return { numDoc, da };
}

function mapEncuestaResumen(e, contrato) {
  return {
    _id: String(e._id),
    idContrato: String(e.idContrato),
    contratoLabel: etiquetaContrato(contrato),
    codContrato: contrato?.codContrato || '',
    titulo: e.titulo,
    instrucciones: e.instrucciones || '',
    estado: e.estado,
    fechaApertura: e.fechaApertura,
    fechaCierre: e.fechaCierre,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

async function listarEncuestas(query = {}) {
  const filtro = {};
  if (query.idContrato) {
    if (!mongoose.Types.ObjectId.isValid(String(query.idContrato))) {
      throw httpError('Contrato inválido', 400);
    }
    filtro.idContrato = new mongoose.Types.ObjectId(String(query.idContrato));
  }
  if (query.estado) filtro.estado = String(query.estado).trim();

  const rows = await EncuestaJornadaCap.find(filtro).sort({ createdAt: -1 }).lean();
  const contratoIds = [...new Set(rows.map((r) => String(r.idContrato)))];
  const contratos = contratoIds.length
    ? await Contratacion.find({ _id: { $in: contratoIds } }).lean()
    : [];
  const cMap = new Map(contratos.map((c) => [String(c._id), c]));

  const encuestaIds = rows.map((r) => r._id);
  const respCounts = encuestaIds.length
    ? await RespuestaEncuestaJornada.aggregate([
        { $match: { idEncuesta: { $in: encuestaIds } } },
        { $group: { _id: '$idEncuesta', total: { $sum: 1 } } },
      ])
    : [];
  const rMap = new Map(respCounts.map((r) => [String(r._id), r.total]));

  return rows.map((e) => ({
    ...mapEncuestaResumen(e, cMap.get(String(e.idContrato))),
    totalRespuestas: rMap.get(String(e._id)) || 0,
    vigente: encuestaVigente(e),
  }));
}

async function listarEncuestasContrato(idContrato) {
  if (!mongoose.Types.ObjectId.isValid(String(idContrato))) {
    throw httpError('Contrato inválido', 400);
  }
  return listarEncuestas({ idContrato });
}

async function obtenerEncuesta(id) {
  const e = await EncuestaJornadaCap.findById(id).lean();
  if (!e) throw httpError('Encuesta no encontrada', 404);
  const contrato = await Contratacion.findById(e.idContrato).lean();
  return mapEncuestaResumen(e, contrato);
}

async function crearEncuesta(idContrato, body, usuario) {
  if (!mongoose.Types.ObjectId.isValid(String(idContrato))) {
    throw httpError('Contrato inválido', 400);
  }
  const contrato = await Contratacion.findById(idContrato).lean();
  if (!contrato) throw httpError('Contrato no encontrado', 404);
  if (!String(body?.titulo || '').trim()) throw httpError('El título es obligatorio');

  const doc = await EncuestaJornadaCap.create({
    idContrato,
    titulo: String(body.titulo).trim(),
    instrucciones: String(body.instrucciones || '').trim(),
    fechaApertura: body.fechaApertura ? new Date(body.fechaApertura) : null,
    fechaCierre: body.fechaCierre ? new Date(body.fechaCierre) : null,
    userAddReg: usuario,
  });
  return obtenerEncuesta(doc._id);
}

async function actualizarEncuesta(id, body, usuario) {
  const e = await EncuestaJornadaCap.findById(id);
  if (!e) throw httpError('Encuesta no encontrada', 404);
  if (e.estado === 'CERRADA') throw httpError('La encuesta está cerrada y no se puede editar');

  if (body.titulo !== undefined) {
    const t = String(body.titulo).trim();
    if (!t) throw httpError('El título es obligatorio');
    e.titulo = t;
  }
  if (body.instrucciones !== undefined) e.instrucciones = String(body.instrucciones || '').trim();
  if (body.fechaApertura !== undefined) {
    e.fechaApertura = body.fechaApertura ? new Date(body.fechaApertura) : null;
  }
  if (body.fechaCierre !== undefined) {
    e.fechaCierre = body.fechaCierre ? new Date(body.fechaCierre) : null;
  }
  e.userChangeRecord = usuario;
  await e.save();
  return obtenerEncuesta(e._id);
}

async function publicarEncuesta(id, usuario) {
  const e = await EncuestaJornadaCap.findById(id);
  if (!e) throw httpError('Encuesta no encontrada', 404);
  if (e.estado === 'CERRADA') throw httpError('La encuesta ya está cerrada');

  const otra = await EncuestaJornadaCap.findOne({
    idContrato: e.idContrato,
    estado: 'PUBLICADA',
    _id: { $ne: e._id },
  }).lean();
  if (otra) {
    throw httpError(
      'Ya hay otra encuesta publicada para este contrato. Ciérrela antes de publicar una nueva.',
      409,
    );
  }

  e.estado = 'PUBLICADA';
  e.userChangeRecord = usuario;
  await e.save();
  return obtenerEncuesta(e._id);
}

async function cerrarEncuesta(id, usuario) {
  const e = await EncuestaJornadaCap.findById(id);
  if (!e) throw httpError('Encuesta no encontrada', 404);
  e.estado = 'CERRADA';
  e.userChangeRecord = usuario;
  await e.save();
  return obtenerEncuesta(e._id);
}

async function eliminarEncuesta(id) {
  const e = await EncuestaJornadaCap.findById(id);
  if (!e) throw httpError('Encuesta no encontrada', 404);
  const resp = await RespuestaEncuestaJornada.countDocuments({ idEncuesta: id });
  if (resp > 0) {
    throw httpError('No se puede eliminar: ya hay respuestas registradas', 409);
  }
  await EncuestaJornadaCap.deleteOne({ _id: id });
  return { ok: true };
}

async function resultadosEncuesta(id) {
  const e = await EncuestaJornadaCap.findById(id).lean();
  if (!e) throw httpError('Encuesta no encontrada', 404);

  const [contrato, respuestas] = await Promise.all([
    Contratacion.findById(e.idContrato).lean(),
    RespuestaEncuestaJornada.find({ idEncuesta: id }).sort({ fechaEnvio: -1 }).lean(),
  ]);

  const numDocs = [...new Set(respuestas.map((r) => r.numDoc))];
  const alumnos = numDocs.length
    ? await DatosAlumno.find({ numDoc: { $in: numDocs } }).lean()
    : [];
  const alMap = new Map(alumnos.map((a) => [a.numDoc, a]));

  const mapasCarpasPorAlumno = new Map();
  for (const numDoc of numDocs) {
    const carpas = await carpasAsistidasAlumnoContrato(numDoc, e.idContrato);
    mapasCarpasPorAlumno.set(numDoc, {
      byClave: new Map(carpas.map((c) => [c.clave || claveEvaluacion(c), c])),
      byCarpa: new Map(carpas.map((c) => [String(c.idCarpa), c])),
    });
  }

  const enriquecerCalificacion = (c, numDoc) => {
    const idCarpa = Number(c.idCarpa);
    const maps = mapasCarpasPorAlumno.get(numDoc);
    const clave = claveEvaluacionLegacy(c);
    const ref =
      maps?.byClave.get(clave) ||
      (Number.isFinite(idCarpa) ? maps?.byCarpa.get(String(idCarpa)) : null);
    const idProg = String(c.idProg || ref?.idProg || '').trim();
    const instructorNombre = String(c.instructorNombre || ref?.instructorNombre || '').trim();
    const idEmpleadoInstructor =
      c.idEmpleadoInstructor != null ? Number(c.idEmpleadoInstructor) : ref?.idEmpleadoInstructor ?? null;
    return {
      ...c,
      clave: clave || claveProgramaInstructor(idProg, idEmpleadoInstructor, ''),
      idCarpa,
      idProg,
      idEmpleadoInstructor,
      instructorNombre,
      ref,
      programaNombreHint: ref?.programaNombre || '',
    };
  };

  const acumCarpaAspecto = new Map();
  const carpasIds = new Set();
  const acumProg = new Map();
  const metaPorClave = new Map();

  for (const r of respuestas) {
    for (const raw of r.calificacionesCarpa || []) {
      const c = enriquecerCalificacion(raw, r.numDoc);
      const clave = c.clave;
      if (!clave) continue;
      if (Number.isFinite(c.idCarpa)) carpasIds.add(c.idCarpa);
      if (!metaPorClave.has(clave)) {
        metaPorClave.set(clave, {
          clave,
          idCarpa: c.idCarpa,
          idProg: c.idProg,
          instructorNombre: c.instructorNombre,
          idEmpleadoInstructor: c.idEmpleadoInstructor,
          programaNombreHint: c.programaNombreHint,
        });
      }
      for (const key of ASPECTO_KEYS_ENCUESTA_JORNADA) {
        const k = `${clave}|${key}`;
        const prev = acumCarpaAspecto.get(k) || { suma: 0, n: 0, clave, aspecto: key };
        prev.suma += num(c.aspectos?.[key]);
        prev.n += 1;
        acumCarpaAspecto.set(k, prev);
      }
    }
    for (const c of r.calificaciones || []) {
      const k = String(c.idProg);
      const prev = acumProg.get(k) || { suma: 0, n: 0, idProg: k };
      prev.suma += num(c.nota);
      prev.n += 1;
      acumProg.set(k, prev);
    }
  }

  const nombresCarpa = await mapaNombresCarpas([...carpasIds]);
  const idProgByCarpa = new Map();
  for (const [, meta] of metaPorClave) {
    if (Number.isFinite(meta.idCarpa) && meta.idProg) {
      idProgByCarpa.set(meta.idCarpa, String(meta.idProg).trim());
    }
  }
  const nombresProgCarpa = await resolverNombresProgramas([
    ...idProgByCarpa.values(),
    ...[...metaPorClave.values()].map((m) => m.idProg).filter(Boolean),
  ]);

  const labelProgramaCarpa = (meta) => {
    const idProg = meta.idProg || idProgByCarpa.get(meta.idCarpa) || '';
    if (meta.programaNombreHint) return meta.programaNombreHint;
    if (idProg && nombresProgCarpa.get(String(idProg))) {
      return nombresProgCarpa.get(String(idProg));
    }
    return idProg || nombresCarpa.get(meta.idCarpa) || 'Programa';
  };

  const promediosPorClaveAspecto = new Map();
  const acumPromedioClave = new Map();
  for (const r of respuestas) {
    for (const raw of r.calificacionesCarpa || []) {
      const c = enriquecerCalificacion(raw, r.numDoc);
      const clave = c.clave;
      if (!clave) continue;
      const prom =
        c.promedio != null ? num(c.promedio) : promedioAspectos(c.aspectos || {});
      if (prom != null) {
        const prev = acumPromedioClave.get(clave) || { suma: 0, n: 0, clave };
        prev.suma += prom;
        prev.n += 1;
        acumPromedioClave.set(clave, prev);
      }
    }
  }

  for (const [, a] of acumCarpaAspecto) {
    const clave = a.clave;
    if (!promediosPorClaveAspecto.has(clave)) {
      const meta = metaPorClave.get(clave) || { clave, idCarpa: null, idProg: '', instructorNombre: '' };
      const programaNombre = labelProgramaCarpa(meta);
      promediosPorClaveAspecto.set(clave, {
        clave,
        idCarpa: meta.idCarpa,
        idProg: meta.idProg || '',
        nombre: programaNombre,
        programaNombre,
        instructorNombre: meta.instructorNombre || '',
        idEmpleadoInstructor: meta.idEmpleadoInstructor ?? null,
        promedioGeneral:
          acumPromedioClave.has(clave) && acumPromedioClave.get(clave).n
            ? Math.round((acumPromedioClave.get(clave).suma / acumPromedioClave.get(clave).n) * 100) /
              100
            : null,
        aspectos: {},
      });
    }
    const row = promediosPorClaveAspecto.get(clave);
    row.aspectos[a.aspecto] = {
      promedio: a.n ? Math.round((a.suma / a.n) * 100) / 100 : null,
      respuestas: a.n,
    };
  }

  const promediosCarpa = [...promediosPorClaveAspecto.values()].sort((x, y) => {
    const cmpProg = String(x.programaNombre).localeCompare(String(y.programaNombre), 'es');
    if (cmpProg !== 0) return cmpProg;
    return String(x.instructorNombre).localeCompare(String(y.instructorNombre), 'es');
  });

  const idProgs = [...acumProg.keys()];
  const nombres = await resolverNombresProgramas(idProgs);
  const promediosPrograma = idProgs
    .map((idProg) => {
      const a = acumProg.get(idProg);
      return {
        idProg,
        nombre: nombres.get(idProg) || idProg,
        promedio: a.n ? Math.round((a.suma / a.n) * 100) / 100 : null,
        respuestas: a.n,
      };
    })
    .sort((x, y) => String(x.nombre).localeCompare(String(y.nombre), 'es'));

  const filas = [];
  for (const r of respuestas) {
    const calificacionesCarpa = (r.calificacionesCarpa || []).map((raw) => {
      const c = enriquecerCalificacion(raw, r.numDoc);
      const meta = metaPorClave.get(c.clave) || c;
      const programaNombre = labelProgramaCarpa(meta);
      const aspectos = { ...(raw.aspectos || {}) };
      const promedio =
        raw.promedio != null ? num(raw.promedio) : promedioAspectos(aspectos);
      return {
        clave: c.clave,
        idCarpa: c.idCarpa,
        nombre: programaNombre,
        programaNombre,
        idProg: c.idProg || '',
        instructorNombre: c.instructorNombre || '',
        idEmpleadoInstructor: c.idEmpleadoInstructor ?? null,
        aspectos,
        promedio,
      };
    });
    filas.push({
      numDoc: r.numDoc,
      nombreCompleto: nombreCompletoAlumno(alMap.get(r.numDoc)) || `Doc ${r.numDoc}`,
      calificacionesCarpa,
      calificaciones: (r.calificaciones || []).map((c) => ({
        idProg: c.idProg,
        nombre: nombres.get(String(c.idProg)) || c.idProg,
        nota: c.nota,
      })),
      comentario: r.comentario || '',
      fechaEnvio: r.fechaEnvio,
    });
  }

  return {
    encuesta: mapEncuestaResumen(e, contrato),
    totalRespuestas: respuestas.length,
    aspectos: ASPECTOS_ENCUESTA_JORNADA,
    promediosCarpa,
    promediosPrograma,
    filas,
  };
}

/* ---------------- Portal público ---------------- */

async function resolverMotivoSinPendientes(numDoc, vigentes) {
  const publicadas = await EncuestaJornadaCap.find({ estado: 'PUBLICADA' }).lean();
  if (!publicadas.length) {
    const borrador = await EncuestaJornadaCap.countDocuments({ estado: 'BORRADOR' });
    return borrador > 0 ? 'encuestas_no_publicadas' : 'sin_encuestas';
  }
  if (!vigentes.length) return 'encuestas_fuera_vigencia';

  const contratosElegibles = [];
  const contratoIdsAlumno = await contratosConCarpasAsistidas(numDoc);
  for (const idC of contratoIdsAlumno) {
    const carpas = await carpasElegiblesAlumno(numDoc, idC);
    if (carpas.length) contratosElegibles.push(String(idC));
  }
  if (!contratosElegibles.length) return 'no_elegible';

  const contratosConEncuesta = new Set(vigentes.map((e) => String(e.idContrato)));
  if (!contratosElegibles.some((idC) => contratosConEncuesta.has(idC))) {
    return 'sin_encuesta_su_contrato';
  }
  return 'ya_respondio';
}

async function encuestasPendientesPortal(numDocRaw) {
  const { numDoc, da } = await asegurarAlumnoJornadas(numDocRaw);

  const encuestas = await EncuestaJornadaCap.find({ estado: 'PUBLICADA' }).lean();
  const vigentes = encuestas.filter(encuestaVigente);

  const contratoIds = [...new Set(vigentes.map((e) => String(e.idContrato)))];
  const contratos = contratoIds.length
    ? await Contratacion.find({ _id: { $in: contratoIds } }).lean()
    : [];
  const cMap = new Map(contratos.map((c) => [String(c._id), c]));

  const encuestaIds = vigentes.map((e) => e._id);
  const ya = encuestaIds.length
    ? await RespuestaEncuestaJornada.find({
        idEncuesta: { $in: encuestaIds },
        numDoc,
      })
        .select('idEncuesta')
        .lean()
    : [];
  const respondidas = new Set(ya.map((r) => String(r.idEncuesta)));

  const items = [];
  for (const e of vigentes) {
    if (respondidas.has(String(e._id))) continue;
    const carpas = await carpasElegiblesAlumno(numDoc, e.idContrato);
    if (!carpas.length) continue;
    const contrato = cMap.get(String(e.idContrato));
    items.push({
      _id: String(e._id),
      titulo: e.titulo,
      instrucciones: e.instrucciones || '',
      idContrato: String(e.idContrato),
      contratoLabel: etiquetaContrato(contrato),
      carpas: mapCarpasPortal(carpas),
      aspectos: ASPECTOS_ENCUESTA_JORNADA,
      fechaCierre: e.fechaCierre,
    });
  }

  if (items.length) {
    return {
      numDoc,
      nombreCompleto: nombreCompletoAlumno(da),
      items,
    };
  }

  return {
    numDoc,
    nombreCompleto: nombreCompletoAlumno(da),
    items: [],
    motivo: await resolverMotivoSinPendientes(numDoc, vigentes),
  };
}

async function detalleEncuestaPortal(idEncuesta, numDocRaw) {
  const { numDoc, da } = await asegurarAlumnoJornadas(numDocRaw);
  const e = await EncuestaJornadaCap.findById(idEncuesta).lean();
  if (!e) throw httpError('Encuesta no encontrada', 404);
  if (!encuestaVigente(e)) throw httpError('Esta encuesta no está disponible en este momento', 403);

  const prev = await RespuestaEncuestaJornada.findOne({ idEncuesta, numDoc }).lean();
  if (prev) throw httpError('Ya registró su respuesta para esta encuesta', 409);

  const carpas = await carpasElegiblesAlumno(numDoc, e.idContrato);
  if (!carpas.length) {
    throw httpError(
      'No tiene carpas con asistencia registrada en este contrato',
      403,
    );
  }

  const contrato = await Contratacion.findById(e.idContrato).lean();
  return {
    _id: String(e._id),
    titulo: e.titulo,
    instrucciones: e.instrucciones || '',
    idContrato: String(e.idContrato),
    contratoLabel: etiquetaContrato(contrato),
    numDoc,
    nombreCompleto: nombreCompletoAlumno(da),
    carpas: mapCarpasPortal(carpas),
    aspectos: ASPECTOS_ENCUESTA_JORNADA,
    fechaCierre: e.fechaCierre,
  };
}

async function responderEncuestaPortal(idEncuesta, numDocRaw, body) {
  const { numDoc } = await asegurarAlumnoJornadas(numDocRaw);
  const e = await EncuestaJornadaCap.findById(idEncuesta).lean();
  if (!e) throw httpError('Encuesta no encontrada', 404);
  if (!encuestaVigente(e)) throw httpError('Esta encuesta ya no acepta respuestas', 403);

  const prev = await RespuestaEncuestaJornada.findOne({ idEncuesta, numDoc }).lean();
  if (prev) throw httpError('Ya registró su respuesta para esta encuesta', 409);

  const carpas = await carpasElegiblesAlumno(numDoc, e.idContrato);
  if (!carpas.length) {
    throw httpError('No es elegible para responder esta encuesta', 403);
  }

  const esperados = new Map(carpas.map((c) => [c.clave || claveEvaluacion(c), c]));
  const calificacionesCarpa = Array.isArray(body?.calificacionesCarpa)
    ? body.calificacionesCarpa
    : [];
  if (calificacionesCarpa.length !== esperados.size) {
    throw httpError('Debe calificar todas las capacitaciones en las que participó', 400);
  }

  const normalizadas = [];
  const vistos = new Set();
  for (const c of calificacionesCarpa) {
    const idCarpa = Number(c?.idCarpa);
    const ref =
      (c?.clave && esperados.get(String(c.clave).trim())) ||
      [...esperados.values()].find((x) => Number(x.idCarpa) === idCarpa);
    const clave = ref ? ref.clave || claveEvaluacion(ref) : '';
    if (!ref || !clave || vistos.has(clave)) {
      throw httpError('Calificaciones inválidas para las capacitaciones del contrato', 400);
    }
    vistos.add(clave);
    const aspectos = normalizarAspectos(c?.aspectos);
    normalizadas.push({
      idCarpa: ref.idCarpa,
      idProg: ref.idProg || '',
      idEmpleadoInstructor: ref.idEmpleadoInstructor ?? null,
      instructorNombre: ref.instructorNombre || '',
      clave,
      aspectos,
      promedio: promedioAspectos(aspectos),
    });
  }
  for (const clave of esperados.keys()) {
    if (!vistos.has(clave)) throw httpError('Falta calificar una o más capacitaciones', 400);
  }

  const comentario = String(body?.comentario || '').trim().slice(0, 2000);

  const doc = await RespuestaEncuestaJornada.create({
    idEncuesta,
    idContrato: e.idContrato,
    numDoc,
    calificacionesCarpa: normalizadas,
    comentario,
    fechaEnvio: new Date(),
  });

  return {
    ok: true,
    _id: String(doc._id),
    mensaje: 'Gracias por completar la evaluación.',
  };
}

module.exports = {
  listarEncuestas,
  listarEncuestasContrato,
  obtenerEncuesta,
  crearEncuesta,
  actualizarEncuesta,
  publicarEncuesta,
  cerrarEncuesta,
  eliminarEncuesta,
  resultadosEncuesta,
  encuestasPendientesPortal,
  detalleEncuestaPortal,
  responderEncuestaPortal,
  carpasElegiblesAlumno,
  programasElegiblesAlumno: carpasElegiblesAlumno,
};
