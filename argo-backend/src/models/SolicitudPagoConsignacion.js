const mongoose = require('mongoose');

const SolicitudPagoConsignacionSchema = new mongoose.Schema(
  {
    numDoc: { type: Number, required: true, index: true },
    idLiquidacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Liquidacion', required: true, index: true },
    idPrograma: { type: String, trim: true, required: true, index: true },
    idMatricula: { type: mongoose.Schema.Types.ObjectId, ref: 'Matricula', default: null },
    medioId: { type: String, trim: true, required: true },
    medioEtiqueta: { type: String, trim: true, default: '' },
    idCuentaBancaria: { type: String, trim: true, required: true },
    idBanco: { type: String, trim: true, default: '' },
    bancoNombre: { type: String, trim: true, default: '' },
    cuentaDescr: { type: String, trim: true, default: '' },
    referenciaBancaria: { type: String, trim: true, required: true },
    urlComprobante: { type: String, trim: true, required: true },
    montoCop: { type: Number, required: true },
    estado: {
      type: String,
      enum: ['pendiente', 'aprobada', 'rechazada'],
      default: 'pendiente',
      index: true,
    },
    motivoRechazo: { type: String, trim: true, default: '' },
    idIngreso: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingreso', default: null },
    revisadoPor: { type: String, trim: true, default: null },
    revisadoPorNombre: { type: String, trim: true, default: null },
    fechaRevision: { type: Date, default: null },
    emailNotificado: { type: String, trim: true, default: '' },
  },
  { collection: 'solicitudesPagoConsignacion', timestamps: true },
);

SolicitudPagoConsignacionSchema.index(
  { numDoc: 1, idPrograma: 1, estado: 1 },
  { name: 'solicitud_consignacion_alumno_curso_estado' },
);

module.exports = mongoose.model('SolicitudPagoConsignacion', SolicitudPagoConsignacionSchema);
