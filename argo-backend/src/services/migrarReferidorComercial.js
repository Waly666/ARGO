const Matricula = require('../models/Matricula');
const Certificado = require('../models/Certificado');
const Liquidacion = require('../models/Liquidacion');
const DatosAlumno = require('../models/DatosAlumno');
const { TARIFA_GESTOR, TARIFA_EMPRESA } = require('../constants/tarifa');
const { snapshotReferidorComercial, snapshotReferidorDesdeMatricula } = require('./gestorEmpresaMatricula');
const { ensureConfigDocument } = require('./configEnsure');

const ESQUEMA_REFERIDOR = 1;

async function asegurarConfigGestoresEmpresas() {
  await ensureConfigDocument('gestoresEmpresas', { clave: 'gestoresEmpresas', activo: false });
}

/**
 * Rellena snapshot gestor/empresa en matrículas con tarifa 5/6 que aún no lo tienen.
 */
async function migrarSnapshotMatriculasComerciales(opts = {}) {
  const { dryRun = false } = opts;
  const mats = await Matricula.find({
    tarifa: { $in: [TARIFA_GESTOR, TARIFA_EMPRESA] },
    $or: [
      { referidorComercial: { $ne: true } },
      { referidorComercial: { $exists: false } },
      { gestorId: null, referidorEmpresaId: null },
    ],
  })
    .select('numDoc tarifa')
    .lean();

  if (!mats.length) return { total: 0, actualizadas: 0 };

  const nums = [...new Set(mats.map((m) => m.numDoc).filter((n) => n != null))];
  const alumnos = await DatosAlumno.find({ numDoc: { $in: nums } }).lean();
  const alumMap = new Map(alumnos.map((a) => [a.numDoc, a]));

  let actualizadas = 0;
  for (const mat of mats) {
    const alumno = alumMap.get(mat.numDoc);
    if (!alumno) continue;
    const snap = snapshotReferidorComercial(alumno, mat.tarifa);
    if (!snap.referidorComercial) continue;
    if (!dryRun) {
      await Matricula.updateOne({ _id: mat._id }, { $set: snap });
    }
    actualizadas += 1;
  }

  if (actualizadas > 0) {
    console.log(
      `[ARGO] Referidor comercial: ${actualizadas} matrícula(s) con snapshot${dryRun ? ' (simulación)' : ''}`,
    );
  }
  return { total: mats.length, actualizadas };
}

/** Copia el referidor de la matrícula al certificado (vía liquidación o idMatricula). */
async function migrarSnapshotCertificadosComerciales(opts = {}) {
  const { dryRun = false } = opts;
  const certs = await Certificado.find({
    estado: { $ne: 'anulado' },
    referidorComercial: { $ne: true },
    $or: [
      { idLiquidacion: { $exists: true, $ne: null } },
      { idMatricula: { $exists: true, $ne: null } },
    ],
  })
    .select('_id idLiquidacion idMatricula')
    .lean();

  if (!certs.length) return { total: 0, actualizados: 0 };

  const liqIds = certs.map((c) => c.idLiquidacion).filter(Boolean);
  const liqs = liqIds.length
    ? await Liquidacion.find({ _id: { $in: liqIds } }).select('_id idMat').lean()
    : [];
  const liqMap = new Map(liqs.map((l) => [String(l._id), l]));

  const matIds = new Set(
    [
      ...certs.map((c) => c.idMatricula).filter(Boolean),
      ...liqs.map((l) => l.idMat).filter(Boolean),
    ].map(String),
  );
  const mats = matIds.size
    ? await Matricula.find({ _id: { $in: [...matIds] } }).lean()
    : [];
  const matMap = new Map(mats.map((m) => [String(m._id), m]));

  let actualizados = 0;
  for (const cert of certs) {
    let mat = cert.idMatricula ? matMap.get(String(cert.idMatricula)) : null;
    if (!mat && cert.idLiquidacion) {
      const liq = liqMap.get(String(cert.idLiquidacion));
      if (liq?.idMat) mat = matMap.get(String(liq.idMat));
    }
    if (!mat?.referidorComercial) continue;
    const snap = snapshotReferidorDesdeMatricula(mat);
    if (!snap.referidorComercial) continue;
    if (!dryRun) {
      await Certificado.updateOne({ _id: cert._id }, { $set: snap });
    }
    actualizados += 1;
  }

  if (actualizados > 0) {
    console.log(
      `[ARGO] Referidor comercial: ${actualizados} certificado(s) con snapshot${dryRun ? ' (simulación)' : ''}`,
    );
  }
  return { total: certs.length, actualizados };
}

async function normalizarDefaultsReferidor() {
  await Matricula.updateMany(
    {
      $or: [{ referidorComercial: { $exists: false } }, { referidorComercial: null }],
      tarifa: { $nin: [TARIFA_GESTOR, TARIFA_EMPRESA] },
    },
    {
      $set: {
        referidorComercial: false,
        tipoReferidorComercial: null,
        gestorId: null,
        gestorNombre: null,
        referidorEmpresaId: null,
        referidorEmpresaNombre: null,
      },
    },
  );
  await Certificado.updateMany(
    { referidorComercial: { $exists: false } },
    {
      $set: {
        referidorComercial: false,
        tipoReferidorComercial: null,
        gestorId: null,
        gestorNombre: null,
        referidorEmpresaId: null,
        referidorEmpresaNombre: null,
      },
    },
  );
}

/** Parches idempotentes tras restaurar respaldo o al arrancar el servidor. */
async function aplicarParchesReferidorComercial(opts = {}) {
  await asegurarConfigGestoresEmpresas();
  await normalizarDefaultsReferidor();
  const mats = await migrarSnapshotMatriculasComerciales(opts);
  const certs = await migrarSnapshotCertificadosComerciales(opts);
  return {
    esquemaReferidor: ESQUEMA_REFERIDOR,
    matriculas: mats,
    certificados: certs,
  };
}

module.exports = {
  ESQUEMA_REFERIDOR,
  aplicarParchesReferidorComercial,
  migrarSnapshotMatriculasComerciales,
  migrarSnapshotCertificadosComerciales,
  asegurarConfigGestoresEmpresas,
};
