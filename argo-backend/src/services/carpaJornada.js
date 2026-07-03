const { models: cat } = require('../models/catalogos');

function normalizarIdCarpa(raw) {
  if (raw == null || String(raw).trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function buscarCarpaPorId(idCarpa) {
  const id = normalizarIdCarpa(idCarpa);
  if (id == null) return null;
  return (
    (await cat.carpas.findOne({ idCarpa: id }).lean()) ||
    (await cat.carpas.findOne({ idCarpa: String(id) }).lean())
  );
}

function nombreCarpaDoc(doc) {
  if (!doc) return '';
  return String(doc.nombre || doc.descripcion || '').trim();
}

/** Resuelve idCarpa y nombre desde un programa (o idCarpa explícito). */
async function resolverCarpaDesdePrograma(prog, idCarpaOverride) {
  const id =
    idCarpaOverride !== undefined
      ? normalizarIdCarpa(idCarpaOverride)
      : normalizarIdCarpa(prog?.idCarpa);
  if (id == null) return { idCarpa: null, carpaNombre: '' };
  const doc = await buscarCarpaPorId(id);
  return {
    idCarpa: id,
    carpaNombre: nombreCarpaDoc(doc) || `Carpa ${id}`,
  };
}

async function mapaNombresCarpas(ids) {
  const uniq = [...new Set(ids.map(normalizarIdCarpa).filter((x) => x != null))];
  const map = new Map();
  if (!uniq.length) return map;
  const rows = await cat.carpas
    .find({ $or: [{ idCarpa: { $in: uniq } }, { idCarpa: { $in: uniq.map(String) } }] })
    .lean();
  for (const r of rows) {
    const id = normalizarIdCarpa(r.idCarpa);
    if (id != null) map.set(id, nombreCarpaDoc(r) || `Carpa ${id}`);
  }
  return map;
}

module.exports = {
  normalizarIdCarpa,
  buscarCarpaPorId,
  resolverCarpaDesdePrograma,
  mapaNombresCarpas,
};
