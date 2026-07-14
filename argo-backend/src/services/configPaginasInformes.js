const Config = require('../models/Config');
const {
  GRUPOS,
  SIZE_PRESETS,
  ORIENTACIONES,
  catalogoMetadatos,
  metaPorClave,
  presetPorId,
} = require('../constants/paginasInformesCatalogo');

const CLAVE = 'paginasInformes';

/** Compat: valores antiguos guardados en BD → id de preset. */
const SIZE_LEGACY = {
  auto: 'termico_80',
  layout: 'cert_horizontal',
  '140mm 216mm': 'media_carta',
  '80mm auto': 'termico_80',
  '58mm auto': 'termico_58',
  '52mm 32mm': 'etiqueta_qr',
  '297mm 210mm': 'cert_horizontal',
  '210mm 297mm': 'cert_vertical',
};

function clampMm(n, fallback = 12) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, Math.min(50, Math.round(v * 10) / 10));
}

function normalizarMargenes(raw, defaults) {
  const d = defaults || { top: 12, right: 12, bottom: 12, left: 12 };
  if (raw == null) return { ...d };
  if (typeof raw === 'number' || (typeof raw === 'string' && raw.trim() !== '' && !Number.isNaN(Number(raw)))) {
    const m = clampMm(raw, d.top);
    return { top: m, right: m, bottom: m, left: m };
  }
  const obj = typeof raw === 'object' ? raw : {};
  if (typeof obj.margin === 'string' && obj.margin.trim()) {
    const parts = obj.margin
      .replace(/mm/gi, '')
      .trim()
      .split(/\s+/)
      .map((x) => clampMm(x, d.top));
    if (parts.length === 1) {
      return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
    }
    if (parts.length === 2) {
      return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
    }
    if (parts.length >= 4) {
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
    }
  }
  return {
    top: clampMm(obj.top ?? obj.marginTop, d.top),
    right: clampMm(obj.right ?? obj.marginRight, d.right),
    bottom: clampMm(obj.bottom ?? obj.marginBottom, d.bottom),
    left: clampMm(obj.left ?? obj.marginLeft, d.left),
  };
}

function normalizarSizeId(raw, fallback = 'A4') {
  let cand = String(raw || fallback).trim();
  if (SIZE_LEGACY[cand]) cand = SIZE_LEGACY[cand];
  if (presetPorId(cand)) return cand;
  return presetPorId(fallback) ? fallback : 'A4';
}

function paginaVacia(meta) {
  return {
    key: meta.key,
    label: meta.label,
    grupoId: meta.grupoId,
    grupoLabel: meta.grupoLabel,
    size: meta.size,
    orientation: meta.orientation || '',
    margins: { ...meta.defaultMargins },
    hint: meta.hint || '',
    sizeEditable: true,
    orientationEditable: true,
  };
}

function normalizarPagina(raw, meta) {
  const base = paginaVacia(meta);
  const r = raw || {};
  const margins = normalizarMargenes(r.margins ?? r, meta.defaultMargins);
  const size = normalizarSizeId(r.size ?? base.size, base.size || 'A4');
  const ori = String(r.orientation ?? base.orientation ?? '').trim().toLowerCase();
  const orientation = ori === 'portrait' || ori === 'landscape' ? ori : '';

  return {
    ...base,
    size,
    orientation,
    margins,
  };
}

async function obtenerPaginasInformes() {
  const doc = await Config.findOne({ clave: CLAVE }).lean();
  const mapa = new Map();
  for (const row of doc?.paginas || []) {
    if (row?.key) mapa.set(row.key, row);
  }
  return catalogoMetadatos().map((meta) => normalizarPagina(mapa.get(meta.key), meta));
}

async function paginaPorClave(key) {
  const meta = metaPorClave(key);
  if (!meta) {
    return {
      key,
      label: key,
      size: 'A4',
      orientation: '',
      margins: { top: 12, right: 12, bottom: 12, left: 12 },
      sizeEditable: true,
      orientationEditable: true,
      hint: '',
    };
  }
  const doc = await Config.findOne({ clave: CLAVE }).lean();
  const raw = (doc?.paginas || []).find((p) => p?.key === key);
  return normalizarPagina(raw, meta);
}

/**
 * Resuelve el valor CSS `size:` a partir del id de preset + orientación.
 */
function resolveCssSize(pagina, opts = {}) {
  if (opts.sizeOverride) return String(opts.sizeOverride).trim();
  const preset = presetPorId(pagina?.size) || presetPorId('A4');
  const css = preset.cssSize || 'A4';
  // Medidas explícitas (mm / auto): no concatenar orientation
  if (/\bmm\b/i.test(css) || /\bauto\b/i.test(css)) return css;
  const ori = pagina?.orientation ? ` ${pagina.orientation}` : '';
  return `${css}${ori}`;
}

/**
 * Construye la regla CSS @page.
 */
function buildAtPageCss(pagina, opts = {}) {
  const m = pagina?.margins || { top: 12, right: 12, bottom: 12, left: 12 };
  const margin = `${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm`;
  const size = resolveCssSize(pagina, opts);
  return `@page { size: ${size}; margin: ${margin}; }`.replace(/\s+/g, ' ').trim();
}

async function atPageCssPara(key, opts = {}) {
  const pagina = await paginaPorClave(key);
  return buildAtPageCss(pagina, opts);
}

async function actualizarPaginasInformes(body, user) {
  const lista = Array.isArray(body?.paginas) ? body.paginas : [];
  const mapa = new Map(lista.map((x) => [x?.key, x]));
  const paginas = catalogoMetadatos().map((meta) => normalizarPagina(mapa.get(meta.key), meta));
  await Config.findOneAndUpdate(
    { clave: CLAVE },
    { $set: { clave: CLAVE, paginas, userChangeRecord: user || '' } },
    { upsert: true, new: true },
  );
  return paginas;
}

module.exports = {
  CLAVE,
  GRUPOS,
  SIZE_PRESETS,
  ORIENTACIONES,
  catalogoMetadatos,
  obtenerPaginasInformes,
  paginaPorClave,
  resolveCssSize,
  buildAtPageCss,
  atPageCssPara,
  actualizarPaginasInformes,
};
