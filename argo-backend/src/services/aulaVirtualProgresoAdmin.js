const Matricula = require('../models/Matricula');
const UsuarioPortal = require('../models/UsuarioPortal');
const Certificado = require('../models/Certificado');
const ProgresoVirtualCurso = require('../models/ProgresoVirtualCurso');
const Liquidacion = require('../models/Liquidacion');
const DatosAlumno = require('../models/DatosAlumno');
const { listarMatriculasProgramaUnicas, TARIFA_VIRTUAL } = require('./programaMatriculas');
const { configPorPrograma, servicioMatriculaPrograma } = require('./aulaVirtualCatalogo');
const {
  buscarPrograma,
  esCapacitacionVirtualServicio,
  num,
} = require('./programaServicio');
const { concatNombreAlumno } = require('../utils/busquedaAlumnoNombre');
const { numDocQuery, parseNumDoc } = require('../utils/numDoc');
const {
  evaluarAprobacion,
  mapIntentosPublicos,
} = require('./aulaVirtualProgreso');

const QUERY_MATRICULA_ACTIVA = { estado: { $regex: /^activo?a?$/i } };

const ONLINE_MS = 10 * 60 * 1000;
const RECIENTE_MS = 24 * 60 * 60 * 1000;

function paginacion(query) {
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 50));
  const skip = Math.max(0, parseInt(query.skip, 10) || 0);
  return { limit, skip };
}

function estadoConexion(fechaActividad, ultimoAccesoPortal) {
  const fechas = [fechaActividad, ultimoAccesoPortal]
    .filter(Boolean)
    .map((f) => new Date(f).getTime())
    .filter((t) => !Number.isNaN(t));
  if (!fechas.length) {
    return { codigo: 'sin_datos', label: 'Sin actividad', enLinea: false };
  }
  const ultima = Math.max(...fechas);
  const diff = Date.now() - ultima;
  if (diff <= ONLINE_MS) {
    return { codigo: 'en_linea', label: 'En línea', enLinea: true };
  }
  if (diff <= RECIENTE_MS) {
    return { codigo: 'reciente', label: 'Reciente', enLinea: false };
  }
  return { codigo: 'desconectado', label: 'Desconectado', enLinea: false };
}

function mapClasesPublicas(clases) {
  if (!Array.isArray(clases)) return [];
  return clases
    .slice()
    .sort((a, b) => a.numero - b.numero)
    .map((c) => ({
      numero: c.numero,
      pct: c.pct ?? 0,
      aprobada: !!c.aprobada,
    }));
}

function pasaFiltro(filtro, row) {
  if (!filtro) return true;
  if (filtro === 'aprobado') return row.progreso.aprobado;
  if (filtro === 'sin_iniciar') return row.progreso.sinIniciar;
  if (filtro === 'certificado') return row.progreso.certificadoEmitido;
  return true;
}

function reglasDesdeCfg(cfg = {}) {
  return {
    modoCertificado: cfg.modoCertificado || 'al_pagar',
    pctMinCompletitud: Number(cfg.pctMinCompletitud) || 80,
    pctMinEvaluaciones: Number(cfg.pctMinEvaluaciones) || 60,
    intentosMaxEval: Math.max(1, Number(cfg.intentosMaxEval) || 3),
  };
}

