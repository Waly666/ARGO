const { normalizarDocumentosPorItem } = require('./pesvPdfDocumentoPorItem');
const { normalizarElementosLayout } = require('./pesvPdfLayoutElementos');
const {
  FUENTES_PDF,
  DEFAULT_TIPOGRAFIA_BLOQUE,
  DEFAULT_LOGO_CAPA,
  normalizarTipografiaBloque,
  normalizarLogoCapa,
  normalizarMarcaAguaLogo,
} = require('./pesvPdfTipografia');

/** Campos de empresa disponibles en encabezado / pie de PDF PESV. */
const CAMPOS_EMPRESA_PDF = [
  { key: 'logo', label: 'Logo institucional' },
  { key: 'razonSocial', label: 'Razón social (fiscal o nombre)' },
  { key: 'nombreEmpresa', label: 'Nombre empresa / institución' },
  { key: 'nit', label: 'NIT' },
  { key: 'representanteLegal', label: 'Representante legal' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'departamento', label: 'Departamento' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'email', label: 'Correo electrónico' },
];

const TAMANOS_HOJA = ['letter', 'legal', 'a4'];
const ORIENTACIONES = ['portrait', 'landscape'];

const DEFAULT_PDF_DOCUMENTO = {
  tamanoHoja: 'letter',
  orientacion: 'portrait',
  margenesMm: {
    superior: 20,
    inferior: 20,
    izquierdo: 25,
    derecho: 25,
  },
  encabezado: {
    activo: true,
    alturaMm: 28,
    modo: 'datos',
    imagenRuta: null,
    camposActivos: ['logo', 'razonSocial', 'nit'],
    elementosLayout: [],
    tipografia: { ...DEFAULT_TIPOGRAFIA_BLOQUE },
    logoCapa: { ...DEFAULT_LOGO_CAPA },
    textoLibre: '',
    mostrarLineaSeparadora: true,
  },
  piePagina: {
    activo: true,
    alturaMm: 16,
    modo: 'datos',
    imagenRuta: null,
    camposActivos: ['direccion', 'telefono', 'email'],
    elementosLayout: [],
    tipografia: { ...DEFAULT_TIPOGRAFIA_BLOQUE, tamanoPt: 7 },
    logoCapa: { ...DEFAULT_LOGO_CAPA, anchoMm: 10, altoMm: 8 },
    textoLibre: 'Documento PESV generado en ARGO',
    mostrarNumeracion: true,
    mostrarLineaSeparadora: true,
  },
  marcaAgua: {
    activa: false,
    usarLogoEmpresa: true,
    imagenRuta: null,
    logoTamano: { anchoMm: 48, altoMm: 42 },
    opacidad: 0.08,
    rotacionGrados: 0,
  },
  /** Por ítem Fase 1: título/subtítulo centrados, versión, vigencia, portada opcional. */
  documentosPorItem: {},
};

function clampMm(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
}

function normalizarListaCampos(arr, fallback) {
  const allowed = new Set(CAMPOS_EMPRESA_PDF.map((c) => c.key));
  const src = Array.isArray(arr) ? arr : fallback;
  const out = [];
  for (const k of src) {
    const key = String(k || '').trim();
    if (allowed.has(key) && !out.includes(key)) out.push(key);
  }
  return out.length ? out : [...fallback];
}

function normalizarModoBloque(m) {
  const m2 = String(m || 'datos');
  if (m2 === 'imagen' || m2 === 'mixto') return m2;
  return 'datos';
}

