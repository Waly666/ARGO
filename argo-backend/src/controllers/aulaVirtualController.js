const {
  listarCursosVirtuales,
  obtenerCursoVirtual,
} = require('../services/aulaVirtualCatalogo');
const { listarCategorias } = require('../services/aulaVirtualCategorias');
const { obtenerConfigPortalPublica } = require('../services/aulaVirtualPortal');
const { registrarPortal, loginPortal, buscarAlumnoRegistro } = require('../services/aulaVirtualAuth');
const {
  listarMisCursos,
  reportarProgreso,
  evaluarAprobacion,
  verificarAccesoCurso,
  mapProgresoRespuesta,
} = require('../services/aulaVirtualProgreso');
const {
  matricularVirtual,
  estadoInscripcionVirtual,
} = require('../services/aulaVirtualMatricula');
const {
  listarMisCertificados,
  htmlCertificadoPortal,
} = require('../services/aulaVirtualCertificados');
const { htmlReciboPortal } = require('../services/aulaVirtualRecibos');
const { publicOriginFromReq } = require('../utils/publicOrigin');
const path = require('path');

exports.configPublica = async (_req, res, next) => {
  try {
    res.json(await obtenerConfigPortalPublica());
  } catch (e) {
    next(e);
  }
};

exports.listarCategorias = async (_req, res, next) => {
  try {
    res.json(await listarCategorias({ soloActivas: true }));
  } catch (e) {
    next(e);
  }
};

exports.listarCursos = async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const idCategoria = req.query.idCategoria ?? req.query.categoria ?? null;
    const rows = await listarCursosVirtuales({ soloPublicados: true, q, idCategoria });
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

exports.obtenerCurso = async (req, res, next) => {
  try {
    const curso = await obtenerCursoVirtual(req.params.id, { requierePublicado: true });
    if (!curso) return res.status(404).json({ message: 'Curso no encontrado o no publicado' });
    res.json(curso);
  } catch (e) {
    next(e);
  }
};

exports.buscarAlumnoRegistro = async (req, res, next) => {
  try {
    const numDoc = req.query.numDoc ?? req.params.numDoc;
    res.json(await buscarAlumnoRegistro(numDoc));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.registro = async (req, res, next) => {
  try {
    const { email, password, ...alumno } = req.body || {};
    const out = await registrarPortal({ email, password, alumno });
    res.status(201).json(out);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const out = await loginPortal({ email, password });
    res.json(out);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.miPerfil = async (req, res, next) => {
  try {
    res.json({ usuario: req.portalUser });
  } catch (e) {
    next(e);
  }
};

exports.bridgeScript = (_req, res, next) => {
  try {
    const file = path.join(__dirname, '..', 'public', 'aula-virtual', 'argo-bridge.js');
    res.type('application/javascript');
    res.sendFile(file);
  } catch (e) {
    next(e);
  }
};

exports.misCursos = async (req, res, next) => {
  try {
    const rows = await listarMisCursos(req.portalUser.numDoc);
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

exports.obtenerProgreso = async (req, res, next) => {
  try {
    await verificarAccesoCurso(req.portalUser.numDoc, req.params.id);
    const estado = await evaluarAprobacion(req.portalUser.numDoc, req.params.id);
    res.json(mapProgresoRespuesta(null, estado));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.reportarProgreso = async (req, res, next) => {
  try {
    const out = await reportarProgreso(req.portalUser.numDoc, req.params.id, req.body || {});
    res.json(out);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.estadoInscripcion = async (req, res, next) => {
  try {
    res.json(await estadoInscripcionVirtual(req.portalUser.numDoc, req.params.id));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.matricularCurso = async (req, res, next) => {
  try {
    const out = await matricularVirtual({
      numDoc: req.portalUser.numDoc,
      idPrograma: req.params.id,
    });
    res.status(out.yaMatriculado ? 200 : 201).json(out);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.misCertificados = async (req, res, next) => {
  try {
    const rows = await listarMisCertificados(req.portalUser.numDoc);
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

exports.certificadoHtml = async (req, res, next) => {
  try {
    const html = await htmlCertificadoPortal(
      req.portalUser.numDoc,
      req.params.id,
      publicOriginFromReq(req),
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    if (e.status) return res.status(e.status).send(e.message);
    next(e);
  }
};

exports.reciboHtml = async (req, res, next) => {
  try {
    const html = await htmlReciboPortal(req.portalUser.numDoc, req.params.id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    if (e.status) return res.status(e.status).send(e.message);
    next(e);
  }
};
