const mongoose = require('mongoose');

const CajaCierreGeneralSchema = new mongoose.Schema(
  {
    idCierreGeneral: { type: Number, required: true, unique: true, index: true },
    periodoDesde: { type: Date, required: true, index: true },
    periodoHasta: { type: Date, required: true, index: true },
    fechaRegistro: { type: Date, default: Date.now, index: true },
    usuarioAdmin: { type: String, trim: true },
    idUsuarioAdmin: { type: String, trim: true },
    observaciones: { type: String, trim: true },
    idsSesiones: [{ type: Number }],
    cantidadCajas: { type: Number, default: 0 },
    resumen: { type: mongoose.Schema.Types.Mixed },
    fechaAudi: { type: Date, default: Date.now },
    userAddReg: { type: String, trim: true },
  },
  { collection: 'cajaCierresGenerales', strict: false },
);

module.exports = mongoose.model('CajaCierreGeneral', CajaCierreGeneralSchema);
