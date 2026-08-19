const DatosAlumno = require('../models/DatosAlumno');
const { numDocQuery } = require('../utils/numDoc');
const { fmtFechaSolo } = require('../utils/timezoneColombia');
const { esComprobanteAnulado } = require('../utils/comprobanteEstado');
const { esIngresoAlumno } = require('../utils/ingresoClasificacion');
const { sendMail, smtpConfigured } = require('./mail');
const { obtenerConfigPortalPublica, obtenerConfigAula } = require('./aulaVirtualPortal');
const { obtenerConfigEnvioCorreosAlumno } = require('./configEnvioCorreosAlumno');
const { armarRecibo } = require('../controllers/reciboController');
const { generarHtmlIngreso } = require('./comprobanteHtml');
const { launchBrowser, htmlToPdfBuffer } = require('./htmlToPdf');
const { fmtMoney } = require('./reciboHtmlShared');

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

async function mailFromHeader(nombreCea) {
  const cea = nombreCea || 'CEA';
  const aula = await obtenerConfigAula().catch(() => null);
  const fromCustom = aula?.emailConfirmacion?.trim() || null;
  return fromCustom ? `"${cea}" <${fromCustom}>` : undefined;
}

async function generarPdfRecibo(ingresoId) {
  const data = await armarRecibo(ingresoId);
  if (!data) return null;
  const html = await generarHtmlIngreso(data);
  const browser = await launchBrowser();
  try {
    return await htmlToPdfBuffer(browser, html);
  } finally {
    await browser.close().catch(() => {});
  }
}

function etiquetaTipoAbono(tipoAbono) {
  return tipoAbono === 'total' ? 'Pago total' : 'Abono parcial';
}

