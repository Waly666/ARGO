const { verifySync } = require('otplib');
const Usuario = require('../models/Usuario');
const { esAdmin } = require('../utils/roles');
const { decryptSecret } = require('../utils/totpCrypto');
const { logAuthIntento } = require('./authSecurityLog');
const soporteMaestro = require('./soporteMaestro');

/**
 * Reautenticación reforzada para operaciones críticas
 * (reset de empresa, restauración de respaldos).
 * Exige: rol admin + contraseña + código TOTP si el usuario tiene MFA activo
 * (salvo omitirMfa en restauración de respaldos).
 */
async function verificarReautenticacionAdmin(req, { password, codigoMfa } = {}, opciones = {}) {
  const omitirMfa = opciones.omitirMfa === true;
  const fallo = (status, message) => {
    const err = new Error(message);
    err.status = status;
    return err;
  };

  // Cuenta de soporte maestro (break-glass): valida contra variables de entorno.
  if (req.user?.bg && req.user.sub === soporteMaestro.SUB) {
    return soporteMaestro.verificarReauth(req, { password, codigoMfa }, { omitirMfa });
  }

  const u = await Usuario.findById(req.user?.sub);
  if (!u || u.activo === false) throw fallo(401, 'Usuario no encontrado o inactivo');
  if (!esAdmin(u.rol)) throw fallo(403, 'Solo un administrador puede ejecutar esta operación');

  const passOk = await u.compararPassword(String(password || ''));
  if (!passOk) {
    logAuthIntento({
      req,
      canal: 'staff',
      identificador: u.username,
      ok: false,
      motivo: 'reauth_password_invalido',
    });
    throw fallo(401, 'Contraseña incorrecta');
  }

  if (!omitirMfa && u.totpEnabled === true && String(u.totpSecretEnc || '').trim()) {
    const code = String(codigoMfa || '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(code)) {
      throw fallo(401, 'Ingrese el código de 6 dígitos de su aplicación de autenticación');
    }
    let valido = false;
    try {
      const secret = decryptSecret(u.totpSecretEnc);
      valido = verifySync({ secret, token: code }).valid === true;
    } catch {
      valido = false;
    }
    if (!valido) {
      logAuthIntento({
        req,
        canal: 'staff',
        identificador: u.username,
        ok: false,
        motivo: 'reauth_mfa_invalido',
      });
      throw fallo(401, 'Código de autenticación incorrecto');
    }
  }

  logAuthIntento({
    req,
    canal: 'staff',
    identificador: u.username,
    ok: true,
    motivo: 'reauth_ok',
  });
  return u;
}

module.exports = { verificarReautenticacionAdmin };