function normalizarPdfDocumento(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const m = src.margenesMm || {};
  const enc = src.encabezado || {};
  const pie = src.piePagina || {};
  const mw = src.marcaAgua || {};

  const tam = TAMANOS_HOJA.includes(src.tamanoHoja) ? src.tamanoHoja : DEFAULT_PDF_DOCUMENTO.tamanoHoja;
  const ori = ORIENTACIONES.includes(src.orientacion) ? src.orientacion : DEFAULT_PDF_DOCUMENTO.orientacion;

  const encCampos = normalizarListaCampos(
    enc.camposActivos,
    DEFAULT_PDF_DOCUMENTO.encabezado.camposActivos,
  );
  const encTexto = String(enc.textoLibre || '').trim();
  const pieCampos = normalizarListaCampos(
    pie.camposActivos,
    DEFAULT_PDF_DOCUMENTO.piePagina.camposActivos,
  );
  const pieTexto = String(pie.textoLibre || '').trim();
  const pieNumeracion = pie.mostrarNumeracion !== false;

  return {
    tamanoHoja: tam,
    orientacion: ori,
    margenesMm: {
      superior: clampMm(m.superior, 5, 60, DEFAULT_PDF_DOCUMENTO.margenesMm.superior),
      inferior: clampMm(m.inferior, 5, 60, DEFAULT_PDF_DOCUMENTO.margenesMm.inferior),
      izquierdo: clampMm(m.izquierdo, 5, 50, DEFAULT_PDF_DOCUMENTO.margenesMm.izquierdo),
      derecho: clampMm(m.derecho, 5, 50, DEFAULT_PDF_DOCUMENTO.margenesMm.derecho),
    },
    encabezado: {
      activo: enc.activo !== false,
      alturaMm: clampMm(enc.alturaMm, 10, 80, DEFAULT_PDF_DOCUMENTO.encabezado.alturaMm),
      modo: normalizarModoBloque(enc.modo),
      imagenRuta: enc.imagenRuta ? String(enc.imagenRuta).trim() : null,
      camposActivos: encCampos,
      elementosLayout: normalizarElementosLayout(encCampos, enc.elementosLayout, {
        incluirTextoLibre: !!encTexto,
        incluirNumeracion: false,
      }),
      tipografia: normalizarTipografiaBloque(enc.tipografia, DEFAULT_TIPOGRAFIA_BLOQUE.tamanoPt),
      logoCapa: normalizarLogoCapa(enc.logoCapa),
      textoLibre: encTexto,
      mostrarLineaSeparadora: enc.mostrarLineaSeparadora !== false,
    },
    piePagina: {
      activo: pie.activo !== false,
      alturaMm: clampMm(pie.alturaMm, 8, 50, DEFAULT_PDF_DOCUMENTO.piePagina.alturaMm),
      modo: normalizarModoBloque(pie.modo),
      imagenRuta: pie.imagenRuta ? String(pie.imagenRuta).trim() : null,
      camposActivos: pieCampos,
      elementosLayout: normalizarElementosLayout(pieCampos, pie.elementosLayout, {
        incluirTextoLibre: !!pieTexto,
        incluirNumeracion: pieNumeracion,
      }),
      tipografia: normalizarTipografiaBloque(pie.tipografia, 7),
      logoCapa: normalizarLogoCapa(pie.logoCapa),
      textoLibre: pieTexto,
      mostrarNumeracion: pieNumeracion,
      mostrarLineaSeparadora: pie.mostrarLineaSeparadora !== false,
    },
    marcaAgua: {
      activa: mw.activa === true,
      usarLogoEmpresa: mw.usarLogoEmpresa !== false,
      imagenRuta: mw.imagenRuta ? String(mw.imagenRuta).trim() : null,
      logoTamano: normalizarMarcaAguaLogo(mw.logoTamano),
      opacidad: Math.min(0.5, Math.max(0.03, Number(mw.opacidad) || DEFAULT_PDF_DOCUMENTO.marcaAgua.opacidad)),
      rotacionGrados: clampMm(mw.rotacionGrados, -90, 90, DEFAULT_PDF_DOCUMENTO.marcaAgua.rotacionGrados),
    },
    documentosPorItem: normalizarDocumentosPorItem(src.documentosPorItem),
  };
}

module.exports = {
  CAMPOS_EMPRESA_PDF,
  FUENTES_PDF,
  TAMANOS_HOJA,
  ORIENTACIONES,
  DEFAULT_PDF_DOCUMENTO,
  normalizarPdfDocumento,
};
