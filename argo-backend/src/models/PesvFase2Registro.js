const mongoose = require('mongoose');

const EvidenciaFase2Schema = new mongoose.Schema(
  {
    id: { type: String, trim: true, required: true },
    tipo: { type: String, enum: ['pdf', 'xlsx', 'entero'], required: true },
    valorEntero: { type: Number, default: null },
    adjuntoRuta: { type: String, trim: true, default: null },
    adjuntoNombre: { type: String, trim: true, default: null },
  },
  { _id: false },
);

const PesvFase2RegistroSchema = new mongoose.Schema(
  {
    vigencia: { type: Number, required: true, index: true },
    mes: { type: Number, required: true, min: 1, max: 12 },
    obligado: { type: Boolean, default: true },
    siniestros: {
      adjuntoRuta: { type: String, trim: true, default: null },
      adjuntoNombre: { type: String, trim: true, default: null },
    },
    administrativo: {
      variables: {
        type: [{ id: String, valor: mongoose.Schema.Types.Mixed }],
        default: [],
      },
    },
    funcionamiento: {
      variables: { type: Map, of: Number, default: {} },
      evidencias: { type: [EvidenciaFase2Schema], default: [] },
    },
    vehiculos: {
      variables: { type: Map, of: Number, default: {} },
      evidencias: { type: [EvidenciaFase2Schema], default: [] },
    },
    estado: { type: String, enum: ['borrador', 'enviado_st'], default: 'borrador' },
    userChangeRecord: { type: String, trim: true },
  },
  { collection: 'pesvFase2Registro', timestamps: true },
);

PesvFase2RegistroSchema.index({ vigencia: 1, mes: 1 }, { unique: true });

module.exports = mongoose.model('PesvFase2Registro', PesvFase2RegistroSchema);
