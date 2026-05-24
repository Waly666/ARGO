const Usuario = require('../models/Usuario');
const { normalizarRol } = require('../utils/roles');
const { normalizarEmpleadoLegacy } = require('../utils/empleadoDoc');

/** Cargo (nombre) → rol de login */
const CARGO_ROL = [
  { test: (n) => /\bcajer/i.test(n), rol: 'cajero' },
  { test: (n) => /\binstructor/i.test(n), rol: 'instructor' },
];

function slugAscii(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function rolDesdeCargoNombre(nombreCargo) {
  const n = slugAscii(nombreCargo);
  if (!n) return null;
  for (const { test, rol } of CARGO_ROL) {
    if (test(n)) return rol;
  }
  return null;
}

function nombresUsuario(emp) {
  const e = normalizarEmpleadoLegacy(emp);
  return [e.primerNombre, e.segundoNombre].filter(Boolean).join(' ').trim();
}

function apellidosUsuario(emp) {
  const e = normalizarEmpleadoLegacy(emp);
  return [e.primerApellido, e.segundoApellido].filter(Boolean).join(' ').trim();
}

function emailUsuario(emp) {
  const e = normalizarEmpleadoLegacy(emp);
  return (e.correoCorporativo || e.correoPersonal || '').trim().toLowerCase();
}

/** Login = número de documento (solo dígitos, minúsculas). */
function usernameDesdeDocumento(emp) {
  const e = normalizarEmpleadoLegacy(emp);
  const doc = String(e.numeroDocumento || '').trim();
  const digits = doc.replace(/\D/g, '');
  if (digits) return digits.toLowerCase();
  const slug = slugAscii(doc);
  return slug || null;
}

/**
 * Campo legacy `numero` en colección usuarios (índice único).
 * Debe coincidir con el documento del empleado.
 */
function numeroDesdeDocumento(emp) {
  const digits = String(normalizarEmpleadoLegacy(emp).numeroDocumento || '').replace(/\D/g, '');
  if (!digits) return null;
  const n = Number(digits);
  if (!Number.isFinite(n)) return null;
  return n;
}

async function assertUsuarioDocumentoLibre(emp, exceptUserId) {
  const e = normalizarEmpleadoLegacy(emp);
  const username = usernameDesdeDocumento(e);
  const numero = numeroDesdeDocumento(e);
  if (!username || numero == null) {
    throw Object.assign(
      new Error('numeroDocumento es obligatorio para crear el usuario del empleado'),
      { status: 400 },
    );
  }
  const notSelf = exceptUserId ? { _id: { $ne: exceptUserId } } : {};
  const porLogin = await Usuario.findOne({ username, ...notSelf }).lean();
  if (porLogin) {
    throw Object.assign(
      new Error(`Ya existe un usuario con login ${username} (${porLogin.nombres || ''} ${porLogin.apellidos || ''})`.trim()),
      { status: 409 },
    );
  }
  const porNumero = await Usuario.findOne({ numero, ...notSelf }).lean();
  if (porNumero) {
    throw Object.assign(
      new Error(`Ya existe un usuario con número de documento ${numero}`),
      { status: 409 },
    );
  }
  return { username, numero };
}

function passwordInicialDesdeEmpleado(emp) {
  const digits = String(emp.numeroDocumento || '').replace(/\D/g, '');
  if (digits.length >= 4) return digits.slice(-4);
  if (digits.length > 0) return digits;
  return 'argo1';
}

function limpiarUsuario(doc) {
  if (!doc) return null;
  const o = doc.toJSON ? doc.toJSON() : { ...doc };
  delete o.passwordHash;
  return o;
}

async function cargarUsuarioPorId(id) {
  if (!id) return null;
  return Usuario.findById(id);
}

/**
 * Crea usuario de sistema para empleado con cargo Cajero o Instructor.
 * Usuario de login = numeroDocumento; campo `numero` = documento numérico (legacy).
 */
async function asegurarUsuarioParaEmpleado(emp, { cargoNombre, creadoPor } = {}) {
  const e = normalizarEmpleadoLegacy(emp);
  const rol = rolDesdeCargoNombre(cargoNombre);
  if (!rol) return null;

  if (e.idUsuario) {
    const prev = await cargarUsuarioPorId(e.idUsuario);
    if (prev) {
      await sincronizarDatosUsuario(prev, e, rol);
      return {
        existente: true,
        usuario: limpiarUsuario(prev),
        username: prev.username,
        rol: normalizarRol(prev.rol),
        idUsuario: prev._id,
      };
    }
  }

  const porEmpleado = await Usuario.findOne({ idEmpleado: e.idEmpleado });
  if (porEmpleado) {
    await sincronizarDatosUsuario(porEmpleado, e, rol);
    return {
      existente: true,
      usuario: limpiarUsuario(porEmpleado),
      username: porEmpleado.username,
      rol: normalizarRol(porEmpleado.rol),
      idUsuario: porEmpleado._id,
    };
  }

  const email = emailUsuario(e);
  if (email) {
    const porEmail = await Usuario.findOne({ email }).lean();
    if (porEmail) {
      throw Object.assign(
        new Error(`Ya existe un usuario con el correo ${email} (${porEmail.username})`),
        { status: 409 },
      );
    }
  }

  const { username, numero } = await assertUsuarioDocumentoLibre(e);
  const passwordInicial = passwordInicialDesdeEmpleado(e);

  const doc = await Usuario.create({
    username,
    numero,
    nombres: nombresUsuario(e),
    apellidos: apellidosUsuario(e),
    email: email || undefined,
    rol: normalizarRol(rol),
    activo: String(e.estado || 'activo').toLowerCase() !== 'retirado',
    passwordHash: await Usuario.hashPassword(passwordInicial),
    idEmpleado: e.idEmpleado,
    numeroDocumento: String(e.numeroDocumento || '').trim(),
    creadoDesdeEmpleado: true,
    userAddReg: creadoPor || 'sistema',
  });

  return {
    existente: false,
    usuario: limpiarUsuario(doc),
    username: doc.username,
    passwordInicial,
    rol: normalizarRol(rol),
    idUsuario: doc._id,
  };
}

async function sincronizarDatosUsuario(usuarioDoc, emp, rolEsperado) {
  const u = usuarioDoc;
  const e = normalizarEmpleadoLegacy(emp);
  const email = emailUsuario(e);
  const username = usernameDesdeDocumento(e);
  const numero = numeroDesdeDocumento(e);

  u.nombres = nombresUsuario(e);
  u.apellidos = apellidosUsuario(e);
  if (email) u.email = email;
  if (rolEsperado) u.rol = normalizarRol(rolEsperado);
  u.idEmpleado = e.idEmpleado;
  u.numeroDocumento = String(e.numeroDocumento || '').trim();

  if (username && numero != null) {
    const dupLogin = await Usuario.findOne({ username, _id: { $ne: u._id } }).lean();
    const dupNum = await Usuario.findOne({ numero, _id: { $ne: u._id } }).lean();
    if (!dupLogin && !dupNum) {
      u.username = username;
      u.numero = numero;
    }
  } else if (numero != null && u.numero == null) {
    const dupNum = await Usuario.findOne({ numero, _id: { $ne: u._id } }).lean();
    if (!dupNum) u.numero = numero;
  }

  if (String(e.estado || '').toLowerCase() === 'retirado') u.activo = false;
  await u.save();
}

/** Repara usuarios legacy con numero null (evita E11000 en índice único). */
async function repararUsuariosNumeroNulo() {
  const rows = await Usuario.find({
    $or: [{ numero: null }, { numero: { $exists: false } }],
  }).limit(200);
  let fixed = 0;
  for (const u of rows) {
    const digits = String(u.numeroDocumento || u.username || '').replace(/\D/g, '');
    if (!digits) continue;
    const numero = Number(digits);
    if (!Number.isFinite(numero)) continue;
    const dup = await Usuario.findOne({ numero, _id: { $ne: u._id } }).lean();
    if (dup) continue;
    const username = (u.username || digits).toLowerCase();
    await Usuario.updateOne(
      { _id: u._id },
      { $set: { numero, username, numeroDocumento: u.numeroDocumento || digits } },
    );
    fixed += 1;
  }
  if (fixed > 0) console.log(`[ARGO] Usuarios reparados (campo numero): ${fixed}`);
}

module.exports = {
  rolDesdeCargoNombre,
  usernameDesdeDocumento,
  numeroDesdeDocumento,
  asegurarUsuarioParaEmpleado,
  repararUsuariosNumeroNulo,
};
