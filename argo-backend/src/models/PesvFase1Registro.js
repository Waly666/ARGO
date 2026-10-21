const mongoose = require('mongoose');

const ItemFase1Schema = new mongoose.Schema(
  {
    itemNo: { type: Number, required: true },
    existe: { type: String, enum: ['si', 'no', null], default: null },
    motivoCodigo: { type: String, trim: true, default: '' },
    observacion: { type: String, trim: true, default: '' },
    /** Campos capturados en ARGO para generar el documento (no sustituye SISI). */
    datosCapturados: { type: mongoose.Schema.Types.Mixed, default: null },
    documentoGeneradoRuta: { type: String, trim: true, default: null },
    documentoGeneradoEn: { type: Date, default: null },
    /** Solo certificaciones externas (ST) u homologación manual excepcional. */
    adjuntoRuta: { type: String, trim: true, default: null },
    adjuntoNombre: { type: String, trim: true, default: null },
  },
  { _id: false },
);

const PesvFase1RegistroSchema = new mongoose.Schema(
  {
    vigencia: { type: Number, required: true, unique: true, index: true },
    items: { type: [ItemFase1Schema], default: [] },
    enviadoSt: { type: Boolean, default: false },
    userChangeRecord: { type: String, trim: true },
  },
  { collection: 'pesvFase1Registro', timestamps: true },
);

module.exports = mongoose.model('PesvFase1Registro', PesvFase1RegistroSchema);
