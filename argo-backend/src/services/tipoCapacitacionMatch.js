const { models: cat } = require('../models/catalogos');

function esReentrenamientoSeguridadVialTexto(text) {
  const t = normalizarTextoCap(text);
  if (!t) return false;
  if (t.includes('reentrenamiento') && t.includes('seguridad') && t.includes('vial')) return true;
  if (t.includes('reentrenamiento') && t.includes('seguridad vial')) return true;
  return false;
}

let indiceCache = null;
let indiceCargadoEn = 0;
const TTL_MS = 60_000;

function normalizarTextoCap(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Índice catTipoCapacitacion: id numérico, etiquetas y alias de programas legacy.
 */
async function cargarIndiceTipCap() {
  const now = Date.now();
  if (indiceCache && now - indiceCargadoEn < TTL_MS) return indiceCache;

  const rows = await cat.catTipoCapacitacion.find({}).lean();
  const byCanon = new Map();
  const byLabel = new Map();

  for (const r of rows) {
    const idRaw = r.idTipCap ?? r.id;
    if (idRaw == null || idRaw === '') continue;
    const idStr = String(idRaw).trim();
    const canon = idStr.match(/^(\d+)/) ? idStr.match(/^(\d+)/)[1] : idStr;
    const label = String(r.tipoCap || r.descripcion || r.nombre || '').trim();

    byCanon.set(idStr, canon);
    byCanon.set(canon, canon);
    if (label) {
      byLabel.set(normalizarTextoCap(label), canon);
    }
    if (!/^\d+$/.test(idStr)) {
      byLabel.set(normalizarTextoCap(idStr), canon);
    }
  }

  indiceCache = { rows, byCanon, byLabel, normalizarTextoCap };
  indiceCargadoEn = now;
  return indiceCache;
}

function resolverIdTipCapCanonico(idTipCap, indice) {
  const raw = String(idTipCap ?? '').trim();
  if (!raw) return '';

  if (indice.byCanon.has(raw)) return indice.byCanon.get(raw);

  const pref = raw.match(/^(\d+)/);
  if (pref && indice.byCanon.has(pref[1])) return indice.byCanon.get(pref[1]);

  const norm = indice.normalizarTextoCap(raw);
  if (indice.byLabel.has(norm)) return indice.byLabel.get(norm);

  for (const r of indice.rows) {
    const label = String(r.tipoCap || r.descripcion || r.nombre || '').trim();
    if (!label) continue;
    const nl = indice.normalizarTextoCap(label);
    if (norm === nl) {
      const idRaw = r.idTipCap ?? r.id;
      const idStr = String(idRaw).trim();
      return idStr.match(/^(\d+)/) ? idStr.match(/^(\d+)/)[1] : idStr;
    }
  }

  return pref ? pref[1] : raw;
}

function idsTipCapIguales(a, b) {
  const sa = String(a ?? '').trim();
  const sb = String(b ?? '').trim();
  if (!sa || !sb) return false;
  if (sa === sb) return true;
  const na = Number(sa);
  const nb = Number(sb);
  return Number.isFinite(na) && Number.isFinite(nb) && na === nb;
}

function filaCatalogoPorIdTipCap(filtroId, indice) {
  const f = String(filtroId ?? '').trim();
  if (!f) return null;
  return indice.rows.find((r) => idsTipCapIguales(r.idTipCap ?? r.id, f)) || null;
}

function etiquetasTipCapEquivalentes(almacenado, etiquetaCatalogo, indice) {
  const fs = String(almacenado ?? '').trim();
  const et = String(etiquetaCatalogo ?? '').trim();
  if (!fs || !et) return false;
  const norm = indice.normalizarTextoCap;
  if (norm(fs) === norm(et)) return true;
  const sinPref = et.replace(/^\d+\)\s*/, '').trim();
  return !!(sinPref && norm(fs) === norm(sinPref));
}

/** Coincidencia estricta: campo idTipCap del programa vs valor del catálogo (sin prefijo numérico fuzzy). */
function programaCoincideIdTipCap(prog, filtroId, indice) {
  const f = String(filtroId ?? '').trim();
  if (!f) return true;
  const almacenado = prog?.idTipCap;
  if (almacenado == null || almacenado === '') return false;
  if (idsTipCapIguales(almacenado, f)) return true;

  const fila = filaCatalogoPorIdTipCap(f, indice);
  if (!fila) return false;
  const etiqueta = String(fila.tipoCap || fila.descripcion || fila.nombre || '').trim();
  return etiquetasTipCapEquivalentes(almacenado, etiqueta, indice);
}

