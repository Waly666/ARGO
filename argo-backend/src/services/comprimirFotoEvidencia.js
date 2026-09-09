const fs = require('fs');
const path = require('path');

const MAX_LADO = 1600;
const JPEG_QUALITY = 72;

/**
 * Convierte una foto de evidencia a JPEG reducido (máx. 1600 px).
 * Sustituye el archivo original (p. ej. PNG de cámara) por .jpg.
 * @returns {string} ruta absoluta del JPEG
 */
async function comprimirArchivoAJpeg(absPath) {
  const src = String(absPath || '').trim();
  if (!src || !fs.existsSync(src)) return src;

  const dir = path.dirname(src);
  const stem = path.basename(src, path.extname(src)) || 'foto';
  const dest = path.join(dir, `${stem}.jpg`);
  const tmp = path.join(dir, `${stem}.${Date.now()}.tmp.jpg`);

  try {
    const sharp = require('sharp');
    await sharp(src)
      .rotate()
      .resize({
        width: MAX_LADO,
        height: MAX_LADO,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY, chromaSubsampling: '4:2:0' })
      .toFile(tmp);

    if (path.resolve(src) !== path.resolve(dest) && fs.existsSync(src)) {
      fs.unlinkSync(src);
    }
    if (fs.existsSync(dest) && path.resolve(dest) !== path.resolve(tmp)) {
      fs.unlinkSync(dest);
    }
    fs.renameSync(tmp, dest);
    return dest;
  } catch {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
    return src;
  }
}

/** JPEG en memoria para el ZIP (fotos ya guardadas, incluso PNG grandes). */
async function jpegBufferDesdeArchivo(absPath) {
  const src = String(absPath || '').trim();
  if (!src || !fs.existsSync(src)) return null;
  try {
    const sharp = require('sharp');
    return await sharp(src)
      .rotate()
      .resize({
        width: MAX_LADO,
        height: MAX_LADO,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY, chromaSubsampling: '4:2:0' })
      .toBuffer();
  } catch {
    return null;
  }
}

module.exports = {
  MAX_LADO,
  JPEG_QUALITY,
  comprimirArchivoAJpeg,
  jpegBufferDesdeArchivo,
};
