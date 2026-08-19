const mongoose = require('mongoose');

/**
 * Catálogo de gestores (caja / matrículas).
 */
const GestorSchema = new mongoose.Schema(
  {
    nombres: { type: String, required: true, trim: true },
    apellidos: { type: String, required: true, trim: true },
    tipoDoc: { type: String, trim: true, default: 'CC' },
    numero: { type: String, required: true, trim: true, index: true },
    correo: { type: String, trim: true, default: '', lowercase: true },
    celular: { type: String, trim: true, default: '' },
    direccion: { type: String, trim: true, default: '' },
    seudonimo: { type: String, trim: true, default: '' },
    foto: { type: String, trim: true, default: '' },
    activo: { type: Boolean, default: true, index: true },
    userAddReg: { type: String, trim: true },
    userChangeRecord: { type: String, trim: true },
  },
  { collection: 'gestores', timestamps: true, strict: false },
);

GestorSchema.index({ nombres: 'text', apellidos: 'text', numero: 'text', seudonimo: 'text' });

module.exports = mongoose.model('Gestor', GestorSchema);
