const mongoose = require('mongoose');

const SolicitudAutorizacionSchema = new mongoose.Schema(
  {
    idSolicitud: { type: Number, required: true, unique: true, index: true },
    modulo: { type: String, required: true, trim: true, index: true },
    accion: { type: String, required: true, trim: true, default: 'eliminar' },
    entidad: { type: String, trim: true },
    idEntidad: { type: String, required: true, trim: true, index: true },
    idSede: { type: String, trim: true, index: true },
    resumen: { type: String, trim: true },
    detalle: { type: mongoose.Schema.Types.Mixed },
    motivo: { type: String, trim: true },
    estado: {
      type: String,
      enum: ['pendiente', 'autorizada', 'rechazada', 'ejecutada', 'fallida', 'caducada'],
      default: 'pendiente',
      index: true,
    },
    idUsuarioSolicita: { type: String, trim: true, index: true },
    usuarioSolicita: { type: String, trim: true },
    nombreSolicita: { type: String, trim: true },
    fechaSolicitud: { type: Date, default: Date.now, index: true },
    idUsuarioResuelve: { type: String, trim: true },
    usuarioResuelve: { type: String, trim: true },
    nombreResuelve: { type: String, trim: true },
    fechaResolucion: { type: Date },
    motivoRechazo: { type: String, trim: true },
    resultadoEjecucion: { type: mongoose.Schema.Types.Mixed },
    errorEjecucion: { type: String, trim: true },
    notificacionVistaSolicitante: { type: Boolean, default: false, index: true },
  },
  { collection: 'solicitudesAutorizacion', timestamps: true },
);

SolicitudAutorizacionSchema.index({ estado: 1, fechaSolicitud: -1 });

module.exports = mongoose.model('SolicitudAutorizacion', SolicitudAutorizacionSchema);
