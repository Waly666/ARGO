const jwt = require('jsonwebtoken');

const PURPOSE = 'cert_qr_verify';

function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET no configurado');
  return s;
}

/** Token permanente para QR impreso (vinculado al _id del certificado). */
function emitCertificadoQrToken(certId) {
  const sub = String(certId ?? '').trim();
  if (!sub) return '';
  return jwt.sign({ sub, purpose: PURPOSE }, jwtSecret());
}

function verifyCertificadoQrToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(String(token), jwtSecret());
    if (payload?.purpose !== PURPOSE) return null;
    const sub = String(payload?.sub ?? '').trim();
    return sub || null;
  } catch {
    return null;
  }
}

function codigoVerificacionCert(cert) {
  return String(cert?.codVerificacion || cert?.codigoCert || cert?._id || '').trim();
}

function normalizarCodigoVerificacion(raw) {
  try {
    return decodeURIComponent(String(raw ?? '').trim());
  } catch {
    return String(raw ?? '').trim();
  }
}

module.exports = {
  PURPOSE,
  emitCertificadoQrToken,
  verifyCertificadoQrToken,
  codigoVerificacionCert,
  normalizarCodigoVerificacion,
};