function filaCatalogoPorValorTipCap(valor, indice) {
  const v = String(valor ?? '').trim();
  if (!v) return null;
  const directa = indice.rows.find((r) => idsTipCapIguales(r.idTipCap ?? r.id, v));
  if (directa) return directa;
  return (
    indice.rows.find((r) => {
      const etiqueta = String(r.tipoCap || r.descripcion || r.nombre || '').trim();
      return etiqueta && etiquetasTipCapEquivalentes(v, etiqueta, indice);
    }) || null
  );
}

function matchIdTipCap(a, b, indice) {
  const sa = String(a ?? '').trim();
  const sb = String(b ?? '').trim();
  if (!sa || !sb) return false;
  if (sa === sb) return true;

  const ca = resolverIdTipCapCanonico(sa, indice);
  const cb = resolverIdTipCapCanonico(sb, indice);
  if (ca && cb && ca === cb) return true;

  const na = sa.match(/^(\d+)/);
  const nb = sb.match(/^(\d+)/);
  return !!(na && nb && na[1] === nb[1]);
}

function findRequisitoPorCap(config, idTipCap, indice) {
  const canon = resolverIdTipCapCanonico(idTipCap, indice);
  return (config.requisitosPorCap || []).find((r) => matchIdTipCap(r.idTipCap, canon, indice));
}

function normalizarPrefijoCodigo(v) {
  const s = String(v ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  return /^[A-Z]{3}$/.test(s) ? s : '';
}

/**
 * Prefijo codigoProg (fallback si el catálogo no trae prefijoCodigo).
 * LIC · NCL · CUR · DIP · JOR · TEC.
 */
function prefijoCodigoPorEtiquetaTipCap(labelOrId) {
  const t = normalizarTextoCap(labelOrId);
  if (!t) return 'CUR';
  if (
    /jornadas? de capacitacion/.test(t) ||
    /jornada capacitacion/.test(t) ||
    (t.includes('jornada') && t.includes('capacitacion'))
  ) {
    return 'JOR';
  }
  if (t.includes('licencia') && t.includes('conduccion')) return 'LIC';
  if (
    (/norma/.test(t) && /competenc/.test(t)) ||
    /competencias laborales/.test(t)
  ) {
    if (!t.includes('tecnico')) return 'NCL';
  }
  if (esReentrenamientoSeguridadVialTexto(t)) return 'RSV';
  if (t.includes('diplomado')) return 'DIP';
  if (t.includes('tecnico') && (t.includes('laboral') || t.includes('competenc'))) return 'TEC';
  if (/curso|no formal/.test(t)) return 'CUR';
  return 'CUR';
}

function etiquetaFilaTipCap(fila) {
  return String(fila?.tipoCap || fila?.descripcion || fila?.nombre || '').trim();
}

/** Prefijo desde catTipoCapacitacion.prefijoCodigo; si falta, deduce por etiqueta. */
async function resolverPrefijoCodigoProg(idTipCap) {
  const indice = await cargarIndiceTipCap();
  const fila =
    filaCatalogoPorIdTipCap(idTipCap, indice) || filaCatalogoPorValorTipCap(idTipCap, indice);
  if (fila) {
    const pref = normalizarPrefijoCodigo(fila.prefijoCodigo);
    if (pref) return pref;
    const label = etiquetaFilaTipCap(fila);
    if (label) return prefijoCodigoPorEtiquetaTipCap(label);
  }
  const raw = String(idTipCap ?? '').trim();
  return prefijoCodigoPorEtiquetaTipCap(raw);
}

function invalidarCacheTipCap() {
  indiceCache = null;
  indiceCargadoEn = 0;
}

module.exports = {
  cargarIndiceTipCap,
  resolverIdTipCapCanonico,
  matchIdTipCap,
  idsTipCapIguales,
  filaCatalogoPorIdTipCap,
  filaCatalogoPorValorTipCap,
  programaCoincideIdTipCap,
  findRequisitoPorCap,
  normalizarTextoCap,
  normalizarPrefijoCodigo,
  prefijoCodigoPorEtiquetaTipCap,
  resolverPrefijoCodigoProg,
  invalidarCacheTipCap,
};
