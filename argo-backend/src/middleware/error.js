function notFound(req, res, next) {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('[ARGO] Error:', err);
  res.status(status).json({
    message: err.message || 'Error interno',
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { notFound, errorHandler };
