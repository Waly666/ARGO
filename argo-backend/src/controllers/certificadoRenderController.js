const Certificado = require('../models/Certificado');
const Liquidacion = require('../models/Liquidacion');const DatosAlumno = require('../models/DatosAlumno');
const { models: cat } = require('../models/catalogos');
const { obtenerConfigCertificado } = require('../services/configCertificado');
const { buscarPrograma } = require('../services/programaServicio');
const {
  clasificarProgramaAsync,
  normalizarTipoCertificado,
  orientacionPorTipo,
  TIPOS_VALIDOS,
} = require('../services/clasificacionCertificado');
const { generarHtmlCertificado } = require('../services/certificadoRender');
const { resolverPlantillaImpresion } = require('../services/plantillaCertificado');
const { numDocQuery } = require('../utils/numDoc');

async function programaPorId(idProg) {
  return buscarPrograma(idProg);
}

async function armarDatos(id) {
  const cert = await Certificado.findById(id).lean();
  if (!cert) return null;

  const [config, alumno, liq] = await Promise.all([
    obtenerConfigCertificado(),
    DatosAlumno.findOne(numDocQuery(cert.numDoc)).lean(),
    Liquidacion.findById(cert.idLiquidacion).lean(),
  ]);

  const idProg = cert.idProg || liq?.idProg;
  const programa = idProg ? await programaPorId(idProg) : null;

  const tipo = alumno?.tipoDoc
    ? await cat.catTipoDoc
        .findOne({ $or: [{ idTipoDoc: alumno.tipoDoc }, { codigo: alumno.tipoDoc }] })
        .lean()
    : null;
  const tipoDocDescr = tipo?.descripcion || tipo?.codigo || alumno?.tipoDoc;

  const legacyFormato =
    cert.tipoFormatoCert ||
    (TIPOS_VALIDOS.includes(cert.tipoCertificado) ? cert.tipoCertificado : null);
  const tipoFormatoCert =
    normalizarTipoCertificado(legacyFormato) ||
    (await clasificarProgramaAsync(programa, cat.catTipoCapacitacion));

  const plantilla =
    (await resolverPlantillaImpresion(config, tipoFormatoCert, cert.idPlantilla)) || null;
  const plantillaFinal = plantilla || {
    orientacion: cert.orientacion || orientacionPorTipo(config, tipoFormatoCert),
    urlFondo: '',
  };

  return {
    config,
    plantilla: plantillaFinal,
    certificado: cert,
    alumno,
    programa,
    tipoDocDescr,
    tipoFormatoCert,
    /** Compat. render: layout por formato curso/tecnico/… */
    tipoCertificado: tipoFormatoCert,
  };
}

exports.html = async (req, res, next) => {
  try {
    const data = await armarDatos(req.params.id);
    if (!data) return res.status(404).send('Certificado no encontrado');
    const html = await generarHtmlCertificado(data);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    next(e);
  }
};

exports.datos = async (req, res, next) => {
  try {
    const data = await armarDatos(req.params.id);
    if (!data) return res.status(404).json({ message: 'Certificado no encontrado' });
    res.json(data);
  } catch (e) {
    next(e);
  }
};
