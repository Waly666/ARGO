const Config = require('../models/Config');
const { models } = require('../models/catalogos');
const {
  cargarIndiceClases,
  resolverIdClaseVehiculo,
  findRequisitoPorClase: findRequisitoDocPorClase,
  matchIdClase,
} = require('./configRequisitosDocumentosVehiculos');

const CLAVE = 'formatoInspeccionVehiculos';
const DEFAULT_CONSECUTIVO = {
  prefijoConsecutivoInspeccion: 'INSP',
  consecutivoInspeccion: 0,
};
const claseModel = models.claseVehiculo;
const estGralModel = models.itemsEstGral;
const aspecto1Model = models.aspecto1;
const aspecto2Model = models.aspecto2;
const adaptacionesModel = models.adaptaciones;

const SECCIONES = ['idItemsEstGral', 'idAspecto1', 'idAspecto2', 'idAdaptaciones'];

function normalizeIds(raw) {
  return [...new Set((raw || []).map((d) => String(d).trim()).filter(Boolean))];
}

function normalizeRequisitosPorClase(raw, catalogos) {
  const valid = {
    idItemsEstGral: new Set(catalogos.itemsEstGral.map((i) => i.id)),
    idAspecto1: new Set(catalogos.aspecto1.map((i) => i.id)),
    idAspecto2: new Set(catalogos.aspecto2.map((i) => i.id)),
    idAdaptaciones: new Set(catalogos.adaptaciones.map((i) => i.id)),
  };
  const src = Array.isArray(raw) ? raw : [];
  return src
    .map((r) => ({
      idClase: String(r.idClase ?? '').trim(),
      idItemsEstGral: normalizeIds(r.idItemsEstGral).filter((id) => valid.idItemsEstGral.has(id)),
      idAspecto1: normalizeIds(r.idAspecto1).filter((id) => valid.idAspecto1.has(id)),
      idAspecto2: normalizeIds(r.idAspecto2).filter((id) => valid.idAspecto2.has(id)),
      idAdaptaciones: normalizeIds(r.idAdaptaciones).filter((id) => valid.idAdaptaciones.has(id)),
    }))
    .filter((r) => r.idClase);
}

async function cargarCatalogosItems() {
  const [est, a1, a2, ad] = await Promise.all([
    estGralModel.find({}).sort({ idItemEsGral: 1 }).lean(),
    aspecto1Model.find({}).sort({ idAspecto1: 1 }).lean(),
    aspecto2Model.find({}).sort({ idAspecto2: 1 }).lean(),
    adaptacionesModel.find({}).sort({ idAdaptacion: 1 }).lean(),
  ]);

  return {
    itemsEstGral: est
      .filter((r) => r.idItemEsGral != null && r.idItemEsGral !== '')
      .map((r) => ({ id: String(r.idItemEsGral), label: String(r.item || '').trim() || `Ítem ${r.idItemEsGral}` })),
    aspecto1: a1
      .filter((r) => r.idAspecto1 != null && r.idAspecto1 !== '')
      .map((r) => ({
        id: String(r.idAspecto1),
        label: String(r.aspecto1 || '').trim() || `Aspecto ${r.idAspecto1}`,
      })),
    aspecto2: a2
      .filter((r) => r.idAspecto2 != null && r.idAspecto2 !== '')
      .map((r) => ({
        id: String(r.idAspecto2),
        label: String(r.aspecto2 || '').trim() || `Aspecto ${r.idAspecto2}`,
      })),
    adaptaciones: ad
      .filter((r) => r.idAdaptacion != null && r.idAdaptacion !== '')
      .map((r) => ({
        id: String(r.idAdaptacion),
        label: String(r.nombre || '').trim() || `Adaptación ${r.idAdaptacion}`,
      })),
  };
}

async function buildDefaultRequisitosPorClase(catalogos) {
  const clases = await claseModel.find({}).sort({ idClase: 1 }).lean();
  return clases
    .map((c) => ({
      idClase: String(c.idClase ?? '').trim(),
      idItemsEstGral: catalogos.itemsEstGral.map((i) => i.id),
      idAspecto1: catalogos.aspecto1.map((i) => i.id),
      idAspecto2: catalogos.aspecto2.map((i) => i.id),
      idAdaptaciones: catalogos.adaptaciones.map((i) => i.id),
    }))
    .filter((r) => r.idClase);
}

