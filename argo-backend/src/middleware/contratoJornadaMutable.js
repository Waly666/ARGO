const Contratacion = require('../models/Contratacion');
const JornadaCap = require('../models/JornadaCap');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const Certificado = require('../models/Certificado');
const FacturaElectronica = require('../models/FacturaElectronica');
const Ingreso = require('../models/Ingreso');
const { normalizarEstadoContrato } = require('../services/contratoFinalizacionCap');

const MENSAJE_BLOQUEO =
  'El contrato está finalizado. No se permiten modificaciones en el contrato, sus jornadas, clases, alumnos ni certificados.';

async function validarContrato(req, res, next, idContrato) {
  try {
    if (!idContrato) return next();
    const contrato = await Contratacion.findById(idContrato).select('estado').lean();
    if (!contrato) return res.status(404).json({ message: 'Contrato no encontrado' });
    if (normalizarEstadoContrato(contrato.estado) === 'Ejecutado') {
      return res.status(409).json({
        message: MENSAJE_BLOQUEO,
        codigo: 'contrato_finalizado',
      });
    }
    req.contratoJornadaMutable = contrato;
    next();
  } catch (e) {
    next(e);
  }
}

function contratoPorParametro(req, res, next) {
  return validarContrato(req, res, next, req.params.id);
}

async function jornadaPorParametro(req, res, next) {
  return validarJornada(req, res, next, req.params.id);
}

async function jornadaPorBody(req, res, next) {
  const idJornada = req.body?.idJornada;
  if (!idJornada) return next();
  return validarJornada(req, res, next, idJornada);
}

async function validarJornada(req, res, next, idJornada) {
  try {
    const jornada = await JornadaCap.findById(idJornada).select('idContrato').lean();
    if (!jornada) return res.status(404).json({ message: 'Jornada no encontrada' });
    return validarContrato(req, res, next, jornada.idContrato);
  } catch (e) {
    next(e);
  }
}

async function clasePorParametro(req, res, next) {
  return validarClase(req, res, next, req.params.id);
}

async function clasePorBody(req, res, next) {
  const idClase = req.body?.idClase;
  if (!idClase) return next();
  return validarClase(req, res, next, idClase);
}

async function validarClase(req, res, next, idClase) {
  try {
    const clase = await ClaseJornadaCap.findById(idClase).select('idJornada').lean();
    if (!clase) return res.status(404).json({ message: 'Clase no encontrada' });
    const jornada = await JornadaCap.findById(clase.idJornada).select('idContrato').lean();
    if (!jornada) return res.status(404).json({ message: 'Jornada no encontrada' });
    return validarContrato(req, res, next, jornada.idContrato);
  } catch (e) {
    next(e);
  }
}

async function certificadoPorParametro(req, res, next) {
  try {
    const cert = await Certificado.findById(req.params.id)
      .select('idContrato idJornada idClaseJornada generadoAutoJornada')
      .lean();
    if (!cert) return res.status(404).json({ message: 'Certificado no encontrado' });
    if (!cert.generadoAutoJornada && !cert.idContrato && !cert.idJornada) return next();
    if (cert.idContrato) return validarContrato(req, res, next, cert.idContrato);
    if (cert.idJornada) {
      const jornada = await JornadaCap.findById(cert.idJornada).select('idContrato').lean();
      if (jornada?.idContrato) return validarContrato(req, res, next, jornada.idContrato);
    }
    if (cert.idClaseJornada) {
      return validarClase(req, res, next, cert.idClaseJornada);
    }
    if (cert.generadoAutoJornada) {
      return res.status(409).json({
        message: 'No se pudo validar el contrato del certificado de jornada.',
        codigo: 'contrato_jornada_no_resuelto',
      });
    }
    return next();
  } catch (e) {
    next(e);
  }
}

function contratoPorBodyOpcional(req, res, next) {
  const idContrato = req.body?.idContrato;
  if (idContrato) return validarContrato(req, res, next, idContrato);
  const idJornada = req.body?.idJornada;
  if (idJornada) return validarJornada(req, res, next, idJornada);
  const idClase = req.body?.idClaseJornada || req.body?.idClase;
  if (idClase) return validarClase(req, res, next, idClase);
  return next();
}

function contratoPorParametroIdContrato(req, res, next) {
  return validarContrato(req, res, next, req.params.idContrato);
}

async function facturaPorParametro(req, res, next) {
  try {
    const factura = await FacturaElectronica.findById(req.params.id).select('idContrato').lean();
    if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });
    if (!factura.idContrato) return next();
    return validarContrato(req, res, next, factura.idContrato);
  } catch (e) {
    next(e);
  }
}

async function ingresoPorParametro(req, res, next) {
  try {
    const ingreso = await Ingreso.findById(req.params.id)
      .select('idContrato origenContratoCap')
      .lean();
    if (!ingreso) return res.status(404).json({ message: 'Ingreso no encontrado' });
    if (!ingreso.origenContratoCap || !ingreso.idContrato) return next();
    return validarContrato(req, res, next, ingreso.idContrato);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  MENSAJE_BLOQUEO,
  contratoPorParametro,
  jornadaPorParametro,
  jornadaPorBody,
  clasePorParametro,
  clasePorBody,
  certificadoPorParametro,
  contratoPorBodyOpcional,
  contratoPorParametroIdContrato,
  facturaPorParametro,
  ingresoPorParametro,
};
