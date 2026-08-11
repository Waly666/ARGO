const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const RegistroPortalPendiente = require('../models/RegistroPortalPendiente');
const { sendMail } = require('./mail');
const { validarDatosRegistroPortal, crearCuentaPortal, maskEmail } = require('./aulaVirtualAuth');
const { portalEmailVerifyEnabled } = require('../config/security');
const { obtenerConfigAula } = require('./aulaVirtualPortal');
const { resolverBasePortal, buildActivacionUrl } = require('../utils/portalPublicUrl');
const { CANAL_CONSENTIMIENTO } = require('../constants/autorizacionTratamientoDatos');

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_INTENTOS = 5;

function generarCodigo() {
  return String(crypto.randomInt(100000, 999999));
}

function generarLinkToken() {
  return crypto.randomBytes(24).toString('hex');
}

function hashLinkToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function ttlMinutos() {
  return Math.round(CODE_TTL_MS / 60000);
}

async function mailFromHeader(nombreCea) {
  const cea = nombreCea || 'Finstruvial';
  const aula = await obtenerConfigAula().catch(() => null);
  const fromCustom = aula?.emailConfirmacion?.trim() || null;
  return fromCustom ? `"${cea}" <${fromCustom}>` : undefined;
}

async function enviarCodigoRegistro({ email, codigo, linkToken, pendingId, nombreCea, portalBaseUrl }) {
  const cea = nombreCea || 'Finstruvial';
  const base = resolverBasePortal({ portalBaseUrl });
  const link = buildActivacionUrl(base, '/registro/activar', {
    pendingId,
    linkToken,
  });

  const subject = `${cea} — Confirme su registro en el aula virtual`;
  const textParts = [
    `Hola,`,
    ``,
    `Para confirmar su registro en el aula virtual de ${cea} use el código:`,
    ``,
    `  ${codigo}`,
    ``,
  ];
  if (link) {
    textParts.push(`O abra este enlace (recomendado):`, link, ``);
  }
  textParts.push(
    `El código y el enlace vencen en ${ttlMinutos()} minutos. Si no solicitó este registro, ignore este mensaje.`,
  );
  const text = textParts.join('\n');

  const html = `
    <p>Hola,</p>
    <p>Para confirmar su registro en el aula virtual de <strong>${cea}</strong> use el código:</p>
    <p style="font-size:1.5rem;font-weight:bold;letter-spacing:0.2em">${codigo}</p>
    ${
      link
        ? `<p>O haga clic en el botón:</p>
    <p style="margin:1.5rem 0">
      <a href="${link}" style="background:#0ea5e9;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
        Activar mi cuenta
      </a>
    </p>
    <p style="font-size:0.85rem;color:#64748b;word-break:break-all">${link}</p>`
        : ''
    }
    <p>El código y el enlace vencen en ${ttlMinutos()} minutos. Si no solicitó este registro, ignore este mensaje.</p>
  `.trim();

  await sendMail({
    to: email,
    subject,
    text,
    html,
    from: await mailFromHeader(cea),
  });
}

async function solicitarRegistroPortal({ email, password, alumno, nombreCea, portalBaseUrl, consentimiento }) {
  if (!portalEmailVerifyEnabled()) {
    const err = new Error('Verificación de correo desactivada');
    err.status = 400;
    throw err;
  }

  const datos = await validarDatosRegistroPortal({ email, password, alumno });
  const codigo = generarCodigo();
  const linkToken = generarLinkToken();
  const codeHash = await bcrypt.hash(codigo, 10);
  const passwordHash = await bcrypt.hash(datos.pass, 10);
  const pendingId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await RegistroPortalPendiente.deleteMany({
    $or: [{ email: datos.mail }, { numDoc: datos.numDoc }],
  });

  await RegistroPortalPendiente.create({
    pendingId,
    email: datos.mail,
    passwordHash,
    numDoc: datos.numDoc,
    alumno: datos.alumnoPayload,
    codeHash,
    linkTokenHash: hashLinkToken(linkToken),
    expiresAt,
    consentimiento,
  });

  await enviarCodigoRegistro({
    email: datos.mail,
    codigo,
    linkToken,
    pendingId,
    nombreCea,
    portalBaseUrl,
  });

  return {
    step: 'verify_email',
    pendingId,
    email: maskEmail(datos.mail),
    expiresInMinutes: ttlMinutos(),
    message: `Enviamos un código y un enlace de verificación a ${maskEmail(datos.mail)}. Revise su bandeja de entrada y spam.`,
  };
}