function formatearConsecutivoInspeccion(prefijo, numero) {
  const pref = String(prefijo || DEFAULT_CONSECUTIVO.prefijoConsecutivoInspeccion).trim() || 'INSP';
  const n = Math.max(1, Number(numero) || 1);
  return `${pref}-${String(n).padStart(6, '0')}`;
}

async function previewConsecutivoInspeccion() {
  const cfg = await obtenerConfigFormatoInspeccionVehiculos();
  const prefijo = String(cfg.prefijoConsecutivoInspeccion || DEFAULT_CONSECUTIVO.prefijoConsecutivoInspeccion).trim();
  const actual = Math.max(0, Number(cfg.consecutivoInspeccion) || 0);
  return formatearConsecutivoInspeccion(prefijo, actual + 1);
}

async function reservarConsecutivoInspeccion() {
  let doc = await Config.findOne({ clave: CLAVE });
  if (!doc) {
    doc = await Config.create({
      clave: CLAVE,
      requisitosPorClase: [],
      ...DEFAULT_CONSECUTIVO,
      consecutivoInspeccion: 1,
    });
  } else {
    doc.consecutivoInspeccion = (doc.consecutivoInspeccion || 0) + 1;
    await doc.save();
  }
  const prefijo = String(doc.prefijoConsecutivoInspeccion || DEFAULT_CONSECUTIVO.prefijoConsecutivoInspeccion).trim();
  return formatearConsecutivoInspeccion(prefijo, doc.consecutivoInspeccion || 1);
}

async function obtenerConfigFormatoInspeccionVehiculos() {
  const catalogos = await cargarCatalogosItems();
  let found = await Config.findOne({ clave: CLAVE }).lean();

  if (!found) {
    const requisitosPorClase = await buildDefaultRequisitosPorClase(catalogos);
    found = (
      await Config.create({
        clave: CLAVE,
        requisitosPorClase,
        ...DEFAULT_CONSECUTIVO,
      })
    ).toObject();
  }

  let requisitosPorClase = normalizeRequisitosPorClase(found.requisitosPorClase, catalogos);
  if (!requisitosPorClase.length) {
    requisitosPorClase = await buildDefaultRequisitosPorClase(catalogos);
  }

  const prefijoConsecutivoInspeccion =
    String(found.prefijoConsecutivoInspeccion || DEFAULT_CONSECUTIVO.prefijoConsecutivoInspeccion).trim() ||
    DEFAULT_CONSECUTIVO.prefijoConsecutivoInspeccion;
  const consecutivoInspeccion = Math.max(0, Number(found.consecutivoInspeccion) || 0);
  const proximoConsecutivoInspeccion = formatearConsecutivoInspeccion(
    prefijoConsecutivoInspeccion,
    consecutivoInspeccion + 1,
  );

  return {
    clave: CLAVE,
    catalogos,
    requisitosPorClase,
    prefijoConsecutivoInspeccion,
    consecutivoInspeccion,
    proximoConsecutivoInspeccion,
  };
}

