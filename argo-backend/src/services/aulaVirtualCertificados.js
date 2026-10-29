const Certificado = require('../models/Certificado');
const { ID_PROG_HISTORICO } = require('../constants/migracionHistorico');
const DatosAlumno = require('../models/DatosAlumno');
const { numDocQuery, parseNumDoc } = require('../utils/numDoc');
const { buscarPrograma } = require('./programaServicio');
const { configPorPrograma } = require('./aulaVirtualCatalogo');
const { generarHtmlCertificado } = require('./certificadoRender');
const { armarDatosCertificado } = require('./certificadoRenderData');
const {
  verifyCertificadoQrToken,
  codigoVerificacionCert,
  normalizarCodigoVerificacion,
} = require('./certificadoQrToken');
const { obtenerConfigPortalPublica } = require('./aulaVirtualPortal');
const { resolverBasePortal } = require('../utils/portalPublicUrl');
const { reciboResumenPorLiquidacion } = require('./aulaVirtualRecibos');
const { launchBrowser, htmlToPdfBuffer } = require('./htmlToPdf');
const { certificadoEstaVencido, estadoVigenciaCertificado } = require('../utils/certificadoVigencia');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');

/** Misma lógica que certificadoRender: horasCert → programa.horas → clase jornada. */
function horasDesdePrograma(prog) {
  const hProg = prog?.horas != null ? Number(prog.horas) : NaN;
  if (Number.isFinite(hProg) && hProg > 0) return String(hProg);
  return '';
}

async function resolverHorasConsultaPublica(cert, programaCache, claseCache) {
  const direct = String(cert.horasCert || '').trim();
  if (direct) return direct;

  const idProg = String(cert.idProg || '').trim();
  if (idProg) {
    if (!programaCache.has(idProg)) {
      programaCache.set(idProg, await buscarPrograma(cert.idProg));
    }
    const desdeProg = horasDesdePrograma(programaCache.get(idProg));
    if (desdeProg) return desdeProg;
  }

  const idClase = cert.idClaseJornada;
  if (idClase) {
    const ck = String(idClase);
    if (!claseCache.has(ck)) {
      claseCache.set(
        ck,
        await ClaseJornadaCap.findById(idClase).select('horasCertificadas').lean(),
      );
    }
    const hClase = Number(claseCache.get(ck)?.horasCertificadas);
    if (Number.isFinite(hClase) && hClase > 0) return String(hClase);
  }

  return '';
}

function nombreCompletoAlumno(da) {
  if (!da) return '';
  return [da.apellido1, da.apellido2, da.nombre1, da.nombre2].filter(Boolean).join(' ').trim();
}

async function descrPrograma(idProg, encabezado) {
  if (String(idProg) === ID_PROG_HISTORICO) {
    return String(encabezado || '').trim() || 'Certificado histórico';
  }
  const p = await buscarPrograma(idProg);
  if (!p) return String(encabezado || idProg || '').trim();
  return p.nombreProg || p.descripcion || p.nomCert || String(idProg);
}

async function esProgramaVirtual(idProg) {
  const cfg = await configPorPrograma(idProg);
  return !!(cfg && cfg.rutaPaquete);
}

async function listarMisCertificados(numDoc) {
  const nd = parseNumDoc(numDoc);
  if (nd == null) return [];

  const certs = await Certificado.find({
    ...numDocQuery(nd),
    estado: { $ne: 'anulado' },
  })
    .sort({ fechaEmision: -1 })
    .lean();

  const out = [];
  for (const c of certs) {
    const prog = await buscarPrograma(c.idProg);
    const recibo = c.idLiquidacion
      ? await reciboResumenPorLiquidacion(numDoc, c.idLiquidacion)
      : null;
    out.push({
      _id: c._id,
      idProg: c.idProg,
      codigoCert: c.codigoCert || null,
      encabezado: c.encabezado || null,
      programaDescr: await descrPrograma(c.idProg, c.encabezado),
      nomCert: prog?.nomCert || null,
      fechaEmision: c.fechaEmision || c.createdAt || null,
      fechaVencimiento: c.fechaVencimiento || null,
      estado: c.estado || 'vigente',
      esCursoVirtual: await esProgramaVirtual(c.idProg),
      generadoAutoVirtual: !!c.generadoAutoVirtual,
      generadoAutoPago: !!c.generadoAutoPago,
      recibo,
    });
  }
  return out;
}

async function verificarCertificadoAlumno(numDoc, certId) {
  const nd = parseNumDoc(numDoc);
  if (nd == null || !certId) {
    const err = new Error('Solicitud inválida');
    err.status = 400;
    throw err;
  }
  const cert = await Certificado.findById(certId).lean();
  if (!cert || cert.estado === 'anulado') {
    const err = new Error('Certificado no encontrado');
    err.status = 404;
    throw err;
  }
  if (Number(cert.numDoc) !== nd) {
    const err = new Error('No tiene permiso para ver este certificado');
    err.status = 403;
    throw err;
  }
  return cert;
}

