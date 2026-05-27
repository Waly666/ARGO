const Config = require('../models/Config');

const CLAVE = 'programacion_cea';

function bloqueHorarioBase() {
  return {
    horaDesde: '07:00',
    horaHasta: '18:00',
    permiteSabado: true,
    permiteDomingo: false,
    permiteFestivo: false,
    normal: { horaDesde: '07:00', horaHasta: '18:00' },
    sabado: { horaDesde: '07:00', horaHasta: '14:00' },
    domingo: { horaDesde: '08:00', horaHasta: '13:00' },
    festivo: { horaDesde: '08:00', horaHasta: '13:00' },
  };
}

function defaults() {
  return {
    clave: CLAVE,
    vehiculo: {
      ...bloqueHorarioBase(),
      duracionesPermitidas: [1, 2, 3, 4],
      bufferMinutos: 30,
    },
    aula: {
      ...bloqueHorarioBase(),
      cupoMaximoDefault: 25,
    },
    taller: {
      ...bloqueHorarioBase(),
      cupoMaximoDefault: 20,
    },
  };
}

function mergeBloque(actual, patch) {
  const base = bloqueHorarioBase();
  const prev = { ...base, ...(actual || {}) };
  const next = { ...prev, ...(patch || {}) };
  for (const k of ['normal', 'sabado', 'domingo', 'festivo']) {
    next[k] = { ...base[k], ...(prev[k] || {}), ...(patch?.[k] || {}) };
  }
  if (Array.isArray(patch?.duracionesPermitidas)) {
    next.duracionesPermitidas = patch.duracionesPermitidas
      .map((n) => Number(n))
      .filter((n) => n >= 1 && n <= 8);
  }
  if (patch?.bufferMinutos != null) next.bufferMinutos = Math.max(0, Number(patch.bufferMinutos) || 0);
  if (patch?.cupoMaximoDefault != null) {
    next.cupoMaximoDefault = Math.max(1, Number(patch.cupoMaximoDefault) || 1);
  }
  return next;
}

async function obtenerConfig() {
  let doc = await Config.findOne({ clave: CLAVE }).lean();
  if (!doc) {
    doc = (await Config.create(defaults())).toObject();
  }
  const d = defaults();
  return {
    vehiculo: mergeBloque(d.vehiculo, doc.vehiculo),
    aula: mergeBloque(d.aula, doc.aula),
    taller: mergeBloque(d.taller, doc.taller),
    actualizado: doc.updatedAt || doc.createdAt || null,
  };
}

async function guardarConfig(body, usuario) {
  const actual = await obtenerConfig();
  const dto = {
    clave: CLAVE,
    vehiculo: mergeBloque(actual.vehiculo, body?.vehiculo),
    aula: mergeBloque(actual.aula, body?.aula),
    taller: mergeBloque(actual.taller, body?.taller),
    userChangeRecord: usuario?.username || 'sistema',
  };
  await Config.updateOne({ clave: CLAVE }, { $set: dto }, { upsert: true });
  return obtenerConfig();
}

module.exports = { CLAVE, defaults, obtenerConfig, guardarConfig, bloqueHorarioBase };
