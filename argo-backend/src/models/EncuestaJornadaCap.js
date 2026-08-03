const mongoose = require('mongoose');

const ESTADOS_ENCUESTA_JORNADA = ['BORRADOR', 'PUBLICADA', 'CERRADA'];

const EncuestaJornadaCapSchema = new mongoose.Schema(
  {
    idContrato: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contratacion',
      required: true,
      index: true,
    },
    titulo: { type: String, required: true, trim: true },
    instrucciones: { type: String, trim: true, default: '' },
    estado: {
      type: String,
      enum: ESTADOS_ENCUESTA_JORNADA,
      default: 'BORRADOR',
      index: true,
    },
    fechaApertura: { type: Date, default: null },
    fechaCierre: { type: Date, default: null },
    userAddReg: { type: String, trim: true },
    userChangeRecord: { type: String, trim: true },
  },
  { collection: 'encuestasJornadaCap', timestamps: true },
);

EncuestaJornadaCapSchema.index({ idContrato: 1, estado: 1 });

module.exports = mongoose.model('EncuestaJornadaCap', EncuestaJornadaCapSchema);
module.exports.ESTADOS_ENCUESTA_JORNADA = ESTADOS_ENCUESTA_JORNADA;
