/** Verificación de propiedad — Google Search Console (archivo HTML en la raíz del portal). */

const FILENAME_RE = /^google[a-z0-9]+\.html$/i;

function normalizarContenido(raw) {
  return String(raw || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function validarArchivoGoogleSearchConsole(filename, contentRaw) {
  const filenameNorm = String(filename || '').trim();
  if (!FILENAME_RE.test(filenameNorm)) {
    const err = new Error(
      'El archivo debe llamarse exactamente como Google lo entrega (ej. google6feae35a5c10ac77.html).',
    );
    err.status = 400;
    throw err;
  }

  const content = normalizarContenido(contentRaw);
  if (!content) {
    const err = new Error('El archivo HTML está vacío.');
    err.status = 400;
    throw err;
  }
  if (!/google-site-verification\s*:/i.test(content)) {
    const err = new Error('El archivo no contiene la meta de verificación de Google Search Console.');
    err.status = 400;
    throw err;
  }
  const esperado = `google-site-verification: ${filenameNorm}`;
  if (!content.toLowerCase().includes(esperado.toLowerCase())) {
    const err = new Error(`El contenido debe incluir la línea: ${esperado}`);
    err.status = 400;
    throw err;
  }
  if (content.length > 4096) {
    const err = new Error('El archivo de verificación es demasiado grande.');
    err.status = 400;
    throw err;
  }

  return {
    googleSearchConsoleFilename: filenameNorm,
    googleSearchConsoleContent: content,
  };
}

function urlPublicaVerificacion(filename) {
  const name = String(filename || '').trim();
  if (!name) return '';
  return `/${name}`;
}

module.exports = {
  validarArchivoGoogleSearchConsole,
  urlPublicaVerificacion,
  FILENAME_RE,
};
