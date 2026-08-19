const {
  obtenerConfigEnvioCorreosAlumno,
  guardarConfigEnvioCorreosAlumno,
} = require('../services/configEnvioCorreosAlumno');

exports.obtener = async (_req, res, next) => {
  try {
    const cfg = await obtenerConfigEnvioCorreosAlumno();
    res.json(cfg);
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const saved = await guardarConfigEnvioCorreosAlumno(req.body || {});
    res.json(saved);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};
