const fs = require('fs');
const path = require('path');

const { resolvePath } = require('../middleware/upload');

/** Sufijo estable del archivo (nombre original sanitizado) sin prefijo timestamp_random_. */
function galeriaFotoSuffix(url) {
  const leaf = path.basename(String(url || '').trim());
  const m = leaf.match(/^\d+_\d+_(.+)$/);
  return m ? m[1] : leaf;
}

function galeriaFotoRelPath(url) {
  let rel = String(url || '').trim();
  if (!rel) return '';
  rel = rel.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
  return rel;
}

function galeriaFotoExisteEnDisco(url) {
  const rel = galeriaFotoRelPath(url);
  if (!rel) return false;
  const p = resolvePath(rel);
  return Boolean(p && fs.existsSync(p));
}

function timestampDesdeNombre(url) {
  const leaf = path.basename(String(url || ''));
  const m = leaf.match(/^(\d+)_/);
  return m ? Number(m[1]) : 0;
}

/** Entre dos entradas del mismo archivo, conserva la que exista en disco o la más reciente. */
function prefiereGaleriaFoto(a, b) {
  const aOk = galeriaFotoExisteEnDisco(a.url);
  const bOk = galeriaFotoExisteEnDisco(b.url);
  if (aOk !== bOk) return aOk;

  const aTs = timestampDesdeNombre(a.url);
  const bTs = timestampDesdeNombre(b.url);
  if (aTs !== bTs) return aTs > bTs;

  return Number(a.orden) > Number(b.orden);
}

/**
 * Quita duplicados (misma foto importada dos veces) y entradas cuyo archivo no está en uploads.
 */
function sanearGaleriaFotos(fotos, { soloExistentes = true } = {}) {
  const lista = Array.isArray(fotos) ? fotos.filter(Boolean) : [];
  const bySuffix = new Map();

  for (const foto of lista) {
    const key = galeriaFotoSuffix(foto.url);
    const prev = bySuffix.get(key);
    if (!prev || prefiereGaleriaFoto(foto, prev)) {
      bySuffix.set(key, foto);
    }
  }

  let out = Array.from(bySuffix.values());
  if (soloExistentes) {
    out = out.filter((f) => galeriaFotoExisteEnDisco(f.url));
  }
  return out.sort((a, b) => Number(a.orden) - Number(b.orden));
}

module.exports = {
  galeriaFotoSuffix,
  galeriaFotoExisteEnDisco,
  sanearGaleriaFotos,
};
