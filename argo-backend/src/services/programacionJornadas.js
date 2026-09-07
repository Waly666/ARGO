const JornadaCap = require('../models/JornadaCap');
const { esDiaProgramable } = require('../constants/jornadaCapacitacion');
const { parseFechaCalendario, fechaCalendarioIso, fechaCalendarioParaGuardar } = require('../utils/fechaCalendario');
const { estadoJornadaPorFecha } = require('./estadoJornadaCap');
const {
  normalizarMunicipiosPlan,
  totalJornadasDesdePlan,
  cuposFaltantesPlan,
  keyMunicipioPlan,
} = require('../constants/municipiosPlanContrato');
const {
  inferirModoProgramacionJornadas,
  validarProgramacionContrato,
  MODO_MUNICIPIO,
} = require('./capacidadProgramacionJornadas');

function calcNumeObjeJornada(numeroAlumnos, numerojornadas) {
  const a = Number(numeroAlumnos) || 0;
  const j = Number(numerojornadas) || 0;
  if (j <= 0) return 0;
  return Math.ceil(a / j);
}

function slotKey(fecha, indiceEnDia) {
  return `${fechaCalendarioIso(fecha)}|${Math.max(1, parseInt(indiceEnDia, 10) || 1)}`;
}

function labelMunicipioGenerado(doc) {
  const nombre = String(doc?.municipio || '').trim();
  return nombre || 'Sin municipio';
}

/** Resumen de jornadas recién insertadas: municipios y rango de fechas. */
function resumenJornadasGeneradas(docs) {
  const byMun = new Map();
  let fechaPrimera = null;
  let fechaUltima = null;
  for (const d of docs || []) {
    const fecha = fechaCalendarioIso(d.fechaProgramacion);
    if (fecha) {
      if (!fechaPrimera || fecha < fechaPrimera) fechaPrimera = fecha;
      if (!fechaUltima || fecha > fechaUltima) fechaUltima = fecha;
    }
    const municipio = labelMunicipioGenerado(d);
    const depto = String(d.depto || '').trim();
    const codMunicipio = String(d.codMunicipio || '').trim();
    const key = `${codMunicipio}|${municipio}|${depto}`;
    const prev = byMun.get(key) || { municipio, depto, codMunicipio, count: 0 };
    prev.count += 1;
    byMun.set(key, prev);
  }
  const municipiosGenerados = [...byMun.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return String(a.municipio).localeCompare(String(b.municipio), 'es');
  });
  return {
    municipiosGenerados,
    fechaPrimeraGenerada: fechaPrimera,
    fechaUltimaGenerada: fechaUltima,
  };
}

function flagsDeContrato(contrato) {
  return {
    incluiSab: !!contrato.incluiSab,
    incluiDom: !!contrato.incluiDom,
    incluiFest: !!contrato.incluiFest,
  };
}

function mapaDiaMunicipio(existentes) {
  const map = new Map();
  for (const j of existentes || []) {
    const iso = fechaCalendarioIso(j.fechaProgramacion);
    if (!iso) continue;
    const key = keyMunicipioPlan(j);
    if (!map.has(iso) && key && key !== '__sin__') map.set(iso, key);
  }
  return map;
}

function docJornada({ contrato, cursor, indiceEnDia, cupo, numeObje, supervisor, userLogin }) {
  return {
    idContrato: contrato._id,
    fechaProgramacion: fechaCalendarioParaGuardar(cursor),
    indiceEnDia,
    municipio: cupo.municipio || '',
    depto: cupo.depto || '',
    codMunicipio: cupo.codMunicipio || '',
    direccion: '',
    lat: null,
    lng: null,
    numeObjeJornada: numeObje,
    supervisor,
    estado: estadoJornadaPorFecha(cursor),
    userAddReg: userLogin,
  };
}

/**
 * Coloca cupos en [inicio, fin] respetando un municipio por día y slots ocupados.
 * Mutates ocupados, diaMun y docs. Returns remaining cupos not placed.
 */
