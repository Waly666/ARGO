const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const archiver = require('archiver');
const { armarDatosCertificado } = require('./certificadoRenderData');
const { generarHtmlCertificado } = require('./certificadoRender');
const { parseFechaCalendario } = require('../utils/fechaCalendario');
const { inicioDia } = require('./estadoJornadaCap');
const { publicOriginFromReq } = require('../utils/publicOrigin');
const { launchBrowser, htmlToPdfBuffer, mergePdfBuffers } = require('./htmlToPdf');

const MAX_CERTS_ZIP = 400;
const JOB_TTL_MS = 30 * 60 * 1000;
/** @type {Map<string, object>} */
const jobs = new Map();

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
  if (Object.keys(fecha).length) {
    // Las fechas del filtro son el día en que se GENERÓ el certificado (createdAt).
    // fechaEmision puede ser el día de la clase (impreso en el PDF) y no coincide con «hoy».
    q.createdAt = fecha;
  }
  return { q };
}

function nombreArchivoCert(cert, idx) {
  const cod = sanitizarNombreArchivo(cert.codigoCert) || `cert_${idx + 1}`;
  const doc = cert.numDoc != null ? String(cert.numDoc) : '';
  return doc ? `${cod}_${doc}.pdf` : `${cod}.pdf`;
}

function purgeExpiredJobs() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - (job.updatedAt || job.createdAt) > JOB_TTL_MS) {
      if (job.filePath) fs.promises.unlink(job.filePath).catch(() => {});
      jobs.delete(id);
    }
  }
}

function progressSnapshot(job) {
  return {
    jobId: job.id,
    status: job.status,
    fase: job.fase,
    hecho: job.hecho,
    total: job.total,
    porcentaje: job.porcentaje,
    message: job.message || null,
    filename: job.filename || null,
  };
}

function setProgress(job, patch) {
  Object.assign(job, patch, { updatedAt: Date.now() });
}

/**
 * Genera ZIP en disco y reporta progreso.
 * @returns {Promise<{ filePath: string, filename: string, total: number }>}
 */
async function buildZipCertificadosToFile({
  rows,
  publicOrigin,
  filtros = {},
  onProgress,
}) {
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

  const total = rows.length;
  const report = (patch) => {
    if (typeof onProgress === 'function') onProgress(patch);
  };

  report({
    status: 'running',
    fase: 'Preparando certificados…',
    hecho: 0,
    total,
    porcentaje: 2,
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `certificados-jornadas_${stamp}.zip`;

  report({
    fase: 'Iniciando generador de PDF…',
    porcentaje: 4,
  });

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
      report({
        fase: `Generando PDF ${i + 1} de ${total}…`,
        hecho: i,
        total,
        porcentaje: 5 + Math.round((i / Math.max(total, 1)) * 82),
      });
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
      report({
        fase: `PDF ${pdfs.length} de ${total} listo`,
        hecho: pdfs.length,
        total,
        porcentaje: 5 + Math.round((pdfs.length / Math.max(total, 1)) * 82),
      });
    }
  } finally {
    await browser.close().catch(() => {});
  }

  if (!pdfs.length) {
    const err = new Error('No se pudo generar el PDF de los certificados.');
    err.status = 500;
    throw err;
  }

  report({
    fase: 'Uniendo PDFs en un solo archivo…',
    hecho: pdfs.length,
    total,
    porcentaje: 90,
  });
  const todosPdf = await mergePdfBuffers(pdfs.map((p) => p.pdf));

  report({
    fase: 'Empaquetando ZIP…',
    porcentaje: 95,
  });

  const filePath = path.join(
    os.tmpdir(),
    `argo-cert-zip-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.zip`,
  );

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filePath);
    const archive = archiver('zip', { zlib: { level: 6 } });
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);

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
            idContrato: filtros.idContrato || null,
            idJornada: filtros.idJornada || null,
            idClase: filtros.idClase || filtros.idClaseJornada || null,
            desde: filtros.desde || null,
            hasta: filtros.hasta || null,
          },
        },
        null,
        2,
      ),
      { name: 'manifest.json' },
    );
    archive.finalize();
  });

  report({
    fase: 'ZIP listo',
    hecho: pdfs.length,
    total,
    porcentaje: 100,
  });

  return { filePath, filename, total: pdfs.length };
}

/**
 * Escribe el ZIP de certificados PDF en res (compatibilidad / uso sincrónico).
 */
async function streamZipCertificadosJornada(req, res, rows) {
  const result = await buildZipCertificadosToFile({
    rows,
    publicOrigin: publicOriginFromReq(req),
    filtros: req.query || {},
  });
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  const stream = fs.createReadStream(result.filePath);
  stream.on('close', () => {
    fs.promises.unlink(result.filePath).catch(() => {});
  });
  stream.on('error', (e) => {
    fs.promises.unlink(result.filePath).catch(() => {});
    if (!res.headersSent) {
      res.status(500).json({ message: e.message || 'Error al enviar ZIP' });
    } else {
      res.destroy(e);
    }
  });
  stream.pipe(res);
}

/**
 * Inicia job asíncrono con progreso.
 * @returns {{ jobId: string }}
 */
function startZipJob({ rows, publicOrigin, filtros, ownerSub }) {
  purgeExpiredJobs();
  const id = crypto.randomUUID();
  const job = {
    id,
    ownerSub: ownerSub || null,
    status: 'running',
    fase: 'En cola…',
    hecho: 0,
    total: rows.length,
    porcentaje: 1,
    message: null,
    filename: null,
    filePath: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  jobs.set(id, job);

  setImmediate(() => {
    buildZipCertificadosToFile({
      rows,
      publicOrigin,
      filtros,
      onProgress: (patch) => setProgress(job, patch),
    })
      .then((result) => {
        setProgress(job, {
          status: 'ready',
          fase: 'ZIP listo para descargar',
          hecho: result.total,
          total: result.total,
          porcentaje: 100,
          filename: result.filename,
          filePath: result.filePath,
          message: null,
        });
      })
      .catch((e) => {
        setProgress(job, {
          status: 'error',
          fase: 'Error',
          porcentaje: job.porcentaje || 0,
          message: e.message || 'No se pudo generar el ZIP',
        });
        if (job.filePath) {
          fs.promises.unlink(job.filePath).catch(() => {});
          job.filePath = null;
        }
      });
  });

  return { jobId: id };
}

function getZipJob(jobId, ownerSub) {
  purgeExpiredJobs();
  const job = jobs.get(String(jobId || ''));
  if (!job) return null;
  if (job.ownerSub && ownerSub && String(job.ownerSub) !== String(ownerSub)) {
    const err = new Error('No autorizado para este job');
    err.status = 403;
    throw err;
  }
  return job;
}

function takeZipDownload(jobId, ownerSub) {
  const job = getZipJob(jobId, ownerSub);
  if (!job) return null;
  if (job.status !== 'ready' || !job.filePath) {
    const err = new Error(
      job.status === 'error'
        ? job.message || 'El ZIP falló'
        : 'El ZIP aún no está listo',
    );
    err.status = job.status === 'error' ? 500 : 409;
    throw err;
  }
  const meta = {
    filePath: job.filePath,
    filename: job.filename || 'certificados.zip',
  };
  // Un solo uso: quitar del mapa; el caller borra el archivo al cerrar el stream
  jobs.delete(job.id);
  return meta;
}

module.exports = {
  MAX_CERTS_ZIP,
  buildQueryCertificadosJornada,
  streamZipCertificadosJornada,
  buildZipCertificadosToFile,
  startZipJob,
  getZipJob,
  takeZipDownload,
  progressSnapshot,
};
