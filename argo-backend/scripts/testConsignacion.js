/**
 * Prueba local del flujo pago por consignación QR (sin UI).
 * Uso: node scripts/testConsignacion.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDB } = require('../src/config/db');
const { models: cat } = require('../src/models/catalogos');
const Liquidacion = require('../src/models/Liquidacion');
const SolicitudPagoConsignacion = require('../src/models/SolicitudPagoConsignacion');
const Usuario = require('../src/models/Usuario');
const {
  guardarConfigPagoConsignacion,
  obtenerConfigPagoConsignacion,
} = require('../src/services/configPagoConsignacion');
const { buscarLiquidacionVirtual } = require('../src/services/aulaVirtualMatricula');
const { num } = require('../src/services/pagoVirtual');
const { sesionAbiertaUsuario, abrirSesion } = require('../src/services/cajaSesion');
const {
  estadoConsignacionPublico,
  crearSolicitudConsignacion,
  aprobarSolicitud,
  listarSolicitudesAdmin,
} = require('../src/services/pagoConsignacionPortal');

const UPLOADS = path.join(__dirname, '../uploads/pago-consignacion-qr');
const QR_SRC = path.resolve(
  __dirname,
  '../../assets/c__Users_walte_AppData_Roaming_Cursor_User_workspaceStorage_2ddcf6236cfc9d2e5ff0b3edb4e63c27_images_WhatsApp_Image_2026-08-21_at_6.15.35_PM-b16f7f3e-8cad-4866-bf83-def023f99c45.jpg',
);

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}
function fail(msg) {
  console.error(`  ✗ ${msg}`);
  process.exitCode = 1;
}

async function primeraCuentaBancaria() {
  const cuenta = await cat.cuentasBancarias.findOne({}).lean();
  if (!cuenta) throw new Error('No hay cuentas bancarias en catálogo.');
  const id = String(cuenta.idCuentaBancaria ?? cuenta._id ?? cuenta.codigo ?? '');
  return { id, cuenta };
}

async function liquidacionVirtualPendiente() {
  const rows = await Liquidacion.find({ idProg: { $exists: true, $ne: null } })
    .sort({ updatedAt: -1 })
    .limit(120)
    .lean();
  const candidatos = [];
  for (const row of rows) {
    const saldo = num(row.saldo);
    if (saldo <= 0.01 || !row.idProg || row.numDoc == null) continue;
    const liq = await buscarLiquidacionVirtual(row.numDoc, row.idProg);
    if (liq && num(liq.saldo) > 0.01) {
      candidatos.push({ liq, numDoc: row.numDoc, idPrograma: String(row.idProg), saldo: num(liq.saldo) });
    }
  }
  if (!candidatos.length) throw new Error('No hay liquidación virtual pendiente para probar.');
  candidatos.sort((a, b) => a.saldo - b.saldo);
  const pick = candidatos[0];
  return { liq: pick.liq, numDoc: pick.numDoc, idPrograma: pick.idPrograma };
}

async function prepararQr(medioId) {
  fs.mkdirSync(UPLOADS, { recursive: true });
  const filename = `test-${medioId}.jpg`;
  const dest = path.join(UPLOADS, filename);
  if (fs.existsSync(QR_SRC)) {
    fs.copyFileSync(QR_SRC, dest);
  } else {
    fs.writeFileSync(dest, Buffer.from('fake-qr-test'));
  }
  return `pago-consignacion-qr/${filename}`;
}

async function main() {
  console.log('\n[testConsignacion] Iniciando prueba E2E...\n');
  await connectDB();

  const { id: idCuenta } = await primeraCuentaBancaria();
  ok(`Cuenta bancaria: ${idCuenta}`);

  const medioId = 'test-medio-nequi';
  const urlQr = await prepararQr(medioId);
  ok(`QR de prueba: ${urlQr}`);

  const { liq, numDoc, idPrograma } = await liquidacionVirtualPendiente();
  ok(`Liquidación pendiente: alumno ${numDoc}, curso ${idPrograma}, saldo ${num(liq.saldo)}`);

  const cfg = await guardarConfigPagoConsignacion({
    activo: true,
    idTipoPago: '2',
    medios: [
      {
        id: medioId,
        etiqueta: 'Nequi / Bre-B (prueba)',
        idCuentaBancaria: idCuenta,
        urlQr,
        activo: true,
        orden: 0,
        instruccionesExtra: 'Consigne el valor exacto del curso.',
      },
    ],
  });
  if (!cfg.activo || cfg.medios.length !== 1) fail('No se guardó la config');
  else ok('Config consignación activa con 1 medio');

  const publico = await obtenerConfigPagoConsignacion();
  if (!publico.medios[0]?.urlQr) fail('Medio sin QR');
  else ok('Medio con QR en config');

  await SolicitudPagoConsignacion.deleteMany({
    numDoc,
    idPrograma,
    estado: { $in: ['pendiente', 'rechazada'] },
  });
  ok('Solicitudes previas de prueba limpiadas');

  const estado0 = await estadoConsignacionPublico(numDoc, idPrograma);
  if (!estado0.consignacionActiva) fail('Consignación no activa en estado público');
  if (!estado0.medios.length) fail('Sin medios públicos');
  if (!estado0.puedeEnviarSolicitud) fail('Debería poder enviar solicitud');
  ok(`Estado público OK (${estado0.medios.length} medio(s))`);

  const creada = await crearSolicitudConsignacion({
    numDoc,
    idPrograma,
    medioId,
    referenciaBancaria: `TEST-${Date.now()}`,
    urlComprobante: 'pago-consignacion-comprobantes/test-comprobante.jpg',
  });
  if (creada.solicitud?.estado !== 'pendiente') fail('Solicitud no quedó pendiente');
  ok(`Solicitud creada: ${creada.solicitud.id}`);

  const estado1 = await estadoConsignacionPublico(numDoc, idPrograma);
  if (estado1.puedeEnviarSolicitud) fail('No debería permitir otra solicitud pendiente');
  if (estado1.solicitud?.estado !== 'pendiente') fail('Estado no refleja solicitud pendiente');
  ok('Bloqueo de segunda solicitud OK');

  const admin = await Usuario.findOne({ username: 'admin' }).lean();
  if (!admin) fail('Usuario admin no encontrado');

  let sesion = await sesionAbiertaUsuario(String(admin._id));
  if (!sesion) {
    sesion = await abrirSesion({
      idUsuario: String(admin._id),
      usuario: admin.username,
      user: admin.username,
      rol: admin.rol,
      idSede: String(liq.idSede || 'PRINCIPAL'),
      saldoInicial: 0,
    });
    ok(`Caja abierta para prueba: sesión #${sesion.idSesion}`);
  } else {
    ok(`Caja ya abierta: sesión #${sesion.idSesion}`);
  }

  const lista = await listarSolicitudesAdmin({ estado: 'pendiente' });
  const found = lista.find((s) => String(s.id) === String(creada.solicitud.id));
  if (!found) fail('Solicitud no aparece en listado admin');
  ok('Listado admin OK');

  const aprob = await aprobarSolicitud(creada.solicitud.id, admin);
  if (!aprob.numRecibo && !aprob.message) fail('Aprobación sin respuesta');
  ok(`Aprobada — ${aprob.message || ''} ${aprob.numRecibo ? `Recibo ${aprob.numRecibo}` : ''}`);

  const liqDespues = await Liquidacion.findById(liq._id).lean();
  const saldo = Number(liqDespues?.saldo?.toString?.() ?? liqDespues?.saldo ?? 1);
  if (saldo > 0.01) fail(`Liquidación aún con saldo: ${saldo}`);
  ok('Liquidación pagada');

  console.log('\n[testConsignacion] Prueba completada con éxito.\n');
  process.exit(process.exitCode || 0);
}

main().catch((err) => {
  console.error('\n[testConsignacion] Error:', err.message || err);
  process.exit(1);
});
