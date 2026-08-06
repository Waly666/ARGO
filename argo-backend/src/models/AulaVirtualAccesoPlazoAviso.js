const mongoose = require('mongoose');

const AulaVirtualAccesoPlazoAvisoSchema = new mongoose.Schema(
  {
    numDoc: { type: Number, required: true, index: true },
    idPrograma: { type: String, required: true, trim: true, index: true },
    idMatricula: { type: mongoose.Schema.Types.ObjectId, ref: 'Matricula', default: null },
    tipo: { type: String, enum: ['aviso_alumno', 'expiracion_alumno'], required: true },
    diasRestantes: { type: Number, default: null },
  },
  { collection: 'aulaVirtualAccesoPlazoAvisos', timestamps: true },
);

AulaVirtualAccesoPlazoAvisoSchema.index({ numDoc: 1, idPrograma: 1, tipo: 1, idMatricula: 1 });

module.exports = mongoose.model('AulaVirtualAccesoPlazoAviso', AulaVirtualAccesoPlazoAvisoSchema);
