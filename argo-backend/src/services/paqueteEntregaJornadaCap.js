const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const archiver = require('archiver');
const Certificado = require('../models/Certificado');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const Contratacion = require('../models/Contratacion');
const JornadaCap = require('../models/JornadaCap');
const upload = require('../middleware/upload');
const { buildCodigoJornada } = require('../utils/codigoJornada');
const {
  buildQueryCertificadosJornada,
  generarPdfsCertificados,
  sanitizarNombreArchivo,
  MAX_CERTS_ZIP,
} = require('./certificadosJornadaZip');

const JOB_TTL_MS = 45 * 60 * 1000;
/** @type {Map<string, object>} */
const jobs = new Map();

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
    tipo: job.tipo || null,
  };
}

function setProgress(job, patch) {
  Object.assign(job, patch, { updatedAt: Date.now() });
}

async function bufferInformeContratoPdf(idContrato, query = {}) {
  const {
    obtenerDashboardInformeContrato,
    buildHtmlInformeContratoPdf,
  } = require('./informeDashboardContrato');
  const { launchBrowser, htmlToPdfBuffer } = require('./htmlToPdf');
  const alcance = String(query.alcance || 'contrato').trim().toLowerCase();
  const data = await obtenerDashboardInformeContrato(idContrato, query);
  if (!data) {
    const err = new Error('Contrato no encontrado');
    err.status = 404;
    throw err;
  }
  const html = await buildHtmlInformeContratoPdf(data, alcance);
  const browser = await launchBrowser();
  try {
    return await htmlToPdfBuffer(browser, html);
  } finally {
    await browser.close().catch(() => {});
  }
}

function appendCertificadosAlArchivo(archive, carpeta, pdfs, todosPdf, manifest) {
  const base = carpeta.endsWith('/') ? carpeta : `${carpeta}/`;
  for (const item of pdfs) {
    archive.append(item.pdf, { name: `${base}individuales/${item.name}` });
  }
  archive.append(todosPdf, { name: `${base}00-todos-imprimir.pdf` });
  archive.append(JSON.stringify(manifest, null, 2), { name: `${base}manifest.json` });
}

function appendEvidenciaAlArchivo(archive, carpeta, urlRel) {
  const rel = String(urlRel || '').trim();
  if (!rel) return false;
  const abs = upload.resolvePath(rel);
  if (!abs || !fs.existsSync(abs)) return false;
  const ext = path.extname(abs).toLowerCase() || '.pdf';
  const base = carpeta.endsWith('/') ? carpeta : `${carpeta}/`;
  archive.file(abs, { name: `${base}evidencia/evidencia-consolidada${ext}` });
  return true;
}

/** Agrega fotos de evidencia de cada clase (urlforo) en carpeta imagenes/. */
async function appendImagenesClasesAlArchivo(archive, carpeta, idJornada) {
  const clases = await ClaseJornadaCap.find({
    idJornada,
    urlforo: { $nin: [null, ''] },
  })
    .sort({ indiceClaseEnJornada: 1, horaInicio: 1, createdAt: 1 })
    .lean();

  const base = carpeta.endsWith('/') ? carpeta : `${carpeta}/`;
  let count = 0;
  for (let i = 0; i < clases.length; i++) {
    const clase = clases[i];
    const rel = String(clase.urlforo || '').trim();
    if (!rel) continue;
    const abs = upload.resolvePath(rel);
    if (!abs || !fs.existsSync(abs)) continue;
    const idx = clase.indiceClaseEnJornada ?? i + 1;
    const prog = sanitizarNombreArchivo(clase.idPrograma || 'clase');
    const original = sanitizarNombreArchivo(path.basename(abs)) || `clase-${idx}.jpg`;
    const name = `${String(idx).padStart(2, '0')}_${prog}_${original}`;
    archive.file(abs, { name: `${base}imagenes/${name}` });
    count++;
  }
  return count;
}

function truncarSlug(s, max = 48) {
  const t = sanitizarNombreArchivo(s);
  if (!t) return '';
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/_+$/, '');
}

