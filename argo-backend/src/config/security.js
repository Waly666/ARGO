/** Configuración de seguridad (Fase 1 producción). */

function envFlag(name, defaultTrue = true) {
  const v = process.env[name];
  if (v == null || v === '') return defaultTrue;
  return v === '1' || v === 'true' || v === 'yes';
}

function envInt(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function turnstileEnabled() {
  const secret = String(process.env.TURNSTILE_SECRET_KEY || '').trim();
  if (!secret) return false;
  return envFlag('TURNSTILE_ENABLED', true);
}

function turnstileSiteKey() {
  return String(process.env.TURNSTILE_SITE_KEY || '').trim();
}

function portalRegistroAbierto() {
  return envFlag('PORTAL_REGISTRO_ABIERTO', true);
}

function trustProxyHops() {
  return envInt('TRUST_PROXY', 1);
}

module.exports = {
  envFlag,
  envInt,
  turnstileEnabled,
  turnstileSiteKey,
  portalRegistroAbierto,
  trustProxyHops,
  loginRateLimit: {
    windowMs: envInt('RATE_LIMIT_LOGIN_WINDOW_MS', 15 * 60 * 1000),
    max: envInt('RATE_LIMIT_LOGIN_MAX', 10),
  },
  buscarAlumnoRateLimit: {
    windowMs: envInt('RATE_LIMIT_BUSCAR_ALUMNO_WINDOW_MS', 15 * 60 * 1000),
    max: envInt('RATE_LIMIT_BUSCAR_ALUMNO_MAX', 15),
  },
  authApiRateLimit: {
    windowMs: envInt('RATE_LIMIT_AUTH_WINDOW_MS', 15 * 60 * 1000),
    max: envInt('RATE_LIMIT_AUTH_MAX', 30),
  },
};
