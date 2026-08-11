/**
 * Base URL pública del portal aula (sin barra final).
 * Prioridad: body.portalBaseUrl → env → CORS_ORIGIN (sin app.*) → Origin del request.
 */
function normalizarUrlBase(raw) {
  const s = String(raw || '')
    .trim()
    .replace(/\/+$/, '');
  if (!s || !/^https?:\/\//i.test(s)) return '';
  return s;
}

/** Portal aula desde CORS_ORIGIN: excluye subdominio app.* (ERP). */
function portalDesdeCorsOrigin() {
  const raw = String(process.env.CORS_ORIGIN || '').trim();
  if (!raw) return '';
  const origins = raw.split(',').map((s) => normalizarUrlBase(s)).filter(Boolean);
  if (!origins.length) return '';

  const sinErp = origins.filter((o) => !/^https?:\/\/app\./i.test(o));
  const pool = sinErp.length ? sinErp : origins;
  const sinWww = pool.find((o) => !/^https?:\/\/www\./i.test(o));
  return sinWww || pool[0];
}

function resolverBasePortal({ portalBaseUrl, origin } = {}) {
  const candidates = [
    portalBaseUrl,
    process.env.PORTAL_SITE_URL,
    process.env.AULA_VIRTUAL_PUBLIC_URL,
    process.env.AULA_VIRTUAL_PORTAL_URL,
    process.env.PORTAL_AULA_URL,
    process.env.PORTAL_PUBLIC_URL,
    portalDesdeCorsOrigin(),
    origin,
  ];
  for (const raw of candidates) {
    const s = normalizarUrlBase(raw);
    if (s) return s;
  }
  return '';
}

function buildActivacionUrl(base, path, { pendingId, codigo, linkToken }) {
  if (!base) return '';
  const u = new URL(path.startsWith('/') ? path : `/${path}`, `${base}/`);
  if (pendingId) u.searchParams.set('pendingId', pendingId);
  if (linkToken) u.searchParams.set('t', linkToken);
  else if (codigo) u.searchParams.set('codigo', codigo);
  return u.toString();
}

module.exports = {
  resolverBasePortal,
  buildActivacionUrl,
};
