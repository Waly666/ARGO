const mongoose = require('mongoose');

const ESTADOS_SALIDA = ['programado', 'autorizado', 'en_curso', 'finalizado', 'cancelado'];
const MOTIVOS_SALIDA = ['clase', 'mantenimiento', 'diligencia', 'otro'];

const RegistroSalidaRetornoVehiculoSchema = new mongoose.Schema(
  {
    numeroSecuencia: { type: Number, required: true, unique: true, index: true },
    numeroRegistro: { type: String, required: true, unique: true, trim: true },
    vehiculoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehiculo', required: true, index: true },
    placa: { type: String, required: true, trim: true, index: true },
    idEmpleadoConductor: { type: Number, required: true, index: true },
    nombreConductor: { type: String, required: true, trim: true },
    motivo: { type: String, enum: MOTIVOS_SALIDA, required: true },
    claseId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClaseProgramadaCea', default: null },
    claseResumen: { type: String, trim: true, default: '' },
    alumnoNumDoc: { type: Number, default: null },
    alumnoNombre: { type: String, trim: true, default: '' },
    origen: { type: String, trim: true, default: '' },
    destino: { type: String, trim: true, default: '' },
    fechaHoraSalida: { type: Date, default: null },
    kilometrajeInicial: { type: Number, default: null },
    inspeccionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InspeccionVehiculo', default: null },
    inspeccionResultado: { type: String, trim: true, default: '' },
    fechaHoraRegreso: { type: Date, default: null },
    kilometrajeFinal: { type: Number, default: null },
    kilometrosRecorridos: { type: Number, default: null },
    observaciones: { type: String, trim: true, default: '' },
    incidente: { type: String, trim: true, default: '' },
    estado: { type: String, enum: ESTADOS_SALIDA, default: 'programado', index: true },
    creadoPor: { type: String, trim: true, default: '' },
    cerradoPor: { type: String, trim: true, default: '' },
    cerradoEn: { type: Date, default: null },
  },
  { collection: 'registros_salida_retorno_vehiculos', timestamps: true },
);

RegistroSalidaRetornoVehiculoSchema.index({ fechaHoraSalida: -1, placa: 1 });

module.exports = mongoose.model('RegistroSalidaRetornoVehiculo', RegistroSalidaRetornoVehiculoSchema);
module.exports.ESTADOS_SALIDA = ESTADOS_SALIDA;
module.exports.MOTIVOS_SALIDA = MOTIVOS_SALIDA;
