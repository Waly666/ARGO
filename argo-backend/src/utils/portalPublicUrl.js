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

/** ERP/API local (pnpm); portal aula :4202. */
const PUERTOS_ERP_DEV = new Set(['3000', '4200', '4201']);
/** Docker VPS: ERP :8083, sitio :8084, API :5002 → portal aula :8085 (verificar-certificado). */
const PUERTOS_ERP_DOCKER = new Set(['8083', '8084', '5002']);

/**
 * En local/LAN o IP:puerto del VPS, enlaces del portal no deben apuntar al ERP (:4200 / :8083).
 */
function mapearDevErpAlPortalPublico(urlBase) {
  const s = normalizarUrlBase(urlBase);
  if (!s) return '';
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    const port = u.port;

    if (PUERTOS_ERP_DEV.has(port)) {
      return `${u.protocol}//${host}:4202`;
    }

    if (PUERTOS_ERP_DOCKER.has(port)) {
      return `${u.protocol}//${host}:8085`;
    }

    if ((host === 'localhost' || host === '127.0.0.1') && !port) {
      return `${u.protocol}//${host}:4202`;
    }

    if (/^app\./i.test(host)) {
      const portalHost = host.replace(/^app\./i, '');
      const portPart = port && !['80', '443'].includes(port) ? `:${port}` : '';
      return `${u.protocol}//${portalHost}${portPart}`;
    }
  } catch {
    return s;
  }
  return s;
}

function portalExplicitoDesdeEnv(portalBaseUrl) {
  const candidates = [
    portalBaseUrl,
    process.env.PORTAL_SITE_URL,
    process.env.AULA_VIRTUAL_PUBLIC_URL,
    process.env.AULA_VIRTUAL_PORTAL_URL,
    process.env.PORTAL_AULA_URL,
    process.env.PORTAL_PUBLIC_URL,
  ];
  for (const raw of candidates) {
    const s = normalizarUrlBase(raw);
    if (s) return s;
  }
  return '';
}

/** Portal aula desde CORS_ORIGIN: excluye app.*; prefiere dominio HTTPS sin puerto, luego :8085 / :4202. */
function portalDesdeCorsOrigin() {
  const raw = String(process.env.CORS_ORIGIN || '').trim();
  if (!raw) return '';
  const origins = raw.split(',').map((s) => normalizarUrlBase(s)).filter(Boolean);
  if (!origins.length) return '';

  const sinErp = origins.filter((o) => !/^https?:\/\/app\./i.test(o));
  const pool = sinErp.length ? sinErp : origins;

  const dominioPublico = pool.find((o) => {
    try {
      const u = new URL(o);
      if (u.port) return false;
      return u.protocol === 'https:' && !/^app\./i.test(u.hostname);
    } catch {
      return false;
    }
  });
  if (dominioPublico) return dominioPublico;

  const aula8085 = pool.find((o) => /:8085(\/|$)/.test(o));
  if (aula8085) return aula8085;

  const aula4202 = pool.find((o) => /:4202(\/|$)/.test(o));
  if (aula4202) return aula4202;

  const sinWww = pool.find((o) => !/^https?:\/\/www\./i.test(o));
  const pick = sinWww || pool[0];
  return mapearDevErpAlPortalPublico(pick);
}

function resolverBasePortal({ portalBaseUrl, origin } = {}) {
  const explicit = portalExplicitoDesdeEnv(portalBaseUrl);
  if (explicit) return explicit;

  const fromCors = portalDesdeCorsOrigin();
  if (fromCors) return fromCors;

  const fromOrigin = normalizarUrlBase(origin);
  if (fromOrigin) return mapearDevErpAlPortalPublico(fromOrigin);

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:4202';
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
  mapearDevErpAlPortalPublico,
};
