const CANALES_USUARIO = ['mixta', 'movil', 'escritorio'];
const CLIENTES_MOVILES = new Set(['cajero', 'mobile', 'jornadas']);
const CLIENTES_ESCRITORIO = new Set(['escritorio', 'web', 'erp']);

function normalizarCanalConexionUsuario(val) {
  const v = String(val || 'mixta').trim().toLowerCase();
  if (CANALES_USUARIO.includes(v)) return v;
  return 'mixta';
}

/** Canal detectado en la petición actual (web ERP vs app móvil). */
function detectarCanalCliente(req) {
  const c = String(req?.get?.('X-ARGO-Cliente') || req?.headers?.['x-argo-cliente'] || '')
    .trim()
    .toLowerCase();
  if (CLIENTES_MOVILES.has(c)) return 'movil';
  if (CLIENTES_ESCRITORIO.has(c)) return 'escritorio';
  // Apps móviles deben enviar X-ARGO-Cliente; sin header = ERP web / navegador.
  return 'escritorio';
}

function usuarioPermiteCanal(usuario, canalCliente) {
  const permitido = normalizarCanalConexionUsuario(usuario?.canalConexion);
  if (permitido === 'mixta') return true;
  return permitido === canalCliente;
}

function mensajeCanalDenegado(canalPermitido, canalCliente) {
  const permitidoTxt =
    canalPermitido === 'movil'
      ? 'solo aplicaciones móviles'
      : canalPermitido === 'escritorio'
        ? 'solo el ERP web (escritorio)'
        : 'cualquier canal';
  const intentoTxt = canalCliente === 'movil' ? 'una aplicación móvil' : 'el ERP web';
  return `Este usuario no puede conectarse desde ${intentoTxt}. Acceso permitido: ${permitidoTxt}.`;
}

function evaluarCanalConexion(req, usuario) {
  const canalCliente = detectarCanalCliente(req);
  const canalPermitido = normalizarCanalConexionUsuario(usuario?.canalConexion);
  if (!usuarioPermiteCanal(usuario, canalCliente)) {
    return {
      ok: false,
      status: 403,
      message: mensajeCanalDenegado(canalPermitido, canalCliente),
      code: 'CANAL_CONEXION_DENEGADO',
      canalPermitido,
      canalCliente,
    };
  }
  return { ok: true, canalCliente, canalPermitido };
}

function assertCanalConexionPermitida(req, usuario) {
  const r = evaluarCanalConexion(req, usuario);
  if (!r.ok) {
    const err = new Error(r.message);
    err.status = r.status;
    err.code = r.code;
    err.canalPermitido = r.canalPermitido;
    err.canalCliente = r.canalCliente;
    throw err;
  }
  return r;
}

module.exports = {
  CANALES_USUARIO,
  normalizarCanalConexionUsuario,
  detectarCanalCliente,
  usuarioPermiteCanal,
  evaluarCanalConexion,
  assertCanalConexionPermitida,
};
