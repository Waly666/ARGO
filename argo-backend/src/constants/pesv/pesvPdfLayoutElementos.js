const ALINEACIONES = ['left', 'center', 'right'];

const ID_TEXTO_LIBRE = '_textoLibre';
const ID_NUMERACION = '_numeracion';

function normalizarAlineacion(a, fallback = 'center') {
  const v = String(a || fallback).toLowerCase();
  return ALINEACIONES.includes(v) ? v : fallback;
}

/**
 * Orden y alineación de ítems en encabezado / pie.
 * ids: claves de CAMPOS_EMPRESA_PDF, _textoLibre, _numeracion (solo pie).
 */
function camposParaLayout(camposActivos) {
  return (Array.isArray(camposActivos) ? camposActivos : []).filter((k) => k && k !== 'logo');
}

function normalizarElementosLayout(camposActivos, rawLayout, opts = {}) {
  const activos = camposParaLayout(camposActivos);
  const incluirTextoLibre = opts.incluirTextoLibre === true;
  const incluirNumeracion = opts.incluirNumeracion === true;
  const defaultsAlign = opts.defaultsAlign || {};

  const idsDeseados = [...activos];
  if (incluirTextoLibre) idsDeseados.push(ID_TEXTO_LIBRE);
  if (incluirNumeracion) idsDeseados.push(ID_NUMERACION);

  const allowed = new Set(idsDeseados);
  const src = Array.isArray(rawLayout) ? rawLayout : [];
  const out = [];
  const seen = new Set();

  for (const row of src) {
    const id = String(row?.id || '').trim();
    if (!id || !allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      alineacion: normalizarAlineacion(row.alineacion, defaultsAlign[id] || defaultAlignForId(id)),
    });
  }

  for (const id of idsDeseados) {
    if (seen.has(id)) continue;
    out.push({
      id,
      alineacion: normalizarAlineacion(defaultsAlign[id], defaultAlignForId(id)),
    });
  }

  return out;
}

function defaultAlignForId(id) {
  if (id === 'logo') return 'left';
  if (id === ID_NUMERACION) return 'right';
  if (id === 'nit') return 'right';
  return 'center';
}

/** Campos configurables en el encabezado de cada documento PDF. */
const CAMPOS_ENCABEZADO_DOCUMENTO_TODOS = [
  'nombre',
  'titulo',
  'subtitulo',
  'versionDocumento',
  'vigenciaDocumento',
];

const DEFAULT_CAMPOS_ENCABEZADO_DOCUMENTO_ACTIVOS = [
  'titulo',
  'subtitulo',
  'versionDocumento',
  'vigenciaDocumento',
];

function normalizarCamposEncabezadoDocumentoActivos(arr) {
  const allowed = new Set(CAMPOS_ENCABEZADO_DOCUMENTO_TODOS);
  const src = Array.isArray(arr) ? arr : DEFAULT_CAMPOS_ENCABEZADO_DOCUMENTO_ACTIVOS;
  const out = [];
  for (const k of src) {
    const key = String(k || '').trim();
    if (allowed.has(key) && !out.includes(key)) out.push(key);
  }
  return out.length ? out : [...DEFAULT_CAMPOS_ENCABEZADO_DOCUMENTO_ACTIVOS];
}

function normalizarLayoutEncabezadoDocumento(camposActivos, rawLayout) {
  const idsDeseados = normalizarCamposEncabezadoDocumentoActivos(camposActivos);
  const allowed = new Set(idsDeseados);
  const src = Array.isArray(rawLayout) ? rawLayout : [];
  const out = [];
  const seen = new Set();

  for (const row of src) {
    const id = String(row?.id || '').trim();
    if (!allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      alineacion: normalizarAlineacion(row.alineacion, 'center'),
    });
  }

  for (const id of idsDeseados) {
    if (seen.has(id)) continue;
    out.push({ id, alineacion: 'center' });
  }

  return out;
}

/** @deprecated alias — sin campos activos explícitos */
function normalizarLayoutContenidoDocumento(rawLayout) {
  return normalizarLayoutEncabezadoDocumento(DEFAULT_CAMPOS_ENCABEZADO_DOCUMENTO_ACTIVOS, rawLayout);
}

module.exports = {
  ALINEACIONES,
  ID_TEXTO_LIBRE,
  ID_NUMERACION,
  CAMPOS_ENCABEZADO_DOCUMENTO_TODOS,
  CAMPOS_LAYOUT_ENCABEZADO_DOCUMENTO: CAMPOS_ENCABEZADO_DOCUMENTO_TODOS,
  CAMPOS_LAYOUT_DOCUMENTO: CAMPOS_ENCABEZADO_DOCUMENTO_TODOS,
  DEFAULT_CAMPOS_ENCABEZADO_DOCUMENTO_ACTIVOS,
  camposParaLayout,
  normalizarCamposEncabezadoDocumentoActivos,
  normalizarAlineacion,
  normalizarElementosLayout,
  normalizarLayoutEncabezadoDocumento,
  normalizarLayoutContenidoDocumento,
};
