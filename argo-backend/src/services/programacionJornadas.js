const JornadaCap = require('../models/JornadaCap');
const { esDiaProgramable } = require('../constants/jornadaCapacitacion');
const { parseFechaCalendario, fechaCalendarioIso, fechaCalendarioParaGuardar } = require('../utils/fechaCalendario');
const { estadoJornadaPorFecha } = require('./estadoJornadaCap');

function calcNumeObjeJornada(numeroAlumnos, numerojornadas) {
  const a = Number(numeroAlumnos) || 0;
  const j = Number(numerojornadas) || 0;
  if (j <= 0) return 0;
  return Math.ceil(a / j);
}

function slotKey(fecha, indiceEnDia) {
  return `${fechaCalendarioIso(fecha)}|${Math.max(1, parseInt(indiceEnDia, 10) || 1)}`;
}

/**
 * Genera jornadas faltantes hasta completar numerojornadas del contrato.
 * Programa desde fechaInicJornadas hasta fechaFinJornadas (si existe), respetando sáb/dom/festivos.
 */
async function generarJornadasContrato(contrato, userLogin = '') {
  if (!contrato?._id) throw new Error('Contrato inválido');
  const n = Math.max(0, parseInt(contrato.numerojornadas, 10) || 0);
  if (n < 1) throw new Error('numerojornadas debe ser mayor a 0');
  const inicioContrato = parseFechaCalendario(contrato.fechaInicJornadas);
  if (!inicioContrato) throw new Error('fechaInicJornadas inválida');
  const finJornadas = parseFechaCalendario(contrato.fechaFinJornadas);
  if (finJornadas && finJornadas.getTime() < inicioContrato.getTime()) {
    throw new Error('La fecha fin de jornadas debe ser igual o posterior al inicio.');
  }

  const cursor = new Date(inicioContrato.getTime());
  const fechaDesdeProgramacion = fechaCalendarioIso(inicioContrato);

  const existentes = await JornadaCap.find({ idContrato: contrato._id }).lean();
  if (existentes.length >= n) {
    return {
      count: 0,
      total: existentes.length,
      metaJornadas: n,
      numeObjeJornada: calcNumeObjeJornada(contrato.numeroAlumnos, n),
      fechaDesde: fechaDesdeProgramacion,
      fechaFin: finJornadas ? fechaCalendarioIso(finJornadas) : null,
      jornadasCompletas: true,
    };
  }
  const faltan = n - existentes.length;

  const flags = {
    incluiSab: !!contrato.incluiSab,
    incluiDom: !!contrato.incluiDom,
    incluiFest: !!contrato.incluiFest,
  };
  const porDia = Math.max(1, Math.min(20, parseInt(contrato.jornadasPorDia, 10) || 1));
  const numeObje = calcNumeObjeJornada(contrato.numeroAlumnos, n);
  const supervisor = String(contrato.supervisor || '').trim();
  const direccion = String(contrato.direccion || '').trim();

  const ocupados = new Set(existentes.map((j) => slotKey(j.fechaProgramacion, j.indiceEnDia)));

  const docs = [];
  let guard = 0;
  const maxDias = 2000;
  while (docs.length < faltan && guard < maxDias) {
    guard += 1;
    if (finJornadas && cursor.getTime() > finJornadas.getTime()) break;

    if (esDiaProgramable(cursor, flags)) {
      for (let i = 0; i < porDia && docs.length < faltan; i += 1) {
        const indiceEnDia = i + 1;
        const key = slotKey(cursor, indiceEnDia);
        if (ocupados.has(key)) continue;
        docs.push({
          idContrato: contrato._id,
          fechaProgramacion: fechaCalendarioParaGuardar(cursor),
          indiceEnDia,
          municipio: '',
          depto: '',
          direccion,
          lat: null,
          lng: null,
          numeObjeJornada: numeObje,
          supervisor,
          estado: estadoJornadaPorFecha(cursor),
          userAddReg: userLogin,
        });
        ocupados.add(key);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (docs.length < faltan) {
    const rango =
      finJornadas != null
        ? ` entre ${fechaDesdeProgramacion} y ${fechaCalendarioIso(finJornadas)}`
        : '';
    throw new Error(
      `No fue posible programar ${faltan} jornada(s) faltante(s)${rango} con las reglas de calendario (sábados, domingos y festivos). Amplíe la fecha fin, ajuste el número de jornadas o revise los días hábiles.`,
    );
  }

  const inserted = await JornadaCap.insertMany(docs);
  if (numeObje > 0) {
    await JornadaCap.updateMany({ idContrato: contrato._id }, { $set: { numeObjeJornada: numeObje } });
  }
  return {
    count: inserted.length,
    total: existentes.length + inserted.length,
    metaJornadas: n,
    numeObjeJornada: numeObje,
    fechaDesde: fechaDesdeProgramacion,
    fechaFin: finJornadas ? fechaCalendarioIso(finJornadas) : null,
  };
}

module.exports = { generarJornadasContrato, calcNumeObjeJornada, slotKey };
