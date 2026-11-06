const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { getLanIpv4 } = require('../utils/networkHosts');
const {
  loginRateLimit,
  buscarAlumnoRateLimit,
  authApiRateLimit,
} = require('../config/security');

function createHelmetMiddleware() {
  return helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    /** Paquetes /uploads se incrustan en iframe desde el ERP (:4200) y portal. */
    frameguard: false,
  });
}

/** Cabeceras para incrustar HTML de cursos (vista previa ERP, portal). */
function uploadsEmbedHeaders(_req, res, next) {
  res.removeHeader('X-Frame-Options');
  const extra = (process.env.FRAME_ANCESTORS || '').trim();
  const ancestors = new Set([
    "'self'",
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://localhost:4300',
    'http://127.0.0.1:4300',
  ]);
  for (const { address } of getLanIpv4()) {
    ancestors.add(`http://${address}:4200`);
    ancestors.add(`http://${address}:4300`);
  }
  if (extra) extra.split(/[\s,]+/).forEach((a) => ancestors.add(a));
  res.setHeader('Content-Security-Policy', `frame-ancestors ${[...ancestors].join(' ')}`);
  next();
}

function rateLimitHandler(_req, res) {
  res.status(429).json({
    message: 'Demasiados intentos. Espere unos minutos e intente de nuevo.',
  });
}

function createRateLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    message: { message: message || 'Demasiados intentos.' },
  });
}

const staffLoginLimiter = createRateLimiter({
  ...loginRateLimit,
  message: 'Demasiados intentos de inicio de sesión.',
});

const portalAuthLimiter = createRateLimiter({
  ...authApiRateLimit,
  message: 'Demasiados intentos en el portal.',
});

const buscarAlumnoLimiter = createRateLimiter({
  ...buscarAlumnoRateLimit,
  message: 'Demasiadas consultas de documento. Intente más tarde.',
});

module.exports = {
  createHelmetMiddleware,
  uploadsEmbedHeaders,
  staffLoginLimiter,
  portalAuthLimiter,
  buscarAlumnoLimiter,
};