function colocarCuposEnVentana({
  inicio,
  fin,
  cupos,
  flags,
  ocupados,
  diaMun,
  docs,
  contrato,
  numeObje,
  supervisor,
  userLogin,
  porDiaFijo,
}) {
  if (!cupos.length) return [];
  const cursor = new Date(inicio.getTime());
  let idx = 0;
  let guard = 0;
  const maxDias = 2000;
  while (idx < cupos.length && guard < maxDias) {
    guard += 1;
    if (fin && cursor.getTime() > fin.getTime()) break;
    if (!esDiaProgramable(cursor, flags)) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }
    const iso = fechaCalendarioIso(cursor);
    const primero = cupos[idx];
    const munKeyDia = keyMunicipioPlan(primero);
    const occupier = diaMun.get(iso);
    if (occupier && munKeyDia && munKeyDia !== '__sin__' && occupier !== munKeyDia) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }
    const porDiaHoy = Math.max(
      1,
      Math.min(20, parseInt(porDiaFijo ?? primero.jornadasPorDia, 10) || 1),
    );
    for (let i = 0; i < porDiaHoy && idx < cupos.length; i += 1) {
      const cupo = cupos[idx];
      if (munKeyDia && munKeyDia !== '__sin__' && keyMunicipioPlan(cupo) !== munKeyDia) break;
      const indiceEnDia = i + 1;
      const key = slotKey(cursor, indiceEnDia);
      if (ocupados.has(key)) continue;
      docs.push(
        docJornada({ contrato, cursor, indiceEnDia, cupo, numeObje, supervisor, userLogin }),
      );
      ocupados.add(key);
      if (munKeyDia && munKeyDia !== '__sin__') diaMun.set(iso, munKeyDia);
      idx += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return cupos.slice(idx);
}

async function persistirJornadasGeneradas(contrato, docs, existentes, n, numeObje, plan) {
  const inserted = await JornadaCap.insertMany(docs);
  const { buildCodigoJornada } = require('../utils/codigoJornada');
  const codContrato = String(contrato.codContrato || '').trim();
  if (inserted.length) {
    await JornadaCap.bulkWrite(
      inserted.map((j) => ({
        updateOne: {
          filter: { _id: j._id },
          update: { $set: { codigoJornada: buildCodigoJornada(codContrato, j._id) } },
        },
      })),
      { ordered: false },
    );
  }
  if (numeObje > 0) {
    await JornadaCap.updateMany({ idContrato: contrato._id }, { $set: { numeObjeJornada: numeObje } });
  }

  if (plan.length && Number(contrato.numerojornadas) !== n) {
    const Contratacion = require('../models/Contratacion');
    await Contratacion.updateOne(
      { _id: contrato._id },
      { $set: { numerojornadas: n, numeObjeJornada: numeObje, municipiosPlan: plan } },
    );
  }

  const finJornadas = parseFechaCalendario(contrato.fechaFinJornadas);
  const inicioContrato = parseFechaCalendario(contrato.fechaInicJornadas);
  return {
    count: inserted.length,
    total: existentes.length + inserted.length,
    metaJornadas: n,
    numeObjeJornada: numeObje,
    fechaDesde: inicioContrato ? fechaCalendarioIso(inicioContrato) : null,
    fechaFin: finJornadas ? fechaCalendarioIso(finJornadas) : null,
    municipiosPlan: plan,
    ...resumenJornadasGeneradas(docs),
  };
}

function resultadoSinCupos(contrato, existentes, n, plan) {
  const numeObje = calcNumeObjeJornada(contrato.numeroAlumnos, n);
  const inicioContrato = parseFechaCalendario(contrato.fechaInicJornadas);
  const finJornadas = parseFechaCalendario(contrato.fechaFinJornadas);
  return {
    count: 0,
    total: existentes.length,
    metaJornadas: n,
    numeObjeJornada: numeObje,
    fechaDesde: inicioContrato ? fechaCalendarioIso(inicioContrato) : null,
    fechaFin: finJornadas ? fechaCalendarioIso(finJornadas) : null,
    jornadasCompletas: true,
    municipiosPlan: plan,
    municipiosGenerados: [],
    fechaPrimeraGenerada: null,
    fechaUltimaGenerada: null,
  };
}

/**
 * Genera jornadas faltantes hasta completar el plan del contrato.
 * Modo global: una ventana (fechas del contrato), municipios en orden.
 * Modo municipio: cada fila se programa solo en su inicio–fin (sin solapes).
 */
