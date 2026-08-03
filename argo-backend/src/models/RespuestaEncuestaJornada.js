const mongoose = require('mongoose');

/** @deprecated Formato anterior: una nota por programa certificado. */
const CalificacionProgramaSchema = new mongoose.Schema(
  {
    idProg: { type: String, required: true, trim: true },
    nota: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false },
);

const AspectosCarpaSchema = new mongoose.Schema(
  {
    claridad: { type: Number, required: true, min: 1, max: 5 },
    utilidad: { type: Number, required: true, min: 1, max: 5 },
    instructor: { type: Number, required: true, min: 1, max: 5 },
    organizacion: { type: Number, required: true, min: 1, max: 5 },
    recomendaria: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false },
);

const CalificacionCarpaSchema = new mongoose.Schema(
  {
    idCarpa: { type: Number, required: true },
    idProg: { type: String, trim: true, default: '' },
    idEmpleadoInstructor: { type: Number, default: null },
    instructorNombre: { type: String, trim: true, default: '' },
    /** Clave programa|instructor para agrupar resultados. */
    clave: { type: String, trim: true, default: '' },
    aspectos: { type: AspectosCarpaSchema, required: true },
    /** Promedio de los 5 aspectos (1–5). */
    promedio: { type: Number, min: 1, max: 5 },
  },
  { _id: false },
);

const RespuestaEncuestaJornadaSchema = new mongoose.Schema(
  {
    idEncuesta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EncuestaJornadaCap',
      required: true,
      index: true,
    },
    idContrato: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contratacion',
      required: true,
      index: true,
    },
    numDoc: { type: Number, required: true, index: true },
    /** Una fila por carpa asistida (5 aspectos Likert cada una). */
    calificacionesCarpa: { type: [CalificacionCarpaSchema], default: [] },
    /** Legado: una nota por programa certificado. */
    calificaciones: { type: [CalificacionProgramaSchema], default: [] },
    comentario: { type: String, trim: true, default: '' },
    fechaEnvio: { type: Date, default: Date.now },
  },
  { collection: 'respuestasEncuestaJornada', timestamps: true },
);

RespuestaEncuestaJornadaSchema.index({ idEncuesta: 1, numDoc: 1 }, { unique: true });

module.exports = mongoose.model('RespuestaEncuestaJornada', RespuestaEncuestaJornadaSchema);
