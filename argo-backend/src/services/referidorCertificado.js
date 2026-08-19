const Matricula = require('../models/Matricula');
const { snapshotReferidorDesdeMatricula } = require('./gestorEmpresaMatricula');

/** Copia el referidor comercial de la matrícula ligada a la liquidación (si aplica). */
async function referidorCertificadoDesdeLiquidacion(liq) {
  const idMat = liq?.idMat || liq?.idMatricula;
  if (!idMat) {
    return snapshotReferidorDesdeMatricula(null);
  }
  const mat = await Matricula.findById(idMat).lean();
  return snapshotReferidorDesdeMatricula(mat);
}

module.exports = { referidorCertificadoDesdeLiquidacion };
