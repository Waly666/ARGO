const Certificado = require('../models/Certificado');
const DatosAlumno = require('../models/DatosAlumno');
const { numDocQuery } = require('../utils/numDoc');
const { fmtFechaSolo } = require('../utils/timezoneColombia');
const { resolverBasePortal } = require('../utils/portalPublicUrl');
const { publicOriginFromReq } = require('../utils/publicOrigin');
const { sendMail, smtpConfigured } = require('./mail');
const { obtenerConfigPortalPublica, obtenerConfigAula } = require('./aulaVirtualPortal');
const { armarDatosCertificado } = require('./certificadoRenderData');
const { generarHtmlCertificado } = require('./certificadoRender');
const { launchBrowser, htmlToPdfBuffer } = require('./htmlToPdf');

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nombreCompleto(alumno) {
  if (!alumno) return '';
  return [alumno.apellido1, alumno.apellido2, alumno.nombre1, alumno.nombre2]
    .filter(Boolean)
    .join(' ')
    .trim();
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

function resolverPublicOrigin(opts = {}) {
  const fromReq = opts.req ? publicOriginFromReq(opts.req) : null;
  const portal = resolverBasePortal({
    portalBaseUrl: opts.portalBaseUrl,
    origin: opts.origin || opts.req?.get?.('origin'),
  });
  const env = String(process.env.PUBLIC_URL || process.env.AULA_VIRTUAL_PUBLIC_URL || '').trim();
  return (fromReq || portal || env || 'http://localhost:3000').replace(/\/+$/, '');
}

async function mailFromHeader(nombreCea) {
  const cea = nombreCea || 'Finstruvial';
  const aula = await obtenerConfigAula().catch(() => null);
  const fromCustom = aula?.emailConfirmacion?.trim() || null;
  return fromCustom ? `"${cea}" <${fromCustom}>` : undefined;
}

async function generarPdfCertificado(certId, publicOrigin) {
  const data = await armarDatosCertificado(certId);
  if (!data) return null;
  const html = await generarHtmlCertificado(data, {
    publicOrigin,
    embedLocalAssets: true,
  });
  const browser = await launchBrowser();
  try {
    return await htmlToPdfBuffer(browser, html);
  } finally {
    await browser.close().catch(() => {});
  }
}

function codigoVerificacionCert(cert) {
  return String(cert.codVerificacion || cert.codigoCert || cert._id || '').trim();
}

function urlConsultaCertificados(publicOrigin) {
  const base = String(publicOrigin || '').trim().replace(/\/+$/, '');
  if (!base) return '';
  return `${base}/consulta-certificados`;
}

function armarContenidoCorreo({ nombreCea, nombre, curso, fechaEmision, codigoRef, numDoc, linkVerificacion, contactoEmail, contactoTelefono }) {
  const fechaTxt = fmtFechaSolo(fechaEmision) || '—';
  const subject = `${nombreCea} — Certificado de formación${curso ? `: ${curso}` : ''}`;

  const textParts = [
    nombre ? `Estimado(a) ${nombre},` : 'Estimado(a) alumno(a),',
    '',
    `${nombreCea} le informa que su certificado de formación ha sido emitido exitosamente.`,
    '',
    curso ? `Programa / capacitación: ${curso}` : null,
    `Fecha de emisión: ${fechaTxt}`,
    codigoRef ? `Código de verificación: ${codigoRef}` : null,
    numDoc != null ? `Documento del titular: ${numDoc}` : null,
    '',
    'Adjunto encontrará el certificado en formato PDF.',
    linkVerificacion
      ? `Puede verificar la autenticidad de su certificado en línea: ${linkVerificacion}`
      : null,
    '',
    'Si tiene alguna inquietud, comuníquese con nuestro equipo de atención.',
    contactoEmail ? `Correo: ${contactoEmail}` : null,
    contactoTelefono ? `Teléfono: ${contactoTelefono}` : null,
    '',
    `Atentamente,`,
    nombreCea,
  ].filter((line) => line != null);

  const html = `
    <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.55;max-width:640px">
      <p>${nombre ? `Estimado(a) <strong>${escHtml(nombre)}</strong>,` : 'Estimado(a) alumno(a),'}</p>
      <p><strong>${escHtml(nombreCea)}</strong> le informa que su <strong>certificado de formación</strong> ha sido emitido exitosamente.</p>
      <table style="margin:1rem 0;border-collapse:collapse;width:100%;font-size:0.95rem">
        ${curso ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top">Programa</td><td style="padding:6px 0"><strong>${escHtml(curso)}</strong></td></tr>` : ''}
        <tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top">Fecha de emisión</td><td style="padding:6px 0">${escHtml(fechaTxt)}</td></tr>
        ${codigoRef ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top">Código de verificación</td><td style="padding:6px 0"><strong>${escHtml(codigoRef)}</strong></td></tr>` : ''}
        ${numDoc != null ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top">Documento</td><td style="padding:6px 0">${escHtml(numDoc)}</td></tr>` : ''}
      </table>
      <p>Adjunto encontrará su certificado en formato <strong>PDF</strong>.</p>
      ${
        linkVerificacion
          ? `<p style="margin:1.5rem 0">
        <a href="${escHtml(linkVerificacion)}" style="background:#0ea5e9;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
          Verificar certificado en línea
        </a>
      </p>
      <p style="font-size:0.85rem;color:#64748b;word-break:break-all">${escHtml(linkVerificacion)}</p>
      <p style="font-size:0.9rem;color:#475569">En el portal podrá consultar sus certificados ingresando su número de documento.</p>`
          : ''
      }
      <p style="margin-top:1.5rem;font-size:0.9rem;color:#475569">Si tiene alguna inquietud, comuníquese con nuestro equipo de atención${
        contactoEmail || contactoTelefono
          ? `: ${[contactoEmail, contactoTelefono].filter(Boolean).map(escHtml).join(' · ')}`
          : '.'
      }</p>
      <p style="margin-top:2rem;color:#64748b">Atentamente,<br><strong>${escHtml(nombreCea)}</strong></p>
    </div>
  `.trim();

  return { subject, text: textParts.join('\n'), html };
}

/**
 * Genera el PDF y envía el certificado al correo del alumno (DatosAlumno.correo).
 * No lanza errores: devuelve { enviado, motivo?, email? }.
 */
async function enviarCertificadoPorCorreo(certId, opts = {}) {
  if (!smtpConfigured()) {
    return { enviado: false, motivo: 'smtp_no_configurado' };
  }

  const cert = await Certificado.findById(certId).lean();
  if (!cert) return { enviado: false, motivo: 'certificado_no_encontrado' };
  if (cert.estado === 'anulado') return { enviado: false, motivo: 'certificado_anulado' };

  const alumno = await DatosAlumno.findOne(numDocQuery(cert.numDoc)).lean();
  const email = String(alumno?.correo || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { enviado: false, motivo: 'sin_correo_alumno', numDoc: cert.numDoc };
  }

  const portal = await obtenerConfigPortalPublica().catch(() => ({}));
  const nombreCea = String(portal?.nombreCea || 'Finstruvial').trim() || 'Finstruvial';
  const publicOrigin = resolverPublicOrigin(opts);
  const linkVerificacion = urlConsultaCertificados(publicOrigin);
  const codigoRef = codigoVerificacionCert(cert);
  const nombre = nombreCompleto(alumno);
  const curso = String(cert.encabezado || '').trim();
  const { subject, text, html } = armarContenidoCorreo({
    nombreCea,
    nombre,
    curso,
    fechaEmision: cert.fechaEmision || cert.createdAt,
    codigoRef,
    numDoc: cert.numDoc,
    linkVerificacion,
    contactoEmail: portal?.email || '',
    contactoTelefono: portal?.telefono || '',
  });

  let pdfBuffer;
  try {
    pdfBuffer = await generarPdfCertificado(certId, publicOrigin);
  } catch (e) {
    console.error('[certificadoEmail] Error generando PDF:', e?.message || e);
    return { enviado: false, motivo: 'error_pdf', email };
  }
  if (!pdfBuffer?.length) {
    return { enviado: false, motivo: 'pdf_vacio', email };
  }

  const filename = `${sanitizarNombreArchivo(`certificado-${codigoRef || cert.numDoc}`)}.pdf`;

  try {
    await sendMail({
      to: email,
      subject,
      text,
      html,
      from: await mailFromHeader(nombreCea),
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  } catch (e) {
    console.error('[certificadoEmail] Error enviando correo:', e?.message || e);
    return { enviado: false, motivo: 'error_envio', email };
  }

  console.info(
    `[certificadoEmail] Certificado ${codigoRef || certId} enviado a ${email} (${nombreCea})`,
  );
  return { enviado: true, email };
}

/** Programa el envío sin bloquear la emisión del certificado. */
function programarEnvioCertificadoPorCorreo(certId, opts = {}) {
  if (!certId) return;
  setImmediate(() => {
    enviarCertificadoPorCorreo(certId, opts).catch((e) => {
      console.error('[certificadoEmail] Error inesperado:', e?.message || e);
    });
  });
}

module.exports = {
  enviarCertificadoPorCorreo,
  programarEnvioCertificadoPorCorreo,
  codigoVerificacionCert,
  urlConsultaCertificados,
};
