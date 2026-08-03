const mongoose = require('mongoose');
const { parseNumDoc, numDocInvalidMessage } = require('../utils/numDoc');
const { TIPOS_ALUMNO, TIPO_ALUMNO_DEFAULT } = require('../constants/tipoAlumno');
const {
  ORIGENES_ALUMNO,
  ORIGEN_ALUMNO_DEFAULT,
} = require('../constants/origenAlumno');

function normalizarNumDocEnDoc(doc) {
  if (!doc || doc.numDoc == null || doc.numDoc === '') return;
  const n = parseNumDoc(doc.numDoc);
  if (n != null) doc.numDoc = n;
}

const DatosAlumnoSchema = new mongoose.Schema(
  {
    fechaReg: { type: Date, default: Date.now },
    tipoAlumno: {
      type: String,
      enum: TIPOS_ALUMNO,
      default: TIPO_ALUMNO_DEFAULT,
      index: true,
    },
    /** Canal de inscripción: SISTEMA (ARGO) | WEB (portal / página). */
    origen: {
      type: String,
      enum: ORIGENES_ALUMNO,
      default: ORIGEN_ALUMNO_DEFAULT,
      index: true,
    },
    tipoDoc: { type: String, trim: true },
    /** Número de documento (Number en MongoDB) */
    numDoc: { type: Number, required: true, unique: true, index: true },
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
    /** Departamento de origen (DIVIPOLA) — campo separado del municipio. */
    codDepartamento: { type: String, trim: true, index: true },
    nombreDepartamento: { type: String, trim: true },
    nombreMunicipio: { type: String, trim: true },
    correo: { type: String, trim: true },
    direccion: { type: String, trim: true },
    celular: { type: String, trim: true },
    multiCulturalidad: { type: String, trim: true },
    urlFoto: { type: String, trim: true },
    urlCedula: { type: String, trim: true },
    urlLicencia: { type: String, trim: true },
    /** Empresa de transporte u organización a la que pertenece el alumno (ref a clientesFacturacion). */
    empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', default: null, index: true },
    /**
     * Origen en jornadas de capacitación: colegio (institución educativa) | estamento | empresa | operativo.
     * Distinto de `origen` (SISTEMA|WEB).
     */
    origenJornadaCap: { type: String, trim: true, default: null, index: true },
    /** primaria | secundaria | tecnica | tecnologica | universidad (legado: colegio→secundaria, instituto→tecnica). */
    tipoInstitucionEducativa: { type: String, trim: true, default: null, index: true },
    /** estudiante | profesor — perfil dentro de institución educativa. */
    perfilInstitucionEducativa: { type: String, trim: true, default: null, index: true },
    /** Institución educativa (catálogo colegios MEN / IES) — código establecimiento. */
    colegioCodigo: { type: String, trim: true, default: null, index: true },
    colegioNombre: { type: String, trim: true, default: null },
    /** Curso/grado 1–11 (primaria 1–5 · secundaria 6–11 · perfil estudiante). */
    gradoColegio: { type: Number, default: null, min: 1, max: 11 },
    /** Semestre 1–12 (técnica / tecnológica / universidad · perfil estudiante). */
    semestreInstitucion: { type: Number, default: null, min: 1, max: 12 },
    /** Código de titulación del catálogo (técnica/tecnológica/universitaria). */
    titulacionCodigo: { type: String, trim: true, default: null, index: true },
    /** Área que imparte (perfil profesor en institución educativa). */
    areaImparteColegio: { type: String, trim: true, default: null, index: true },
    /** Titulación / programa / carrera (nombre visible · perfil estudiante superior). */
    programaInstitucion: { type: String, trim: true, default: null },
    /** Estamento público (catálogo estamentosPublicos). */
    estamentoId: { type: String, trim: true, default: null, index: true },
    estamentoNombre: { type: String, trim: true, default: null },
    cargoEstamento: { type: String, trim: true, default: null },
    dependenciaEstamento: { type: String, trim: true, default: null },
    /** Horas por sesión de práctica CEA al auto-generar clases (1–4). null = automático según config global. */
    duracionSesionPracticaCea: { type: Number, default: null, min: 1, max: 8 },
    /** Día de referencia acordado con el alumno para recordatorio de cobro (técnicos / cuotas). */
    alertaPago: { type: Date, default: null },
    /** quincenal | mensual */
    alertaPagoFrecuencia: { type: String, trim: true, default: null },
    fechaAudi: { type: Date, default: Date.now },
    userAddReg: { type: String, trim: true },
    userChangeRecord: { type: String, trim: true },
    fechaMod: { type: Date },
  },
  { collection: 'datosAlumnos', timestamps: false, strict: false },
);

DatosAlumnoSchema.index({ apellido1: 'text', apellido2: 'text', nombre1: 'text', nombre2: 'text' });

DatosAlumnoSchema.pre('validate', function preValidateNumDoc(next) {
  normalizarNumDocEnDoc(this);
  if (this.numDoc == null || !Number.isFinite(this.numDoc)) {
    return next(new Error(numDocInvalidMessage()));
  }
  next();
});

DatosAlumnoSchema.pre('findOneAndUpdate', function preUpdateNumDoc(next) {
  const upd = this.getUpdate();
  const payload = upd?.$set || upd;
  if (payload) normalizarNumDocEnDoc(payload);
  next();
});

module.exports = mongoose.model('DatosAlumno', DatosAlumnoSchema);
