const jwt = require('jsonwebtoken');

const PURPOSE = 'cert_consulta_dl';
const TTL = process.env.CERT_CONSULTA_DL_TTL || '20m';

function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET no configurado');
  return s;
}

/** Token de corta duración para descargar PDF tras consulta pública (Turnstile ya validado). */
function emitConsultaDescargaToken(numDoc) {
  const sub = String(numDoc ?? '').trim();
  if (!sub) return '';
  return jwt.sign({ sub, purpose: PURPOSE }, jwtSecret(), { expiresIn: TTL });
}

function verifyConsultaDescargaToken(token, numDoc) {
  const expected = String(numDoc ?? '').trim();
  if (!token || !expected) return false;
  try {
    const payload = jwt.verify(String(token), jwtSecret());
    return payload?.purpose === PURPOSE && String(payload?.sub) === expected;
  } catch {
    return false;
  }
}

module.exports = {
  emitConsultaDescargaToken,
  verifyConsultaDescargaToken,
};
