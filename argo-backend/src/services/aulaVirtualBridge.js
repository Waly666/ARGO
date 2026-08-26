const fs = require('fs');
const path = require('path');
const { raizContenido } = require('./aulaVirtualPaquete');

const BRIDGE_MARKER = 'argo-bridge.js';
const META_PREFIX_MARKER = 'argo-storage-prefix';
const META_FINAL_MODE = 'argo-final-nota-mode';
const META_CLASS_SLOTS = 'argo-class-slots';

function bridgeScriptUrl() {
  /** Ruta relativa: funciona en localhost, LAN o producción (mismo host que sirve /uploads). */
  return '/api/aula-virtual/argo-bridge.js';
}

function listarHtmlPaquete(absDir) {
  const out = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name.startsWith('.') || ent.name === 'node_modules') continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (/\.html?$/i.test(ent.name)) out.push(full);
    }
  }
  walk(absDir);
  return out;
}

function buscarCursoAppJs(contentRoot) {
  const direct = path.join(contentRoot, 'curso-app.js');
  if (fs.existsSync(direct)) return direct;

  const queue = [contentRoot];
  while (queue.length) {
    const dir = queue.shift();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_e) {
      continue;
    }
    for (const ent of entries) {
      if (ent.name.startsWith('.') || ent.name === 'node_modules') continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) queue.push(full);
      else if (ent.name === 'curso-app.js') return full;
    }
  }
  return null;
}

/** Metadatos ARGO leídos de curso-app.js (STORAGE_PREFIX, clases, modo nota final). */
function detectarCursoAppMeta(absDir, indexHtml = 'index.html') {
  const contentRoot = raizContenido(absDir, indexHtml);
  const appJs = buscarCursoAppJs(contentRoot);
  if (!appJs) {
    return { storagePrefix: null, classSlots: null, finalNotaMode: null };
  }
  try {
    const src = fs.readFileSync(appJs, 'utf8');
    const prefixMatch = src.match(/(?:const|let|var)\s+STORAGE_PREFIX\s*=\s*["']([^"']+)["']/);
    const classKeysMatch = src.match(/CLASS_KEYS\s*=\s*\[([^\]]+)\]/);
    let classSlots = null;
    if (classKeysMatch) {
      const keys = classKeysMatch[1].match(/["'][^"']+["']/g);
      classSlots = keys ? keys.length : null;
    }
    const finalPercent =
      /argo-final-nota-mode["'],\s*["']percent["']/.test(src) ||
      /nota que se registra es el\s*\*\*porcentaje/i.test(src) ||
      /nota que va al aula virtual se calcula por %/i.test(src);
    return {
      storagePrefix: prefixMatch ? prefixMatch[1].trim() : null,
      classSlots,
      finalNotaMode: finalPercent ? 'percent' : null,
    };
  } catch (_e) {
    return { storagePrefix: null, classSlots: null, finalNotaMode: null };
  }
}

/** Lee STORAGE_PREFIX de curso-app.js (p. ej. curso-licencia-conduccion). */
function detectarStoragePrefix(absDir, indexHtml = 'index.html') {
  return detectarCursoAppMeta(absDir, indexHtml).storagePrefix;
}

function escAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function upsertMeta(html, name, content) {
  if (content == null || content === '') return html;
  const meta = `<meta name="${name}" content="${escAttr(content)}">`;
  const re = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*>`, 'i');
  if (re.test(html)) return html.replace(re, meta);
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, `$&\n  ${meta}`);
  }
  return `${meta}\n${html}`;
}

function inyectarMetaArgoEnHtml(html, meta = {}) {
  let out = html;
  out = upsertMeta(out, META_PREFIX_MARKER, meta.storagePrefix);
  out = upsertMeta(out, META_FINAL_MODE, meta.finalNotaMode);
  out = upsertMeta(
    out,
    META_CLASS_SLOTS,
    meta.classSlots != null ? String(meta.classSlots) : null,
  );
  return out;
}

function inyectarMetaPrefixEnHtml(html, storagePrefix) {
  return inyectarMetaArgoEnHtml(html, { storagePrefix });
}

function inyectarScriptEnHtml(html, scriptTag) {
  if (html.includes(BRIDGE_MARKER) && html.includes(bridgeScriptUrl())) return html;

  const cursoAppRe = /<script[^>]+src=["'][^"']*curso-app\.js[^"']*["'][^>]*>\s*<\/script>/i;
  if (cursoAppRe.test(html)) {
    return html.replace(cursoAppRe, `${scriptTag}\n  $&`);
  }

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `  ${scriptTag}\n</body>`);
  }
  if (/<\/html>/i.test(html)) {
    return html.replace(/<\/html>/i, `${scriptTag}\n</html>`);
  }
  return `${html}\n${scriptTag}\n`;
}

function normalizarBridgeEnHtml(html) {
  let out = html.replace(/<script[^>]*argo-bridge\.js[^>]*>\s*<\/script>\s*/gi, '');
  const scriptTag = `<script src="${bridgeScriptUrl()}"></script>`;
  if (!out.includes(bridgeScriptUrl())) {
    out = inyectarScriptEnHtml(out, scriptTag);
  }
  return out;
}

function inyectarBridgeEnArchivo(filePath, meta = null) {
  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;
  let changed = false;

  if (meta) {
    const withMeta = inyectarMetaArgoEnHtml(html, meta);
    if (withMeta !== html) {
      html = withMeta;
      changed = true;
    }
  }

  const withBridge = normalizarBridgeEnHtml(html);
  if (withBridge !== html) {
    html = withBridge;
    changed = true;
  }

  if (changed) fs.writeFileSync(filePath, html, 'utf8');
  return changed;
}

/** Inyecta argo-bridge.js y meta ARGO en todos los HTML del paquete. */
function inyectarBridgeEnPaquete(absDir, indexHtml = 'index.html') {
  const contentRoot = raizContenido(absDir, indexHtml);
  const files = listarHtmlPaquete(contentRoot);
  const meta = detectarCursoAppMeta(absDir, indexHtml);
  if (!files.length) {
    return { inyectados: 0, total: 0, storagePrefix: meta.storagePrefix, meta };
  }

  let inyectados = 0;
  for (const f of files) {
    if (inyectarBridgeEnArchivo(f, meta)) inyectados++;
  }
  return {
    inyectados,
    total: files.length,
    storagePrefix: meta.storagePrefix,
    meta,
  };
}

module.exports = {
  inyectarBridgeEnPaquete,
  inyectarBridgeEnArchivo,
  bridgeScriptUrl,
  listarHtmlPaquete,
  detectarStoragePrefix,
  detectarCursoAppMeta,
  inyectarMetaArgoEnHtml,
};
