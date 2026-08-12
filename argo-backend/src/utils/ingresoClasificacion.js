/**
 * Distingue ingreso de caja (tercero) vs cobro a alumno.
 * Multi-ítem de alumno tiene idLiquidacion null pero sí numDoc y detalle[].
 */
function esIngresoCaja(doc) {
  if (!doc) return false;
  if (doc.ingresoCaja) return true;
  if (doc.numDoc != null || doc.idLiquidacion) return false;
  return !!doc.idTipoIngreso;
}

/** Cobro a alumno (liquidación o multi-ítem), no caja ni contrato empresa. */
function esIngresoAlumno(doc) {
  if (!doc) return false;
  if (doc.ingresoCaja) return false;
  if (doc.origenContratoCap) return false;
  if (doc.numDoc == null) return false;
  return true;
}

module.exports = { esIngresoCaja, esIngresoAlumno };
