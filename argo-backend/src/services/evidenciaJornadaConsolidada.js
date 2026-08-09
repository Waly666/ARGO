const path = require('path');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const { mergePdfBuffers } = require('./htmlToPdf');

const MIME_PDF = 'application/pdf';
const IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);

function extDeArchivo(name, mime) {
  const ext = path.extname(String(name || '')).toLowerCase();
  if (ext === '.pdf') return '.pdf';
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) return ext;
  const m = String(mime || '').toLowerCase();
  if (m === MIME_PDF) return '.pdf';
  if (m === 'image/png') return '.png';
  if (m === 'image/webp') return '.webp';
  if (m === 'image/gif') return '.gif';
  return '.jpg';
}

function esPdf(file) {
  const mime = String(file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || '').toLowerCase();
  return mime === MIME_PDF || ext === '.pdf';
}

function esImagen(file) {
  const mime = String(file.mimetype || '').toLowerCase();
  if (IMAGE_MIMES.has(mime)) return true;
  const ext = path.extname(file.originalname || '').toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext);
}

/** Convierte un buffer de imagen a PDF de una página (ajusta a A4). */
async function imagenBufferAPdf(buffer) {
  const meta = await sharp(buffer).metadata();
  const pngBuf = await sharp(buffer).png().toBuffer();

  const pdf = await PDFDocument.create();
  const img = await pdf.embedPng(pngBuf);
  const iw = meta.width || img.width;
  const ih = meta.height || img.height;

  const pageW = 595.28;
  const pageH = 841.89;
  const scale = Math.min(pageW / iw, pageH / ih, 1);
  const w = iw * scale;
  const h = ih * scale;
  const page = pdf.addPage([pageW, pageH]);
  page.drawImage(img, {
    x: (pageW - w) / 2,
    y: (pageH - h) / 2,
    width: w,
    height: h,
  });
  return Buffer.from(await pdf.save());
}

/**
 * Une varios archivos (PNG/JPG/PDF) en un solo PDF, en el orden recibido.
 * @param {Array<{ buffer: Buffer, mimetype?: string, originalname?: string }>} files
 */
async function consolidarEvidenciasEnPdf(files) {
  if (!files?.length) {
    const err = new Error('Debe enviar al menos un archivo de evidencia.');
    err.status = 400;
    throw err;
  }

  const partes = [];
  for (const file of files) {
    const buf = file.buffer;
    if (!buf?.length) continue;

    if (esPdf(file)) {
      partes.push(buf);
      continue;
    }
    if (esImagen(file)) {
      partes.push(await imagenBufferAPdf(buf));
      continue;
    }
    const err = new Error(
      `Tipo no permitido: ${file.originalname || 'archivo'}. Use PNG, JPG o PDF.`,
    );
    err.status = 400;
    throw err;
  }

  if (!partes.length) {
    const err = new Error('No se pudo leer ningún archivo válido.');
    err.status = 400;
    throw err;
  }

  if (partes.length === 1) return partes[0];
  return mergePdfBuffers(partes);
}

module.exports = {
  consolidarEvidenciasEnPdf,
  esPdf,
  esImagen,
  extDeArchivo,
};
