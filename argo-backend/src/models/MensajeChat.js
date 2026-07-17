const mongoose = require('mongoose');

/** Clave canónica de conversación 1:1 (ids ordenados). */
function convKeyDe(a, b) {
  return [String(a), String(b)].sort().join(':');
}

const MensajeChatSchema = new mongoose.Schema(
  {
    convKey: { type: String, required: true, trim: true, index: true },
    deId: { type: String, required: true, trim: true, index: true },
    paraId: { type: String, required: true, trim: true, index: true },
    deNombre: { type: String, required: true, trim: true },
    texto: { type: String, required: true, trim: true, maxlength: 4000 },
    leido: { type: Boolean, default: false, index: true },
    leidoAt: { type: Date, default: null },
  },
  { timestamps: true },
);

MensajeChatSchema.index({ convKey: 1, createdAt: 1 });
MensajeChatSchema.index({ paraId: 1, leido: 1 });

module.exports = mongoose.model('MensajeChat', MensajeChatSchema);
module.exports.convKeyDe = convKeyDe;
