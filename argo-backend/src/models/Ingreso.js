const mongoose = require('mongoose');

const IngresoSchema = new mongoose.Schema(
  {
    numDoc:        { type: String, required: true, trim: true, index: true },
    idLiquidacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Liquidacion', required: true },
    valor:         { type: mongoose.Schema.Types.Decimal128, required: true },
    numRecibo:     { type: String, trim: true, index: true },
    idTipoPago:    { type: String, required: true, trim: true },
    idBanco:       { type: String, trim: true, default: null },
    numComprobante:{ type: String, trim: true },
    fecha:         { type: Date, default: Date.now },
    observaciones: { type: String, trim: true },
    /** total = paga el saldo pendiente del ítem; abono = pago parcial */
    tipoAbono:     { type: String, enum: ['total', 'abono'], trim: true },
    idUsuario:     { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  },
  { collection: 'ingresos', timestamps: true, strict: false },
);

module.exports = mongoose.model('Ingreso', IngresoSchema);
