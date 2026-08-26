const mongoose = require('mongoose');
const Matricula = require('../models/Matricula');
const Liquidacion = require('../models/Liquidacion');
const Ingreso = require('../models/Ingreso');
const Certificado = require('../models/Certificado');
const DatosAlumno = require('../models/DatosAlumno');
const Gestor = require('../models/Gestor');
const Cliente = require('../models/Cliente');
const { models: cat } = require('../models/catalogos');
const { TARIFA_GESTOR, TARIFA_EMPRESA } = require('../constants/tarifa');
const { num, buscarPrograma } = require('./programaServicio');
const {
  cargarIndiceTipCap,
  programaCoincideIdTipCap,
} = require('./tipoCapacitacionMatch');
const { clasificarPrograma, TIPOS_LABEL } = require('./clasificacionCertificado');
const { concatNombreAlumno } = require('../utils/busquedaAlumnoNombre');

function parseFechaQuery(val, finDeDia) {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;
  const d = new Date(finDeDia ? `${s}T23:59:59.999` : `${s}T00:00:00`);
  if (Number.isNaN(d.getTime())) {
    const err = new Error(`Fecha inválida: ${s}`);
    err.status = 400;
    throw err;
  }
  return d;
}

function rangoFechas(query) {
  let desde = parseFechaQuery(query.desde, false);
  let hasta = parseFechaQuery(query.hasta, true);
  if (desde && hasta && desde > hasta) {
    const t = desde;
    desde = hasta;
    hasta = t;
  }
  return { desde, hasta, activo: !!(desde || hasta) };
}

function idProgCanonico(raw) {
  const q = String(raw || '').trim();
  if (!q) return null;
  const n = Number(q);
  return Number.isFinite(n) ? n : q;
}

function numIngreso(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v.$numberDecimal != null) return Number(v.$numberDecimal) || 0;
  return Number(String(v)) || 0;
}

function mesEtiqueta(fecha) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return 'Sin fecha';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function filtroMatriculaComercial(tipo, referidorId) {
  if (tipo === 'gestor') {
    const f = {
      referidorComercial: true,
      gestorId: { $exists: true, $ne: null },
      tarifa: { $in: [TARIFA_GESTOR, TARIFA_EMPRESA] },
    };
    if (referidorId && mongoose.isValidObjectId(referidorId)) {
      f.gestorId = new mongoose.Types.ObjectId(referidorId);
    }
    return f;
  }
  const f = {
    referidorComercial: true,
    tipoReferidorComercial: 'empresa',
    tarifa: TARIFA_EMPRESA,
  };
  if (referidorId && mongoose.isValidObjectId(referidorId)) {
    f.referidorEmpresaId = new mongoose.Types.ObjectId(referidorId);
  }
  return f;
}

function filtroCertificadoComercial(tipo, referidorId) {
  if (tipo === 'gestor') {
    const f = {
      referidorComercial: true,
      gestorId: { $exists: true, $ne: null },
      estado: { $ne: 'anulado' },
    };
    if (referidorId && mongoose.isValidObjectId(referidorId)) {
      f.gestorId = new mongoose.Types.ObjectId(referidorId);
    }
    return f;
  }
  const f = {
    referidorComercial: true,
    tipoReferidorComercial: 'empresa',
    estado: { $ne: 'anulado' },
  };
  if (referidorId && mongoose.isValidObjectId(referidorId)) {
    f.referidorEmpresaId = new mongoose.Types.ObjectId(referidorId);
  }
  return f;
}

async function resolverProgramasFiltro(query) {
  const idProg = idProgCanonico(query.idPrograma);
  const idTipCap = String(query.idTipCap || '').trim();
  const tipoFormatoCert = String(query.tipoFormatoCert || '').trim();

  if (!idProg && !idTipCap && !tipoFormatoCert) {
    return { ids: null, map: new Map() };
  }

  let programas = await cat.programas.find({}).lean();
  const indice = idTipCap ? await cargarIndiceTipCap() : null;

  if (idProg) {
    programas = programas.filter(
      (p) => String(p.idProg) === String(idProg) || String(p.idPrograma) === String(idProg),
    );
  }
  if (idTipCap && indice) {
    programas = programas.filter((p) => programaCoincideIdTipCap(p, idTipCap, indice));
  }
  if (tipoFormatoCert) {
    programas = programas.filter((p) => clasificarPrograma(p) === tipoFormatoCert);
  }

  const map = new Map(programas.map((p) => [String(p.idProg), p]));
  return { ids: [...map.keys()], map };
}

