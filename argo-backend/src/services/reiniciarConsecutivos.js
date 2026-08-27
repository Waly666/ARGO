const Config = require('../models/Config');
const { CLAVE: CLAVE_RECIBO } = require('./configRecibo');
const { CLAVE: CLAVE_CERT } = require('./configCertificado');
const { CLAVE: CLAVE_INSP } = require('./inspeccionConsecutivo');

/** Documentos de config cuyos contadores numéricos se reinician a 0. */
const REINICIO_POR_CLAVE = {
  [CLAVE_RECIBO]: {
    consecutivoFactura: 0,
    consecutivoComprobanteIngreso: 0,
    consecutivoComprobanteEgreso: 0,
    consecutivoCuentaCobro: 0,
    consecutivoRecibo: 0,
  },
  [CLAVE_CERT]: {
    consecutivoCertificado: 0,
  },
  [CLAVE_INSP]: {
    consecutivoInspeccion: 0,
  },
};

/**
 * Pone en 0 los consecutivos de numeración (recibos, certificados, inspecciones).
 * No modifica prefijos, textos, logos ni demás configuración.
 */
async function reiniciarConsecutivosEmpresa() {
  const actualizados = [];
  const sinDocumento = [];

  for (const [clave, fields] of Object.entries(REINICIO_POR_CLAVE)) {
    const r = await Config.updateOne({ clave }, { $set: fields });
    if (r.matchedCount > 0) {
      actualizados.push(clave);
    } else {
      sinDocumento.push(clave);
    }
  }

  return {
    actualizados,
    sinDocumento,
    campos: Object.values(REINICIO_POR_CLAVE).flatMap((f) => Object.keys(f)),
  };
}

module.exports = { reiniciarConsecutivosEmpresa, REINICIO_POR_CLAVE };
