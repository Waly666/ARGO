const mongoose = require('mongoose');

const EgresoSchema = new mongoose.Schema(
  {
    concepto:      { type: String, trim: true, required: true },
    valor:         { type: mongoose.Schema.Types.Decimal128, required: true },
    idTipoPago:    { type: String, trim: true },
    idBanco:       { type: String, trim: true },
    numComprobante:{ type: String, trim: true },
    fecha:         { type: Date, default: Date.now },
    observaciones: { type: String, trim: true },
    idUsuario:     { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  },
  { collection: 'egresos', timestamps: true, strict: false },
);

module.exports = mongoose.model('Egreso', EgresoSchema);
