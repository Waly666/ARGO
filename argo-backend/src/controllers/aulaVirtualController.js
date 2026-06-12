const {
  listarCursosVirtuales,
  obtenerCursoVirtual,
} = require('../services/aulaVirtualCatalogo');
const { listarCategorias } = require('../services/aulaVirtualCategorias');
const { obtenerConfigPortalPublica } = require('../services/aulaVirtualPortal');
const { registrarPortal, loginPortal, buscarAlumnoRegistro } = require('../services/aulaVirtualAuth');
const {
  solicitarRegistroPortal,
  confirmarRegistroPortal,
  reenviarCodigoRegistro,
} = require('../services/portalRegistroVerificacion');
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
  consultarCertificadosPublico,
  htmlCertificadoPortal,
} = require('../services/aulaVirtualCertificados');
const { htmlReciboPortal } = require('../services/aulaVirtualRecibos');
const { enviarContactoPortal } = require('../services/aulaVirtualContacto');
const { generarSitemapXml } = require('../services/aulaVirtualSitemap');
const { publicOriginFromReq } = require('../utils/publicOrigin');
const { portalRegistroAbierto, turnstileSiteKey, turnstileEnabled, portalEmailVerifyEnabled } = require('../config/security');
const { logAuthIntento } = require('../services/authSecurityLog');
const path = require('path');
const { models } = require('../models/catalogos');
const catalogoController = require('./catalogoController');

exports.configPublica = async (_req, res, next) => {
  try {
    const cfg = await obtenerConfigPortalPublica();
    res.json({
      ...cfg,
      registroAbierto: portalRegistroAbierto(),
      emailVerificacionRegistro: portalEmailVerifyEnabled(),
      turnstileSiteKey: turnstileEnabled() ? turnstileSiteKey() : '',
    });
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
    if (!portalRegistroAbierto()) {
      return res.status(403).json({ message: 'El registro en línea está temporalmente cerrado.' });
    }
    const { email, password, turnstileToken: _t, ...alumno } = req.body || {};
    const out = await registrarPortal({ email, password, alumno });
    res.status(201).json(out);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.registroSolicitar = async (req, res, next) => {
  try {
    if (!portalRegistroAbierto()) {
      return res.status(403).json({ message: 'El registro en línea está temporalmente cerrado.' });
    }
    if (!portalEmailVerifyEnabled()) {
      return res.status(400).json({
        message: 'La verificación por correo no está activa. Use el registro directo.',
      });
    }
    const cfg = await obtenerConfigPortalPublica();
    const { email, password, turnstileToken: _t, ...alumno } = req.body || {};
    const out = await solicitarRegistroPortal({
      email,
      password,
      alumno,
      nombreCea: cfg.nombreCea,
    });
    res.status(202).json(out);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.registroConfirmar = async (req, res, next) => {
  try {
    if (!portalRegistroAbierto()) {
      return res.status(403).json({ message: 'El registro en línea está temporalmente cerrado.' });
    }
    const { pendingId, codigo } = req.body || {};
    const out = await confirmarRegistroPortal({ pendingId, codigo });
    res.status(201).json(out);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.registroReenviarCodigo = async (req, res, next) => {
  try {
    if (!portalRegistroAbierto()) {
      return res.status(403).json({ message: 'El registro en línea está temporalmente cerrado.' });
    }
    const cfg = await obtenerConfigPortalPublica();
    const { pendingId } = req.body || {};
    const out = await reenviarCodigoRegistro({ pendingId, nombreCea: cfg.nombreCea });
    res.json(out);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const out = await loginPortal({ email, password });
    logAuthIntento({ req, canal: 'portal', identificador: email, ok: true });
    res.json(out);
  } catch (e) {
    if (e.status) {
      logAuthIntento({
        req,
        canal: 'portal',
        identificador: req.body?.email,
        ok: false,
        motivo: e.message,
      });
      return res.status(e.status).json({ message: e.message });
    }
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

exports.consultarCertificados = async (req, res, next) => {
  try {
    res.json(await consultarCertificadosPublico(req.query.numDoc));
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

exports.catalogosTiposDoc = async (_req, res, next) => {
  try {
    const data = await models.catTipoDoc.find().sort({ idTipoDoc: 1 }).lean();
    res.json(data);
  } catch (e) {
    next(e);
  }
};

exports.catalogosGeneros = async (_req, res, next) => {
  try {
    const data = await models.genero.find().sort({ idGenero: 1 }).lean();
    res.json(data);
  } catch (e) {
    next(e);
  }
};

exports.catalogosDepartamentos = catalogoController.departamentos;
exports.catalogosMunicipios = catalogoController.municipios;
exports.catalogosBuscarMunicipios = catalogoController.buscarMunicipios;
exports.catalogosMunicipio = catalogoController.municipioPorCodigo;

exports.enviarContacto = async (req, res, next) => {
  try {
    const result = await enviarContactoPortal(req.body);
    res.json(result);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.sitemapXml = async (req, res, next) => {
  try {
    const xml = await generarSitemapXml(req);
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (e) {
    next(e);
  }
};
