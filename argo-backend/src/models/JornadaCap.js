const mongoose = require('mongoose');
const { ESTADOS_JORNADA, ESTADO_JORNADA_PROGRAMADA, DETE_GEOREFE_VALORES } = require('../constants/jornadaCapacitacion');

const JornadaCapSchema = new mongoose.Schema(
  {
    idContrato: { type: mongoose.Schema.Types.ObjectId, ref: 'Contratacion', required: true, index: true },
    /**
     * Código legible: {codContrato}-{últimas 6 del _id Mongo}.
     * Ej. JOR-2026-059-A1B2C3
     */
    codigoJornada: { type: String, trim: true, default: '', index: true },
    fechaProgramacion: { type: Date, required: true, index: true },
    municipio: { type: String, trim: true, default: '' },
    depto: { type: String, trim: true, default: '' },
    /** Código Divipola del municipio (si se conoce). */
    codMunicipio: { type: String, trim: true, default: '' },
    direccion: { type: String, trim: true, default: '' },
    /** 1..N cuando hay varias jornadas el mismo día (plan municipio.jornadasPorDia o legado contrato). */
    indiceEnDia: { type: Number, default: 1 },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    /** MAPA | DISPOSITIVO_MOVIL | MANUAL — cómo se obtuvo la georreferenciación. */
    deteGeorefe: { type: String, enum: [...DETE_GEOREFE_VALORES, ''], default: '' },
    horaInicio: { type: Date, default: null },
    numeObjeJornada: { type: Number, default: 0 },
    supervisor: { type: String, trim: true, default: '' },
    estado: { type: String, enum: ESTADOS_JORNADA, default: ESTADO_JORNADA_PROGRAMADA },
    /** Si true, no recalcula estado por fecha (cierre manual en modo operación especial). */
    estadoOperacionManual: { type: Boolean, default: false },
    /** PDF único con evidencias consolidadas (imágenes + PDFs). */
    urlEvidenciaConsolidada: { type: String, trim: true, default: '' },
    userAddReg: { type: String, trim: true },
    userChangeRecord: { type: String, trim: true },
  },
  { collection: 'jornadasCap', timestamps: true },
);

module.exports = mongoose.model('JornadaCap', JornadaCapSchema);
