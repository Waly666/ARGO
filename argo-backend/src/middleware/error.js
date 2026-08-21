function notFound(req, res, next) {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

const multer = require('multer');
const { zipMaxMb } = require('./upload');

function errorHandler(err, req, res, _next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = req.originalUrl?.includes('/paquete') ? zipMaxMb : 10;
      return res.status(413).json({
        message: `El archivo supera el tamaño máximo permitido (${maxMb} MB)`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      const esGaleria = String(req.originalUrl || '').includes('/portal/galeria');
      return res.status(400).json({
        message: esGaleria
          ? 'Demasiados archivos en un solo envío. Suba máximo 30 fotos o videos por lote.'
          : err.message || 'Demasiados archivos en un solo envío',
      });
    }
    return res.status(400).json({ message: err.message || 'Error al subir archivo' });
  }

  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('[ARGO] Error:', err);
  res.status(status).json({
    message: err.message || 'Error interno',
    ...(err.code ? { code: err.code } : {}),
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { notFound, errorHandler };