function armarContenidoCorreo({
  nombreCea,
  nombre,
  numeroRecibo,
  valor,
  formaPago,
  concepto,
  fechaPago,
  tipoAbono,
  detalle,
  contactoEmail,
  contactoTelefono,
}) {
  const fechaTxt = fmtFechaSolo(fechaPago) || '—';
  const valorTxt = fmtMoney(valor);
  const tipoTxt = etiquetaTipoAbono(tipoAbono);
  const subject = `${nombreCea} — Comprobante de pago${numeroRecibo ? ` ${numeroRecibo}` : ''}`;

  const detalleLineas =
    Array.isArray(detalle) && detalle.length
      ? detalle.map((d) => `  · ${d.descripcion || 'Ítem'}: ${fmtMoney(d.valor)}`).join('\n')
      : null;

  const textParts = [
    nombre ? `Estimado(a) ${nombre},` : 'Estimado(a) alumno(a),',
    '',
    `${nombreCea} confirma el registro de su pago. Adjunto encontrará el comprobante de ingreso en formato PDF.`,
    '',
    numeroRecibo ? `Comprobante N°: ${numeroRecibo}` : null,
    `Valor pagado: ${valorTxt}`,
    `Tipo de pago: ${tipoTxt}`,
    formaPago ? `Forma de pago: ${formaPago}` : null,
    concepto ? `Concepto: ${concepto}` : null,
    detalleLineas ? `Detalle:\n${detalleLineas}` : null,
    `Fecha del pago: ${fechaTxt}`,
    '',
    'Conserve este comprobante como soporte de su pago.',
    '',
    'Si tiene alguna inquietud, comuníquese con nuestro equipo de atención.',
    contactoEmail ? `Correo: ${contactoEmail}` : null,
    contactoTelefono ? `Teléfono: ${contactoTelefono}` : null,
    '',
    'Atentamente,',
    nombreCea,
  ].filter((line) => line != null);

  const detalleHtml =
    Array.isArray(detalle) && detalle.length
      ? `<tr><td colspan="2" style="padding:8px 0 4px;color:#64748b;vertical-align:top;font-size:0.85rem">Detalle del pago</td></tr>${detalle
          .map(
            (d) =>
              `<tr><td style="padding:4px 12px 4px 0;color:#475569;vertical-align:top">${escHtml(d.descripcion || 'Ítem')}</td><td style="padding:4px 0;font-weight:700">${escHtml(fmtMoney(d.valor))}</td></tr>`,
          )
          .join('')}`
      : '';

  const html = `
    <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.55;max-width:640px">
      <p>${nombre ? `Estimado(a) <strong>${escHtml(nombre)}</strong>,` : 'Estimado(a) alumno(a),'}</p>
      <p><strong>${escHtml(nombreCea)}</strong> confirma el registro de su pago. Adjunto encontrará el <strong>comprobante de ingreso</strong> en formato PDF.</p>
      <table style="margin:1rem 0;border-collapse:collapse;width:100%;font-size:0.95rem">
        ${numeroRecibo ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top">Comprobante N°</td><td style="padding:6px 0"><strong>${escHtml(numeroRecibo)}</strong></td></tr>` : ''}
        <tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top">Valor pagado</td><td style="padding:6px 0"><strong>${escHtml(valorTxt)}</strong></td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top">Tipo de pago</td><td style="padding:6px 0">${escHtml(tipoTxt)}</td></tr>
        ${formaPago ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top">Forma de pago</td><td style="padding:6px 0">${escHtml(formaPago)}</td></tr>` : ''}
        ${concepto ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top">Concepto</td><td style="padding:6px 0">${escHtml(concepto)}</td></tr>` : ''}
        ${detalleHtml}
        <tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top">Fecha del pago</td><td style="padding:6px 0">${escHtml(fechaTxt)}</td></tr>
      </table>
      <p>Conserve este comprobante como soporte de su pago.</p>
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
 * Genera el PDF del recibo y lo envía al correo del alumno (DatosAlumno.correo).
 * No lanza errores: devuelve { enviado, motivo?, email? }.
 */
async function enviarReciboPorCorreo(ingresoId, opts = {}) {
  const cfgEnvio = await obtenerConfigEnvioCorreosAlumno();
  if (!cfgEnvio.enviarComprobantesIngreso) {
    return { enviado: false, motivo: 'envio_desactivado' };
  }

  if (!smtpConfigured()) {
    return { enviado: false, motivo: 'smtp_no_configurado' };
  }

  const data = await armarRecibo(ingresoId);
  if (!data) return { enviado: false, motivo: 'ingreso_no_encontrado' };

  const ing = data.ingreso;
  if (esComprobanteAnulado(ing)) return { enviado: false, motivo: 'ingreso_anulado' };
  if (!esIngresoAlumno(ing)) return { enviado: false, motivo: 'no_es_ingreso_alumno' };

  const alumno = ing.numDoc
    ? await DatosAlumno.findOne(numDocQuery(ing.numDoc)).lean()
    : null;
  const email = String(alumno?.correo || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { enviado: false, motivo: 'sin_correo_alumno', numDoc: ing.numDoc };
  }

  const portal = await obtenerConfigPortalPublica().catch(() => ({}));
  const nombreCea = String(portal?.nombreCea || 'CEA').trim() || 'CEA';
  const nombre = nombreCompleto(alumno) || data.alumno?.nombreCompleto || '';
  const numeroRecibo = data.numeroRecibo || ing.numRecibo || '';
  const concepto =
    String(ing.concepto || '').trim() ||
    String(data.liquidacion?.descripcion || '').trim() ||
    (Array.isArray(data.detalle) && data.detalle.length
      ? `Varios servicios (${data.detalle.length})`
      : '');

  const { subject, text, html } = armarContenidoCorreo({
    nombreCea,
    nombre,
    numeroRecibo,
    valor: ing.valor,
    formaPago: ing.formaPago || ing.tipoPagoDescr || '',
    concepto,
    fechaPago: ing.fecha || ing.createdAt,
    tipoAbono: ing.tipoAbono,
    detalle: data.detalle,
    contactoEmail: portal?.email || '',
    contactoTelefono: portal?.telefono || '',
  });

  let pdfBuffer;
  try {
    pdfBuffer = await generarPdfRecibo(ingresoId);
  } catch (e) {
    console.error('[reciboEmail] Error generando PDF:', e?.message || e);
    return { enviado: false, motivo: 'error_pdf', email };
  }
  if (!pdfBuffer?.length) {
    return { enviado: false, motivo: 'pdf_vacio', email };
  }

  const filename = `${sanitizarNombreArchivo(`recibo-${numeroRecibo || ingresoId}`)}.pdf`;

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
    console.error('[reciboEmail] Error enviando correo:', e?.message || e);
    return { enviado: false, motivo: 'error_envio', email };
  }

  console.info(
    `[reciboEmail] Recibo ${numeroRecibo || ingresoId} enviado a ${email} (${nombreCea})`,
  );
  return { enviado: true, email };
}

/** Programa el envío sin bloquear el registro del ingreso. */
function programarEnvioReciboPorCorreo(ingresoId, opts = {}) {
  if (!ingresoId) return;
  setImmediate(() => {
    enviarReciboPorCorreo(ingresoId, opts).catch((e) => {
      console.error('[reciboEmail] Error inesperado:', e?.message || e);
    });
  });
}

module.exports = {
  enviarReciboPorCorreo,
  programarEnvioReciboPorCorreo,
};