function etiquetaPrograma(prog, idProg) {
  if (!prog) return String(idProg || '');
  return `${prog.codigoProg || ''} ${prog.nombreProg || ''}`.trim() || String(idProg || '');
}

function etiquetaReferidor(tipo, row) {
  if (tipo === 'gestor') return row.gestorNombre || 'Gestor sin nombre';
  return row.referidorEmpresaNombre || row.gestorNombre || 'Empresa sin nombre';
}

function idReferidor(tipo, row) {
  if (tipo === 'gestor') return row.gestorId ? String(row.gestorId) : '';
  if (row.referidorEmpresaId) return String(row.referidorEmpresaId);
  return row.gestorId ? String(row.gestorId) : '';
}

async function cargarNombresReferidores(tipo, ids) {
  const map = new Map();
  if (!ids.length) return map;
  if (tipo === 'gestor') {
    const rows = await Gestor.find({ _id: { $in: ids } })
      .select('nombres apellidos seudonimo numero tipoGestor')
      .lean();
    for (const g of rows) {
      const nombre =
        String(g.seudonimo || '').trim() ||
        (String(g.tipoGestor || '').toLowerCase() === 'empresa'
          ? String(g.nombres || '').trim()
          : [g.nombres, g.apellidos].filter(Boolean).join(' ').trim()) ||
        String(g.numero || '');
      map.set(String(g._id), nombre);
    }
  } else {
    const rows = await Cliente.find({ _id: { $in: ids } })
      .select('razonSocial nombreComercial nombres identificacion')
      .lean();
    for (const c of rows) {
      const nombre =
        c.razonSocial?.trim() ||
        c.nombreComercial?.trim() ||
        c.nombres?.trim() ||
        String(c.identificacion || '');
      map.set(String(c._id), nombre);
    }
  }
  return map;
}

function vacio(tipo, activo, desde, hasta) {
  return {
    tipo,
    periodo: { desde: desde || null, hasta: hasta || null, activo },
    kpis: {
      totalPagado: 0,
      totalCertificados: 0,
      matriculasComerciales: 0,
      referidoresActivos: 0,
      pendienteCobro: 0,
    },
    charts: {
      pagosPorMes: [],
      certificadosPorMes: [],
      pagosPorPrograma: [],
      certificadosPorPrograma: [],
    },
    resumen: [],
    detalle: { pagos: [], certificados: [], matriculas: [] },
  };
}

function mapChart(m) {
  return [...m.entries()]
    .map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);
}

