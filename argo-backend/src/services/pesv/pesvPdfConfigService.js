const PesvConfig = require('../../models/PesvConfig');
const {
  CAMPOS_EMPRESA_PDF,
  FUENTES_PDF,
  TAMANOS_HOJA,
  ORIENTACIONES,
  DEFAULT_PDF_DOCUMENTO,
  normalizarPdfDocumento,
} = require('../../constants/pesv/pesvPdfDocumentoDefaults');
const {
  catalogoDocumentosPdfConfig,
  configDocumentoItem,
  normalizarItemConfig,
} = require('../../constants/pesv/pesvPdfDocumentoPorItem');
const { defaultsFromItemNo } = require('../../constants/pesv/pesvPdfDocumentoPorItem');
const { ALINEACIONES } = require('../../constants/pesv/pesvPdfLayoutElementos');

const CONFIG_KEY = 'default';

async function asegurarConfig() {
  let doc = await PesvConfig.findOne({ singletonKey: CONFIG_KEY }).lean();
  if (!doc) {
    doc = (
      await PesvConfig.create({
        singletonKey: CONFIG_KEY,
        vigenciaActiva: new Date().getFullYear(),
        pdfDocumento: DEFAULT_PDF_DOCUMENTO,
      })
    ).toObject();
  }
  return doc;
}

async function obtenerConfigPdf() {
  const doc = await asegurarConfig();
  const pdfDocumento = normalizarPdfDocumento(doc.pdfDocumento || DEFAULT_PDF_DOCUMENTO);
  const catalogoDocumentos = catalogoDocumentosPdfConfig().map((c) => ({
    ...c,
    config: configDocumentoItem(pdfDocumento, c.itemNo),
  }));
  return {
    pdfDocumento,
    camposEmpresaDisponibles: CAMPOS_EMPRESA_PDF,
    tamanosHoja: TAMANOS_HOJA,
    orientaciones: ORIENTACIONES,
    catalogoDocumentos,
    alineacionesPdf: ALINEACIONES,
    fuentesPdf: FUENTES_PDF,
  };
}

async function guardarConfigPdf(body, user) {
  const pdfDocumento = normalizarPdfDocumento(body?.pdfDocumento || body);
  const userChangeRecord = user?.usuario || user?.email || '';
  const doc = await PesvConfig.findOneAndUpdate(
    { singletonKey: CONFIG_KEY },
    {
      $set: { pdfDocumento, userChangeRecord },
      $setOnInsert: { singletonKey: CONFIG_KEY, vigenciaActiva: new Date().getFullYear() },
    },
    { upsert: true, new: true, lean: true },
  );
  const pdfGuardado = normalizarPdfDocumento(doc.pdfDocumento);
  return {
    pdfDocumento: pdfGuardado,
    camposEmpresaDisponibles: CAMPOS_EMPRESA_PDF,
    catalogoDocumentos: catalogoDocumentosPdfConfig().map((c) => ({
      ...c,
      config: configDocumentoItem(pdfGuardado, c.itemNo),
    })),
    alineacionesPdf: ALINEACIONES,
    fuentesPdf: FUENTES_PDF,
  };
}

async function actualizarImagenPdf(zona, relativePath, user) {
  const key = String(zona || '').trim();
  const map = {
    encabezado: 'pdfDocumento.encabezado.imagenRuta',
    pie: 'pdfDocumento.piePagina.imagenRuta',
    marcaAgua: 'pdfDocumento.marcaAgua.imagenRuta',
  };
  const pathField = map[key];
  if (!pathField) {
    const err = new Error('Zona de imagen no válida (encabezado, pie, marcaAgua)');
    err.status = 400;
    throw err;
  }
  await asegurarConfig();
  const current = await obtenerConfigPdf();
  const pdf = { ...current.pdfDocumento };
  if (key === 'encabezado') {
    pdf.encabezado = { ...pdf.encabezado, imagenRuta: relativePath, modo: 'imagen' };
  } else if (key === 'pie') {
    pdf.piePagina = { ...pdf.piePagina, imagenRuta: relativePath, modo: 'imagen' };
  } else {
    pdf.marcaAgua = { ...pdf.marcaAgua, imagenRuta: relativePath, activa: true };
  }
  return guardarConfigPdf({ pdfDocumento: pdf }, user);
}

async function actualizarPortadaDocumento(itemNo, relativePath, user) {
  const no = Number(itemNo);
  if (!Number.isFinite(no) || no < 1 || no > 50) {
    const err = new Error('Ítem de documento no válido (1–50)');
    err.status = 400;
    throw err;
  }
  await asegurarConfig();
  const current = await obtenerConfigPdf();
  const pdf = { ...current.pdfDocumento };
  const key = String(no);
  const prev = configDocumentoItem(pdf, no);
  const nextItem = normalizarItemConfig(
    {
      ...prev,
      portada: { activa: true, imagenRuta: relativePath },
    },
    defaultsFromItemNo(no),
  );
  pdf.documentosPorItem = { ...(pdf.documentosPorItem || {}), [key]: nextItem };
  return guardarConfigPdf({ pdfDocumento: pdf }, user);
}

module.exports = {
  obtenerConfigPdf,
  guardarConfigPdf,
  actualizarImagenPdf,
  actualizarPortadaDocumento,
};