async function guardarConfigFormatoInspeccionVehiculos(body) {
  const catalogos = await cargarCatalogosItems();
  const requisitosPorClase = normalizeRequisitosPorClase(body?.requisitosPorClase, catalogos);
  const dto = { clave: CLAVE, requisitosPorClase };
  if (body?.prefijoConsecutivoInspeccion != null) {
    dto.prefijoConsecutivoInspeccion =
      String(body.prefijoConsecutivoInspeccion).trim() || DEFAULT_CONSECUTIVO.prefijoConsecutivoInspeccion;
  }
  if (body?.consecutivoInspeccion != null) {
    dto.consecutivoInspeccion = Math.max(0, parseInt(String(body.consecutivoInspeccion), 10) || 0);
  }
  const updated = await Config.findOneAndUpdate({ clave: CLAVE }, dto, { new: true, upsert: true }).lean();
  const prefijoConsecutivoInspeccion =
    String(updated.prefijoConsecutivoInspeccion || DEFAULT_CONSECUTIVO.prefijoConsecutivoInspeccion).trim() ||
    DEFAULT_CONSECUTIVO.prefijoConsecutivoInspeccion;
  const consecutivoInspeccion = Math.max(0, Number(updated.consecutivoInspeccion) || 0);
  return {
    clave: CLAVE,
    catalogos,
    requisitosPorClase: normalizeRequisitosPorClase(updated.requisitosPorClase, catalogos),
    prefijoConsecutivoInspeccion,
    consecutivoInspeccion,
    proximoConsecutivoInspeccion: formatearConsecutivoInspeccion(
      prefijoConsecutivoInspeccion,
      consecutivoInspeccion + 1,
    ),
  };
}

function findFormatoPorClase(config, idClaseRaw, indice) {
  const idCanon =
    resolverIdClaseVehiculo({ idClase: idClaseRaw, claseVehiculo: '' }, indice) || String(idClaseRaw ?? '').trim();
  if (!idCanon) return null;
  return (config.requisitosPorClase || []).find((r) => matchIdClase(r.idClase, idCanon)) || null;
}

function filtrarFilasPorFormato(rows, idField, idsPermitidos, idClase) {
  const set = new Set(normalizeIds(idsPermitidos));
  if (!set.size) return [];
  return (rows || []).filter(
    (r) => set.has(String(r[idField])) && itemAplicaPorClaseEnCatalogo(r, idClase),
  );
}

function itemAplicaPorClaseEnCatalogo(row, idClase) {
  if (!idClase) return false;
  const idClases = row?.idClases;
  if (Array.isArray(idClases) && idClases.length) {
    return idClases.some((c) => matchIdClase(c, idClase));
  }
  return true;
}

async function itemsInspeccionPorClase(vehiculo) {
  const [config, indiceClases, rowsEst, rowsA1, rowsA2, rowsAd] = await Promise.all([
    obtenerConfigFormatoInspeccionVehiculos(),
    cargarIndiceClases(),
    estGralModel.find({}).sort({ idItemEsGral: 1 }).lean(),
    aspecto1Model.find({}).sort({ idAspecto1: 1 }).lean(),
    aspecto2Model.find({}).sort({ idAspecto2: 1 }).lean(),
    adaptacionesModel.find({}).sort({ idAdaptacion: 1 }).lean(),
  ]);

  const idClase = resolverIdClaseVehiculo(vehiculo, indiceClases);
  if (!idClase) {
    return { idClase: '', estadoGeneral: [], aspecto1: [], aspecto2: [], adaptaciones: [] };
  }

  const req = findFormatoPorClase(config, idClase, indiceClases) || {};

  return {
    idClase,
    estadoGeneral: filtrarFilasPorFormato(rowsEst, 'idItemEsGral', req.idItemsEstGral, idClase),
    aspecto1: filtrarFilasPorFormato(rowsA1, 'idAspecto1', req.idAspecto1, idClase),
    aspecto2: filtrarFilasPorFormato(rowsA2, 'idAspecto2', req.idAspecto2, idClase),
    adaptaciones: filtrarFilasPorFormato(rowsAd, 'idAdaptacion', req.idAdaptaciones, idClase),
  };
}

module.exports = {
  CLAVE,
  SECCIONES,
  obtenerConfigFormatoInspeccionVehiculos,
  guardarConfigFormatoInspeccionVehiculos,
  findFormatoPorClase,
  filtrarFilasPorFormato,
  itemAplicaPorClaseEnCatalogo,
  itemsInspeccionPorClase,
  cargarCatalogosItems,
  buildDefaultRequisitosPorClase,
  normalizeRequisitosPorClase,
  findRequisitoDocPorClase,
  previewConsecutivoInspeccion,
  reservarConsecutivoInspeccion,
  formatearConsecutivoInspeccion,
  DEFAULT_CONSECUTIVO,
};
