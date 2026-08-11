const mongoose = require('mongoose');

const RegistroPortalPendienteSchema = new mongoose.Schema(
  {
    pendingId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    numDoc: { type: Number, required: true, index: true },
    alumno: { type: mongoose.Schema.Types.Mixed, required: true },
    codeHash: { type: String, required: true },
    /** SHA-256 hex del token del enlace de activación (vacío en registros antiguos). */
    linkTokenHash: { type: String, default: '', index: true },
    expiresAt: { type: Date, required: true },
    intentosConfirmacion: { type: Number, default: 0 },
    /** Snapshot de aceptación Ley 1581 al solicitar registro. */
    consentimiento: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { collection: 'registroPortalPendiente', timestamps: true },
);

RegistroPortalPendienteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RegistroPortalPendiente', RegistroPortalPendienteSchema);
