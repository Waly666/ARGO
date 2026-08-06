const mongoose = require('mongoose');

const AlertaAulaVirtualEventoSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: ['registro', 'matricula'], required: true, index: true },
    numDoc: { type: Number, required: true, index: true },
    nombreAlumno: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    idPrograma: { type: String, default: '', trim: true },
    nombrePrograma: { type: String, default: '', trim: true },
    /** Ficha alumno nueva en ARGO (registro portal). */
    alumnoNuevo: { type: Boolean, default: false },
  },
  { collection: 'alertasAulaVirtualEventos', timestamps: true },
);

AlertaAulaVirtualEventoSchema.index({ createdAt: -1 });
AlertaAulaVirtualEventoSchema.index({ tipo: 1, createdAt: -1 });

module.exports = mongoose.model('AlertaAulaVirtualEvento', AlertaAulaVirtualEventoSchema);
