const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const Usuario = require('../models/Usuario');
const { baseDir: uploadsDir } = require('../middleware/upload');
const { CONSERVAR_EN_RESET, COLECCIONES_ESPECIALES } = require('../constants/cicloVidaColecciones');
const { crearRespaldo, recrearIndices } = require('./respaldos');
const { registrarAuditoria } = require('./auditoria');

const FRASE_CONFIRMACION = 'REINICIAR EMPRESA';

async function coleccionesActuales() {
  const cols = await mongoose.connection.db.listCollections().toArray();
  return cols.map((c) => c.name).filter((n) => !n.startsWith('system.'));
}

async function vaciarUploads() {
  if (!fs.existsSync(uploadsDir)) return 0;
  const entradas = await fs.promises.readdir(uploadsDir);
  for (const e of entradas) {
    await fs.promises.rm(path.join(uploadsDir, e), { recursive: true, force: true });
  }
  return entradas.length;
}

/**
 * Puesta en cero para iniciar con otra empresa:
 * - Respaldo completo previo (obligatorio).
 * - Conserva catálogos; elimina todos los datos transaccionales.
 * - Conserva únicamente al administrador que ejecuta la operación.
 * - Configuración vuelve a valores de fábrica (consecutivos en 0).
 * - Limpia archivos subidos (fotos, documentos, materiales).
 */
async function ejecutarResetEmpresa(req, adminDoc) {
  const usuario = adminDoc.username;

  const respaldo = await crearRespaldo({
    tipo: 'pre-reset',
    usuario,
    nota: 'Respaldo automático antes de la puesta en cero',
  });

  const db = mongoose.connection.db;
  const todas = await coleccionesActuales();
  const conservadas = [];
  const limpiadas = [];

  for (const nombre of todas) {
    if (CONSERVAR_EN_RESET.has(nombre)) {
      conservadas.push(nombre);
      continue;
    }
    if (COLECCIONES_ESPECIALES.has(nombre)) continue;
    await db.collection(nombre).drop().catch(() => {});
    limpiadas.push(nombre);
  }

  // usuarios: conservar solo al administrador que ejecuta
  const rUsuarios = await db
    .collection('usuarios')
    .deleteMany({ _id: { $ne: adminDoc._id } });
  // Desvincular referencias a empleados eliminados
  await Usuario.updateOne(
    { _id: adminDoc._id },
    { $unset: { idEmpleado: '', numero: '', numeroDocumento: '' }, $set: { sedesPermitidas: [] } },
  ).catch(() => {});

  // config y roles: a valores de fábrica
  await db.collection('config').drop().catch(() => {});
  await db.collection('roles_app').drop().catch(() => {});
  limpiadas.push('config', 'roles_app');

  await recrearIndices();
  const { initRolesSistema, limpiarCache } = require('./rolesPermisos');
  await initRolesSistema({ force: true });
  limpiarCache();
  const { initConfigNomina } = require('./configNomina');
  await initConfigNomina().catch(() => {});

  // Sede mínima para que el sistema sea operable de inmediato
  const { asegurarSedePrincipal } = require('./sedeContext');
  await asegurarSedePrincipal().catch(() => {});

  const archivosEliminados = await vaciarUploads();

  // La auditoría queda registrada en la BD ya reiniciada y en el log de archivo.
  await registrarAuditoria({
    req,
    accion: 'reset_empresa',
    entidad: 'sistema',
    resumen:
      `Puesta en cero ejecutada por ${usuario}. ` +
      `Colecciones limpiadas: ${limpiadas.length}; conservadas: ${conservadas.length}. ` +
      `Respaldo previo: ${respaldo.archivo}`,
    datosDespues: {
      respaldoPrevio: respaldo.archivo,
      coleccionesLimpiadas: limpiadas,
      coleccionesConservadas: conservadas,
      usuariosEliminados: rUsuarios.deletedCount,
      carpetasUploadsEliminadas: archivosEliminados,
    },
  });

  return {
    respaldoPrevio: respaldo.archivo,
    coleccionesLimpiadas: limpiadas.length,
    coleccionesConservadas: conservadas.length,
    usuariosEliminados: rUsuarios.deletedCount,
    detalle: { limpiadas, conservadas },
  };
}

module.exports = { ejecutarResetEmpresa, FRASE_CONFIRMACION };
