const {
  obtenerConfigPagoConsignacion,
  guardarConfigPagoConsignacion,
  mapPublico,
  actualizarQrMedio,
} = require('../services/configPagoConsignacion');

exports.obtener = async (_req, res, next) => {
  try {
    const cfg = await obtenerConfigPagoConsignacion();
    res.json(cfg);
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const cfg = await guardarConfigPagoConsignacion(req.body || {});
    res.json(cfg);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.estadoPublico = async (_req, res, next) => {
  try {
    const cfg = await obtenerConfigPagoConsignacion();
    res.json(mapPublico(cfg));
  } catch (e) {
    next(e);
  }
};

exports.subirQrMedio = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Seleccione una imagen QR.' });
    }
    const rel = `pago-consignacion-qr/${req.file.filename}`;
    const cfg = await actualizarQrMedio(req.params.medioId, rel);
    res.json({ config: cfg, urlQr: rel, message: 'QR actualizado.' });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};
