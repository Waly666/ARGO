const archiver = require('archiver');
const { armarDatosCertificado } = require('./certificadoRenderData');
const { generarHtmlCertificado } = require('./certificadoRender');
const { parseFechaCalendario } = require('../utils/fechaCalendario');
const { inicioDia } = require('./estadoJornadaCap');
const { publicOriginFromReq } = require('../utils/publicOrigin');
const { launchBrowser, htmlToPdfBuffer, mergePdfBuffers } = require('./htmlToPdf');

const MAX_CERTS_ZIP = 400;

function finDia(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function sanitizarNombreArchivo(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80);
}

/**
 * Query base para certificados de jornadas con filtros.
 * @returns {{ q: object, error?: string }}
 */
function buildQueryCertificadosJornada(query = {}) {
  const q = { generadoAutoJornada: true, estado: { $ne: 'anulado' } };
  if (query.idContrato) q.idContrato = query.idContrato;
  if (query.idJornada) q.idJornada = query.idJornada;
  if (query.idClase || query.idClaseJornada) {
    q.idClaseJornada = query.idClase || query.idClaseJornada;
  }

  const fecha = {};
  if (query.desde) {
    const d = parseFechaCalendario(String(query.desde));
    if (!d) return { q: null, error: 'Fecha «desde» inválida' };
    fecha.$gte = inicioDia(d);
  }
  if (query.hasta) {
    const d = parseFechaCalendario(String(query.hasta));
    if (!d) return { q: null, error: 'Fecha «hasta» inválida' };
    fecha.$lte = finDia(d);
  }
  if (Object.keys(fecha).length) q.fechaEmision = fecha;
  return { q };
}

function nombreArchivoCert(cert, idx) {
  const cod = sanitizarNombreArchivo(cert.codigoCert) || `cert_${idx + 1}`;
  const doc = cert.numDoc != null ? String(cert.numDoc) : '';
  return doc ? `${cod}_${doc}.pdf` : `${cod}.pdf`;
}

/**
 * Escribe el ZIP de certificados PDF (individuales + 00-todos-imprimir.pdf) en res.
 */
async function streamZipCertificadosJornada(req, res, rows) {
  if (!rows.length) {
    const err = new Error('No hay certificados con los filtros indicados.');
    err.status = 404;
    throw err;
  }
  if (rows.length > MAX_CERTS_ZIP) {
    const err = new Error(
      `Demasiados certificados (${rows.length}). Acote filtros (máx. ${MAX_CERTS_ZIP}).`,
    );
    err.status = 400;
    throw err;
  }

  const publicOrigin = publicOriginFromReq(req);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `certificados-jornadas_${stamp}.zip`;

  let browser;
  try {
    browser = await launchBrowser();
  } catch (e) {
    throw e;
  }

  const pdfs = [];
  const usados = new Set();

  try {
    for (let i = 0; i < rows.length; i++) {
      const cert = rows[i];
      const data = await armarDatosCertificado(cert._id);
      if (!data) continue;
      const html = await generarHtmlCertificado(data, {
        publicOrigin,
        embedLocalAssets: true,
      });
      const pdf = await htmlToPdfBuffer(browser, html);
      let name = nombreArchivoCert(cert, i);
      if (usados.has(name)) name = `${i + 1}_${name}`;
      usados.add(name);
      pdfs.push({ name, pdf });
    }
  } finally {
    await browser.close().catch(() => {});
  }

  if (!pdfs.length) {
    const err = new Error('No se pudo generar el PDF de los certificados.');
    err.status = 500;
    throw err;
  }

  const todosPdf = await mergePdfBuffers(pdfs.map((p) => p.pdf));

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.on('error', (e) => {
    if (!res.headersSent) {
      res.status(500).json({ message: e.message || 'Error al crear ZIP' });
    } else {
      res.destroy(e);
    }
  });
  archive.pipe(res);

  for (const item of pdfs) {
    archive.append(item.pdf, { name: `individuales/${item.name}` });
  }
  archive.append(todosPdf, { name: '00-todos-imprimir.pdf' });
  archive.append(
    JSON.stringify(
      {
        generadoAt: new Date().toISOString(),
        total: pdfs.length,
        formato: 'pdf',
        filtros: {
          idContrato: req.query.idContrato || null,
          idJornada: req.query.idJornada || null,
          idClase: req.query.idClase || req.query.idClaseJornada || null,
          desde: req.query.desde || null,
          hasta: req.query.hasta || null,
        },
      },
      null,
      2,
    ),
    { name: 'manifest.json' },
  );

  await archive.finalize();
}

module.exports = {
  MAX_CERTS_ZIP,
  buildQueryCertificadosJornada,
  streamZipCertificadosJornada,
};
