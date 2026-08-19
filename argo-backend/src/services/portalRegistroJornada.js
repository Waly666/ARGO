const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const DatosAlumno = require('../models/DatosAlumno');
const RegistroJornadaPendiente = require('../models/RegistroJornadaPendiente');
const { parseNumDoc, numDocQuery } = require('../utils/numDoc');
const { TIPO_JORNADAS_CAPACITACION } = require('../constants/tipoAlumno');
const { ORIGEN_WEB } = require('../constants/origenAlumno');
const { sendMail, smtpConfigured } = require('./mail');
const { obtenerConfigAula } = require('./aulaVirtualPortal');
const { resolverBasePortal, buildActivacionUrl } = require('../utils/portalPublicUrl');
const {
  buildJornadaAlumnoQrPayload,
  nombreDesdeAlumno,
  generarQrJornadaPngBuffer,
} = require('./jornadaAlumnoQr');
const { CANAL_CONSENTIMIENTO } = require('../constants/autorizacionTratamientoDatos');
const {
  exigirAutorizacionDatos,
  camposConsentimientoAlumno,
} = require('./autorizacionTratamientoDatos');

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

function nombreMayusculas(v) {
  return String(v || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function buildAlumnoPayload(alumno, numDoc) {
  return {
    numDoc,
    tipoDoc: alumno?.tipoDoc || '1',
    expedida: alumno?.expedida || '',
    empresaId: alumno?.empresaId || null,
    apellido1: nombreMayusculas(alumno?.apellido1),
    apellido2: nombreMayusculas(alumno?.apellido2),
    nombre1: nombreMayusculas(alumno?.nombre1),
    nombre2: nombreMayusculas(alumno?.nombre2),
    fechaNac: alumno?.fechaNac || '',
    genero: alumno?.genero || '',
    celular: alumno?.celular || '',
    direccion: alumno?.direccion || '',
    munOrigen: alumno?.munOrigen || '',
    codMunicipio: alumno?.codMunicipio || '',
  };
}

async function mailFromHeader(nombreCea) {
  const cea = nombreCea || 'CEA';
  const aula = await obtenerConfigAula().catch(() => null);
  const fromCustom = aula?.emailConfirmacion?.trim() || null;
  return fromCustom ? `"${cea}" <${fromCustom}>` : undefined;
}

/** Valida datos de inscripción a jornadas (sin cuenta portal / sin contraseña). */
async function validarDatosRegistroJornada({ email, alumno }) {
  const mail = String(email || '').trim().toLowerCase();
  if (!mail || !mail.includes('@')) {
    const err = new Error('Correo electrónico obligatorio');
    err.status = 400;
    throw err;
  }

  const numDoc = parseNumDoc(alumno?.numDoc);
  if (numDoc == null) {
    const err = new Error('Número de documento inválido');
    err.status = 400;
    throw err;
  }

  const da = await DatosAlumno.findOne(numDocQuery(numDoc)).lean();
  if (!da) {
    const payload = buildAlumnoPayload(alumno, numDoc);
    if (!payload.apellido1 || !payload.nombre1) {
      const err = new Error('Apellido y nombre son obligatorios para alumnos nuevos');
      err.status = 400;
      throw err;
    }
    return { mail, numDoc, alumnoPayload: payload, alumnoExistente: false };
  }

  return {
    mail,
    numDoc,
    alumnoPayload: buildAlumnoPayload(
      {
        ...alumno,
        tipoDoc: alumno?.tipoDoc || da.tipoDoc,
        expedida: alumno?.expedida || da.expedida,
        apellido1: alumno?.apellido1 || da.apellido1,
        apellido2: alumno?.apellido2 || da.apellido2,
        nombre1: alumno?.nombre1 || da.nombre1,
        nombre2: alumno?.nombre2 || da.nombre2,
        fechaNac: alumno?.fechaNac || (da.fechaNac ? new Date(da.fechaNac).toISOString().slice(0, 10) : ''),
        genero: alumno?.genero || da.genero,
        celular: alumno?.celular || da.celular,
        direccion: alumno?.direccion || da.direccion,
        munOrigen: alumno?.munOrigen || da.munOrigen,
        codMunicipio: alumno?.codMunicipio || da.codMunicipio,
        empresaId: alumno?.empresaId || da.empresaId,
      },
      numDoc,
    ),
    alumnoExistente: true,
  };
}

/**
 * Crea o actualiza ficha como alumno de Jornadas de Capacitación (origen WEB).
 * No crea UsuarioPortal ni matrícula.
 */
async function crearOActualizarAlumnoJornada({ email, alumno, consentimiento }) {
  const mail = String(email || '').trim().toLowerCase();
  const numDoc = parseNumDoc(alumno?.numDoc);
  if (numDoc == null) {
    const err = new Error('Número de documento inválido');
    err.status = 400;
    throw err;
  }

  let da = await DatosAlumno.findOne(numDocQuery(numDoc));
  const empresaIdValido =
    alumno.empresaId && mongoose.isValidObjectId(alumno.empresaId) ? alumno.empresaId : null;

  const consentFields = consentimiento
    ? camposConsentimientoAlumno(consentimiento.canal || CANAL_CONSENTIMIENTO.JORNADAS)
    : {};

  if (!da) {
    da = await DatosAlumno.create({
      tipoAlumno: TIPO_JORNADAS_CAPACITACION,
      origen: ORIGEN_WEB,
      tipoDoc: alumno.tipoDoc || '1',
      numDoc,
      expedida: alumno.expedida || '',
      apellido1: nombreMayusculas(alumno.apellido1),
      apellido2: nombreMayusculas(alumno.apellido2),
      nombre1: nombreMayusculas(alumno.nombre1),
      nombre2: nombreMayusculas(alumno.nombre2),
      fechaNac: alumno.fechaNac ? new Date(alumno.fechaNac) : null,
      genero: alumno.genero || '',
      correo: mail,
      celular: alumno.celular || '',
      direccion: alumno.direccion || '',
      munOrigen: alumno.munOrigen || '',
      codMunicipio: alumno.codMunicipio || '',
      empresaId: empresaIdValido,
      userAddReg: 'portal-jornadas',
      ...consentFields,
    });
  } else {
    da.tipoAlumno = TIPO_JORNADAS_CAPACITACION;
    da.origen = ORIGEN_WEB;
    if (mail) da.correo = mail;
    if (alumno.celular) da.celular = String(alumno.celular).trim();
    if (alumno.direccion) da.direccion = String(alumno.direccion).trim();
    if (alumno.expedida) da.expedida = String(alumno.expedida).trim();
    if (empresaIdValido) da.empresaId = empresaIdValido;
    if (alumno.codMunicipio || alumno.munOrigen) {
      da.codMunicipio = alumno.codMunicipio || alumno.munOrigen;
      da.munOrigen = alumno.munOrigen || alumno.codMunicipio;
    }
    if (Object.keys(consentFields).length) {
      Object.assign(da, consentFields);
    }
    da.userChangeRecord = 'portal-jornadas';
    da.fechaMod = new Date();
    await da.save();
  }

  const lean = da.toObject ? da.toObject() : da;
  const nombre = nombreDesdeAlumno(lean);
  return {
    alumno: {
      _id: String(lean._id),
      numDoc: lean.numDoc,
      tipoAlumno: lean.tipoAlumno,
      origen: lean.origen,
      nombreCompleto: nombre,
      correo: lean.correo,
    },
    mensaje:
      'Te has registrado en Jornadas de Capacitación. Tu ficha quedó marcada como alumno presencial de jornadas. La matrícula a una jornada concreta se realiza en el centro.',
  };
}

async function enviarQrJornadaPorCorreo({ email, alumno, nombreCea }) {
  if (!smtpConfigured()) return { enviado: false };
  const cea = nombreCea || 'CEA';
  const nombre = nombreDesdeAlumno(alumno);
  const payload = buildJornadaAlumnoQrPayload(alumno.numDoc, nombre);
  const png = await generarQrJornadaPngBuffer(alumno.numDoc, nombre);

  const subject = `${cea} — Su registro en Jornadas de Capacitación`;
  const text = [
    `Hola ${nombre || ''},`.trim(),
    ``,
    `Te has registrado en Jornadas de Capacitación de ${cea}.`,
    ``,
    `Adjunto encontrará su código QR para asistencia en las jornadas (app ARGO).`,
    `Documento: ${alumno.numDoc}`,
    ``,
    `La matrícula a una jornada concreta se gestiona en el centro.`,
  ].join('\n');

  const html = `
    <p>Hola${nombre ? ` <strong>${nombre}</strong>` : ''},</p>
    <p>Te has registrado en <strong>Jornadas de Capacitación</strong> de <strong>${cea}</strong>.</p>
    <p>Adjunto encontrará su <strong>código QR</strong> para asistencia (compatible con la app de jornadas ARGO).</p>
    <p>Documento: <strong>${alumno.numDoc}</strong></p>
    <p style="font-size:0.85rem;color:#64748b">Código: ${payload}</p>
    <p>La matrícula a una jornada concreta se gestiona en el centro.</p>
  `.trim();

  await sendMail({
    to: email,
    subject,
    text,
    html,
    from: await mailFromHeader(cea),
    attachments: [
      {
        filename: `qr-jornada-${alumno.numDoc}.png`,
        content: png,
        contentType: 'image/png',
      },
    ],
  });

  return { enviado: true };
}

async function enviarCodigoRegistroJornada({
  email,
  codigo,
  linkToken,
  pendingId,
  nombreCea,
  portalBaseUrl,
}) {
  const cea = nombreCea || 'CEA';
  const base = resolverBasePortal({ portalBaseUrl });
  const link = buildActivacionUrl(base, '/jornadas-capacitacion/activar', {
    pendingId,
    linkToken,
  });

  const subject = `${cea} — Confirme su inscripción a Jornadas de Capacitación`;
  const textParts = [
    `Hola,`,
    ``,
    `Para confirmar su inscripción a Jornadas de Capacitación de ${cea} use el código:`,
    ``,
    `  ${codigo}`,
    ``,
  ];
  if (link) {
    textParts.push(`O abra este enlace (recomendado):`, link, ``);
  }
  textParts.push(
    `El código y el enlace vencen en ${ttlMinutos()} minutos. Si no solicitó esta inscripción, ignore este mensaje.`,
  );

  const html = `
    <p>Hola,</p>
    <p>Para confirmar su inscripción a <strong>Jornadas de Capacitación</strong> de <strong>${cea}</strong> use el código:</p>
    <p style="font-size:1.5rem;font-weight:bold;letter-spacing:0.2em">${codigo}</p>
    ${
      link
        ? `<p>O haga clic en el botón:</p>
    <p style="margin:1.5rem 0">
      <a href="${link}" style="background:#0ea5e9;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
        Activar inscripción
      </a>
    </p>
    <p style="font-size:0.85rem;color:#64748b;word-break:break-all">${link}</p>`
        : ''
    }
    <p>El código y el enlace vencen en ${ttlMinutos()} minutos. Si no solicitó esta inscripción, ignore este mensaje.</p>
  `.trim();

  await sendMail({
    to: email,
    subject,
    text: textParts.join('\n'),
    html,
    from: await mailFromHeader(cea),
  });
}

async function solicitarRegistroJornada({ email, alumno, nombreCea, portalBaseUrl, consentimiento }) {
  const datos = await validarDatosRegistroJornada({ email, alumno });

  // Anti-bots: NUNCA crear ficha aquí. Solo pendiente + correo con enlace/código.
  // El alumno real se crea al confirmar (enlace o código). Luego se envía el QR.
  if (!smtpConfigured()) {
    const err = new Error(
      'El correo no está configurado. No se puede completar la inscripción sin verificación por email.',
    );
    err.status = 503;
    throw err;
  }

  const codigo = generarCodigo();
  const linkToken = generarLinkToken();
  const pendingId = crypto.randomUUID();

  await RegistroJornadaPendiente.deleteMany({
    $or: [{ email: datos.mail }, { numDoc: datos.numDoc }],
  });

  await RegistroJornadaPendiente.create({
    pendingId,
    email: datos.mail,
    numDoc: datos.numDoc,
    alumno: datos.alumnoPayload,
    codeHash: await bcrypt.hash(codigo, 10),
    linkTokenHash: hashLinkToken(linkToken),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
    consentimiento,
  });

  await enviarCodigoRegistroJornada({
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
    message: `Enviamos un enlace de activación a ${maskEmail(datos.mail)}. Abra su correo y confirme para completar el registro.`,
  };
}

async function cargarPendienteJornada(pendingId) {
  const id = String(pendingId || '').trim();
  if (!id) {
    const err = new Error('Solicitud de inscripción no válida');
    err.status = 400;
    throw err;
  }

  const pending = await RegistroJornadaPendiente.findOne({ pendingId: id });
  if (!pending) {
    const err = new Error('Solicitud expirada o no encontrada. Vuelva a inscribirse.');
    err.status = 404;
    throw err;
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    await RegistroJornadaPendiente.deleteOne({ _id: pending._id });
    const err = new Error('El código o enlace expiró. Solicite uno nuevo.');
    err.status = 410;
    throw err;
  }

  if (pending.intentosConfirmacion >= MAX_INTENTOS) {
    await RegistroJornadaPendiente.deleteOne({ _id: pending._id });
    const err = new Error('Demasiados intentos fallidos. Inicie la inscripción de nuevo.');
    err.status = 429;
    throw err;
  }

  return pending;
}

async function confirmarRegistroJornada({ pendingId, codigo, linkToken, nombreCea }) {
  const code = String(codigo || '').trim();
  const token = String(linkToken || '').trim();
  const porCodigo = /^\d{6}$/.test(code);
  const porLink = token.length >= 32;

  if (!porCodigo && !porLink) {
    const err = new Error('Código o enlace de verificación inválido');
    err.status = 400;
    throw err;
  }

  const pending = await cargarPendienteJornada(pendingId);

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

  const created = await crearOActualizarAlumnoJornada({
    email: pending.email,
    alumno: pending.alumno,
    consentimiento: pending.consentimiento,
  });

  await RegistroJornadaPendiente.deleteOne({ _id: pending._id });

  try {
    await enviarQrJornadaPorCorreo({
      email: pending.email,
      alumno: { ...pending.alumno, numDoc: created.alumno.numDoc },
      nombreCea,
    });
  } catch (_) {
    /* inscripción OK aunque falle el QR */
  }

  return {
    step: 'done',
    ...created,
  };
}

async function reenviarCodigoRegistroJornada({ pendingId, nombreCea, portalBaseUrl }) {
  const pending = await cargarPendienteJornada(pendingId);
  const codigo = generarCodigo();
  const linkToken = generarLinkToken();
  pending.codeHash = await bcrypt.hash(codigo, 10);
  pending.linkTokenHash = hashLinkToken(linkToken);
  pending.expiresAt = new Date(Date.now() + CODE_TTL_MS);
  pending.intentosConfirmacion = 0;
  await pending.save();

  await enviarCodigoRegistroJornada({
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
  solicitarRegistroJornada,
  confirmarRegistroJornada,
  reenviarCodigoRegistroJornada,
  crearOActualizarAlumnoJornada,
};
