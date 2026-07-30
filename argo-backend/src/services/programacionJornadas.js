const JornadaCap = require('../models/JornadaCap');
const { esDiaProgramable } = require('../constants/jornadaCapacitacion');
const { parseFechaCalendario, fechaCalendarioIso, fechaCalendarioParaGuardar } = require('../utils/fechaCalendario');
const { estadoJornadaPorFecha } = require('./estadoJornadaCap');
const {
  normalizarMunicipiosPlan,
  totalJornadasDesdePlan,
  cuposFaltantesPlan,
} = require('../constants/municipiosPlanContrato');

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
 * Genera jornadas faltantes hasta completar el plan del contrato.
 * Si hay municipiosPlan: asigna municipio en ese orden (cupos por municipio).
 * Si no: comportamiento legado (municipio vacío).
 */
async function generarJornadasContrato(contrato, userLogin = '') {
  if (!contrato?._id) throw new Error('Contrato inválido');

  const plan = normalizarMunicipiosPlan(contrato.municipiosPlan);
  const nPlan = totalJornadasDesdePlan(plan);
  const n = nPlan > 0 ? nPlan : Math.max(0, parseInt(contrato.numerojornadas, 10) || 0);
  if (n < 1) {
    throw new Error(
      plan.length
        ? 'El plan de municipios debe sumar al menos 1 jornada'
        : 'numerojornadas debe ser mayor a 0',
    );
  }

  const inicioContrato = parseFechaCalendario(contrato.fechaInicJornadas);
  if (!inicioContrato) throw new Error('fechaInicJornadas inválida');
  const finJornadas = parseFechaCalendario(contrato.fechaFinJornadas);
  if (finJornadas && finJornadas.getTime() < inicioContrato.getTime()) {
    throw new Error('La fecha fin de jornadas debe ser igual o posterior al inicio.');
  }

  const cursor = new Date(inicioContrato.getTime());
  const fechaDesdeProgramacion = fechaCalendarioIso(inicioContrato);

  const existentes = await JornadaCap.find({ idContrato: contrato._id }).lean();

  let cupos = [];
  if (plan.length) {
    ({ cupos } = cuposFaltantesPlan(plan, existentes));
  } else {
    const faltanLegado = Math.max(0, n - existentes.length);
    cupos = Array.from({ length: faltanLegado }, () => ({
      municipio: '',
      depto: '',
      codMunicipio: '',
    }));
  }

  if (!cupos.length) {
    return {
      count: 0,
      total: existentes.length,
      metaJornadas: n,
      numeObjeJornada: calcNumeObjeJornada(contrato.numeroAlumnos, n),
      fechaDesde: fechaDesdeProgramacion,
      fechaFin: finJornadas ? fechaCalendarioIso(finJornadas) : null,
      jornadasCompletas: true,
      municipiosPlan: plan,
    };
  }

  const faltan = cupos.length;
  const flags = {
    incluiSab: !!contrato.incluiSab,
    incluiDom: !!contrato.incluiDom,
    incluiFest: !!contrato.incluiFest,
  };
  /** Solo legado sin plan: jornadasPorDia a nivel contrato. Con plan, va por municipio. */
  const porDiaLegado = Math.max(1, Math.min(20, parseInt(contrato.jornadasPorDia, 10) || 1));
  const numeObje = calcNumeObjeJornada(contrato.numeroAlumnos, n);
  const supervisor = String(contrato.supervisor || '').trim();
  const direccion = String(contrato.direccion || '').trim();

  const ocupados = new Set(existentes.map((j) => slotKey(j.fechaProgramacion, j.indiceEnDia)));

  const docs = [];
  let cupoIdx = 0;
  let guard = 0;
  const maxDias = 2000;
  while (cupoIdx < faltan && guard < maxDias) {
    guard += 1;
    if (finJornadas && cursor.getTime() > finJornadas.getTime()) break;

    if (esDiaProgramable(cursor, flags)) {
      const primero = cupos[cupoIdx];
      const porDiaHoy = plan.length
        ? Math.max(1, Math.min(20, parseInt(primero.jornadasPorDia, 10) || 1))
        : porDiaLegado;
      const munKeyDia = plan.length
        ? String(primero.codMunicipio || '').trim() ||
          String(primero.municipio || '')
            .trim()
            .toUpperCase()
        : '';

      for (let i = 0; i < porDiaHoy && cupoIdx < faltan; i += 1) {
        const cupo = cupos[cupoIdx];
        if (plan.length) {
          const munKey = String(cupo.codMunicipio || '').trim() ||
            String(cupo.municipio || '')
              .trim()
              .toUpperCase();
          if (munKey !== munKeyDia) break;
        }
        const indiceEnDia = i + 1;
        const key = slotKey(cursor, indiceEnDia);
        if (ocupados.has(key)) continue;
        docs.push({
          idContrato: contrato._id,
          fechaProgramacion: fechaCalendarioParaGuardar(cursor),
          indiceEnDia,
          municipio: cupo.municipio || '',
          depto: cupo.depto || '',
          codMunicipio: cupo.codMunicipio || '',
          direccion,
          lat: null,
          lng: null,
          numeObjeJornada: numeObje,
          supervisor,
          estado: estadoJornadaPorFecha(cursor),
          userAddReg: userLogin,
        });
        ocupados.add(key);
        cupoIdx += 1;
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
      `No fue posible programar ${faltan} jornada(s) faltante(s)${rango} con las reglas de calendario (sábados, domingos y festivos). Amplíe la fecha fin, ajuste el plan de municipios o revise los días hábiles.`,
    );
  }

  const inserted = await JornadaCap.insertMany(docs);
  if (numeObje > 0) {
    await JornadaCap.updateMany({ idContrato: contrato._id }, { $set: { numeObjeJornada: numeObje } });
  }

  // Alinear meta del contrato con el plan (si hay plan).
  if (plan.length && Number(contrato.numerojornadas) !== n) {
    const Contratacion = require('../models/Contratacion');
    await Contratacion.updateOne(
      { _id: contrato._id },
      { $set: { numerojornadas: n, numeObjeJornada: numeObje, municipiosPlan: plan } },
    );
  }

  return {
    count: inserted.length,
    total: existentes.length + inserted.length,
    metaJornadas: n,
    numeObjeJornada: numeObje,
    fechaDesde: fechaDesdeProgramacion,
    fechaFin: finJornadas ? fechaCalendarioIso(finJornadas) : null,
    municipiosPlan: plan,
  };
}

module.exports = { generarJornadasContrato, calcNumeObjeJornada, slotKey };