async function construirFilaProgresoAlumno({
  m,
  idProg,
  progDoc,
  portal,
  cert,
  nombreCompleto,
  alumnoId,
  reglasExtra = {},
}) {
  const idPrograma = String(idProg);
  const estado = await evaluarAprobacion(m.numDoc, idPrograma);
  const pctCompletitud = estado.pctCompletitud ?? 0;
  const sinIniciar =
    !progDoc || (pctCompletitud === 0 && !estado.intentosEval && !(progDoc?.clases?.length));
  const conn = estadoConexion(progDoc?.fechaUltimaActividad, portal?.ultimoAcceso);
  const reglas = {
    ...reglasDesdeCfg(reglasExtra),
    pctMinCompletitud: estado.pctMinCompletitud,
    pctMinEvaluaciones: estado.pctMinEvaluaciones,
    intentosMaxEval: estado.intentosMaxEval,
  };

  return {
    idMatricula: String(m.idMatricula || m._id),
    idPrograma,
    nombrePrograma: reglasExtra.nombrePrograma || null,
    reglas,
    alumnoId: alumnoId || null,
    numDoc: m.numDoc,
    nombreCompleto: m.nombreCompleto || nombreCompleto || '',
    celular: m.celular || null,
    correo: m.correo || null,
    emailPortal: portal?.email || null,
    fechaMat: m.fechaMat,
    pago: {
      pagado: (m.saldo ?? 0) <= 0,
      saldo: m.saldo ?? 0,
      valorMat: m.valorMat ?? 0,
      pagada: m.pagada || '',
    },
    progreso: {
      pctCompletitud,
      promedioClases: estado.promedioClases,
      clasesAprobadas: estado.clasesAprobadas,
      totalClases: estado.totalClases,
      clases: mapClasesPublicas(estado.clases),
      mejorNotaEval: estado.mejorNotaEval,
      ultimaNotaEval: estado.ultimaNotaEval,
      intentosEval: estado.intentosEval,
      intentosRestantes: estado.intentosRestantes,
      intentos: mapIntentosPublicos(progDoc?.intentos, {
        pctMinCompletitud: estado.pctMinCompletitud,
        pctMinEvaluaciones: estado.pctMinEvaluaciones,
        pctCompletitudCurso: pctCompletitud,
      }),
      aprobado: estado.aprobado,
      cumpleCompletitud: estado.cumpleCompletitud,
      cumpleNota: estado.cumpleNota,
      certificadoEmitido: estado.certificadoEmitido || !!cert,
      sinIniciar,
      contadorSyncs: progDoc?.contadorSyncs || 0,
      fechaUltimaActividad: progDoc?.fechaUltimaActividad
        ? new Date(progDoc.fechaUltimaActividad).toISOString()
        : null,
    },
    certificado: cert
      ? {
          codigoCert: cert.codigoCert || null,
          fechaEmision: cert.fechaEmision ? new Date(cert.fechaEmision).toISOString() : null,
          generadoAutoVirtual: !!cert.generadoAutoVirtual,
        }
      : null,
    portal: {
      activo: portal?.activo !== false,
      ultimoAcceso: portal?.ultimoAcceso ? new Date(portal.ultimoAcceso).toISOString() : null,
    },
    conexion: conn,
  };
}

/**
 * Resumen de progreso por alumno matriculado en un curso virtual (admin ERP).
 */
async function listarProgresoAlumnosAdmin(idPrograma, query = {}, ctx = {}) {
  const idProg = String(idPrograma || '').trim();
  const { limit, skip } = paginacion(query);
  if (!idProg) {
    return { items: [], total: 0, skip, limit, reglas: null };
  }

  const cfg = (await configPorPrograma(idProg)) || {};
  const reglas = reglasDesdeCfg(cfg);

  const filtro = String(query.filtro || '').trim().toLowerCase();
  const usaFiltroProgreso = ['aprobado', 'sin_iniciar', 'certificado'].includes(filtro);
  const matParams = {
    q: query.q,
    modalidad: 'virtual',
    limit: usaFiltroProgreso ? 500 : limit,
    skip: usaFiltroProgreso ? 0 : skip,
  };

  const { items: mats, total: totalMats } = await listarMatriculasProgramaUnicas(idProg, matParams, ctx);

  if (!mats.length) {
    return { items: [], total: usaFiltroProgreso ? 0 : totalMats, skip, limit, reglas };
  }

  const nums = mats.map((m) => m.numDoc);
  const [progresos, portales, certs] = await Promise.all([
    ProgresoVirtualCurso.find({ idPrograma: idProg, numDoc: { $in: nums } }).lean(),
    UsuarioPortal.find({ numDoc: { $in: nums } }).lean(),
    Certificado.find({ idProg, numDoc: { $in: nums } })
      .select('numDoc codigoCert fechaEmision generadoAutoVirtual')
      .sort({ fechaEmision: -1 })
      .lean(),
  ]);

  const progMap = new Map(progresos.map((p) => [Number(p.numDoc), p]));
  const portalMap = new Map(portales.map((p) => [Number(p.numDoc), p]));
  const certMap = new Map();
  for (const c of certs) {
    const nd = Number(c.numDoc);
    if (!certMap.has(nd)) certMap.set(nd, c);
  }

  const rows = [];
  for (const m of mats) {
    const prog = progMap.get(Number(m.numDoc));
    const portal = portalMap.get(Number(m.numDoc));
    const cert = certMap.get(Number(m.numDoc));
    rows.push(
      await construirFilaProgresoAlumno({
        m,
        idProg,
        progDoc: prog,
        portal,
        cert,
        reglasExtra: cfg,
      }),
    );
  }

  if (usaFiltroProgreso) {
    const filtrados = rows.filter((r) => pasaFiltro(filtro, r));
    return {
      items: filtrados.slice(skip, skip + limit),
      total: filtrados.length,
      skip,
      limit,
      reglas,
    };
  }

  return { items: rows, total: totalMats, skip, limit, reglas };
}

