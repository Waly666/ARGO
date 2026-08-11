/**
 * Base URL pública del portal aula (sin barra final).
 * Prioridad: body.portalBaseUrl → env → Origin del request.
 */
function resolverBasePortal({ portalBaseUrl, origin } = {}) {
  const candidates = [
    portalBaseUrl,
    process.env.PORTAL_SITE_URL,
    process.env.AULA_VIRTUAL_PUBLIC_URL,
    process.env.AULA_VIRTUAL_PORTAL_URL,
    process.env.PORTAL_AULA_URL,
    process.env.PORTAL_PUBLIC_URL,
    origin,
  ];
  for (const raw of candidates) {
    const s = String(raw || '')
      .trim()
      .replace(/\/+$/, '');
    if (!s) continue;
    if (!/^https?:\/\//i.test(s)) continue;
    return s;
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