function nombreEmpresaContratante(contrato) {
  return String(
    contrato?.nombreComercial ||
      contrato?.razoSocial ||
      contrato?.clienteNombre ||
      '',
  ).trim();
}

function buildEtiquetasPaqueteContrato(contrato) {
  const cod = truncarSlug(contrato?.codContrato || 'sin-codigo', 32);
  const empresa = truncarSlug(nombreEmpresaContratante(contrato) || 'empresa-contratante', 48);
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `contrato_${cod}_${empresa}`;
  return {
    codContrato: cod,
    empresaContratante: empresa,
    root: `${base}/`,
    filename: `paquete-entrega-contrato_${cod}_${empresa}_${stamp}.zip`,
  };
}

function leemeJornada({
  codigo,
  contrato,
  incluyeInforme,
  incluyeCerts,
  incluyeEvidencia,
  incluyeImagenes,
  totalCerts,
  totalImagenes,
}) {
  const lineas = [
    'PAQUETE DE ENTREGA — JORNADA',
    '============================',
    `Generado: ${new Date().toISOString()}`,
    `Jornada: ${codigo}`,
    `Contrato: ${contrato || '—'}`,
    '',
    'Contenido:',
  ];
  if (incluyeInforme) lineas.push('  • informe/informe-jornada.pdf');
  if (incluyeCerts) lineas.push(`  • certificados/ (${totalCerts} certificado(s))`);
  if (incluyeEvidencia) lineas.push('  • evidencia/evidencia-consolidada.*');
  if (incluyeImagenes) lineas.push(`  • imagenes/ (${totalImagenes} foto(s) de clases)`);
  if (!incluyeInforme && !incluyeCerts && !incluyeEvidencia && !incluyeImagenes) {
    lineas.push('  (sin archivos — verifique jornada)');
  }
  return `${lineas.join('\n')}\n`;
}

function leemeContrato({ codigo, empresaContratante, totalJornadas, jornadasConEvidencia, totalCerts, totalImagenes }) {
  const lineas = [
    'PAQUETE DE ENTREGA — CONTRATO',
    '=============================',
    `Generado: ${new Date().toISOString()}`,
    `Contrato: ${codigo}`,
    `Empresa contratante: ${empresaContratante || '—'}`,
    `Jornadas incluidas: ${totalJornadas}`,
    `Jornadas con evidencia PDF: ${jornadasConEvidencia}`,
    `Certificados totales (aprox.): ${totalCerts}`,
    `Fotos de clases incluidas: ${totalImagenes}`,
    '',
    'Estructura:',
    '  • informes/informe-contrato.pdf',
    '  • informes/desarrollo-general.pdf',
    '  • informes/encuesta-satisfaccion.pdf (si hay encuesta publicada o cerrada)',
    '  • jornadas/{codigo-jornada}/informe/',
    '  • jornadas/{codigo-jornada}/certificados/',
    '  • jornadas/{codigo-jornada}/evidencia/ (si aplica)',
    '  • jornadas/{codigo-jornada}/imagenes/ (fotos de clases)',
  ];
  return `${lineas.join('\n')}\n`;
}

