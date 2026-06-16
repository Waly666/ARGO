const mongoose = require('mongoose');

const MensajeForoSchema = new mongoose.Schema(
  {
    idPrograma: { type: mongoose.Schema.Types.ObjectId, ref: 'Programa', required: true, index: true },
    autorNumDoc: { type: Number, default: null },
    autorId: { type: String, default: null },
    autorNombre: { type: String, required: true, trim: true },
    autorTipo: {
      type: String,
      enum: ['alumno', 'instructor', 'admin'],
      required: true,
    },
    texto: { type: String, required: true, trim: true, maxlength: 2000 },
    eliminado: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

MensajeForoSchema.index({ idPrograma: 1, createdAt: 1 });

module.exports = mongoose.model('MensajeForo', MensajeForoSchema);
