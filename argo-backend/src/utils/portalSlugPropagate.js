/** Propaga cambios de slug del constructor del sitio en landing y HTML del portal. */

const { paginasDefault } = require('../constants/portalSiteDefaults');

const PORTAL_PAGINA_KEYS = Object.keys(paginasDefault());

function normalizePortalPath(path) {
  const raw = String(path ?? '').trim();
  if (!raw || raw === '/') return '/';
  const base = raw.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return base.startsWith('/') ? base || '/' : `/${base}`;
}

function normalizePortalPageSlug(raw) {
  return String(raw ?? '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function paginaDefaultRoute(key) {
  return paginasDefault()[key]?.ruta || '/';
}

function portalPageRoute(site, key) {
  if (key === 'home') return '/';
  const custom = site?.paginas?.[key]?.ruta?.trim();
  if (custom) {
    const seg = normalizePortalPageSlug(custom.replace(/^\//, ''));
    if (seg) return `/${seg}`;
  }
  return paginaDefaultRoute(key);
}

function detectPortalSlugChanges(beforeSite, afterSite) {
  const changes = [];
  for (const key of PORTAL_PAGINA_KEYS) {
    if (key === 'home') continue;
    const from = normalizePortalPath(portalPageRoute(beforeSite, key));
    const to = normalizePortalPath(portalPageRoute(afterSite, key));
    if (from !== to) changes.push({ paginaKey: key, from, to });
  }
  return changes;
}

function isExternalPortalUrl(raw) {
  const t = String(raw || '').trim();
  return (
    !t ||
    /^https?:\/\//i.test(t) ||
    /^mailto:/i.test(t) ||
    /^tel:/i.test(t) ||
    /^javascript:/i.test(t) ||
    t.startsWith('//')
  );
}

function rewritePortalInternalUrl(raw, rules) {
  const trimmed = String(raw ?? '');
  if (!trimmed.trim() || isExternalPortalUrl(trimmed)) {
    return { value: raw, changed: false, rule: null };
  }

  let pathPart = trimmed.trim();
  let suffix = '';
  const hashIdx = pathPart.indexOf('#');
  if (hashIdx >= 0) {
    suffix = pathPart.slice(hashIdx);
    pathPart = pathPart.slice(0, hashIdx);
  }
  const queryIdx = pathPart.indexOf('?');
  if (queryIdx >= 0) {
    suffix = pathPart.slice(queryIdx) + suffix;
    pathPart = pathPart.slice(0, queryIdx);
  }

  const pathNorm = normalizePortalPath(pathPart);
  for (const rule of rules) {
    const from = normalizePortalPath(rule.from);
    const to = normalizePortalPath(rule.to);
    if (!from || from === to) continue;
    if (pathNorm === from) {
      return { value: `${to}${suffix}`, changed: true, rule };
    }
    if (from !== '/' && pathNorm.startsWith(`${from}/`)) {
      return { value: `${to}${pathNorm.slice(from.length)}${suffix}`, changed: true, rule };
    }
  }
  return { value: raw, changed: false, rule: null };
}

function buildReplacementRules(changes) {
  const map = new Map();
  const add = (from, to) => {
    const f = normalizePortalPath(from);
    const t = normalizePortalPath(to);
    if (!f || f === t || map.has(f)) return;
    map.set(f, t);
  };

  for (const change of changes) {
    add(change.from, change.to);
    const legacy = normalizePortalPath(paginaDefaultRoute(change.paginaKey));
    if (legacy !== change.from && legacy !== change.to) add(legacy, change.to);
  }

  return [...map.entries()]
    .map(([from, to]) => ({ from, to }))
    .sort((a, b) => b.from.length - a.from.length);
}

class PropagationStats {
  constructor() {
    this.counts = new Map();
  }

  record(rule) {
    if (!rule) return;
    const id = `${rule.from}→${rule.to}`;
    const prev = this.counts.get(id);
    if (prev) prev.count += 1;
    else this.counts.set(id, { from: rule.from, to: rule.to, count: 1 });
  }

  total() {
    return [...this.counts.values()].reduce((n, d) => n + d.count, 0);
  }
}

function replaceStringValue(raw, rules, stats) {
  const { value, changed, rule } = rewritePortalInternalUrl(raw, rules);
  if (changed) stats.record(rule);
  return value;
}

function deepReplacePortalUrls(node, rules, stats) {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (typeof node[i] === 'string') {
        node[i] = replaceStringValue(node[i], rules, stats);
      } else {
        deepReplacePortalUrls(node[i], rules, stats);
      }
    }
    return;
  }
  if (typeof node === 'object') {
    for (const key of Object.keys(node)) {
      const val = node[key];
      if (typeof val === 'string') {
        node[key] = replaceStringValue(val, rules, stats);
      } else {
        deepReplacePortalUrls(val, rules, stats);
      }
    }
  }
}

function rewriteHtmlInternalLinks(html, rules, stats) {
  let out = String(html || '');
  for (const rule of rules) {
    if (!rule.from || rule.from === rule.to) continue;
    for (const attr of ['href', 'routerLink']) {
      for (const q of ['"', "'"]) {
        const fromEsc = rule.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(${attr}\\s*=\\s*${q})${fromEsc}(?=${q})`, 'gi');
        out = out.replace(re, (_m, prefix) => {
          stats.record(rule);
          return `${prefix}${rule.to}`;
        });
      }
    }
  }
  return out;
}

function propagatePortalSlugChanges({ landing, acercaDeHtml, changes }) {
  const rules = buildReplacementRules(changes || []);
  const stats = new PropagationStats();
  if (rules.length && landing) {
    deepReplacePortalUrls(landing, rules, stats);
  }
  let htmlOut = acercaDeHtml;
  if (htmlOut && rules.length) {
    htmlOut = rewriteHtmlInternalLinks(htmlOut, rules, stats);
  }
  return { landing, acercaDeHtml: htmlOut, totalReplacements: stats.total() };
}

module.exports = {
  detectPortalSlugChanges,
  propagatePortalSlugChanges,
  normalizePortalPath,
};
