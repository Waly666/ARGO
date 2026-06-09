const Certificado = require('../models/Certificado');
const { numDocQuery, parseNumDoc } = require('../utils/numDoc');
const { buscarPrograma } = require('./programaServicio');
const { configPorPrograma } = require('./aulaVirtualCatalogo');
const { generarHtmlCertificado } = require('./certificadoRender');
const { armarDatosCertificado } = require('./certificadoRenderData');
const { reciboResumenPorLiquidacion } = require('./aulaVirtualRecibos');

async function descrPrograma(idProg) {
  const p = await buscarPrograma(idProg);
  if (!p) return String(idProg || '');
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
      programaDescr: await descrPrograma(c.idProg),
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

module.exports = {
  listarMisCertificados,
  verificarCertificadoAlumno,
  htmlCertificadoPortal,
};
