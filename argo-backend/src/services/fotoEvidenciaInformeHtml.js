const fs = require('fs');
const upload = require('../middleware/upload');
const { uploadFileToDataUrl } = require('../utils/uploadPublicUrl');

function normalizarRelFoto(relative) {
  let rel = String(relative || '').trim();
  if (!rel) return '';
  if (/^https?:\/\//i.test(rel)) {
    try {
      const pathname = new URL(rel).pathname;
      const idx = pathname.indexOf('/uploads/');
      if (idx >= 0) rel = pathname.slice(idx + '/uploads/'.length);
      else return '';
    } catch {
      return '';
    }
  }
  rel = rel.replace(/^\/+/, '').replace(/\\/g, '/');
  if (rel.startsWith('uploads/')) rel = rel.slice('uploads/'.length);
  return rel;
}

/** Primera foto cargada (fotosEvidencia[0] o urlforo legado). */
function primeraUrlFotoEvidencia(clase) {
  const arr = Array.isArray(clase?.fotosEvidencia) ? clase.fotosEvidencia : [];
  for (const f of arr) {
    const u = String(f?.url || '').trim();
    if (u) return u;
  }
  return String(clase?.urlforo || clase?.fotoEvidenciaUrl || '').trim();
}

/**
 * Data URL JPEG recortado a tamaño de informe (print).
 * Si sharp falla, usa el archivo original.
 */
async function dataUrlFotoEvidenciaParaInforme(relative) {
  const rel = normalizarRelFoto(relative);
  if (!rel) return '';
  const abs = upload.resolvePath(rel);
  if (!abs || !fs.existsSync(abs)) return uploadFileToDataUrl(rel) || '';
  try {
    const sharp = require('sharp');
    const buf = await sharp(abs)
      .rotate()
      .resize({
        width: 1400,
        height: 1050,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 78 })
      .toBuffer();
    return `data:image/jpeg;base64,${buf.toString('base64')}`;
  } catch {
    return uploadFileToDataUrl(rel) || '';
  }
}

async function resolverDataUrlFotosClases(clases) {
  const cache = new Map();
  for (const cl of clases || []) {
    const rel = primeraUrlFotoEvidencia(cl);
    cl.fotoEvidenciaUrl = rel || '';
    if (!rel) {
      cl.fotoEvidenciaDataUrl = '';
      continue;
    }
    if (!cache.has(rel)) {
      cache.set(rel, await dataUrlFotoEvidenciaParaInforme(rel));
    }
    cl.fotoEvidenciaDataUrl = cache.get(rel) || '';
  }
}

function htmlFotoEvidenciaClaseInforme(clase, caption = 'Evidencia fotográfica de la clase') {
  const src = String(clase?.fotoEvidenciaDataUrl || '').trim();
  if (!src) return '';
  return `<figure class="clase-foto-frame">
    <div class="clase-foto-plate">
      <img src="${src}" alt="${String(caption).replace(/"/g, '&quot;')}" />
    </div>
    <figcaption>${caption}</figcaption>
  </figure>`;
}

function cssFotoEvidenciaClaseInforme() {
  return `
  .clase-foto-frame {
    margin: 6px auto 12px;
    width: 100%;
    max-width: 172mm;
    text-align: center;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .clase-foto-plate {
    display: inline-block;
    max-width: 100%;
    padding: 8px;
    background:
      linear-gradient(#fbf7ee, #f3ead6) padding-box,
      linear-gradient(135deg, #e8d5a3, #8a6a1f, #c9a227, #8a6a1f, #e8d5a3) border-box;
    border: 3px solid transparent;
    border-radius: 2px;
    box-shadow:
      0 0 0 1px #1e3a5f,
      0 0 0 8px #f7f1e4,
      0 0 0 9px #1e3a5f,
      0 8px 18px rgba(15, 23, 42, 0.16);
  }
  .clase-foto-plate img {
    display: block;
    max-width: min(158mm, 100%);
    max-height: 88mm;
    width: auto;
    height: auto;
    margin: 0 auto;
    object-fit: contain;
    background: #0b1220;
  }
  .clase-foto-frame figcaption {
    margin-top: 8px;
    font-size: 7.5pt;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #1e3a5f;
  }
  `;
}

module.exports = {
  primeraUrlFotoEvidencia,
  dataUrlFotoEvidenciaParaInforme,
  resolverDataUrlFotosClases,
  htmlFotoEvidenciaClaseInforme,
  cssFotoEvidenciaClaseInforme,
};
