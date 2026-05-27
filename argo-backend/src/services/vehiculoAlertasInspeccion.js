const Vehiculo = require('../models/Vehiculo');
const InspeccionVehiculo = require('../models/InspeccionVehiculo');
const { fechaHoyStr } = require('./inspeccionVehiculo');

const MAX_DETALLE = 24;

async function calcularAlertasInspeccionPendiente(fecha) {
  const f = fecha || fechaHoyStr();
  const [vehiculos, inspecciones] = await Promise.all([
    Vehiculo.find({}).select('_id placa nombreMarca nombreLinea claseVehiculo').lean(),
    InspeccionVehiculo.find({ fecha: f }).select('placa').lean(),
  ]);

  const conInspeccion = new Set(inspecciones.map((i) => String(i.placa || '').trim()).filter(Boolean));
  const alertas = [];

  for (const v of vehiculos) {
    const placa = String(v.placa || '').trim();
    if (!placa || conInspeccion.has(placa)) continue;
    alertas.push({
      placa,
      vehiculoId: String(v._id),
      claseVehiculo: String(v.claseVehiculo || '').trim(),
      marcaLinea: [v.nombreMarca, v.nombreLinea].filter(Boolean).join(' ').trim(),
    });
  }

  alertas.sort((a, b) => a.placa.localeCompare(b.placa, 'es'));

  return {
    fecha: f,
    totalPendientes: alertas.length,
    vehiculosAfectados: alertas.length,
    alertas: alertas.slice(0, MAX_DETALLE),
  };
}

module.exports = { calcularAlertasInspeccionPendiente };
