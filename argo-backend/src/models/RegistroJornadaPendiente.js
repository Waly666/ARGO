const mongoose = require('mongoose');

/** Registro web de alumno presencial (jornadas) pendiente de confirmación por correo. */
const RegistroJornadaPendienteSchema = new mongoose.Schema(
  {
    pendingId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    numDoc: { type: Number, required: true, index: true },
    alumno: { type: mongoose.Schema.Types.Mixed, required: true },
    codeHash: { type: String, required: true },
    /** SHA-256 hex del token del enlace de activación. */
    linkTokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    intentosConfirmacion: { type: Number, default: 0 },
  },
  { collection: 'registroJornadaPendiente', timestamps: true },
);

RegistroJornadaPendienteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RegistroJornadaPendiente', RegistroJornadaPendienteSchema);
