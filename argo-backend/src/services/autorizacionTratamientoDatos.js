const DatosAlumno = require('../models/DatosAlumno');
const { numDocQuery, parseNumDoc } = require('../utils/numDoc');
const {
  AUTORIZACION_DATOS_VERSION,
  AUTORIZACION_DATOS_TITULO,
  AUTORIZACION_DATOS_TEXTO,
} = require('../constants/autorizacionTratamientoDatos');

function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function textoLegalPublico() {
  return {
    version: AUTORIZACION_DATOS_VERSION,
    titulo: AUTORIZACION_DATOS_TITULO,
    texto: AUTORIZACION_DATOS_TEXTO,
  };
}

/** Exige checkbox marcado en solicitudes de registro web. */
function exigirAutorizacionDatos(body) {
  if (body?.autorizacionDatos !== true) {
    throw httpError(
      'Debe aceptar la autorización de tratamiento de datos personales para continuar.',
    );
  }
  const version = String(body?.autorizacionDatosVersion || '').trim();
  if (version && version !== AUTORIZACION_DATOS_VERSION) {
    throw httpError(
      'El texto de autorización de datos fue actualizado. Recargue la página e intente de nuevo.',
    );
  }
}

function snapshotConsentimiento(canal) {
  return {
    version: AUTORIZACION_DATOS_VERSION,
    canal: String(canal || '').trim(),
    aceptadoEn: new Date(),
  };
}

function camposConsentimientoAlumno(canal) {
  const now = new Date();
  return {
    autorizacionDatos: true,
    autorizacionDatosFecha: now,
    autorizacionDatosVersion: AUTORIZACION_DATOS_VERSION,
    autorizacionDatosCanal: String(canal || '').trim(),
  };
}

async function registrarConsentimientoAlumno(numDocRaw, canal) {
  const numDoc = parseNumDoc(numDocRaw);
  if (numDoc == null) return;
  await DatosAlumno.updateOne(numDocQuery(numDoc), {
    $set: camposConsentimientoAlumno(canal),
  });
}

module.exports = {
  textoLegalPublico,
  exigirAutorizacionDatos,
  snapshotConsentimiento,
  camposConsentimientoAlumno,
  registrarConsentimientoAlumno,
};
