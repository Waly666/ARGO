const mongoose = require('mongoose');

const EmpleadoEvaluacionSchema = new mongoose.Schema(
  {
    idEmpleado: { type: Number, required: true, index: true },
    fecha: { type: Date, required: true, index: true },
    /** Etiqueta libre: 2026-01, 2026-Q1, Inducción, etc. */
    periodo: { type: String, trim: true, default: '' },
    /** Notas por competencia; puntaje = promedio. */
    competencias: [
      {
        idCompetencia: { type: Number },
        codigo: { type: String, trim: true },
        nombre: { type: String, trim: true },
        puntaje: { type: Number, min: 1, max: 10 },
      },
    ],
    /** Promedio 1–10 (calculado desde competencias o ingresado directo). */
    puntaje: { type: Number, required: true, min: 1, max: 10 },
    tipo: { type: String, trim: true, default: 'desempeño' },
    observaciones: { type: String, trim: true, default: '' },
    evaluadoPor: { type: String, trim: true },
    evaluadoPorNombre: { type: String, trim: true, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    userAddReg: { type: String, trim: true },
    userChangeRecord: { type: String, trim: true },
  },
  { collection: 'empleado_evaluaciones', strict: false },
);

EmpleadoEvaluacionSchema.index({ idEmpleado: 1, fecha: -1 });

module.exports = mongoose.model('EmpleadoEvaluacion', EmpleadoEvaluacionSchema);
