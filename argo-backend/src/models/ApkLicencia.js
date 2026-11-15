const mongoose = require('mongoose');

const ApkLicenciaSchema = new mongoose.Schema(
  {
    idPrograma: { type: String, required: true, trim: true, index: true },
    numDoc: { type: String, required: true, trim: true },
    storagePrefix: { type: String, trim: true, default: '' },
    modo: { type: String, enum: ['fecha', 'plazo'], required: true },
    expiresAt: { type: Date, required: true },
    issuedAt: { type: Date, required: true },
  },
  { collection: 'apkLicencia', timestamps: true },
);

ApkLicenciaSchema.index({ idPrograma: 1, numDoc: 1 }, { unique: true });

module.exports = mongoose.model('ApkLicencia', ApkLicenciaSchema);
