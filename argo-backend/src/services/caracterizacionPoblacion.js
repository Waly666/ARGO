const DatosAlumno = require('../models/DatosAlumno');
const { models } = require('../models/catalogos');
const { calcularEdad, rangoEdadLabel, RANGOS_EDAD } = require('../utils/edad');

const CAMPOS_CATALOGO = [
  { key: 'estadoCivil', out: 'porEstadoCivil', model: models.estadoCivil, codeFields: ['idEstadoCivil', 'id', 'codigo'] },
  { key: 'estrato', out: 'porEstrato', model: models.estrato, codeFields: ['idEstrato', 'id', 'codigo'] },
  { key: 'regimenSalud', out: 'porRegimenSalud', model: models.catRegimenSalud, codeFields: ['idRegimen', 'id', 'codigo'] },
  { key: 'nivelFormacion', out: 'porNivelFormacion', model: models.nivelFormacion, codeFields: ['idNivel', 'id', 'codigo'] },
  { key: 'ocupacion', out: 'porOcupacion', model: models.ocupacion, codeFields: ['idOcupacion', 'id', 'codigo'] },
  { key: 'discapacidad', out: 'porDiscapacidad', model: models.discapacidad, codeFields: ['idDiscapacidad', 'id', 'codigo'] },
  { key: 'multiCulturalidad', out: 'porMultiCulturalidad', model: models.multiCulturalidad, codeFields: ['id', 'codigo'] },
];

const labelCache = new Map();

function etiquetaGenero(raw) {
  const t = String(raw || '').trim().toUpperCase();
  if (!t) return 'Sin dato';
  if (t === 'M' || t.startsWith('MASC')) return 'Masculino';
  if (t === 'F' || t.startsWith('FEM')) return 'Femenino';
  return String(raw).trim();
}

function codigoDoc(doc, codeFields) {
  for (const f of codeFields || []) {
    if (doc[f] != null && String(doc[f]).trim() !== '') return String(doc[f]).trim();
  }
  const desc = doc.descripcion ? String(doc.descripcion).trim() : '';
  const m = desc.match(/^(\d+)/);
  return m ? m[1] : '';
}

function etiquetaDoc(doc) {
  if (doc.descripcion) return String(doc.descripcion).trim();
  if (doc.nombre) return String(doc.nombre).trim();
  return '';
}

async function mapaCatalogo(model, codeFields, cacheKey) {
  if (!model) return new Map();
  if (labelCache.has(cacheKey)) return labelCache.get(cacheKey);
  let docs = [];
  try {
    docs = await model.find({}).lean();
  } catch {
    docs = [];
  }
  const map = new Map();
  for (const doc of docs) {
    const etiqueta = etiquetaDoc(doc);
    const codigo = codigoDoc(doc, codeFields);
    if (!etiqueta) continue;
    if (codigo) {
      map.set(codigo, etiqueta);
      const m = codigo.match(/^(\d+)/);
      if (m) map.set(m[1], etiqueta);
    }
    map.set(etiqueta, etiqueta);
  }
  labelCache.set(cacheKey, map);
  return map;
}

function labelDe(map, raw) {
  const t = String(raw || '').trim();
  if (!t) return 'Sin dato';
  return map.get(t) || map.get(t.replace(/^(\d+).*/, '$1')) || t;
}

function contar(map, label) {
  map.set(label, (map.get(label) || 0) + 1);
}

function aLista(map, ordenFijo) {
  const rows = [...map.entries()].map(([label, value]) => ({ label, value }));
  if (ordenFijo?.length) {
    const order = new Map(ordenFijo.map((l, i) => [l, i]));
    rows.sort((a, b) => {
      const ia = order.has(a.label) ? order.get(a.label) : 999;
      const ib = order.has(b.label) ? order.get(b.label) : 999;
      if (ia !== ib) return ia - ib;
      return b.value - a.value;
    });
  } else {
    rows.sort((a, b) => {
      if (a.label === 'Sin dato') return 1;
      if (b.label === 'Sin dato') return -1;
      return b.value - a.value;
    });
  }
  return rows;
}

/**
 * Agrega demografía a partir de documentos DatosAlumno ya cargados.
 * @param {Array<object>} docs
 * @returns {Promise<object>}
 */
async function caracterizarDesdeDocs(docs) {
  const list = Array.isArray(docs) ? docs : [];
  const mapas = {};
  await Promise.all(
    CAMPOS_CATALOGO.map(async (c) => {
      mapas[c.key] = await mapaCatalogo(c.model, c.codeFields, c.key);
    }),
  );

  const porEdad = new Map(RANGOS_EDAD.map((r) => [r.label, 0]));
  porEdad.set('Sin dato', 0);
  const porGenero = new Map();
  const buckets = {};
  for (const c of CAMPOS_CATALOGO) buckets[c.out] = new Map();

  for (const a of list) {
    const edad = calcularEdad(a.fechaNac);
    contar(porEdad, rangoEdadLabel(edad));
    contar(porGenero, etiquetaGenero(a.genero));
    for (const c of CAMPOS_CATALOGO) {
      contar(buckets[c.out], labelDe(mapas[c.key], a[c.key]));
    }
  }

  return {
    total: list.length,
    porEdad: aLista(porEdad, [...RANGOS_EDAD.map((r) => r.label), 'Sin dato']),
    porGenero: aLista(porGenero),
    porEstadoCivil: aLista(buckets.porEstadoCivil),
    porEstrato: aLista(buckets.porEstrato),
    porRegimenSalud: aLista(buckets.porRegimenSalud),
    porNivelFormacion: aLista(buckets.porNivelFormacion),
    porOcupacion: aLista(buckets.porOcupacion),
    porDiscapacidad: aLista(buckets.porDiscapacidad),
    porMultiCulturalidad: aLista(buckets.porMultiCulturalidad),
  };
}

/**
 * Caracterización global (todos los alumnos) o filtrada por numDocs.
 * @param {{ numDocs?: number[] }} [opts]
 */
async function caracterizarPoblacion(opts = {}) {
  const filter = {};
  if (Array.isArray(opts.numDocs)) {
    if (!opts.numDocs.length) return caracterizarDesdeDocs([]);
    filter.numDoc = { $in: opts.numDocs };
  }
  const docs = await DatosAlumno.find(filter)
    .select(
      'fechaNac genero estadoCivil estrato regimenSalud nivelFormacion ocupacion discapacidad multiCulturalidad',
    )
    .lean();
  return caracterizarDesdeDocs(docs);
}

module.exports = {
  calcularEdad,
  rangoEdadLabel,
  caracterizarDesdeDocs,
  caracterizarPoblacion,
};
