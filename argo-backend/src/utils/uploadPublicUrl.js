const fs = require('fs');
const path = require('path');

const UPLOAD_BASE = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');

/** URL pública bajo /uploads/ (relativa al host que sirve el portal o ERP). */
function publicUploadUrl(relative) {
  let rel = String(relative || '').trim();
  if (!rel) return null;

  if (/^https?:\/\//i.test(rel)) {
    try {
      const pathname = new URL(rel).pathname;
      const idx = pathname.indexOf('/uploads/');
      if (idx >= 0) return pathname.slice(idx);
    } catch {
      return null;
    }
  }

  rel = rel.replace(/^\/+/, '');
  if (rel.startsWith('uploads/')) rel = rel.slice('uploads/'.length);
  return `/uploads/${rel}`;
}

/**
 * Convierte un archivo de uploads a data URL base64.
 * Acepta rutas relativas como "aula-virtual-logo/filename.png".
 * Retorna null si el archivo no existe o hay error.
 */
function uploadFileToDataUrl(relative) {
  try {
    let rel = String(relative || '').trim();
    if (!rel) return null;
    // Normalizar: quitar /uploads/ al inicio si viene así
    if (/^https?:\/\//i.test(rel)) {
      try {
        const pathname = new URL(rel).pathname;
        const idx = pathname.indexOf('/uploads/');
        if (idx >= 0) rel = pathname.slice(idx + '/uploads/'.length);
        else return null;
      } catch {
        return null;
      }
    }
    rel = rel.replace(/^\/+/, '');
    if (rel.startsWith('uploads/')) rel = rel.slice('uploads/'.length);

    const filePath = path.join(UPLOAD_BASE, rel);
    if (!fs.existsSync(filePath)) return null;

    const ext = path.extname(rel).toLowerCase().slice(1);
    const mimeMap = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      gif: 'image/gif',
    };
    const mime = mimeMap[ext] || 'image/png';
    const data = fs.readFileSync(filePath).toString('base64');
    return `data:${mime};base64,${data}`;
  } catch {
    return null;
  }
}

function uploadRelativePath(relative) {
  let rel = String(relative || '').trim();
  if (!rel) return null;
  if (/^https?:\/\//i.test(rel)) {
    try {
      const pathname = new URL(rel).pathname;
      const idx = pathname.indexOf('/uploads/');
      if (idx >= 0) rel = pathname.slice(idx + '/uploads/'.length);
      else return null;
    } catch {
      return null;
    }
  }
  rel = rel.replace(/^\/+/, '');
  if (rel.startsWith('uploads/')) rel = rel.slice('uploads/'.length);
  return rel;
}

function uploadFileMtimeMs(relative) {
  try {
    const rel = uploadRelativePath(relative);
    if (!rel) return null;
    const filePath = path.join(UPLOAD_BASE, rel);
    if (!fs.existsSync(filePath)) return null;
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return null;
  }
}

/** URL pública con versión por fecha de archivo (evita logo viejo en caché del navegador). */
function publicUploadUrlVersioned(relative) {
  const url = publicUploadUrl(relative);
  if (!url) return null;
  const mtime = uploadFileMtimeMs(relative);
  return mtime ? `${url}?v=${Math.floor(mtime)}` : url;
}

module.exports = {
  publicUploadUrl,
  publicUploadUrlVersioned,
  uploadFileToDataUrl,
  uploadFileMtimeMs,
};
