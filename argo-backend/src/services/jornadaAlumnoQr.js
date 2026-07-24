const QRCode = require('qrcode');

const JORNADA_QR_PREFIX = 'ARGOJOR';

/**
 * Payload compatible con app móvil jornadas e impresión de etiquetas.
 * Formato: ARGOJOR|1|{numDoc}|{nombre}
 */
function buildJornadaAlumnoQrPayload(numDoc, nombre) {
  const doc = String(numDoc ?? '').replace(/\D/g, '');
  const nom = String(nombre || '')
    .trim()
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
  return `${JORNADA_QR_PREFIX}|1|${doc}|${nom}`;
}

function nombreDesdeAlumno(alumno) {
  if (!alumno) return '';
  return [alumno.apellido1, alumno.apellido2, alumno.nombre1, alumno.nombre2]
    .filter(Boolean)
    .join(' ')
    .trim();
}

async function generarQrJornadaPngBuffer(numDoc, nombre) {
  const payload = buildJornadaAlumnoQrPayload(numDoc, nombre);
  return QRCode.toBuffer(payload, {
    type: 'png',
    width: 360,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
}

module.exports = {
  JORNADA_QR_PREFIX,
  buildJornadaAlumnoQrPayload,
  nombreDesdeAlumno,
  generarQrJornadaPngBuffer,
};
