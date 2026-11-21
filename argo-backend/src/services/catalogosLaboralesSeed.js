const Cargo = require('../models/Cargo');
const DepartamentoEmpresa = require('../models/DepartamentoEmpresa');
const { maxNumericId } = require('./programaServicio');

const CARGOS_BASE = [
  'Director',
  'Coordinador académico',
  'Coordinador de prácticas',
  'Instructor',
  'Auxiliar administrativo',
  'Recepcionista',
  'Contador',
  'Mensajero',
  'Servicios generales',
];

const DEPARTAMENTOS_BASE = [
  'Dirección',
  'Administrativo y financiero',
  'Talento humano',
  'Formación teórica',
  'Formación práctica',
  'Seguridad vial',
  'Servicios generales',
];

function clave(nombre) {
  return String(nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

async function insertarFaltantes(Model, idField, nombres) {
  const existentes = await Model.find().select({ nombre: 1 }).lean();
  const ya = new Set(existentes.map((r) => clave(r.nombre)));
  let creados = 0;
  for (const nombre of nombres) {
    if (ya.has(clave(nombre))) continue;
    const id = await maxNumericId(Model, idField);
    await Model.create({
      [idField]: id,
      nombre,
      estado: 'activo',
      createdAt: new Date(),
      updatedAt: new Date(),
      userAddReg: 'sistema',
      userChangeRecord: 'sistema',
    });
    ya.add(clave(nombre));
    creados += 1;
  }
  return creados;
}

async function asegurarCatalogosLaborales() {
  const cargos = await insertarFaltantes(Cargo, 'idCargo', CARGOS_BASE);
  const departamentos = await insertarFaltantes(
    DepartamentoEmpresa,
    'idDepartamento',
    DEPARTAMENTOS_BASE,
  );
  return { cargos, departamentos };
}

module.exports = {
  asegurarCatalogosLaborales,
  CARGOS_BASE,
  DEPARTAMENTOS_BASE,
};
