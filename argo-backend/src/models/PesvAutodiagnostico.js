const mongoose = require('mongoose');

const PesvAutodiagnosticoSchema = new mongoose.Schema(
  {
    vigencia: { type: Number, required: true, index: true },
    misionalidad: { type: Number, enum: [1, 2], required: true },
    totalVehiculos: { type: Number, default: 0, min: 0 },
    totalVehiculosFlota: { type: Number, default: 0, min: 0 },
    totalConductores: { type: Number, default: 0, min: 0 },
    obligado: { type: Boolean, default: false },
    reglaCodigo: { type: String, trim: true, default: '' },
    nivelCalculado: { type: String, enum: ['basico', 'estandar', 'avanzado'] },
    observaciones: { type: String, trim: true, default: '' },
    vigente: { type: Boolean, default: true, index: true },
    userChangeRecord: { type: String, trim: true },
  },
  { collection: 'pesvAutodiagnostico', timestamps: true },
);

PesvAutodiagnosticoSchema.index({ vigencia: 1, vigente: 1 });

module.exports = mongoose.model('PesvAutodiagnostico', PesvAutodiagnosticoSchema);
