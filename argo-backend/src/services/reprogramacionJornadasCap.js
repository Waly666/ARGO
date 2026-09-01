const Contratacion = require('../models/Contratacion');
const JornadaCap = require('../models/JornadaCap');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const AsisClasJorCap = require('../models/AsisClasJorCap');
const { esDiaProgramable } = require('../constants/jornadaCapacitacion');
const { normalizarMunicipiosPlan } = require('../constants/municipiosPlanContrato');
const { slotKey } = require('./programacionJornadas');
const { horariosClasesJornada } = require('./programacionClasesJornada');
const { sincronizarEstadoJornada, inicioDia } = require('./estadoJornadaCap');
const {
  parseFechaCalendario,
  fechaCalendarioParaGuardar,
  fechaCalendarioIso,
  hoyCalendario,
} = require('../utils/fechaCalendario');

const ESTADOS_CLASE_DICTADA = new Set(['EN PROCESO', 'FINALIZADO']);

async function claseEstaDictada(clase, asistenciasPorClase) {
  if (!clase) return false;
  if (ESTADOS_CLASE_DICTADA.has(String(clase.estado || '').trim().toUpperCase())) return true;
  if (asistenciasPorClase) {
    return (asistenciasPorClase.get(String(clase._id)) || 0) > 0;
  }
  const n = await AsisClasJorCap.countDocuments({ idclaseJornada: clase._id });
  return n > 0;
}

