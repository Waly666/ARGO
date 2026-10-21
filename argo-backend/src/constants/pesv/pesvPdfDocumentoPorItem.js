const { metaDocumentoItem, MODO_DOCUMENTO } = require('./catalogoDocumentos');
const { listFormulariosFase1 } = require('./formulariosCaptura');
const {
  normalizarLayoutEncabezadoDocumento,
  normalizarCamposEncabezadoDocumentoActivos,
} = require('./pesvPdfLayoutElementos');
const { normalizarTipografiaDocumento } = require('./pesvPdfTipografia');

/** Configuración PDF específica de cada ítem Fase 1 (identidad del doc, portada, versión). */
const DEFAULT_PDF_DOCUMENTO_ITEM = {
  nombre: '',
  titulo: '',
  subtitulo: '',
  versionDocumento: '',
  vigenciaDocumento: '',
  portada: {
    activa: false,
    imagenRuta: null,
  },
};

function trimStr(v, max = 500) {
  return String(v ?? '')
    .trim()
    .slice(0, max);
}

function defaultsDocumentoItem(row) {
  const meta = row?.meta || {};
  const base = trimStr(meta.tituloDocumento || row?.pregunta || `Ítem ${row?.itemNo}`, 200);
  const paso = row?.paso40595 != null ? `Paso ${row.paso40595} · ` : '';
  return {
    nombre: base,
    titulo: base,
    subtitulo: trimStr(`${paso}Plan Estratégico de Seguridad Vial`, 300),
  };
}

function defaultsFromItemNo(itemNo) {
  const row = listItemsPdfConfigurables().find((r) => r.itemNo === Number(itemNo));
  if (!row) {
    return {
      nombre: 'Documento PESV',
      titulo: 'Documento PESV',
      subtitulo: 'Plan Estratégico de Seguridad Vial',
    };
  }
  return defaultsDocumentoItem(row);
}

function normalizarVigenciaDocumento(v) {
  const s = trimStr(v, 40);
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const dd = String(m[1]).padStart(2, '0');
    const mm = String(m[2]).padStart(2, '0');
    return `${m[3]}-${mm}-${dd}`;
  }
  return s;
}

function normalizarItemConfig(raw, defaults = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const port = src.portada && typeof src.portada === 'object' ? src.portada : {};
  const d =
    typeof defaults === 'string'
      ? { nombre: defaults, titulo: defaults, subtitulo: '' }
      : defaults && typeof defaults === 'object'
        ? defaults
        : {};
  return {
    nombre: trimStr(src.nombre, 200) || trimStr(d.nombre, 200) || trimStr(d.titulo, 200),
    titulo: trimStr(src.titulo, 300) || trimStr(d.titulo, 300) || trimStr(d.nombre, 300),
    subtitulo: trimStr(src.subtitulo, 300) || trimStr(d.subtitulo, 300),
    versionDocumento: trimStr(src.versionDocumento, 40),
    vigenciaDocumento: normalizarVigenciaDocumento(src.vigenciaDocumento),
    portada: {
      activa: port.activa === true,
      imagenRuta: port.imagenRuta ? trimStr(port.imagenRuta, 400) : null,
    },
    camposEncabezadoDocumentoActivos: normalizarCamposEncabezadoDocumentoActivos(
      src.camposEncabezadoDocumentoActivos,
    ),
    layoutEncabezadoDocumento: normalizarLayoutEncabezadoDocumento(
      normalizarCamposEncabezadoDocumentoActivos(src.camposEncabezadoDocumentoActivos),
      src.layoutEncabezadoDocumento ?? src.layoutContenido,
    ),
    tipografia: normalizarTipografiaDocumento(src.tipografia),
  };
}

/** Ítems que ARGO puede generar como PDF (excluye solo Excel / derivado flota sin plantilla PDF). */
function listItemsPdfConfigurables() {
  return listFormulariosFase1().filter((row) => {
    const meta = row.meta || {};
    if (meta.modo === MODO_DOCUMENTO.EXCEL_GENERADO) return false;
    if (meta.modo === MODO_DOCUMENTO.DERIVADO_FLOTA && meta.salida === 'xlsx') return false;
    const salida = meta.salida || 'pdf';
    return salida === 'pdf' || meta.modo === MODO_DOCUMENTO.CERT_REPRESENTANTE_LEGAL;
  });
}

function normalizarDocumentosPorItem(rawMap) {
  const src = rawMap && typeof rawMap === 'object' ? rawMap : {};
  const out = {};
  for (const row of listItemsPdfConfigurables()) {
    const key = String(row.itemNo);
    out[key] = normalizarItemConfig(src[key], defaultsDocumentoItem(row));
  }
  return out;
}

function configDocumentoItem(pdfDocumento, itemNo) {
  const key = String(itemNo);
  const map = pdfDocumento?.documentosPorItem || {};
  return normalizarItemConfig(map[key], defaultsFromItemNo(itemNo));
}

/**
 * Al generar PDF: la portada no lleva encabezado ni pie; el resto de hojas sí.
 */
function layoutPaginasDocumento(pdfDocumento, itemNo) {
  const global = pdfDocumento || {};
  const doc = configDocumentoItem(global, itemNo);
  const tienePortada = doc.portada.activa && !!doc.portada.imagenRuta;
  return {
    doc,
    globalEncabezadoPie: {
      encabezado: global.encabezado,
      piePagina: global.piePagina,
      marcaAgua: global.marcaAgua,
      margenesMm: global.margenesMm,
      tamanoHoja: global.tamanoHoja,
      orientacion: global.orientacion,
    },
    paginas: {
      portadaSinEncabezadoPie: tienePortada,
      contenidoConEncabezadoPie: true,
      numeracionEnPie: global.piePagina?.mostrarNumeracion !== false,
      /** Primera hoja numerada suele ser 1 en contenido (portada no cuenta). */
      numeracionOmitePortada: tienePortada,
    },
  };
}

function catalogoDocumentosPdfConfig() {
  return listItemsPdfConfigurables().map((row) => ({
    itemNo: row.itemNo,
    capturaKey: row.capturaKey,
    paso40595: row.paso40595,
    pregunta: row.pregunta,
    tituloCatalogo: row.meta?.tituloDocumento || row.pregunta,
    salida: row.meta?.salida || 'pdf',
    modo: row.meta?.modo,
  }));
}

module.exports = {
  DEFAULT_PDF_DOCUMENTO_ITEM,
  defaultsDocumentoItem,
  defaultsFromItemNo,
  normalizarItemConfig,
  normalizarDocumentosPorItem,
  configDocumentoItem,
  layoutPaginasDocumento,
  catalogoDocumentosPdfConfig,
  listItemsPdfConfigurables,
};
