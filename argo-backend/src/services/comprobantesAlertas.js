const DatosAlumno = require('../models/DatosAlumno');
const Ingreso = require('../models/Ingreso');
const Egreso = require('../models/Egreso');
const FacturaElectronica = require('../models/FacturaElectronica');
const { parseNumDoc } = require('../utils/numDoc');
function inicioDia(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function finDia(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function numValor(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v.$numberDecimal != null) return Number(v.$numberDecimal) || 0;
  return Number(v) || 0;
}

function nombreCompleto(a) {
  if (!a) return '';
  return [a.primerNombre, a.segundoNombre, a.primerApellido, a.segundoApellido]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function claveNumDoc(numDoc) {
  const n = parseNumDoc(numDoc);
  return n != null ? n : numDoc;
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

function fechaMovimiento(row, campos = []) {
  for (const c of campos) {
    if (row?.[c]) return row[c];
  }
  return row?.createdAt || null;
}

/** Comprobantes y facturas recientes (alertas globales en cabecera). */
async function listarComprobantesRecientes(desde) {
  const hoy = inicioDia();
  const fin = finDia();
  const min = desde && !Number.isNaN(desde.getTime()) ? desde : hoy;

  const rango = { $gte: min, $lte: fin };

  const [ingresos, facturas, egresos] = await Promise.all([
    Ingreso.find({
      ingresoCaja: { $ne: true },
      $or: [{ createdAt: rango }, { fecha: rango }],
    })
      .select('_id numDoc numRecibo valor fecha createdAt')
      .sort({ createdAt: -1 })
      .limit(80)
      .lean(),
    FacturaElectronica.find({
      estado: { $nin: ['borrador', 'anulada'] },
      $or: [{ createdAt: rango }, { emitidaAt: rango }],
    })
      .select('_id numDoc numeroFactura valorTotal estado createdAt emitidaAt idContrato origenFactura adquirente')
      .sort({ createdAt: -1 })
      .limit(80)
      .lean(),
    Egreso.find({
      $or: [{ fechaEgreso: rango }, { fechaAudi: rango }],
    })
      .select('_id numeroDocumento numDoc numRecibo valorEgreso pagueA fechaEgreso fechaAudi')
      .sort({ fechaEgreso: -1, fechaAudi: -1 })
      .limit(80)
      .lean(),
  ]);

  const numDocs = new Set();
  for (const ing of ingresos) {
    const k = claveNumDoc(ing.numDoc);
    if (k != null) numDocs.add(k);
  }
  for (const f of facturas) {
    const k = claveNumDoc(f.numDoc);
    if (k != null) numDocs.add(k);
  }
  for (const eg of egresos) {
    const k = claveNumDoc(eg.numeroDocumento || eg.numDoc);
    if (k != null) numDocs.add(k);
  }

  const filtroAl = filtroNumDocsIn([...numDocs]);
  const alumnos = filtroAl
    ? await DatosAlumno.find(filtroAl)
        .select('_id numDoc primerNombre segundoNombre primerApellido segundoApellido')
        .lean()
    : [];

  const alByDoc = new Map();
  for (const a of alumnos) {
    const k = claveNumDoc(a.numDoc);
    if (k != null) alByDoc.set(k, a);
  }

  const out = [];

  for (const ing of ingresos) {
    const k = claveNumDoc(ing.numDoc);
    const al = k != null ? alByDoc.get(k) : null;
    out.push({
      tipo: 'ingreso',
      id: String(ing._id),
      numRecibo: ing.numRecibo || null,
      valor: numValor(ing.valor),
      numDoc: ing.numDoc,
      nombreCompleto: nombreCompleto(al) || (ing.numDoc != null ? `Doc ${ing.numDoc}` : ''),
      alumnoId: al?._id ? String(al._id) : null,
      fecha: fechaMovimiento(ing, ['fecha', 'createdAt']),
    });
  }

  for (const eg of egresos) {
    const doc = eg.numeroDocumento || eg.numDoc;
    const k = claveNumDoc(doc);
    const al = k != null ? alByDoc.get(k) : null;
    const nomAl = nombreCompleto(al);
    const pagueA = String(eg.pagueA || '').trim();
    out.push({
      tipo: 'egreso',
      id: String(eg._id),
      numRecibo: eg.numRecibo || null,
      valor: numValor(eg.valorEgreso),
      numDoc: al?.numDoc ?? doc ?? null,
      nombreCompleto: nomAl || pagueA || (doc != null ? `Doc ${doc}` : 'Egreso'),
      alumnoId: al?._id ? String(al._id) : null,
      fecha: fechaMovimiento(eg, ['fechaEgreso', 'fechaAudi']),
    });
  }

  for (const f of facturas) {
    const k = claveNumDoc(f.numDoc);
    const al = k != null ? alByDoc.get(k) : null;
    const adq = f.adquirente || {};
    const esContrato = !!f.idContrato || f.origenFactura === 'contrato_cap';
    const nomAdq = String(adq.nombre || adq.razonSocial || adq.nombres || '').trim();
    out.push({
      tipo: 'factura',
      id: String(f._id),
      numeroFactura: f.numeroFactura || null,
      valor: numValor(f.valorTotal),
      numDoc: f.numDoc,
      nombreCompleto:
        nomAdq ||
        nombreCompleto(al) ||
        (esContrato ? 'Factura contrato capacitación' : f.numDoc != null ? `Doc ${f.numDoc}` : ''),
      alumnoId: al?._id ? String(al._id) : null,
      idContrato: f.idContrato ? String(f.idContrato) : null,
      origenFactura: f.origenFactura || '',
      fecha: fechaMovimiento(f, ['emitidaAt', 'createdAt']),
    });
  }

  out.sort((a, b) => {
    const ta = a.fecha ? new Date(a.fecha).getTime() : 0;
    const tb = b.fecha ? new Date(b.fecha).getTime() : 0;
    return tb - ta;
  });

  return out.slice(0, 24);
}

module.exports = { listarComprobantesRecientes };