async function agregarContenidoJornadaAlArchivo({
  archive,
  root,
  jornada,
  idContrato,
  publicOrigin,
  onProgress,
  progressBase = 0,
  progressSpan = 100,
  index = 0,
  total = 1,
}) {
  const codJ = sanitizarNombreArchivo(
    jornada.codigoJornada || buildCodigoJornada('', jornada._id) || String(jornada._id),
  );
  const jRoot = `${root}jornadas/${codJ}/`;
  const report = (fase, pctInSpan) => {
    if (typeof onProgress === 'function') {
      onProgress({
        fase,
        hecho: index,
        total,
        porcentaje: progressBase + Math.round((pctInSpan / 100) * progressSpan),
      });
    }
  };

  report(`Informe jornada ${codJ}…`, 5);
  const informeBuf = await bufferInformeContratoPdf(String(idContrato), {
    alcance: 'jornada',
    idJornada: String(jornada._id),
  });
  archive.append(informeBuf, { name: `${jRoot}informe/informe-jornada.pdf` });

  let totalCerts = 0;
  const { q } = buildQueryCertificadosJornada({ idJornada: String(jornada._id) });
  const rows = await Certificado.find(q).sort({ fechaEmision: 1, codigoCert: 1 }).lean();
  if (rows.length) {
    if (rows.length > MAX_CERTS_ZIP) {
      const err = new Error(
        `Jornada ${codJ}: demasiados certificados (${rows.length}). Máx. ${MAX_CERTS_ZIP} por jornada.`,
      );
      err.status = 400;
      throw err;
    }
    report(`Certificados jornada ${codJ} (${rows.length})…`, 35);
    const { pdfs, todosPdf, total: n } = await generarPdfsCertificados({
      rows,
      publicOrigin,
      onProgress: (p) =>
        report(p.fase || `Certificados ${codJ}…`, 35 + Math.round((p.porcentaje || 0) * 0.45)),
    });
    totalCerts = n;
    appendCertificadosAlArchivo(archive, `${jRoot}certificados`, pdfs, todosPdf, {
      generadoAt: new Date().toISOString(),
      idJornada: String(jornada._id),
      codigoJornada: codJ,
      total: n,
    });
  }

  report(`Evidencia jornada ${codJ}…`, 85);
  const tieneEvidencia = appendEvidenciaAlArchivo(
    archive,
    jRoot,
    jornada.urlEvidenciaConsolidada,
  );

  report(`Imágenes de clases ${codJ}…`, 92);
  const totalImagenes = await appendImagenesClasesAlArchivo(archive, jRoot, jornada._id);

  archive.append(
    leemeJornada({
      codigo: codJ,
      contrato: '',
      incluyeInforme: true,
      incluyeCerts: totalCerts > 0,
      incluyeEvidencia: tieneEvidencia,
      incluyeImagenes: totalImagenes > 0,
      totalCerts,
      totalImagenes,
    }),
    { name: `${jRoot}LEEME.txt` },
  );

  return { totalCerts, tieneEvidencia: tieneEvidencia ? 1 : 0, totalImagenes };
}

