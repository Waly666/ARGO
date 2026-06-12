const { CATALOGOS } = require('../models/catalogos');

/**
 * Clasificación de colecciones para el reset de empresa (puesta en cero).
 *
 * CONSERVAR: catálogos puros que sirven igual para cualquier empresa.
 * Todo lo que NO esté aquí se limpia (incluida cualquier colección nueva
 * que se agregue en el futuro: por defecto se considera dato de la empresa).
 */

/** Aulas y talleres referencian sedes (que se limpian), por eso NO se conservan. */
const CATALOGOS_EXCLUIDOS_DE_CONSERVAR = new Set(['aulas', 'talleres']);

const CONSERVAR_EN_RESET = new Set([
  ...Object.values(CATALOGOS).filter((c) => !CATALOGOS_EXCLUIDOS_DE_CONSERVAR.has(c)),
  // Administradoras (catálogos del Ministerio)
  'eps',
  'afp',
  'arl',
  'cajasCompensacion',
  // Catálogos RRHH genéricos
  'cargos',
  'departamentosEmpresa',
  // Temario académico (los programas se conservan como catálogo)
  'temasProgramaCea',
]);

/**
 * Colecciones con manejo especial (no se eliminan completas):
 * - usuarios: se conserva únicamente el administrador que ejecuta el reset.
 * - config: se vacía; los servicios recrean los valores por defecto
 *   (consecutivos de recibos, certificados e inspecciones quedan en 0).
 * - roles_app: se vacía y se reinicializan los roles del sistema.
 */
const COLECCIONES_ESPECIALES = new Set(['usuarios', 'config', 'roles_app']);

module.exports = { CONSERVAR_EN_RESET, COLECCIONES_ESPECIALES };