async function informeReferidorComercial(query, ctx = {}) {
  const tipo = String(query.tipo || 'gestor').trim().toLowerCase() === 'empresa' ? 'empresa' : 'gestor';
  const referidorId = String(query.referidorId || '').trim();
  const { desde, hasta, activo } = rangoFechas(query);
  const { ids: progIds, map: progMap } = await resolverProgramasFiltro(query);

  const matFilter = filtroMatriculaComercial(tipo, referidorId);
  if (ctx.idSede) matFilter.idSede = String(ctx.idSede);
  if (progIds) {
    if (!progIds.length) return vacio(tipo, activo, desde, hasta);
    matFilter.idProg = { $in: progIds };
  }

  const matriculas = await Matricula.find(matFilter).sort({ fechaMat: -1 }).lean();
  const matMap = new Map(matriculas.map((m) => [String(m._id), m]));
  const matIds = matriculas.map((m) => m._id);

  const liqs = matIds.length ? await Liquidacion.find({ idMat: { $in: matIds } }).lean() : [];
  const liqPorMat = new Map();
  const liqIds = [];
  for (const l of liqs) {
    liqIds.push(l._id);
    const k = String(l.idMat);
    if (!liqPorMat.has(k)) liqPorMat.set(k, []);
    liqPorMat.get(k).push(l);
  }
  const liqIdSet = new Set(liqIds.map(String));

  const ingFilter = {
    $or: [{ idLiquidacion: { $in: liqIds } }, { 'detalle.idLiquidacion': { $in: liqIds } }],
    ingresoCaja: { $ne: true },
  };
  if (activo) {
    ingFilter.fecha = {};
    if (desde) ingFilter.fecha.$gte = desde;
    if (hasta) ingFilter.fecha.$lte = hasta;
  }

  const ingresos = liqIds.length ? await Ingreso.find(ingFilter).sort({ fecha: -1 }).lean() : [];

  const pagosDetalle = [];
  const pagosPorMes = new Map();
  const pagosPorPrograma = new Map();
  const pagosPorReferidor = new Map();

  for (const ing of ingresos) {
    const lineas =
      Array.isArray(ing.detalle) && ing.detalle.length
        ? ing.detalle
        : ing.idLiquidacion
          ? [{ idLiquidacion: ing.idLiquidacion, valor: ing.valor }]
          : [];

    for (const linea of lineas) {
      const lid = String(linea.idLiquidacion || '');
      if (!liqIdSet.has(lid)) continue;
      const liq = liqs.find((x) => String(x._id) === lid);
      if (!liq) continue;
      const mat = matMap.get(String(liq.idMat));
      if (!mat) continue;

      const valor = numIngreso(linea.valor);
      if (valor <= 0) continue;

      const refId = idReferidor(tipo, mat);
      const prog = progMap.get(String(mat.idProg)) || (await buscarPrograma(mat.idProg));
      const programa = etiquetaPrograma(prog, mat.idProg);
      const mes = mesEtiqueta(ing.fecha);

      pagosPorMes.set(mes, (pagosPorMes.get(mes) || 0) + valor);
      pagosPorPrograma.set(programa, (pagosPorPrograma.get(programa) || 0) + valor);
      if (refId) pagosPorReferidor.set(refId, (pagosPorReferidor.get(refId) || 0) + valor);

      pagosDetalle.push({
        fecha: ing.fecha,
        numDoc: ing.numDoc || mat.numDoc,
        programa,
        referidor: etiquetaReferidor(tipo, mat),
        referidorId: refId,
        valor,
        numRecibo: ing.numRecibo || '',
      });
    }
  }

  const certFilter = filtroCertificadoComercial(tipo, referidorId);
  if (progIds) {
    if (!progIds.length) return vacio(tipo, activo, desde, hasta);
    certFilter.idProg = { $in: progIds };
  }
  if (activo) {
    certFilter.fechaEmision = {};
    if (desde) certFilter.fechaEmision.$gte = desde;
    if (hasta) certFilter.fechaEmision.$lte = hasta;
  }

  const certificados = await Certificado.find(certFilter).sort({ fechaEmision: -1 }).lean();

  const certsPorPrograma = new Map();
  const certsPorReferidor = new Map();
  const certsPorMes = new Map();
  const certificadosDetalle = [];

  const numsCert = [...new Set(certificados.map((c) => c.numDoc).filter((n) => n != null))];
  const alumnosCert = numsCert.length
    ? await DatosAlumno.find({ numDoc: { $in: numsCert } }).lean()
    : [];
  const alumMap = new Map(alumnosCert.map((a) => [a.numDoc, a]));

  for (const c of certificados) {
    const refId = idReferidor(tipo, c);
    const prog = progMap.get(String(c.idProg)) || (await buscarPrograma(c.idProg));
    const programa = etiquetaPrograma(prog, c.idProg);
    const mes = mesEtiqueta(c.fechaEmision);
    const tipoFmt = c.tipoFormatoCert || clasificarPrograma(prog);
    const tipoLabel = TIPOS_LABEL[tipoFmt] || tipoFmt || '';

    certsPorMes.set(mes, (certsPorMes.get(mes) || 0) + 1);
    certsPorPrograma.set(programa, (certsPorPrograma.get(programa) || 0) + 1);
    if (refId) certsPorReferidor.set(refId, (certsPorReferidor.get(refId) || 0) + 1);

    const a = alumMap.get(c.numDoc);
    certificadosDetalle.push({
      fechaEmision: c.fechaEmision,
      numDoc: c.numDoc,
      nombre: a ? concatNombreAlumno(a) : '',
      programa,
      tipoCertificado: tipoLabel,
      codigoCert: c.codigoCert || c.codigo || '',
      referidor: etiquetaReferidor(tipo, c),
      referidorId: refId,
    });
  }

  const refIdsSet = new Set([
    ...matriculas.map((m) => idReferidor(tipo, m)).filter(Boolean),
    ...certificados.map((c) => idReferidor(tipo, c)).filter(Boolean),
  ]);
  const nombresRef = await cargarNombresReferidores(tipo, [...refIdsSet]);

  const resumenMap = new Map();
  for (const m of matriculas) {
    const refId = idReferidor(tipo, m);
    if (!refId) continue;
    if (!resumenMap.has(refId)) {
      resumenMap.set(refId, {
        referidorId: refId,
        nombre: nombresRef.get(refId) || etiquetaReferidor(tipo, m),
        matriculas: 0,
        totalPagado: 0,
        certificados: 0,
        pendienteCobro: 0,
      });
    }
    const row = resumenMap.get(refId);
    row.matriculas += 1;
    for (const l of liqPorMat.get(String(m._id)) || []) {
      row.pendienteCobro += num(l.saldo);
    }
  }
  for (const [refId, total] of pagosPorReferidor) {
    if (!resumenMap.has(refId)) {
      resumenMap.set(refId, {
        referidorId: refId,
        nombre: nombresRef.get(refId) || refId,
        matriculas: 0,
        totalPagado: 0,
        certificados: 0,
        pendienteCobro: 0,
      });
    }
    resumenMap.get(refId).totalPagado = total;
  }
  for (const [refId, total] of certsPorReferidor) {
    if (!resumenMap.has(refId)) {
      resumenMap.set(refId, {
        referidorId: refId,
        nombre: nombresRef.get(refId) || refId,
        matriculas: 0,
        totalPagado: 0,
        certificados: 0,
        pendienteCobro: 0,
      });
    }
    resumenMap.get(refId).certificados = total;
  }

  const resumen = [...resumenMap.values()].sort(
    (a, b) => b.totalPagado - a.totalPagado || b.certificados - a.certificados,
  );
  const totalPagado = pagosDetalle.reduce((a, p) => a + p.valor, 0);

  let matriculasFiltradas = matriculas;
  if (activo) {
    matriculasFiltradas = matriculas.filter((m) => {
      const d = new Date(m.fechaMat);
      if (desde && d < desde) return false;
      if (hasta && d > hasta) return false;
      return true;
    });
  }

  const matriculasDetalle = [];
  for (const m of matriculasFiltradas) {
    const prog = progMap.get(String(m.idProg)) || (await buscarPrograma(m.idProg));
    const liqsMat = liqPorMat.get(String(m._id)) || [];
    matriculasDetalle.push({
      fechaMat: m.fechaMat,
      numDoc: m.numDoc,
      programa: etiquetaPrograma(prog, m.idProg),
      referidor: etiquetaReferidor(tipo, m),
      referidorId: idReferidor(tipo, m),
      valorMat: num(m.valorMat),
      abonado: liqsMat.reduce((a, l) => a + num(l.abonado), 0),
      saldo: liqsMat.reduce((a, l) => a + num(l.saldo), 0),
      tarifa: m.tarifa,
    });
  }

  return {
    tipo,
    periodo: { desde: desde || null, hasta: hasta || null, activo },
    kpis: {
      totalPagado: Math.round(totalPagado),
      totalCertificados: certificados.length,
      matriculasComerciales: matriculasFiltradas.length,
      referidoresActivos: resumen.length,
      pendienteCobro: Math.round(resumen.reduce((a, r) => a + r.pendienteCobro, 0)),
    },
    charts: {
      pagosPorMes: mapChart(pagosPorMes).reverse(),
      certificadosPorMes: mapChart(certsPorMes).reverse(),
      pagosPorPrograma: mapChart(pagosPorPrograma),
      certificadosPorPrograma: mapChart(certsPorPrograma),
    },
    resumen,
    detalle: {
      pagos: pagosDetalle,
      certificados: certificadosDetalle,
      matriculas: matriculasDetalle,
    },
  };
}

module.exports = { informeReferidorComercial };
