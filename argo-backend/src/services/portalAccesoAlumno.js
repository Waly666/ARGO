const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const UsuarioPortal = require('../models/UsuarioPortal');
const DatosAlumno = require('../models/DatosAlumno');
const { parseNumDoc } = require('../utils/numDoc');
const { TIPO_VIRTUAL, normalizarTipoAlumno } = require('../constants/tipoAlumno');
const { sendMail, smtpConfigured } = require('./mail');
const { obtenerConfigAula } = require('./aulaVirtualPortal');
const { resolverBasePortal } = require('../utils/portalPublicUrl');

function generarPasswordPortal() {
  return crypto.randomBytes(4).toString('hex');
}

function nombreCompleto(a) {
  if (!a) return '';
  return [a.apellido1, a.apellido2, a.nombre1, a.nombre2].filter(Boolean).join(' ').trim();
}

/**
 * Si el alumno es Virtual y aún no tiene UsuarioPortal, crea cuenta con clave
 * aleatoria, intenta enviar correo y devuelve credenciales para mostrar en ERP.
 * No regenera contraseña si la cuenta ya existe. No modifica origen.
 */
async function provisionarAccesoPortalSiVirtual(alumno, { portalBaseUrl, origin } = {}) {
  if (!alumno || normalizarTipoAlumno(alumno.tipoAlumno) !== TIPO_VIRTUAL) {
    return null;
  }

  const numDoc = parseNumDoc(alumno.numDoc);
  if (numDoc == null) return null;

  const existente = await UsuarioPortal.findOne({ numDoc }).lean();
  if (existente) {
    return {
      creado: false,
      yaExiste: true,
      email: existente.email,
      numDoc,
      message: `El alumno ya tiene acceso al aula virtual (${existente.email}).`,
    };
  }

  const mail = String(alumno.correo || '').trim().toLowerCase();
  if (!mail || !mail.includes('@')) {
    return {
      creado: false,
      pendienteCorreo: true,
      numDoc,
      message:
        'Marcado como Virtual, pero falta un correo válido en la ficha para crear el usuario del portal.',
    };
  }

  const dupMail = await UsuarioPortal.findOne({ email: mail }).lean();
  if (dupMail && Number(dupMail.numDoc) !== numDoc) {
    return {
      creado: false,
      conflicto: true,
      email: mail,
      numDoc,
      message: 'Ese correo ya está asociado a otro usuario del portal. Use otro correo o revise Usuarios portal.',
    };
  }

  const password = generarPasswordPortal();
  const passwordHash = await bcrypt.hash(password, 10);
  await UsuarioPortal.create({
    email: mail,
    passwordHash,
    numDoc,
    activo: true,
  });

  if (!alumno.correo) {
    await DatosAlumno.updateOne({ _id: alumno._id }, { $set: { correo: mail } });
  }

  let correoEnviado = false;
  let correoError = null;
  if (smtpConfigured()) {
    try {
      await enviarCredencialesPortal({
        email: mail,
        password,
        alumno,
        portalBaseUrl,
        origin,
      });
      correoEnviado = true;
    } catch (e) {
      correoError = e?.message || 'No se pudo enviar el correo';
    }
  }

  return {
    creado: true,
    yaExiste: false,
    email: mail,
    password,
    numDoc,
    correoEnviado,
    correoError,
    message: correoEnviado
      ? `Acceso al aula virtual creado. Credenciales enviadas a ${mail}.`
      : `Acceso al aula virtual creado. Anote la clave (el correo ${smtpConfigured() ? 'no pudo enviarse' : 'no está configurado'}).`,
  };
}

async function enviarCredencialesPortal({ email, password, alumno, portalBaseUrl, origin }) {
  const aula = await obtenerConfigAula().catch(() => null);
  const cea = String(aula?.nombreEmpresa || 'Finstruvial').trim() || 'Finstruvial';
  const fromCustom = aula?.emailConfirmacion?.trim() || null;
  const fromHeader = fromCustom ? `"${cea}" <${fromCustom}>` : undefined;
  const base = resolverBasePortal({ portalBaseUrl, origin });
  const loginUrl = base ? `${base.replace(/\/+$/, '')}/login` : '';
  const nombre = nombreCompleto(alumno) || 'estudiante';

  const subject = `${cea} — Acceso al aula virtual`;
  const text = [
    `Hola ${nombre},`,
    ``,
    `Se creó su acceso al aula virtual de ${cea}.`,
    ``,
    `Usuario (correo): ${email}`,
    `Contraseña temporal: ${password}`,
    ``,
    loginUrl ? `Ingrese en: ${loginUrl}` : `Ingrese en el portal del aula virtual.`,
    ``,
    `Le recomendamos cambiar la contraseña después del primer acceso.`,
  ].join('\n');

  const html = `
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Se creó su acceso al <strong>aula virtual</strong> de <strong>${cea}</strong>.</p>
    <p>
      <strong>Usuario (correo):</strong> ${email}<br/>
      <strong>Contraseña temporal:</strong>
      <span style="font-size:1.25rem;font-weight:bold;letter-spacing:0.08em">${password}</span>
    </p>
    ${
      loginUrl
        ? `<p><a href="${loginUrl}" style="background:#0ea5e9;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Entrar al aula</a></p>`
        : ''
    }
    <p style="color:#64748b;font-size:0.9rem">Le recomendamos cambiar la contraseña después del primer acceso.</p>
  `.trim();

  await sendMail({ to: email, subject, text, html, from: fromHeader });
}

module.exports = {
  provisionarAccesoPortalSiVirtual,
};
