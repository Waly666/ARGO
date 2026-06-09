const fs = require('fs');
const path = require('path');
const { raizContenido } = require('./aulaVirtualPaquete');

const BRIDGE_MARKER = 'argo-bridge.js';

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

function inyectarScriptEnHtml(html, scriptTag) {
  if (html.includes(BRIDGE_MARKER)) return html;

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

function inyectarBridgeEnArchivo(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes(BRIDGE_MARKER) && html.includes("src=\"/api/aula-virtual/argo-bridge.js\"")) {
    return false;
  }
  if (html.includes(BRIDGE_MARKER)) {
    html = html.replace(/<script[^>]*argo-bridge\.js[^>]*>\s*<\/script>\s*/gi, '');
  }
  const scriptTag = `<script src="${bridgeScriptUrl()}"></script>`;
  html = inyectarScriptEnHtml(html, scriptTag);
  fs.writeFileSync(filePath, html, 'utf8');
  return true;
}

/** Inyecta argo-bridge.js en todos los HTML del paquete (index, clases, evaluación, etc.). */
function inyectarBridgeEnPaquete(absDir, indexHtml = 'index.html') {
  const contentRoot = raizContenido(absDir, indexHtml);
  const files = listarHtmlPaquete(contentRoot);
  if (!files.length) return { inyectados: 0, total: 0 };

  let inyectados = 0;
  for (const f of files) {
    if (inyectarBridgeEnArchivo(f)) inyectados++;
  }
  return { inyectados, total: files.length };
}

module.exports = { inyectarBridgeEnPaquete, inyectarBridgeEnArchivo, bridgeScriptUrl, listarHtmlPaquete };
