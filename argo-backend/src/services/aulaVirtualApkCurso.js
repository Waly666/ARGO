/** APK offline por curso virtual — reglas de descarga en portal (independiente del certificado). */

function normalizarModoApk(raw) {
  return raw === 'al_pagar' ? 'al_pagar' : 'al_matricular';
}

function tieneApkCargado(cfg) {
  return !!String(cfg?.apkRuta || '').trim();
}

/**
 * @param {object|null} cfg — capacitacionVirtualConfig
 * @param {{ pagado?: boolean }|null|undefined} pago — estado de pago del alumno en el curso
 */
function evaluarApkDescargaPortal(cfg, pago) {
  if (!tieneApkCargado(cfg)) {
    return {
      tieneApk: false,
      puedeDescargar: false,
      modoApkDescarga: normalizarModoApk(cfg?.modoApkDescarga),
      apkNombre: null,
    };
  }
  const modo = normalizarModoApk(cfg.modoApkDescarga);
  const apkNombre = String(cfg.apkNombre || '').trim() || null;
  if (modo === 'al_pagar' && !pago?.pagado) {
    return {
      tieneApk: true,
      puedeDescargar: false,
      modoApkDescarga: modo,
      apkNombre,
      mensaje: 'APK disponible cuando complete el pago del curso.',
    };
  }
  return {
    tieneApk: true,
    puedeDescargar: true,
    modoApkDescarga: modo,
    apkNombre,
  };
}

module.exports = {
  normalizarModoApk,
  tieneApkCargado,
  evaluarApkDescargaPortal,
};
