const { fmtFechaSolo } = require('../utils/timezoneColombia');
const { sendMail, smtpConfigured } = require('./mail');
const { resolverRemitentePortalCorreo } = require('./portalMailFrom');
const { fmtMoney } = require('./reciboHtmlShared');

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nombreAlumno(a) {
  if (!a) return '';
  return [a.apellido1, a.apellido2, a.nombre1, a.nombre2].filter(Boolean).join(' ').trim();
}

function destinatarioAlumno(alumno, solicitud) {
  const mail = String(alumno?.correo || solicitud?.emailNotificado || '').trim().toLowerCase();
  return mail || null;
}

function correosHabilitados(enviarCorreosAlumno) {
  return enviarCorreosAlumno !== false;
}

async function enviarCorreoSolicitudAprobada({
  alumno,
  solicitud,
  ingreso,
  curso,
  textos,
  enviarCorreosAlumno = true,
}) {
  if (!correosHabilitados(enviarCorreosAlumno)) {
    return { enviado: false, motivo: 'correos_desactivados' };
  }
  if (!smtpConfigured()) return { enviado: false, motivo: 'smtp_no_configurado' };
  const to = destinatarioAlumno(alumno, solicitud);
  if (!to) return { enviado: false, motivo: 'sin_correo' };

  const { from, nombreCea } = await resolverRemitentePortalCorreo();
  const nombre = nombreAlumno(alumno) || String(solicitud.numDoc);
  const cursoNom = curso?.nombreProg || solicitud.idPrograma;
  const cuerpoExtra = textos?.mensajeAprobado || 'Su pago fue verificado correctamente.';
  const recibo = ingreso?.numRecibo ? ` Recibo N.º ${ingreso.numRecibo}.` : '';

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:560px">
      <h2 style="color:#047857;margin:0 0 12px">Pago confirmado — ${escHtml(nombreCea)}</h2>
      <p>Hola <strong>${escHtml(nombre)}</strong>,</p>
      <p>${escHtml(cuerpoExtra)}</p>
      <ul style="line-height:1.6">
        <li><strong>Curso:</strong> ${escHtml(cursoNom)}</li>
        <li><strong>Valor:</strong> ${escHtml(fmtMoney(solicitud.montoCop))}</li>
        <li><strong>Referencia:</strong> ${escHtml(solicitud.referenciaBancaria)}</li>
        <li><strong>Fecha revisión:</strong> ${escHtml(fmtFechaSolo(solicitud.fechaRevision || new Date()))}</li>
      </ul>
      <p>${escHtml(recibo)} Ya puede obtener su certificado según las reglas del curso en el aula virtual.</p>
      <p style="color:#64748b;font-size:13px">Este mensaje es informativo. No responda a este correo.</p>
    </div>`;

  await sendMail({
    to,
    from,
    subject: `${nombreCea} — Pago de curso virtual confirmado`,
    html,
  });
  return { enviado: true };
}

async function enviarCorreoSolicitudRechazada({
  alumno,
  solicitud,
  curso,
  textos,
  motivo,
  enviarCorreosAlumno = true,
}) {
  if (!correosHabilitados(enviarCorreosAlumno)) {
    return { enviado: false, motivo: 'correos_desactivados' };
  }
  if (!smtpConfigured()) return { enviado: false, motivo: 'smtp_no_configurado' };
  const to = destinatarioAlumno(alumno, solicitud);
  if (!to) return { enviado: false, motivo: 'sin_correo' };

  const { from, nombreCea } = await resolverRemitentePortalCorreo();
  const nombre = nombreAlumno(alumno) || String(solicitud.numDoc);
  const cursoNom = curso?.nombreProg || solicitud.idPrograma;
  const intro = textos?.mensajeRechazado || 'No pudimos verificar su comprobante de pago.';

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:560px">
      <h2 style="color:#b45309;margin:0 0 12px">Pago no verificado — ${escHtml(nombreCea)}</h2>
      <p>Hola <strong>${escHtml(nombre)}</strong>,</p>
      <p>${escHtml(intro)}</p>
      <ul style="line-height:1.6">
        <li><strong>Curso:</strong> ${escHtml(cursoNom)}</li>
        <li><strong>Referencia enviada:</strong> ${escHtml(solicitud.referenciaBancaria)}</li>
      </ul>
      <p style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px">
        <strong>Motivo del rechazo:</strong><br>${escHtml(motivo)}
      </p>
      <p>Puede ingresar nuevamente al portal, realizar el pago y enviar una nueva solicitud con el comprobante correcto.</p>
      <p style="color:#64748b;font-size:13px">Este mensaje es informativo. No responda a este correo.</p>
    </div>`;

  await sendMail({
    to,
    from,
    subject: `${nombreCea} — Comprobante de pago no verificado`,
    html,
  });
  return { enviado: true };
}

module.exports = {
  enviarCorreoSolicitudAprobada,
  enviarCorreoSolicitudRechazada,
};
