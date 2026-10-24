const JornadaCap = require('../models/JornadaCap');
const { obtenerConfigRecibo } = require('./configRecibo');
const { obtenerConfigCertificado } = require('./configCertificado');
const { normalizarIdSede } = require('./sedeContext');

/** Ciudad impresa en el pie del certificado (casilla layout «ciudad»). */
async function ciudadExpedicionJornada(idJornada) {
  if (!idJornada) return '';
  const j = await JornadaCap.findById(idJornada, { municipio: 1 }).lean();
  return String(j?.municipio || '').trim();
}

/** Ciudad de la empresa / sede (certificados normales y virtual). */
async function ciudadExpedicionEmpresa(idSede, configCertificado) {
  const sid = normalizarIdSede(idSede);
  const recibo = await obtenerConfigRecibo(sid || null);
  let ciudad = String(recibo?.ciudad || '').trim();
  if (!ciudad) {
    const cfg = configCertificado || (await obtenerConfigCertificado());
    ciudad = String(cfg?.ciudad || '').trim();
  }
  return ciudad;
}

/**
 * Al emitir: jornada → municipio de la jornada; si no, ciudad institucional (recibo/sede/config).
 */
async function resolverCiudadExpedicion({ idJornada, idSede, configCertificado } = {}) {
  if (idJornada) {
    const deJornada = await ciudadExpedicionJornada(idJornada);
    if (deJornada) return deJornada;
  }
  return ciudadExpedicionEmpresa(idSede, configCertificado);
}

/** Al imprimir: valor congelado en el certificado; fallback config global (históricos). */
function ciudadExpedicionParaRender(certificado, config) {
  return (
    String(certificado?.ciudadExpedicion || certificado?.ciudad || '').trim() ||
    String(config?.ciudad || '').trim()
  );
}

module.exports = {
  ciudadExpedicionJornada,
  ciudadExpedicionEmpresa,
  resolverCiudadExpedicion,
  ciudadExpedicionParaRender,
};
