const { obtenerConfigPortalPublica, obtenerConfigAula } = require('./aulaVirtualPortal');

/**
 * Mismo remitente que registro/confirmación del portal (emailConfirmacion en Aula virtual).
 */
async function resolverRemitentePortalCorreo() {
  const portal = await obtenerConfigPortalPublica().catch(() => ({}));
  const nombreCea = portal.nombreCea || 'CEA';
  const aula = await obtenerConfigAula().catch(() => null);
  const emailConfirmacion = String(aula?.emailConfirmacion || '').trim().toLowerCase();
  const from = emailConfirmacion ? `"${nombreCea}" <${emailConfirmacion}>` : undefined;
  return { from, nombreCea, emailConfirmacion: emailConfirmacion || null };
}

module.exports = {
  resolverRemitentePortalCorreo,
};
