const { turnstileEnabled } = require('../config/security');
const { verifyConsultaDescargaToken } = require('../services/certificadoConsultaToken');
const { isClienteNativo } = require('./turnstile');

/** Descarga de PDF tras consulta: acepta token emitido en la consulta (Turnstile ya validado). */
function requireConsultaDescargaToken(req, res, next) {
  if (!turnstileEnabled()) return next();
  if (isClienteNativo(req)) return next();

  const numDoc = req.query?.numDoc;
  const token = req.query?.descargaToken;
  if (verifyConsultaDescargaToken(token, numDoc)) return next();

  return res.status(403).json({
    message: 'Sesión de descarga expirada. Consulte de nuevo e intente descargar.',
  });
}

module.exports = { requireConsultaDescargaToken };