async function mapaAsistenciasPorClase(claseIds) {
  const ids = (claseIds || []).filter(Boolean);
  if (!ids.length) return new Map();
  const rows = await AsisClasJorCap.aggregate([
    { $match: { idclaseJornada: { $in: ids } } },
    { $group: { _id: '$idclaseJornada', n: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
}

async function jornadaTieneClasesDictadas(idJornada, clasesPorJornada, asistenciasPorClase) {
  const clases = clasesPorJornada || (await ClaseJornadaCap.find({ idJornada }).lean());
  for (const c of clases) {
    if (await claseEstaDictada(c, asistenciasPorClase)) return true;
  }
  return false;
}

function flagsCalendario(contrato) {
  return {
    incluiSab: !!contrato?.incluiSab,
    incluiDom: !!contrato?.incluiDom,
    incluiFest: !!contrato?.incluiFest,
  };
}

function resolverPorDia(contrato, jornada) {
  const plan = normalizarMunicipiosPlan(contrato?.municipiosPlan);
  if (plan.length) {
    const cod = String(jornada?.codMunicipio || '').trim();
    const nom = String(jornada?.municipio || '')
      .trim()
      .toUpperCase();
    const row = plan.find(
      (p) => (cod && String(p.codMunicipio || '').trim() === cod) || (nom && p.municipio === nom),
    );
    if (row) return row.jornadasPorDia;
  }
  return Math.max(1, Math.min(20, parseInt(contrato?.jornadasPorDia, 10) || 1));
}

function avanzarDiasProgramables(fechaInicio, n, flags) {
  const pasos = Math.max(0, parseInt(n, 10) || 0);
  let cursor = parseFechaCalendario(fechaInicio);
  if (!cursor) throw new Error('Fecha de referencia inválida');
  if (pasos === 0) return cursor;

  let counted = 0;
  let guard = 0;
  while (counted < pasos && guard < 5000) {
    guard += 1;
    cursor.setDate(cursor.getDate() + 1);
    if (esDiaProgramable(cursor, flags)) counted += 1;
  }
  if (counted < pasos) {
    throw new Error(
      `No fue posible avanzar ${pasos} día(s) programable(s) con las reglas del contrato (sábados, domingos y festivos).`,
    );
  }
  return cursor;
}

function agruparJornadasPorDia(jornadas) {
  const groups = [];
  let current = null;
  for (const j of jornadas) {
    const key = fechaCalendarioIso(j.fechaProgramacion);
    if (!current || current.fecha !== key) {
      current = { fecha: key, items: [] };
      groups.push(current);
    }
    current.items.push(j);
  }
  for (const g of groups) {
    g.items.sort(
      (a, b) =>
        (parseInt(a.indiceEnDia, 10) || 1) - (parseInt(b.indiceEnDia, 10) || 1) ||
        String(a._id).localeCompare(String(b._id)),
    );
  }
  return groups;
}

function ordenarJornadas(jornadas) {
  return [...jornadas].sort((a, b) => {
    const fa = fechaCalendarioIso(a.fechaProgramacion);
    const fb = fechaCalendarioIso(b.fechaProgramacion);
    if (fa !== fb) return fa.localeCompare(fb);
    return (parseInt(a.indiceEnDia, 10) || 1) - (parseInt(b.indiceEnDia, 10) || 1);
  });
}

async function cargarContextoReprogramacion(idContrato) {
  const contrato = await Contratacion.findById(idContrato).lean();
  if (!contrato) {
    const err = new Error('Contrato no encontrado');
    err.status = 404;
    throw err;
  }

  const jornadas = ordenarJornadas(await JornadaCap.find({ idContrato }).lean());
  const jornadaIds = jornadas.map((j) => j._id);
  const clasesAll = jornadaIds.length
    ? await ClaseJornadaCap.find({ idJornada: { $in: jornadaIds } }).lean()
    : [];
  const clasesPorJornada = new Map();
  for (const c of clasesAll) {
    const key = String(c.idJornada);
    if (!clasesPorJornada.has(key)) clasesPorJornada.set(key, []);
    clasesPorJornada.get(key).push(c);
  }
  const asistenciasPorClase = await mapaAsistenciasPorClase(clasesAll.map((c) => c._id));

  const bloqueadas = [];
  const movibles = [];

  for (const j of jornadas) {
    const clases = clasesPorJornada.get(String(j._id)) || [];
    const dictada = await jornadaTieneClasesDictadas(j._id, clases, asistenciasPorClase);
    const row = { jornada: j, clases, dictada };
    if (dictada) {
      bloqueadas.push(row);
    } else {
      movibles.push(row);
    }
  }

  let fechaMinimaDesde = null;
  if (movibles.length) {
    fechaMinimaDesde = movibles.reduce((min, r) => {
      const f = parseFechaCalendario(r.jornada.fechaProgramacion);
      if (!f) return min;
      if (!min || f.getTime() < min.getTime()) return f;
      return min;
    }, null);
  } else if (jornadas.length) {
    fechaMinimaDesde = parseFechaCalendario(jornadas[0].fechaProgramacion);
  } else {
    fechaMinimaDesde = parseFechaCalendario(contrato.fechaInicJornadas) || hoyCalendario();
  }

  return {
    contrato,
    jornadas,
    clasesPorJornada,
    asistenciasPorClase,
    bloqueadas,
    movibles,
    fechaMinimaDesde,
    flags: flagsCalendario(contrato),
  };
}

function slotsBloqueados(jornadas, idsMover) {
  const mover = new Set((idsMover || []).map(String));
  const locked = new Set();
  for (const j of jornadas) {
    if (mover.has(String(j._id))) continue;
    locked.add(slotKey(j.fechaProgramacion, j.indiceEnDia || 1));
  }
  return locked;
}

function resolverAncla({ modo, fechaDesde, diasCorrimiento, fechaAncla, primeraMovible, flags }) {
  const desde = parseFechaCalendario(fechaDesde);
  if (!desde) throw new Error('La fecha «desde» es obligatoria.');

  if (modo === 'corrimiento') {
    const dias = Math.max(1, parseInt(diasCorrimiento, 10) || 0);
    if (!primeraMovible) throw new Error('No hay jornadas movibles desde la fecha indicada.');
    const ref = parseFechaCalendario(primeraMovible.fechaProgramacion);
    if (!ref) throw new Error('Fecha de la primera jornada movible inválida.');
    if (ref.getTime() < desde.getTime()) {
      throw new Error('La primera jornada movible queda antes de la fecha «desde».');
    }
    const ancla = avanzarDiasProgramables(ref, dias, flags);
    if (!esDiaProgramable(ancla, flags)) {
      throw new Error('La fecha ancla calculada no es un día programable según el contrato.');
    }
    return ancla;
  }

  if (modo === 'fechaAncla') {
    const ancla = parseFechaCalendario(fechaAncla);
    if (!ancla) throw new Error('Indique la nueva fecha de inicio.');
    if (!esDiaProgramable(ancla, flags)) {
      throw new Error('La fecha de inicio no es programable (revise sábados, domingos o festivos).');
    }
    if (ancla.getTime() < desde.getTime()) {
      throw new Error('La fecha de inicio no puede ser anterior a «desde».');
    }
    return ancla;
  }

  throw new Error('Modo de reprogramación inválido.');
}

function calcularAsignaciones(ctx, opts) {
  const { contrato, jornadas, fechaMinimaDesde, flags } = ctx;
  const fechaDesde = parseFechaCalendario(opts.fechaDesde);
  if (!fechaDesde) throw new Error('La fecha «desde» es obligatoria.');
  if (fechaMinimaDesde && fechaDesde.getTime() < fechaMinimaDesde.getTime()) {
    throw new Error(
      `La fecha «desde» no puede ser anterior a ${fechaCalendarioIso(fechaMinimaDesde)} (primera jornada movible del contrato).`,
    );
  }

  const candidatas = ctx.movibles
    .map((r) => r.jornada)
    .filter((j) => parseFechaCalendario(j.fechaProgramacion).getTime() >= fechaDesde.getTime());

  if (!candidatas.length) {
    throw new Error(
      'No hay jornadas movibles desde la fecha indicada (incluye finalizadas sin clases dictadas).',
    );
  }

  const groups = agruparJornadasPorDia(candidatas);
  const ancla = resolverAncla({
    modo: opts.modo,
    fechaDesde,
    diasCorrimiento: opts.diasCorrimiento,
    fechaAncla: opts.fechaAncla,
    primeraMovible: candidatas[0],
    flags,
  });

  const locked = slotsBloqueados(
    jornadas,
    candidatas.map((j) => j._id),
  );

  const assignments = [];
  let cursor = new Date(ancla.getTime());
  let groupIdx = 0;
  let guard = 0;

  while (groupIdx < groups.length && guard < 5000) {
    guard += 1;
    if (!esDiaProgramable(cursor, flags)) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    const group = groups[groupIdx];
    const needed = group.items.length;
    const porDia = Math.max(needed, resolverPorDia(contrato, group.items[0]));
    const indices = [];

    for (let i = 1; i <= porDia; i += 1) {
      const key = slotKey(cursor, i);
      if (!locked.has(key)) indices.push(i);
    }

    if (indices.length < needed) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    for (let i = 0; i < needed; i += 1) {
      const indice = indices[i];
      const j = group.items[i];
      const nuevaFecha = fechaCalendarioParaGuardar(cursor);
      const key = slotKey(nuevaFecha, indice);
      locked.add(key);
      assignments.push({
        idJornada: String(j._id),
        codigoJornada: j.codigoJornada || '',
        municipio: j.municipio || '',
        fechaAnterior: fechaCalendarioIso(j.fechaProgramacion),
        indiceAnterior: parseInt(j.indiceEnDia, 10) || 1,
        fechaNueva: fechaCalendarioIso(nuevaFecha),
        indiceNuevo: indice,
        cambiaFecha:
          fechaCalendarioIso(j.fechaProgramacion) !== fechaCalendarioIso(nuevaFecha) ||
          (parseInt(j.indiceEnDia, 10) || 1) !== indice,
      });
    }
    groupIdx += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  if (groupIdx < groups.length) {
    throw new Error(
      'No fue posible ubicar todas las jornadas en fechas libres respetando sábados, domingos, festivos y turnos ocupados. Amplíe el rango o ajuste la fecha fin del contrato.',
    );
  }

  const omitidas = ctx.movibles
    .filter((r) => parseFechaCalendario(r.jornada.fechaProgramacion).getTime() < fechaDesde.getTime())
    .map((r) => ({
      idJornada: String(r.jornada._id),
      codigoJornada: r.jornada.codigoJornada || '',
      fecha: fechaCalendarioIso(r.jornada.fechaProgramacion),
      motivo: 'Anterior a la fecha «desde»',
    }));

  const bloqueadasResumen = ctx.bloqueadas.map((r) => ({
    idJornada: String(r.jornada._id),
    codigoJornada: r.jornada.codigoJornada || '',
    fecha: fechaCalendarioIso(r.jornada.fechaProgramacion),
    motivo: 'Tiene clases dictadas',
  }));

  const maxNueva = assignments.reduce((m, a) => (a.fechaNueva > m ? a.fechaNueva : m), '');
  const fechaFinActual = fechaCalendarioIso(contrato.fechaFinJornadas);
  const extiendeFechaFin = !!(maxNueva && (!fechaFinActual || maxNueva > fechaFinActual));

  return {
    modo: opts.modo,
    fechaDesde: fechaCalendarioIso(fechaDesde),
    fechaMinimaDesde: fechaCalendarioIso(fechaMinimaDesde),
    fechaAncla: fechaCalendarioIso(ancla),
    totalMovibles: candidatas.length,
    totalCambios: assignments.filter((a) => a.cambiaFecha).length,
    assignments,
    omitidas,
    bloqueadas: bloqueadasResumen,
    fechaFinActual,
    fechaFinNueva: extiendeFechaFin ? maxNueva : fechaFinActual,
    extiendeFechaFin,
    flags,
  };
}

async function aplicarReprogramacion(ctx, plan, userLogin = '') {
  const { contrato, clasesPorJornada, asistenciasPorClase } = ctx;
  const metaClases = Math.max(0, parseInt(contrato.clasesPorJornada, 10) || 0);

  for (const row of plan.assignments) {
    if (!row.cambiaFecha) continue;

    const nuevaFecha = fechaCalendarioParaGuardar(row.fechaNueva);
    const j = await JornadaCap.findByIdAndUpdate(
      row.idJornada,
      {
        $set: {
          fechaProgramacion: nuevaFecha,
          indiceEnDia: row.indiceNuevo,
          userChangeRecord: userLogin,
          estadoOperacionManual: false,
        },
      },
      { new: true },
    ).lean();

    if (!j) continue;

    const clases = (clasesPorJornada.get(String(row.idJornada)) || []).filter(
      (c) => !ESTADOS_CLASE_DICTADA.has(String(c.estado || '').trim().toUpperCase()),
    );

    const horarios =
      metaClases > 0 ? horariosClasesJornada(nuevaFecha, metaClases) : [];
    const horarioPorIndice = new Map(
      horarios.map((h) => [h.indiceClaseEnJornada, h]),
    );

    for (const c of clases) {
      const dictada = await claseEstaDictada(c, asistenciasPorClase);
      if (dictada) continue;

      const upd = {
        fechaClase: inicioDia(nuevaFecha),
        userChangeRecord: userLogin,
      };
      if (String(c.estado || '').toUpperCase() === 'PROGRAMADA' && !c.horarioManual) {
        const slot = horarioPorIndice.get(parseInt(c.indiceClaseEnJornada, 10) || 1);
        if (slot) {
          upd.horaInicio = slot.horaInicio;
          upd.horaFin = slot.horaFin;
        }
      }
      await ClaseJornadaCap.updateOne({ _id: c._id }, { $set: upd });
    }

    await sincronizarEstadoJornada(j);
  }

  if (plan.extiendeFechaFin && plan.fechaFinNueva) {
    await Contratacion.updateOne(
      { _id: contrato._id },
      { $set: { fechaFinJornadas: fechaCalendarioParaGuardar(plan.fechaFinNueva) } },
    );
  }

  return {
    aplicadas: plan.assignments.filter((a) => a.cambiaFecha).length,
    fechaFinNueva: plan.fechaFinNueva,
    extiendeFechaFin: plan.extiendeFechaFin,
  };
}

async function opcionesReprogramacion(idContrato) {
  const ctx = await cargarContextoReprogramacion(idContrato);
  const totalMoviblesFinalizadas = ctx.movibles.filter(
    (r) => String(r.jornada.estado || '').trim().toUpperCase() === 'FINALIZADO',
  ).length;
  return {
    fechaMinimaDesde: fechaCalendarioIso(ctx.fechaMinimaDesde),
    fechaFinJornadas: fechaCalendarioIso(ctx.contrato.fechaFinJornadas),
    incluiSab: ctx.flags.incluiSab,
    incluiDom: ctx.flags.incluiDom,
    incluiFest: ctx.flags.incluiFest,
    totalJornadas: ctx.jornadas.length,
    totalMovibles: ctx.movibles.length,
    totalMoviblesFinalizadas,
    totalBloqueadas: ctx.bloqueadas.length,
    bloqueadas: ctx.bloqueadas.map((r) => ({
      idJornada: String(r.jornada._id),
      codigoJornada: r.jornada.codigoJornada || '',
      fecha: fechaCalendarioIso(r.jornada.fechaProgramacion),
    })),
  };
}

async function vistaPreviaReprogramacion(idContrato, body) {
  const ctx = await cargarContextoReprogramacion(idContrato);
  return calcularAsignaciones(ctx, body || {});
}

async function ejecutarReprogramacion(idContrato, body, userLogin = '') {
  const ctx = await cargarContextoReprogramacion(idContrato);
  const plan = calcularAsignaciones(ctx, body || {});
  const resultado = await aplicarReprogramacion(ctx, plan, userLogin);
  return { ...plan, resultado };
}

module.exports = {
  opcionesReprogramacion,
  vistaPreviaReprogramacion,
  ejecutarReprogramacion,
  claseEstaDictada,
  jornadaTieneClasesDictadas,
};
