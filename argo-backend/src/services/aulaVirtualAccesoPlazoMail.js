const { sendMail, smtpConfigured } = require('./mail');
const { obtenerConfigAula } = require('./aulaVirtualPortal');

function resolverBasePortal() {
  const env = String(process.env.AULA_VIRTUAL_PORTAL_URL || process.env.PORTAL_AULA_URL || '').trim();
  if (env) return env.replace(/\/+$/, '');
  return '';
}

async function mailFromHeader() {
  const aula = await obtenerConfigAula().catch(() => null);
  const cea = String(aula?.nombreEmpresa || 'CEA').trim() || 'CEA';
  const fromCustom = aula?.emailConfirmacion?.trim() || null;
  return fromCustom ? `"${cea}" <${fromCustom}>` : undefined;
}

function fmtFecha(d) {
  if (!d) return '—';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '—';
  return x.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
}

async function enviarAvisoVencimientoAcceso({
  email,
  nombreAlumno,
  nombreCurso,
  diasRestantes,
  fechaVencimiento,
}) {
  if (!email || !smtpConfigured()) return { enviado: false, motivo: 'smtp_no_configurado' };
  const cea = String((await obtenerConfigAula().catch(() => null))?.nombreEmpresa || 'CEA').trim();
  const base = resolverBasePortal();
  const loginUrl = base ? `${base}/login` : '';
  const dias = Math.max(0, Number(diasRestantes) || 0);
  const vence = fmtFecha(fechaVencimiento);
  const subject =
    dias <= 1
      ? `${cea} — Su acceso al curso «${nombreCurso}» vence pronto`
      : `${cea} — Quedan ${dias} días de acceso al curso «${nombreCurso}»`;

  const text = [
    `Hola ${nombreAlumno || 'estudiante'},`,
    '',
    `Le recordamos que su acceso gratuito al curso «${nombreCurso}» vence el ${vence} (${dias === 1 ? 'mañana' : `en ${dias} días`}).`,
    '',
    'Si desea conservar su avance y obtener el certificado, complete el pago antes de esa fecha.',
    'Si no paga a tiempo, perderá el acceso y deberá matricularse de nuevo (se borrará el progreso del curso).',
    '',
    loginUrl ? `Ingrese al aula virtual: ${loginUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <p>Hola <strong>${nombreAlumno || 'estudiante'}</strong>,</p>
    <p>Su acceso <strong>sin pago</strong> al curso <strong>«${nombreCurso}»</strong> vence el <strong>${vence}</strong>
    (${dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`}).</p>
    <p>Si desea conservar su avance y certificarse, <strong>complete el pago</strong> antes de esa fecha.</p>
    <p style="color:#b45309">Si no paga a tiempo, perderá el acceso y deberá matricularse de nuevo; se eliminará el progreso del curso.</p>
    ${loginUrl ? `<p><a href="${loginUrl}" style="background:#0ea5e9;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Ir al aula virtual</a></p>` : ''}
  `.trim();

  await sendMail({ to: email, subject, text, html, from: await mailFromHeader() });
  return { enviado: true };
}

async function enviarAccesoExpirado({ email, nombreAlumno, nombreCurso }) {
  if (!email || !smtpConfigured()) return { enviado: false, motivo: 'smtp_no_configurado' };
  const cea = String((await obtenerConfigAula().catch(() => null))?.nombreEmpresa || 'CEA').trim();
  const base = resolverBasePortal();
  const loginUrl = base ? `${base}/cursos` : '';
  const subject = `${cea} — Acceso expirado al curso «${nombreCurso}»`;

  const text = [
    `Hola ${nombreAlumno || 'estudiante'},`,
    '',
    `Su periodo de acceso gratuito al curso «${nombreCurso}» ha finalizado sin pago registrado.`,
    'Se eliminó su matrícula y progreso en ese curso. Puede volver a matricularse desde el catálogo si desea retomarlo.',
    '',
    loginUrl ? `Catálogo: ${loginUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <p>Hola <strong>${nombreAlumno || 'estudiante'}</strong>,</p>
    <p>Su periodo de acceso gratuito al curso <strong>«${nombreCurso}»</strong> finalizó sin pago registrado.</p>
    <p>Se eliminó su matrícula y progreso en ese curso. Puede volver a matricularse desde el catálogo.</p>
    ${loginUrl ? `<p><a href="${loginUrl}">Ver cursos</a></p>` : ''}
  `.trim();

  await sendMail({ to: email, subject, text, html, from: await mailFromHeader() });
  return { enviado: true };
}

module.exports = {
  enviarAvisoVencimientoAcceso,
  enviarAccesoExpirado,
};