async function generarJornadasContrato(contrato, userLogin = '') {
  if (!contrato?._id) throw new Error('Contrato inválido');

  const plan = normalizarMunicipiosPlan(contrato.municipiosPlan, contrato.clasesPorJornada);
  const nPlan = totalJornadasDesdePlan(plan);
  const n = nPlan > 0 ? nPlan : Math.max(0, parseInt(contrato.numerojornadas, 10) || 0);
  if (n < 1) {
    throw new Error(
      plan.length
        ? 'El plan de municipios debe sumar al menos 1 jornada'
        : 'numerojornadas debe ser mayor a 0',
    );
  }

  validarProgramacionContrato(contrato, { exigirFechas: true });
  const modo = inferirModoProgramacionJornadas(contrato);

  const existentes = await JornadaCap.find({ idContrato: contrato._id }).lean();

  let cupos = [];
  if (plan.length) {
    ({ cupos } = cuposFaltantesPlan(plan, existentes, contrato.clasesPorJornada));
  } else {
    const faltanLegado = Math.max(0, n - existentes.length);
    cupos = Array.from({ length: faltanLegado }, () => ({
      municipio: '',
      depto: '',
      codMunicipio: '',
    }));
  }

  if (!cupos.length) {
    return resultadoSinCupos(contrato, existentes, n, plan);
  }

  const flags = flagsDeContrato(contrato);
  const porDiaLegado = Math.max(1, Math.min(20, parseInt(contrato.jornadasPorDia, 10) || 1));
  const numeObje = calcNumeObjeJornada(contrato.numeroAlumnos, n);
  const supervisor = String(contrato.supervisor || '').trim();
  const ocupados = new Set(existentes.map((j) => slotKey(j.fechaProgramacion, j.indiceEnDia)));
  const diaMun = mapaDiaMunicipio(existentes);
  const docs = [];

  if (modo === MODO_MUNICIPIO && plan.length) {
    for (const row of plan) {
      const key = keyMunicipioPlan(row);
      const cuposMun = cupos.filter((c) => keyMunicipioPlan(c) === key);
      if (!cuposMun.length) continue;
      const inicio = parseFechaCalendario(row.fechaInicJornadas);
      const fin = parseFechaCalendario(row.fechaFinJornadas);
      const sobran = colocarCuposEnVentana({
        inicio,
        fin,
        cupos: cuposMun,
        flags,
        ocupados,
        diaMun,
        docs,
        contrato,
        numeObje,
        supervisor,
        userLogin,
      });
      if (sobran.length) {
        throw new Error(
          `No fue posible programar ${sobran.length} jornada(s) faltante(s) de «${row.municipio}» ` +
            `entre ${fechaCalendarioIso(inicio)} y ${fechaCalendarioIso(fin)} ` +
            'con las reglas de calendario (sábados, domingos, festivos y un municipio por día). ' +
            'Amplíe el rango de ese municipio o revise los días hábiles.',
        );
      }
    }
  } else {
    const inicioContrato = parseFechaCalendario(contrato.fechaInicJornadas);
    if (!inicioContrato) throw new Error('fechaInicJornadas inválida');
    const finJornadas = parseFechaCalendario(contrato.fechaFinJornadas);
    const sobran = colocarCuposEnVentana({
      inicio: inicioContrato,
      fin: finJornadas,
      cupos,
      flags,
      ocupados,
      diaMun,
      docs,
      contrato,
      numeObje,
      supervisor,
      userLogin,
      porDiaFijo: plan.length ? undefined : porDiaLegado,
    });
    if (sobran.length) {
      const fechaDesdeProgramacion = fechaCalendarioIso(inicioContrato);
      const rango =
        finJornadas != null
          ? ` entre ${fechaDesdeProgramacion} y ${fechaCalendarioIso(finJornadas)}`
          : '';
      throw new Error(
        `No fue posible programar ${sobran.length} jornada(s) faltante(s)${rango} con las reglas de calendario (sábados, domingos y festivos). Amplíe la fecha fin, ajuste el plan de municipios o revise los días hábiles.`,
      );
    }
  }

  return persistirJornadasGeneradas(contrato, docs, existentes, n, numeObje, plan);
}

module.exports = { generarJornadasContrato, calcNumeObjeJornada, slotKey, resumenJornadasGeneradas };
