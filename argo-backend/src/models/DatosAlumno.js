const mongoose = require('mongoose');

const DatosAlumnoSchema = new mongoose.Schema(
  {
    fechaReg: { type: Date, default: Date.now },
    tipoDoc: { type: String, trim: true },
    numDoc: { type: String, required: true, unique: true, trim: true, index: true },
    expedida: { type: String, trim: true },
    apellido1: { type: String, required: true, trim: true },
    apellido2: { type: String, trim: true, default: '' },
    nombre1: { type: String, required: true, trim: true },
    nombre2: { type: String, trim: true, default: '' },
    fechaNac: { type: Date },
    observaciones: { type: String, trim: true },
    genero: { type: String, trim: true },
    tipoSangre: { type: String, trim: true },
    jornada: { type: String, trim: true },
    estadoCivil: { type: String, trim: true },
    estrato: { type: String, trim: true },
    regimenSalud: { type: String, trim: true },
    nivelFormacion: { type: String, trim: true },
    ocupacion: { type: String, trim: true },
    discapacidad: { type: String, trim: true },
    munOrigen: { type: String, trim: true },
    codMunicipio: { type: String, trim: true },
    correo: { type: String, trim: true },
    direccion: { type: String, trim: true },
    celular: { type: String, trim: true },
    multiCulturalidad: { type: String, trim: true },
    urlFoto: { type: String, trim: true },
    fechaAudi: { type: Date, default: Date.now },
    userAddReg: { type: String, trim: true },
    userChangeRecord: { type: String, trim: true },
    fechaMod: { type: Date },
  },
  { collection: 'datosAlumnos', timestamps: false, strict: false },
);

DatosAlumnoSchema.index({ apellido1: 'text', apellido2: 'text', nombre1: 'text', nombre2: 'text', numDoc: 'text' });

module.exports = mongoose.model('DatosAlumno', DatosAlumnoSchema);
