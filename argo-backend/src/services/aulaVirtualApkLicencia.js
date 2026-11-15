const ApkLicencia = require('../models/ApkLicencia');
const CapacitacionVirtualConfig = require('../models/CapacitacionVirtualConfig');
const { loginPortal } = require('./aulaVirtualAuth');
const { estadoInscripcionVirtual } = require('./aulaVirtualMatricula');

function modoDe(value) {
  return value === 'fecha' || value === 'plazo' ? value : 'libre';
}

async function emitirLicenciaApk(body = {}) {
  const storagePrefix = String(body.storagePrefix || '').trim();
  if (!storagePrefix) {
    const err = new Error('Falta el identificador del curso.');
    err.status = 400;
    throw err;
  }

  const session = await loginPortal({ email: body.email, password: body.password });
  const numDoc = session.usuario?.numDoc;
  if (!numDoc) {
    const err = new Error('No se pudo identificar al alumno.');
    err.status = 401;
    throw err;
  }

  const cfg = await CapacitacionVirtualConfig.findOne({ storagePrefix }).lean();
  if (!cfg) {
    const err = new Error('Este curso no está en el aula con el mismo prefijo. Sube el curso al programa antes de activar el APK.');
    err.status = 404;
    throw err;
  }

  let estado;
  try {
    estado = await estadoInscripcionVirtual(numDoc, cfg.idPrograma);
  } catch (e) {
    if (e.status === 404) {
      const err = new Error('El curso no está publicado en el aula.');
      err.status = 404;
      throw err;
    }
    throw e;
  }
  if (!estado.matriculado) {
    const err = new Error('Esta cuenta no está matriculada en el curso.');
    err.status = 403;
    throw err;
  }

  const modo = modoDe(cfg.apkAcceso);
  if (modo === 'libre') return { acceso: 'libre', modo };

  const previa = await ApkLicencia.findOne({ idPrograma: cfg.idPrograma, numDoc }).lean();
  if (previa) {
    if (new Date(previa.expiresAt).getTime() < Date.now()) {
      const err = new Error('El acceso de esta cuenta ya venció.');
      err.status = 403;
      throw err;
    }
    return { acceso: 'vigente', modo: previa.modo, expiresAt: previa.expiresAt };
  }

  let expiresAt = null;
  let modoGuardado = modo;
  if (modo === 'fecha') {
    expiresAt = cfg.apkExpiraEn ? new Date(cfg.apkExpiraEn) : null;
    if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
      const err = new Error('El curso no tiene fecha de caducidad.');
      err.status = 400;
      throw err;
    }
    if (expiresAt.getTime() < Date.now()) {
      const err = new Error('La fecha de este curso ya pasó.');
      err.status = 403;
      throw err;
    }
  } else {
    modoGuardado = 'plazo';
    const dias = Math.max(1, Math.floor(Number(cfg.apkDiasVigencia) || 30));
    expiresAt = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  }

  try {
    const doc = await ApkLicencia.create({
      idPrograma: cfg.idPrograma,
      numDoc,
      storagePrefix,
      modo: modoGuardado,
      expiresAt,
      issuedAt: new Date(),
    });
    return { acceso: 'vigente', modo: doc.modo, expiresAt: doc.expiresAt };
  } catch (e) {
    if (e && e.code === 11000) {
      const otra = await ApkLicencia.findOne({ idPrograma: cfg.idPrograma, numDoc }).lean();
      if (otra) return { acceso: 'vigente', modo: otra.modo, expiresAt: otra.expiresAt };
    }
    throw e;
  }
}

module.exports = { emitirLicenciaApk };
