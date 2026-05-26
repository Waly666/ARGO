const { registrarPeticion } = require('../services/actividadHttp');

const RUTAS_EXCLUIDAS = [
  /^\/api\/health/i,
  /^\/api\/actividad/i,
  /^\/uploads/i,
];

function excluirRuta(ruta) {
  return RUTAS_EXCLUIDAS.some((re) => re.test(ruta));
}

/**
 * Registra cada petición API autenticada (incluye GET) para monitoreo en tiempo real.
 */
function actividadHttpMiddleware(req, res, next) {
  const ruta = req.originalUrl || req.url || '';
  if (excluirRuta(ruta)) return next();

  const inicio = Date.now();

  res.on('finish', () => {
    setImmediate(() => {
      registrarPeticion({
        req,
        statusCode: res.statusCode,
        duracionMs: Date.now() - inicio,
      }).catch(() => {});
    });
  });

  next();
}

module.exports = { actividadHttpMiddleware };
