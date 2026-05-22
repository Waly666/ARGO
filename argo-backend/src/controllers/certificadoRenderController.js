const Certificado = require('../models/Certificado');
const PlantillaCertificado = require('../models/PlantillaCertificado');
const Liquidacion = require('../models/Liquidacion');
const DatosAlumno = require('../models/DatosAlumno');
const { models: cat } = require('../models/catalogos');
const { obtenerConfigCertificado } = require('../services/configCertificado');
const { generarHtmlCertificado } = require('../services/certificadoRender');

async function programaPorId(idProg) {
  if (!idProg) return null;
  const id = String(idProg);
  const n = Number(idProg);
  return cat.programas
    .findOne({
      $or: [
        { idProg: id },
        { idPrograma: id },
        ...(Number.isFinite(n) ? [{ idPrograma: n }, { idProg: n }] : []),
      ],
    })
    .lean();
}

async function armarDatos(id) {
  const cert = await Certificado.findById(id).lean();
  if (!cert) return null;

  const [config, alumno, liq, plantilla] = await Promise.all([
    obtenerConfigCertificado(),
    DatosAlumno.findOne({ numDoc: cert.numDoc }).lean(),
    Liquidacion.findById(cert.idLiquidacion).lean(),
    cert.idPlantilla ? PlantillaCertificado.findById(cert.idPlantilla).lean() : null,
  ]);

  const idProg = cert.idProg || liq?.idProg;
  const programa = idProg ? await programaPorId(idProg) : null;

  const tipo = alumno?.tipoDoc
    ? await cat.catTipoDoc
        .findOne({ $or: [{ idTipoDoc: alumno.tipoDoc }, { codigo: alumno.tipoDoc }] })
        .lean()
    : null;
  const tipoDocDescr = tipo?.descripcion || tipo?.codigo || alumno?.tipoDoc;

  const plantillaFinal = plantilla || {
    orientacion: cert.orientacion || 'vertical',
    urlFondo: '',
  };

  return {
    config,
    plantilla: plantillaFinal,
    certificado: cert,
    alumno,
    programa,
    tipoDocDescr,
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
