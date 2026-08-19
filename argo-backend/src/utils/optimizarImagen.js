const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Reduce imágenes subidas para el portal (logo, hero, etc.).
 * Sobrescribe el archivo original si supera maxWidth/maxHeight.
 */
async function optimizarImagenArchivo(
  filePath,
  { maxWidth = 256, maxHeight = 256, jpegQuality = 86, webpQuality = 86 } = {},
) {
  if (!filePath || !fs.existsSync(filePath)) return false;

  const meta = await sharp(filePath).metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  if (!width || !height) return false;
  if (width <= maxWidth && height <= maxHeight) return false;

  const ext = path.extname(filePath).toLowerCase();
  const tmpPath = `${filePath}.opt.tmp`;
  let pipeline = sharp(filePath, { failOn: 'none' })
    .rotate()
    .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true });

  if (ext === '.png') {
    pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality: webpQuality });
  } else {
    pipeline = pipeline.jpeg({ quality: jpegQuality, mozjpeg: true });
  }

  await pipeline.toFile(tmpPath);
  await fs.promises.rename(tmpPath, filePath);
  return true;
}

module.exports = { optimizarImagenArchivo };
