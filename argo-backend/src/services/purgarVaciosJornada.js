const JornadaCap = require('../models/JornadaCap');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const AsisClasJorCap = require('../models/AsisClasJorCap');
const InscripcionClase = require('../models/InscripcionClase');
const Certificado = require('../models/Certificado');
const { syncContadoresContrato } = require('./contratoJornadaSync');

function asIdSet(list) {
  return new Set((list || []).map((x) => String(x)));
}

/** `jornadas` | `clases`. Cada botón de la ficha usa uno; no se mezclan. */
function normalizarAlcancePurga(raw) {
  const v = String(raw || '')
    .trim()
    .toLowerCase();
  if (v === 'jornadas' || v === 'jornada') return 'jornadas';
  if (v === 'clases' || v === 'clase') return 'clases';
  return '';
}

/**
 * Clases sin alumnos (ni inscripción, ni asistencia, ni certificado vigente)
 * y jornadas que quedarían sin clases.
 */
async function calcularPurgaVacios(idContrato) {
  const jornadas = await JornadaCap.find({ idContrato }).select('_id').lean();
  const jornadaIds = jornadas.map((j) => j._id);
  if (!jornadaIds.length) {
    return {
      clasesVaciasIds: [],
      jornadasVaciasIds: [],
      clasesConMovimiento: 0,
      jornadasConClases: 0,
      totalClases: 0,
      totalJornadas: 0,
    };
  }

  const clases = await ClaseJornadaCap.find({ idJornada: { $in: jornadaIds } })
    .select('_id idJornada')
    .lean();
  const claseIds = clases.map((c) => c._id);

  let conInsc = [];
  let conAsis = [];
  let conCert = [];
  if (claseIds.length) {
    [conInsc, conAsis, conCert] = await Promise.all([
      InscripcionClase.distinct('idClase', { idClase: { $in: claseIds } }),
      AsisClasJorCap.distinct('idclaseJornada', { idclaseJornada: { $in: claseIds } }),
      Certificado.distinct('idClaseJornada', {
        idClaseJornada: { $in: claseIds },
        estado: { $ne: 'anulado' },
      }),
    ]);
  }

  const conMovimiento = asIdSet([...conInsc, ...conAsis, ...conCert]);
  const clasesVacias = clases.filter((c) => !conMovimiento.has(String(c._id)));
  const clasesVaciasIds = clasesVacias.map((c) => c._id);

  const jornadasQueQuedanConClase = new Set();
  for (const c of clases) {
    if (conMovimiento.has(String(c._id))) {
      jornadasQueQuedanConClase.add(String(c.idJornada));
    }
  }
  const jornadasVacias = jornadas.filter((j) => !jornadasQueQuedanConClase.has(String(j._id)));

  return {
    clasesVaciasIds,
    jornadasVaciasIds: jornadasVacias.map((j) => j._id),
    clasesConMovimiento: conMovimiento.size,
    jornadasConClases: jornadasQueQuedanConClase.size,
    totalClases: clases.length,
    totalJornadas: jornadas.length,
  };
}

function resumenPurga(calc, alcance) {
  const a = normalizarAlcancePurga(alcance);
  const clasesVacias = (calc.clasesVaciasIds || []).length;
  const jornadasVacias = (calc.jornadasVaciasIds || []).length;
  return {
    alcance: a || undefined,
    clasesSinAlumnos: a === 'jornadas' ? 0 : clasesVacias,
    jornadasSinClases: a === 'clases' ? 0 : jornadasVacias,
    clasesConMovimiento: calc.clasesConMovimiento || 0,
    jornadasConClases: calc.jornadasConClases || 0,
    totalClases: calc.totalClases || 0,
    totalJornadas: calc.totalJornadas || 0,
  };
}

async function previewPurgaVaciosContrato(idContrato, alcance) {
  const a = normalizarAlcancePurga(alcance);
  if (!a) {
    const err = new Error('Indique si va a borrar jornadas vacías o clases vacías.');
    err.status = 400;
    throw err;
  }
  const calc = await calcularPurgaVacios(idContrato);
  return { ok: true, ...resumenPurga(calc, a) };
}

async function ejecutarPurgaVaciosContrato(idContrato, alcance) {
  const a = normalizarAlcancePurga(alcance);
  if (!a) {
    const err = new Error('Indique si va a borrar jornadas vacías o clases vacías.');
    err.status = 400;
    throw err;
  }
  const calc = await calcularPurgaVacios(idContrato);
  let clasesIds = [];
  let jornadasIds = [];

  if (a === 'clases') {
    clasesIds = calc.clasesVaciasIds || [];
  } else {
    jornadasIds = calc.jornadasVaciasIds || [];
    if (jornadasIds.length) {
      const clasesDeEsas = await ClaseJornadaCap.find({ idJornada: { $in: jornadasIds } })
        .select('_id')
        .lean();
      clasesIds = clasesDeEsas.map((c) => c._id);
    }
  }

  if (clasesIds.length) {
    await InscripcionClase.deleteMany({ idClase: { $in: clasesIds } });
    await AsisClasJorCap.deleteMany({ idclaseJornada: { $in: clasesIds } });
    await ClaseJornadaCap.deleteMany({ _id: { $in: clasesIds } });
  }
  if (jornadasIds.length) {
    await JornadaCap.deleteMany({ _id: { $in: jornadasIds } });
  }

  const contratoSync = await syncContadoresContrato(idContrato);
  return {
    ok: true,
    alcance: a,
    clasesEliminadas: a === 'clases' ? clasesIds.length : 0,
    jornadasEliminadas: jornadasIds.length,
    clasesConservadas: calc.clasesConMovimiento || 0,
    jornadasConservadas: a === 'clases' ? calc.totalJornadas || 0 : calc.jornadasConClases || 0,
    contrato: contratoSync,
  };
}

module.exports = {
  calcularPurgaVacios,
  previewPurgaVaciosContrato,
  ejecutarPurgaVaciosContrato,
  normalizarAlcancePurga,
};