/** Consulta pública de certificados vigentes por número de documento (portal). */
async function consultarCertificadosPublico(numDocRaw) {
  const nd = parseNumDoc(numDocRaw);
  if (nd == null) {
    const err = new Error('Ingrese un número de cédula válido.');
    err.status = 400;
    throw err;
  }

  const [alumno, certs] = await Promise.all([
    DatosAlumno.findOne(numDocQuery(nd)).lean(),
    Certificado.find({
      ...numDocQuery(nd),
      estado: { $ne: 'anulado' },
    })
      .sort({ fechaEmision: -1, createdAt: -1 })
      .lean(),
  ]);

  const nombreAlumno = nombreCompletoAlumno(alumno);
  const nombreTitularCert = (c) => String(c.nombreTitular || '').trim();

  const programaCache = new Map();
  const claseCache = new Map();
  const items = [];
  for (const c of certs) {
    const vencido = certificadoEstaVencido(c);
    const horas = await resolverHorasConsultaPublica(c, programaCache, claseCache);
    items.push({
      _id: String(c._id),
      idCertificado: String(c.codVerificacion || c.codigoCert || c._id || '').trim(),
      codVerificacion: String(c.codVerificacion || '').trim(),
      nombreApellidos: nombreAlumno || nombreTitularCert(c),
      cedula: c.numDoc,
      encabezado: String(c.encabezado || '').trim(),
      horas,
      fechaCert: c.fechaEmision || c.createdAt || null,
      fechaVence: c.fechaVencimiento || null,
      vencido,
      estadoVigencia: estadoVigenciaCertificado(c),
    });
  }

  const nombreApellidos =
    nombreAlumno || items.map((i) => i.nombreApellidos).find(Boolean) || '';

  const totalVigentes = items.filter((i) => !i.vencido).length;

  return {
    cedula: nd,
    nombreApellidos,
    total: items.length,
    totalVigentes,
    items,
  };
}

async function htmlCertificadoPortal(numDoc, certId, publicOrigin) {
  await verificarCertificadoAlumno(numDoc, certId);
  const data = await armarDatosCertificado(certId);
  if (!data) {
    const err = new Error('Certificado no encontrado');
    err.status = 404;
    throw err;
  }
  return generarHtmlCertificado(data, { publicOrigin });
}

/** Vista pública del certificado al escanear el QR impreso (token firmado en la URL). */
async function htmlCertificadoVerificacionQr(codigoRaw, tokenRaw, publicOrigin) {
  const certId = verifyCertificadoQrToken(tokenRaw);
  if (!certId) {
    const err = new Error('Enlace de verificación inválido o expirado.');
    err.status = 403;
    throw err;
  }

  const cert = await Certificado.findById(certId).lean();
  if (!cert) {
    const err = new Error('Certificado no encontrado.');
    err.status = 404;
    throw err;
  }

  const codigoUrl = normalizarCodigoVerificacion(codigoRaw);
  const codigoCert = codigoVerificacionCert(cert);
  if (!codigoUrl || codigoUrl !== codigoCert) {
    const err = new Error('El código de verificación no coincide con el enlace.');
    err.status = 403;
    throw err;
  }

  const data = await armarDatosCertificado(certId);
  if (!data) {
    const err = new Error('Certificado no encontrado.');
    err.status = 404;
    throw err;
  }

  const cfg = await obtenerConfigPortalPublica();
  const marcaAguaCopia = cfg.landing?.consultaCertificados?.marcaAguaCopia !== false;

  const portalOrigin = resolverBasePortal({ origin: publicOrigin }) || publicOrigin;

  return generarHtmlCertificado(data, {
    publicOrigin: portalOrigin,
    embedLocalAssets: true,
    marcaAguaCopia,
    modoVerificacionPublica: true,
  });
}

async function pdfCertificadoConsultaPublico(numDoc, certId, publicOrigin, { marcaAguaCopia = false } = {}) {
  const cert = await verificarCertificadoAlumno(numDoc, certId);
  if (certificadoEstaVencido(cert)) {
    const err = new Error(
      'Este certificado está vencido. La descarga no está disponible; contacte a la institución para revalidación.',
    );
    err.status = 403;
    throw err;
  }
  const data = await armarDatosCertificado(certId);
  if (!data) {
    const err = new Error('Certificado no encontrado');
    err.status = 404;
    throw err;
  }
  const html = await generarHtmlCertificado(data, {
    publicOrigin,
    embedLocalAssets: true,
    marcaAguaCopia: !!marcaAguaCopia,
  });
  const browser = await launchBrowser();
  try {
    const buffer = await htmlToPdfBuffer(browser, html);
    const codigo = String(cert.codigoCert || cert.codVerificacion || cert._id || 'argo').trim();
    return { buffer, codigo };
  } finally {
    await browser.close().catch(() => {});
  }
}

module.exports = {
  listarMisCertificados,
  consultarCertificadosPublico,
  verificarCertificadoAlumno,
  htmlCertificadoPortal,
  htmlCertificadoVerificacionQr,
  pdfCertificadoConsultaPublico,
};