async function buildPaqueteJornadaToFile({ jornadaId, publicOrigin, onProgress }) {
  const jornada = await JornadaCap.findById(jornadaId).lean();
  if (!jornada) {
    const err = new Error('Jornada no encontrada');
    err.status = 404;
    throw err;
  }
  const contrato = await Contratacion.findById(jornada.idContrato).select('codContrato').lean();
  const codJ = sanitizarNombreArchivo(
    jornada.codigoJornada || buildCodigoJornada(contrato?.codContrato, jornada._id) || String(jornada._id),
  );
  const root = `${codJ}/`;
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `paquete-entrega_${codJ}_${stamp}.zip`;
  const filePath = path.join(
    os.tmpdir(),
    `argo-paquete-jor-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.zip`,
  );

  let incluyeInforme = false;
  let incluyeCerts = false;
  let incluyeEvidencia = false;
  let incluyeImagenes = false;
  let totalCerts = 0;
  let totalImagenes = 0;

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filePath);
    const archive = archiver('zip', { zlib: { level: 6 } });
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);

    (async () => {
      try {
        if (typeof onProgress === 'function') {
          onProgress({ fase: 'Generando informe de jornada…', porcentaje: 8, hecho: 0, total: 1 });
        }
        const informeBuf = await bufferInformeContratoPdf(String(jornada.idContrato), {
          alcance: 'jornada',
          idJornada: String(jornada._id),
        });
        archive.append(informeBuf, { name: `${root}informe/informe-jornada.pdf` });
        incluyeInforme = true;

        const { q } = buildQueryCertificadosJornada({ idJornada: String(jornada._id) });
        const rows = await Certificado.find(q).sort({ fechaEmision: 1, codigoCert: 1 }).lean();
        if (rows.length) {
          if (rows.length > MAX_CERTS_ZIP) {
            throw Object.assign(
              new Error(`Demasiados certificados (${rows.length}). Máx. ${MAX_CERTS_ZIP}.`),
              { status: 400 },
            );
          }
          const { pdfs, todosPdf, total } = await generarPdfsCertificados({
            rows,
            publicOrigin,
            onProgress: (p) => {
              if (typeof onProgress === 'function') {
                onProgress({
                  fase: p.fase || 'Generando certificados…',
                  hecho: p.hecho || 0,
                  total: p.total || rows.length,
                  porcentaje: 12 + Math.round((p.porcentaje || 0) * 0.68),
                });
              }
            },
          });
          totalCerts = total;
          incluyeCerts = true;
          appendCertificadosAlArchivo(archive, `${root}certificados`, pdfs, todosPdf, {
            generadoAt: new Date().toISOString(),
            idJornada: String(jornada._id),
            codigoJornada: codJ,
            total,
          });
        }

        if (typeof onProgress === 'function') {
          onProgress({ fase: 'Agregando evidencia…', porcentaje: 84, hecho: 1, total: 1 });
        }
        incluyeEvidencia = appendEvidenciaAlArchivo(
          archive,
          root,
          jornada.urlEvidenciaConsolidada,
        );

        if (typeof onProgress === 'function') {
          onProgress({ fase: 'Agregando imágenes de clases…', porcentaje: 90, hecho: 1, total: 1 });
        }
        totalImagenes = await appendImagenesClasesAlArchivo(archive, root, jornada._id);
        incluyeImagenes = totalImagenes > 0;

        archive.append(
          leemeJornada({
            codigo: codJ,
            contrato: contrato?.codContrato || '',
            incluyeInforme,
            incluyeCerts,
            incluyeEvidencia,
            incluyeImagenes,
            totalCerts,
            totalImagenes,
          }),
          { name: `${root}LEEME.txt` },
        );

        if (typeof onProgress === 'function') {
          onProgress({ fase: 'Empaquetando ZIP…', porcentaje: 96, hecho: 1, total: 1 });
        }
        await archive.finalize();
      } catch (e) {
        archive.abort();
        reject(e);
      }
    })();
  });

  return { filePath, filename, total: totalCerts, codJornada: codJ };
}

