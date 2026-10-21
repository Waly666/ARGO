const mongoose = require('mongoose');

const PesvConfigSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: 'default', unique: true, trim: true },
    vigenciaActiva: { type: Number, default: () => new Date().getFullYear() },
    tipoOrganizacion: { type: String, enum: ['cea', 'empresa'], default: 'cea' },
    razonSocial: { type: String, trim: true, default: '' },
    nit: { type: String, trim: true, default: '' },
    /** Ruta relativa bajo uploads/ — portada JPG/PNG (fase PDF posterior) */
    portadaRelPath: { type: String, trim: true, default: null },
    /** Márgenes, encabezado, pie y marca de agua para PDFs PESV. */
    pdfDocumento: { type: mongoose.Schema.Types.Mixed, default: null },
    userChangeRecord: { type: String, trim: true },
  },
  { collection: 'pesvConfig', timestamps: true },
);

module.exports = mongoose.model('PesvConfig', PesvConfigSchema);
