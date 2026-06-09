const fs = require('fs');
const path = require('path');

function normRel(p) {
  return String(p || '').replace(/\\/g, '/').replace(/^\/+/, '');
}

/** Busca index.html en la raíz o en una subcarpeta (ZIP con carpeta contenedora). */
function detectarIndexHtml(absDir, preferred = 'index.html') {
  const pref = normRel(preferred) || 'index.html';
  const abs = path.resolve(absDir);
  if (!fs.existsSync(abs)) return pref;

  const direct = path.join(abs, pref);
  if (fs.existsSync(direct)) return pref;

  const baseName = path.basename(pref);
  const dirs = fs
    .readdirSync(abs, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== '__MACOSX');

  const hits = [];
  for (const ent of dirs) {
    const candidate = path.join(abs, ent.name, baseName);
    if (fs.existsSync(candidate)) {
      hits.push(`${ent.name}/${baseName}`);
    }
  }

  if (hits.length === 1) return hits[0];

  for (const ent of dirs) {
    const found = detectarIndexHtml(path.join(abs, ent.name), baseName);
    if (found === baseName) {
      return `${ent.name}/${baseName}`;
    }
    if (found.includes('/')) {
      return `${ent.name}/${found}`;
    }
  }

  return pref;
}

function raizContenido(absDir, indexHtmlRel) {
  const rel = normRel(indexHtmlRel);
  const abs = path.resolve(absDir);
  if (!rel.includes('/')) return abs;
  const sub = path.dirname(rel);
  return path.join(abs, sub);
}

function paqueteListo(absDir, indexHtmlRel) {
  const rel = normRel(indexHtmlRel);
  return fs.existsSync(path.join(path.resolve(absDir), rel));
}

module.exports = {
  detectarIndexHtml,
  raizContenido,
  paqueteListo,
  normRel,
};
