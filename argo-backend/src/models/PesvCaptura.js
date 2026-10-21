const mongoose = require('mongoose');

const PesvCapturaSchema = new mongoose.Schema(
  {
    vigencia: { type: Number, required: true, index: true },
    capturaKey: { type: String, required: true, trim: true, index: true },
    itemNo: { type: Number, index: true },
    datos: { type: mongoose.Schema.Types.Mixed, default: {} },
    userChangeRecord: { type: String, trim: true },
  },
  { collection: 'pesvCaptura', timestamps: true },
);

PesvCapturaSchema.index({ vigencia: 1, itemNo: 1 }, { unique: true });

module.exports = mongoose.model('PesvCaptura', PesvCapturaSchema);
