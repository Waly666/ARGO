const Cargo = require('../models/Cargo');
const DepartamentoEmpresa = require('../models/DepartamentoEmpresa');
const Eps = require('../models/Eps');
const Afp = require('../models/Afp');
const Arl = require('../models/Arl');
const CajaCompensacion = require('../models/CajaCompensacion');
const CompetenciaDesempeno = require('../models/CompetenciaDesempeno');
const { createCatalogController } = require('../services/rrhhCatalogo');
const { asegurarCompetenciasDefault } = require('../services/competenciasDesempenoSeed');

const cargoFields = ['nombre', 'descripcion', 'nivel', 'salarioBase', 'estado'];
const simpleFields = ['nombre', 'descripcion', 'estado'];
const nitFields = ['nombre', 'nit', 'telefono', 'estado'];
const arlFields = ['nombre', 'nit', 'nivelRiesgo', 'telefono', 'estado'];
const competenciaFields = ['codigo', 'nombre', 'descripcion', 'cargosIds', 'ambito', 'orden', 'estado'];

function normalizeCompetenciaDto(dto) {
  if (!dto || typeof dto !== 'object') return dto;
  if (dto.cargosIds !== undefined) {
    const ids = Array.isArray(dto.cargosIds)
      ? dto.cargosIds.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)
      : [];
    dto.cargosIds = [...new Set(ids)];
    dto.ambito = dto.cargosIds.length ? 'cargos' : 'todos';
  }
  return dto;
}

exports.cargo = createCatalogController(Cargo, {
  idField: 'idCargo',
  fields: cargoFields,
  searchFields: ['nombre', 'descripcion', 'nivel'],
});

exports.departamento = createCatalogController(DepartamentoEmpresa, {
  idField: 'idDepartamento',
  fields: simpleFields,
});

exports.eps = createCatalogController(Eps, { idField: 'idEps', fields: nitFields });
exports.afp = createCatalogController(Afp, { idField: 'idAfp', fields: nitFields });
exports.arl = createCatalogController(Arl, {
  idField: 'idArl',
  fields: arlFields,
  searchFields: ['nombre', 'nit'],
});

exports.cajaCompensacion = createCatalogController(CajaCompensacion, {
  idField: 'idCajaCompensacion',
  fields: nitFields,
});

const competenciaBase = createCatalogController(CompetenciaDesempeno, {
  idField: 'idCompetencia',
  fields: competenciaFields,
  searchFields: ['nombre', 'codigo', 'descripcion', 'ambito'],
});

/** Listar con seed/migración; crear/actualizar normalizan cargosIds. */
exports.competencia = {
  ...competenciaBase,
  listar: async (req, res, next) => {
    try {
      await asegurarCompetenciasDefault();
      return competenciaBase.listar(req, res, next);
    } catch (e) {
      next(e);
    }
  },
  crear: async (req, res, next) => {
    try {
      req.body = normalizeCompetenciaDto({ ...(req.body || {}) });
      return competenciaBase.crear(req, res, next);
    } catch (e) {
      next(e);
    }
  },
  actualizar: async (req, res, next) => {
    try {
      req.body = normalizeCompetenciaDto({ ...(req.body || {}) });
      return competenciaBase.actualizar(req, res, next);
    } catch (e) {
      next(e);
    }
  },
};
