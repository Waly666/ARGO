/** Redirecciones 301 permanentes por cambios de slug del portal (SEO). */

const fs = require('fs');
const path = require('path');

const { paginasDefault } = require('../constants/portalSiteDefaults');

function paginaDefaultRoute(key) {
  return paginasDefault()[key]?.ruta || '/';
}
const { normalizePortalPath } = require('./portalSlugPropagate');

const REDIRECTS_DIR =
  process.env.PORTAL_REDIRECTS_DIR || path.join(__dirname, '../../../data/portal-redirects');
const REDIRECTS_FILE = path.join(REDIRECTS_DIR, 'slug-redirects.conf');

function normalizeRedirectPath(raw) {
  const p = normalizePortalPath(raw);
  return p === '/' ? '/' : p.replace(/\/+$/, '') || '/';
}

function slugRedirectKey(from, to) {
  return `${normalizeRedirectPath(from)}→${normalizeRedirectPath(to)}`;
}

/** Fusiona cambios de slug en el historial (encadena A→B + B→C ⇒ A→C). */
function mergeSlugRedirects(existing, changes) {
  const map = new Map();
  for (const item of existing || []) {
    const from = normalizeRedirectPath(item?.from);
    const to = normalizeRedirectPath(item?.to);
    if (!from || !to || from === to || from === '/') continue;
    map.set(from, to);
  }

  for (const change of changes || []) {
    const from = normalizeRedirectPath(change.from);
    const to = normalizeRedirectPath(change.to);
    if (!from || !to || from === to || from === '/') continue;

    for (const [oldFrom, oldTo] of [...map.entries()]) {
      if (oldTo === from) map.set(oldFrom, to);
    }
    map.set(from, to);
  }

  return [...map.entries()]
    .filter(([from, to]) => from !== to)
    .map(([from, to]) => ({ from, to }));
}

/** Añade rutas legacy por defecto además del cambio explícito (p. ej. /mercancias-peligrosas). */
function slugChangesToRedirectRules(changes) {
  const rules = [];
  const seen = new Set();
  const add = (from, to) => {
    const f = normalizeRedirectPath(from);
    const t = normalizeRedirectPath(to);
    if (!f || !t || f === t || f === '/') return;
    const id = slugRedirectKey(f, t);
    if (seen.has(id)) return;
    seen.add(id);
    rules.push({ from: f, to: t });
  };

  for (const change of changes || []) {
    add(change.from, change.to);
    if (change.paginaKey) {
      const legacy = normalizeRedirectPath(paginaDefaultRoute(change.paginaKey));
      if (legacy !== change.from && legacy !== change.to) add(legacy, change.to);
    }
  }
  return rules;
}

/** Elimina redirects cuyo origen ya es una ruta canónica activa. */
function pruneSlugRedirects(redirects, canonicalPaths) {
  const canon = new Set((canonicalPaths || []).map(normalizeRedirectPath));
  return (redirects || []).filter((r) => {
    const from = normalizeRedirectPath(r.from);
    return from && from !== '/' && !canon.has(from);
  });
}

function collectCanonicalPaths(site) {
  const paths = ['/'];
  if (!site?.paginas) return paths;
  for (const pg of Object.values(site.paginas)) {
    const r = normalizeRedirectPath(pg?.ruta || '/');
    if (r && r !== '/') paths.push(r);
  }
  return paths;
}

function nginxEscapeLocation(p) {
  return String(p).replace(/"/g, '\\"');
}

function buildNginxRedirectConf(redirects) {
  const lines = [
    '# Generado automáticamente por ARGO al publicar el sitio — no editar a mano.',
    '# Recarga nginx tras cambios (docker compose up -d --force-recreate argo-aula-virtual).',
    '',
  ];

  const sorted = [...(redirects || [])].sort(
    (a, b) => normalizeRedirectPath(b.from).length - normalizeRedirectPath(a.from).length,
  );

  for (const rule of sorted) {
    const from = normalizeRedirectPath(rule.from);
    const to = normalizeRedirectPath(rule.to);
    if (!from || !to || from === to || from === '/') continue;
    const fromPath = from.replace(/^\//, '');
    const toPath = to.startsWith('/') ? to : `/${to}`;
    lines.push(`location = /${fromPath} {`);
    lines.push(`    return 301 ${toPath};`);
    lines.push('}');
    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

function writePortalSlugRedirectsConf(redirects) {
  const content = buildNginxRedirectConf(redirects);
  fs.mkdirSync(REDIRECTS_DIR, { recursive: true });
  fs.writeFileSync(REDIRECTS_FILE, content, 'utf8');
  return REDIRECTS_FILE;
}

function readPortalSlugRedirectsConf() {
  try {
    return fs.readFileSync(REDIRECTS_FILE, 'utf8');
  } catch {
    return buildNginxRedirectConf([]);
  }
}

function applySlugRedirectChanges(site, slugChanges) {
  const existing = Array.isArray(site?.slugRedirects) ? site.slugRedirects : [];
  const newRules = slugChangesToRedirectRules(slugChanges);
  let merged = mergeSlugRedirects(existing, newRules);
  merged = pruneSlugRedirects(merged, collectCanonicalPaths(site));
  return merged;
}

async function syncPortalSlugRedirectsFromSite(site) {
  const redirects = pruneSlugRedirects(site?.slugRedirects || [], collectCanonicalPaths(site));
  writePortalSlugRedirectsConf(redirects);
  return redirects;
}

module.exports = {
  REDIRECTS_DIR,
  REDIRECTS_FILE,
  normalizeRedirectPath,
  mergeSlugRedirects,
  slugChangesToRedirectRules,
  pruneSlugRedirects,
  collectCanonicalPaths,
  buildNginxRedirectConf,
  writePortalSlugRedirectsConf,
  readPortalSlugRedirectsConf,
  applySlugRedirectChanges,
  syncPortalSlugRedirectsFromSite,
};
