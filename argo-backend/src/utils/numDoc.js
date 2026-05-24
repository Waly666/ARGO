/**
 * numDoc en datosAlumnos y tablas relacionadas: Number (double en MongoDB).
 * Acepta entrada con puntos/espacios (ej. 1.017.204.030).
 */
function parseNumDoc(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const n = Math.trunc(value);
    return n > 0 ? n : null;
  }
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return null;
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (digits.length < 6 || digits.length > 11) return null;
  return n;
}

function numDocFromParams(param) {
  return parseNumDoc(param);
}

function numDocEquals(a, b) {
  const na = parseNumDoc(a);
  const nb = parseNumDoc(b);
  return na != null && nb != null && na === nb;
}

/** Para respuestas API / UI (sin notación científica) */
function numDocToString(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  const digits = String(value).replace(/\D/g, '');
  return digits || String(value).trim();
}

/** Filtro Mongoose (numDoc siempre Number tras normalización). */
function numDocQuery(value) {
  const n = parseNumDoc(value);
  if (n == null) return null;
  return { numDoc: n };
}

/**
 * Colección nativa: detecta numDoc legacy string hasta migrar a Number.
 */
function numDocQueryNativo(value) {
  const n = parseNumDoc(value);
  if (n == null) return null;
  const s = String(n);
  return {
    $or: [{ numDoc: n }, { numDoc: s }, { $expr: { $eq: [{ $toString: '$numDoc' }, s] } }],
  };
}

module.exports = {
  parseNumDoc,
  numDocFromParams,
  numDocEquals,
  numDocToString,
  numDocQuery,
  numDocQueryNativo,
};
