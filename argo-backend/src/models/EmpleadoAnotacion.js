const mongoose = require('mongoose');

/**
 * Anotaciones / eventualidades del empleado (historial de comportamientos).
 * positivo = destacable a favor; negativo = destacable en contra.
 */
const EmpleadoAnotacionSchema = new mongoose.Schema(
  {
    idEmpleado: { type: Number, required: true, index: true },
    fecha: { type: Date, required: true, index: true },
    /** positivo | negativo */
    tipo: { type: String, trim: true, required: true, enum: ['positivo', 'negativo'] },
    /**
     * Categoría libre/controlada:
     * reconocimiento, logro, felicitacion, llamado_atencion, falta, queja, otro
     */
    categoria: { type: String, trim: true, default: 'otro' },
    titulo: { type: String, trim: true, default: '' },
    descripcion: { type: String, trim: true, required: true },
    registradoPor: { type: String, trim: true },
    registradoPorNombre: { type: String, trim: true, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    userAddReg: { type: String, trim: true },
    userChangeRecord: { type: String, trim: true },
  },
  { collection: 'empleado_anotaciones', strict: false },
);

EmpleadoAnotacionSchema.index({ idEmpleado: 1, fecha: -1 });

module.exports = mongoose.model('EmpleadoAnotacion', EmpleadoAnotacionSchema);