async function buildPaqueteContratoToFile({ idContrato, publicOrigin, onProgress }) {
  const contrato = await Contratacion.findById(idContrato).lean();
  if (!contrato) {
    const err = new Error('Contrato no encontrado');
    err.status = 404;
    throw err;
  }
  const etiquetas = buildEtiquetasPaqueteContrato(contrato);
  const codC = etiquetas.codContrato;
  const root = etiquetas.root;
  const jornadas = await JornadaCap.find({ idContrato }).sort({ fechaProgramacion: 1, indiceEnDia: 1 }).lean();
  const filename = etiquetas.filename;
  const filePath = path.join(
    os.tmpdir(),
    `argo-paquete-con-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.zip`,
  );

  let totalCerts = 0;
  let jornadasConEvidencia = 0;
  let totalImagenes = 0;

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filePath);
    const archive = archiver('zip', { zlib: { level: 6 } });
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);

    (async () => {
      try {
        if (typeof onProgress === 'function') {
          onProgress({
            fase: 'Informe general del contrato…',
            porcentaje: 3,
            hecho: 0,
            total: jornadas.length,
          });
        }
        const informeContrato = await bufferInformeContratoPdf(String(idContrato), {
          alcance: 'contrato',
        });
        archive.append(informeContrato, { name: `${root}informes/informe-contrato.pdf` });

        try {
          const desarrollo = await bufferInformeContratoPdf(String(idContrato), {
            alcance: 'desarrollo-general',
          });
          archive.append(desarrollo, { name: `${root}informes/desarrollo-general.pdf` });
        } catch {
          /* opcional si falla */
        }

        try {
          if (typeof onProgress === 'function') {
            onProgress({
              fase: 'Informe encuesta de satisfacción…',
              porcentaje: 6,
              hecho: 0,
              total: jornadas.length,
            });
          }
          const { bufferInformeEncuestaContratoPdf } = require('./informeEncuestaJornadaPdf');
          const encuestaPdf = await bufferInformeEncuestaContratoPdf(String(idContrato));
          if (encuestaPdf?.length) {
            archive.append(encuestaPdf, { name: `${root}informes/encuesta-satisfaccion.pdf` });
          }
        } catch {
          /* opcional si no hay encuesta o falla la generación */
        }

        const totalJ = jornadas.length;
        for (let i = 0; i < totalJ; i++) {
          const j = jornadas[i];
          const span = totalJ ? 90 / totalJ : 90;
          const base = 8 + i * span;
          const res = await agregarContenidoJornadaAlArchivo({
            archive,
            root,
            jornada: j,
            idContrato,
            publicOrigin,
            onProgress,
            progressBase: base,
            progressSpan: span,
            index: i + 1,
            total: totalJ,
          });
          totalCerts += res.totalCerts;
          jornadasConEvidencia += res.tieneEvidencia;
          totalImagenes += res.totalImagenes || 0;
        }

        archive.append(
          leemeContrato({
            codigo: codC,
            empresaContratante: etiquetas.empresaContratante,
            totalJornadas: jornadas.length,
            jornadasConEvidencia,
            totalCerts,
            totalImagenes,
          }),
          { name: `${root}LEEME.txt` },
        );

        if (typeof onProgress === 'function') {
          onProgress({
            fase: 'Empaquetando ZIP del contrato…',
            porcentaje: 98,
            hecho: jornadas.length,
            total: jornadas.length,
          });
        }
        await archive.finalize();
      } catch (e) {
        archive.abort();
        reject(e);
      }
    })();
  });

  return { filePath, filename, total: totalCerts, codContrato: codC, jornadas: jornadas.length };
}

function startPaqueteEntregaJob({ tipo, params, publicOrigin, ownerSub }) {
  purgeExpiredJobs();
  const id = crypto.randomUUID();
  const job = {
    id,
    tipo,
    params,
    ownerSub: ownerSub || null,
    status: 'running',
    fase: 'En cola…',
    hecho: 0,
    total: 0,
    porcentaje: 1,
    message: null,
    filename: null,
    filePath: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  jobs.set(id, job);

  const runner =
    tipo === 'contrato'
      ? () => buildPaqueteContratoToFile({ ...params, publicOrigin, onProgress: (p) => setProgress(job, p) })
      : () => buildPaqueteJornadaToFile({ ...params, publicOrigin, onProgress: (p) => setProgress(job, p) });

  setImmediate(() => {
    runner()
      .then((result) => {
        setProgress(job, {
          status: 'ready',
          fase: 'Paquete listo para descargar',
          hecho: result.total ?? job.hecho,
          total: result.total ?? job.total,
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
          message: e.message || 'No se pudo generar el paquete',
        });
        if (job.filePath) {
          fs.promises.unlink(job.filePath).catch(() => {});
          job.filePath = null;
        }
      });
  });

  return { jobId: id };
}

function getPaqueteEntregaJob(jobId, ownerSub) {
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

function takePaqueteEntregaDownload(jobId, ownerSub) {
  const job = getPaqueteEntregaJob(jobId, ownerSub);
  if (!job) return null;
  if (job.status !== 'ready' || !job.filePath) {
    const err = new Error(
      job.status === 'error' ? job.message || 'El paquete falló' : 'El paquete aún no está listo',
    );
    err.status = job.status === 'error' ? 500 : 409;
    throw err;
  }
  const meta = {
    filePath: job.filePath,
    filename: job.filename || 'paquete-entrega-contrato.zip',
  };
  jobs.delete(job.id);
  return meta;
}

module.exports = {
  buildPaqueteJornadaToFile,
  buildPaqueteContratoToFile,
  startPaqueteEntregaJob,
  getPaqueteEntregaJob,
  takePaqueteEntregaDownload,
  progressSnapshot,
};