/**
 * Progreso virtual del alumno en todos sus cursos matriculados (admin ERP).
 */
async function listarProgresoAlumnoAdmin(numDocRaw, query = {}, ctx = {}) {
  const numDoc = parseNumDoc(numDocRaw);
  const { limit, skip } = paginacion(query);
  if (numDoc == null) {
    return { items: [], total: 0, skip, limit, reglas: null };
  }

  const filtro = String(query.filtro || '').trim().toLowerCase();
  const matsRaw = await Matricula.find({
    ...numDocQuery(numDoc),
    tarifa: TARIFA_VIRTUAL,
    ...QUERY_MATRICULA_ACTIVA,
    ...(ctx.idSede ? { idSede: String(ctx.idSede) } : {}),
  })
    .sort({ fechaMat: -1 })
    .lean();

  const byProg = new Map();
  for (const m of matsRaw) {
    const idProg = String(m.idProg || '').trim();
    if (!idProg || byProg.has(idProg)) continue;
    byProg.set(idProg, m);
  }

  if (!byProg.size) {
    return { items: [], total: 0, skip, limit, reglas: null };
  }

  const alumno = await DatosAlumno.findOne(numDocQuery(numDoc)).lean();
  const nombreCompleto = alumno ? concatNombreAlumno(alumno) : '';
  const alumnoId = alumno?._id ? String(alumno._id) : null;
  const idMats = [...byProg.values()].map((m) => m._id);
  const idProgs = [...byProg.keys()];

  const [liqs, portal, progresos, certs] = await Promise.all([
    idMats.length ? Liquidacion.find({ idMat: { $in: idMats } }).lean() : [],
    UsuarioPortal.findOne(numDocQuery(numDoc)).lean(),
    ProgresoVirtualCurso.find({ idPrograma: { $in: idProgs }, ...numDocQuery(numDoc) }).lean(),
    Certificado.find({ idProg: { $in: idProgs }, ...numDocQuery(numDoc) })
      .select('numDoc idProg codigoCert fechaEmision generadoAutoVirtual')
      .sort({ fechaEmision: -1 })
      .lean(),
  ]);

  const saldoPorMat = new Map();
  for (const l of liqs) {
    const k = String(l.idMat);
    saldoPorMat.set(k, (saldoPorMat.get(k) || 0) + num(l.saldo));
  }

  const progMap = new Map(progresos.map((p) => [String(p.idPrograma), p]));
  const certMap = new Map();
  for (const c of certs) {
    const key = String(c.idProg);
    if (!certMap.has(key)) certMap.set(key, c);
  }

  const rows = [];
  for (const [idProg, mat] of byProg) {
    const prog = await buscarPrograma(idProg);
    if (!prog) continue;
    const serv = await servicioMatriculaPrograma(prog);
    if (!esCapacitacionVirtualServicio(serv)) continue;

    const cfg = (await configPorPrograma(idProg)) || {};
    const m = {
      idMatricula: String(mat._id),
      numDoc: mat.numDoc,
      nombreCompleto,
      celular: alumno?.celular || null,
      correo: alumno?.correo || null,
      fechaMat: mat.fechaMat,
      valorMat: num(mat.valorMat),
      pagada: mat.pagada || '',
      saldo: saldoPorMat.get(String(mat._id)) || 0,
    };

    rows.push(
      await construirFilaProgresoAlumno({
        m,
        idProg,
        progDoc: progMap.get(idProg),
        portal,
        cert: certMap.get(idProg),
        nombreCompleto,
        alumnoId,
        reglasExtra: { ...cfg, nombrePrograma: prog.nombreProg || prog.nomCert || idProg },
      }),
    );
  }

  rows.sort((a, b) => String(a.nombrePrograma || '').localeCompare(String(b.nombrePrograma || ''), 'es'));

  const filtrados = filtro ? rows.filter((r) => pasaFiltro(filtro, r)) : rows;
  return {
    items: filtrados.slice(skip, skip + limit),
    total: filtrados.length,
    skip,
    limit,
    reglas: null,
  };
}

module.exports = { listarProgresoAlumnosAdmin, listarProgresoAlumnoAdmin, estadoConexion };
