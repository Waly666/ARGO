const PesvCaptura = require('../../models/PesvCaptura');
const PesvFase1Registro = require('../../models/PesvFase1Registro');
const {
  obtenerDatosEmpresaInstitucional,
  mezclarOrganizacionEnDatos,
} = require('../empresaInstitucional');
const { CATALOGO_FASE1 } = require('../../constants/pesv/catalogoFase1');
const { metaDocumentoItem } = require('../../constants/pesv/catalogoDocumentos');
const {
  capturaKeyFromMeta,
  getFormularioDef,
  listFormulariosFase1,
} = require('../../constants/pesv/formulariosCaptura');

async function defaultsOrganizacion() {
  return obtenerDatosEmpresaInstitucional();
}

function flattenCampos(formulario) {
  const campos = [];
  for (const sec of formulario.secciones || []) {
    for (const c of sec.campos || []) {
      campos.push(c);
    }
  }
  return campos;
}

function valorPresente(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === 'boolean') return true;
  if (typeof v === 'number') return !Number.isNaN(v);
  if (Array.isArray(v)) return v.length > 0;
  return String(v).trim().length > 0;
}

function calcularCompletitud(formulario, datos) {
  const todos = flattenCampos(formulario);
  const campos = todos.filter((c) => c.tipo !== 'tabla' && c.requerido);
  const tablas = todos.filter((c) => c.tipo === 'tabla');
  const total = campos.length + tablas.length;
  if (!total) return { pct: 100, total: 0, ok: 0 };
  let ok = 0;
  for (const c of campos) {
    if (valorPresente(datos?.[c.key])) ok += 1;
  }
  for (const t of tablas) {
    const rows = datos?.[t.key];
    if (Array.isArray(rows) && rows.length > 0) ok += 1;
  }
  const pct = Math.round((ok / total) * 100);
  return { pct, total, ok };
}

async function obtenerCaptura(vigencia, itemNo) {
  const no = Number(itemNo);
  const cat = CATALOGO_FASE1.find((c) => c.itemNo === no);
  if (!cat) {
    const err = new Error('Ítem Fase 1 no válido');
    err.status = 404;
    throw err;
  }
  const v = Number(vigencia) || new Date().getFullYear();
  const meta = metaDocumentoItem(no);
  const capturaKey = capturaKeyFromMeta(meta, no);
  const formulario = getFormularioDef(capturaKey, meta);
  const org = await defaultsOrganizacion();
  const doc = await PesvCaptura.findOne({ vigencia: v, itemNo: no }).lean();
  const datos = mezclarOrganizacionEnDatos(doc?.datos, org);
  const completitud = calcularCompletitud(formulario, datos);
  return {
    vigencia: v,
    itemNo: no,
    capturaKey,
    meta,
    formulario,
    datos,
    organizacionEmpresa: org,
    completitud,
    catalogoItem: cat,
  };
}

async function guardarCaptura(body, user) {
  const v = Number(body.vigencia) || new Date().getFullYear();
  const no = Number(body.itemNo);
  if (!no) {
    const err = new Error('itemNo requerido');
    err.status = 400;
    throw err;
  }
  const meta = metaDocumentoItem(no);
  const capturaKey = capturaKeyFromMeta(meta, no);
  const datos = body.datos && typeof body.datos === 'object' ? body.datos : {};
  const userChangeRecord = user?.usuario || user?.email || '';

  await PesvCaptura.findOneAndUpdate(
    { vigencia: v, itemNo: no },
    { $set: { capturaKey, datos, userChangeRecord } },
    { upsert: true, new: true },
  );

  const reg = await PesvFase1Registro.findOne({ vigencia: v }).lean();
  const items = [...(reg?.items || [])];
  const idx = items.findIndex((i) => i.itemNo === no);
  const row = idx >= 0 ? { ...items[idx] } : { itemNo: no };
  row.datosCapturados = datos;
  if (idx >= 0) items[idx] = row;
  else items.push(row);

  await PesvFase1Registro.findOneAndUpdate(
    { vigencia: v },
    { $set: { items, userChangeRecord } },
    { upsert: true },
  );

  const formulario = getFormularioDef(capturaKey, meta);
  return {
    ok: true,
    completitud: calcularCompletitud(formulario, datos),
  };
}

async function indiceCaptura(vigencia) {
  const v = Number(vigencia) || new Date().getFullYear();
  const lista = listFormulariosFase1();
  const guardados = await PesvCaptura.find({ vigencia: v }).lean();
  const byItem = new Map(guardados.map((d) => [d.itemNo, d]));
  const org = await defaultsOrganizacion();

  const items = [];
  for (const row of lista) {
    const formulario = getFormularioDef(row.capturaKey, row.meta);
    const datos = mezclarOrganizacionEnDatos(byItem.get(row.itemNo)?.datos, org);
    const completitud = calcularCompletitud(formulario, datos);
    items.push({
      ...row,
      completitud,
      tieneDatos: completitud.ok > 0,
    });
  }
  return { vigencia: v, items };
}

module.exports = {
  obtenerCaptura,
  guardarCaptura,
  indiceCaptura,
};
