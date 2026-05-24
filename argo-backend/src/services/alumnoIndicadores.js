const Matricula = require('../models/Matricula');
const Liquidacion = require('../models/Liquidacion');
const { parseNumDoc } = require('../utils/numDoc');
const { validarDocumentosPendientesAlumno } = require('./alumnoDocumentos');

function numSaldo(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v.$numberDecimal != null) return Number(v.$numberDecimal) || 0;
  return Number(v) || 0;
}

/** Clave única por documento (número normalizado). */
function claveNumDoc(numDoc) {
  const n = parseNumDoc(numDoc);
  return n != null ? n : numDoc;
}

function groupByNumDoc(rows) {
  const map = new Map();
  for (const r of rows || []) {
    const k = claveNumDoc(r.numDoc);
    if (k == null) continue;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  }
  return map;
}

function filtroNumDocsIn(numDocs) {
  const valores = [];
  const seen = new Set();
  for (const raw of numDocs) {
    const n = parseNumDoc(raw);
    if (n == null) continue;
    for (const v of [n, String(n)]) {
      const key = `${typeof v}:${v}`;
      if (!seen.has(key)) {
        seen.add(key);
        valores.push(v);
      }
    }
  }
  if (!valores.length) return null;
  return { numDoc: { $in: valores } };
}

function indicadorSaldos(liquidaciones) {
  let saldosPendientes = 0;
  let saldoTotal = 0;
  const itemsSaldo = [];
  for (const l of liquidaciones) {
    const s = numSaldo(l.saldo);
    if (s > 0.0001) {
      saldosPendientes += 1;
      saldoTotal += s;
      itemsSaldo.push({
        id: String(l._id),
        descripcion: String(l.descripcion || 'Servicio').trim(),
        saldo: s,
      });
    }
  }
  itemsSaldo.sort((a, b) => a.descripcion.localeCompare(b.descripcion, 'es'));
  return { saldosPendientes, saldoTotal, itemsSaldo };
}

async function enriquecerIndicadoresLista(items) {
  if (!items?.length) return items;

  const numDocs = [...new Set(items.map((i) => i.numDoc).filter((n) => n != null))];
  if (!numDocs.length) return items;

  const filtro = filtroNumDocsIn(numDocs);
  const [liquidaciones] = await Promise.all([
    filtro ? Liquidacion.find(filtro).lean() : [],
  ]);

  const liqsByNum = groupByNumDoc(liquidaciones);

  return Promise.all(
    items.map(async (item) => {
      const key = claveNumDoc(item.numDoc);
      const liqs = liqsByNum.get(key) || [];
      const { saldosPendientes, saldoTotal, itemsSaldo } = indicadorSaldos(liqs);

      const alumnoDoc = {
        numDoc: item.numDoc,
        urlCedula: item.urlCedula,
        urlLicencia: item.urlLicencia,
        docsAlumno: item.docsAlumno,
      };
      const val = await validarDocumentosPendientesAlumno(alumnoDoc);
      const docsPendientes = (val.pendientes || []).length;

      return {
        ...item,
        indicadores: {
          docsPendientes,
          saldosPendientes,
          saldoTotal,
          itemsSaldo,
        },
      };
    }),
  );
}

module.exports = { enriquecerIndicadoresLista };
