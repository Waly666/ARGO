const mongoose = require('mongoose');

const CompetenciaDesempenoSchema = new mongoose.Schema(
  {
    idCompetencia: { type: Number, required: true, unique: true, index: true },
    codigo: { type: String, trim: true, index: true },
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true, default: '' },
    /**
     * Ámbito: vacío = todos los cargos (transversal).
     * Con IDs = solo esos cargos del catálogo RRHH.
     */
    cargosIds: { type: [Number], default: [] },
    /** Legacy / etiqueta: 'todos' | 'cargos' */
    ambito: { type: String, trim: true, default: 'todos' },
    orden: { type: Number, default: 100 },
    estado: { type: String, trim: true, default: 'activo' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    userAddReg: { type: String, trim: true },
    userChangeRecord: { type: String, trim: true },
  },
  { collection: 'competencias_desempeno', strict: false },
);

module.exports = mongoose.model('CompetenciaDesempeno', CompetenciaDesempenoSchema);
