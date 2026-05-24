const mongoose = require('mongoose');

const CertificadoSchema = new mongoose.Schema(
  {
    numDoc:        { type: Number, required: true, index: true },
    idLiquidacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Liquidacion', required: true, unique: true },
    idProg:        { type: String, required: true, trim: true },
    numActa:       { type: String, trim: true },
    numFolio:      { type: String, trim: true },
    numRunt:       { type: String, trim: true },
    fechaEmision:    { type: Date, default: Date.now },
    fechaVencimiento:{ type: Date, default: null },
    observaciones:   { type: String, trim: true },
    estado:        { type: String, trim: true, default: 'vigente' }, // vigente | anulado
    codigoCert:    { type: String, trim: true, index: true },
    idPlantilla:   { type: mongoose.Schema.Types.ObjectId, ref: 'PlantillaCertificado', default: null },
    orientacion:   { type: String, enum: ['vertical', 'horizontal'], default: 'vertical' },
    tipoCertificado: { type: String, trim: true, default: '' },
    /** Nombre del curso / capacitación impreso en el certificado */
    encabezado: { type: String, trim: true, default: '' },
    idUsuario:     { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  },
  { collection: 'certificados', timestamps: true, strict: false },
);

module.exports = mongoose.model('Certificado', CertificadoSchema);