async function cargarPendienteValido(pendingId) {
  const id = String(pendingId || '').trim();
  if (!id) {
    const err = new Error('Solicitud de registro no válida');
    err.status = 400;
    throw err;
  }

  const pending = await RegistroPortalPendiente.findOne({ pendingId: id });
  if (!pending) {
    const err = new Error('Solicitud de registro expirada o no encontrada. Vuelva a iniciar el registro.');
    err.status = 404;
    throw err;
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    await RegistroPortalPendiente.deleteOne({ _id: pending._id });
    const err = new Error('El código o enlace expiró. Solicite uno nuevo.');
    err.status = 410;
    throw err;
  }

  if (pending.intentosConfirmacion >= MAX_INTENTOS) {
    await RegistroPortalPendiente.deleteOne({ _id: pending._id });
    const err = new Error('Demasiados intentos fallidos. Inicie el registro de nuevo.');
    err.status = 429;
    throw err;
  }

  return pending;
}

async function confirmarRegistroPortal({ pendingId, codigo, linkToken }) {
  const code = String(codigo || '').trim();
  const token = String(linkToken || '').trim();
  const porCodigo = /^\d{6}$/.test(code);
  const porLink = token.length >= 32;

  if (!porCodigo && !porLink) {
    const err = new Error('Código o enlace de verificación inválido');
    err.status = 400;
    throw err;
  }

  const pending = await cargarPendienteValido(pendingId);

  let ok = false;
  if (porLink && pending.linkTokenHash) {
    ok = hashLinkToken(token) === pending.linkTokenHash;
  }
  if (!ok && porCodigo) {
    ok = await bcrypt.compare(code, pending.codeHash);
  }

  if (!ok) {
    pending.intentosConfirmacion += 1;
    await pending.save();
    const err = new Error(porLink && !porCodigo ? 'Enlace inválido o ya usado' : 'Código incorrecto');
    err.status = 400;
    throw err;
  }

  const out = await crearCuentaPortal({
    email: pending.email,
    passwordHash: pending.passwordHash,
    alumno: pending.alumno,
    consentimiento: pending.consentimiento,
  });

  await RegistroPortalPendiente.deleteOne({ _id: pending._id });
  return out;
}

async function reenviarCodigoRegistro({ pendingId, nombreCea, portalBaseUrl }) {
  const pending = await cargarPendienteValido(pendingId);

  const codigo = generarCodigo();
  const linkToken = generarLinkToken();
  pending.codeHash = await bcrypt.hash(codigo, 10);
  pending.linkTokenHash = hashLinkToken(linkToken);
  pending.expiresAt = new Date(Date.now() + CODE_TTL_MS);
  pending.intentosConfirmacion = 0;
  await pending.save();

  await enviarCodigoRegistro({
    email: pending.email,
    codigo,
    linkToken,
    pendingId: pending.pendingId,
    nombreCea,
    portalBaseUrl,
  });

  return {
    step: 'verify_email',
    pendingId: pending.pendingId,
    email: maskEmail(pending.email),
    expiresInMinutes: ttlMinutos(),
    message: `Nuevo código y enlace enviados a ${maskEmail(pending.email)}.`,
  };
}

module.exports = {
  solicitarRegistroPortal,
  confirmarRegistroPortal,
  reenviarCodigoRegistro,
};
