const svc = require('../services/encuestasJornadaCap');

function usuarioDe(req) {
  return req?.user?.username || req?.user?.usuario || req?.user?.email || 'sistema';
}

function manejarError(e, res, next) {
  if (e.status) return res.status(e.status).json({ message: e.message });
  return next(e);
}

exports.listarEncuestas = async (req, res, next) => {
  try {
    res.json(await svc.listarEncuestas(req.query || {}));
  } catch (e) {
    manejarError(e, res, next);
  }
};

exports.listarEncuestasContrato = async (req, res, next) => {
  try {
    res.json(await svc.listarEncuestasContrato(req.params.id));
  } catch (e) {
    manejarError(e, res, next);
  }
};

exports.crearEncuesta = async (req, res, next) => {
  try {
    res.status(201).json(await svc.crearEncuesta(req.params.id, req.body, usuarioDe(req)));
  } catch (e) {
    manejarError(e, res, next);
  }
};

exports.obtenerEncuesta = async (req, res, next) => {
  try {
    res.json(await svc.obtenerEncuesta(req.params.id));
  } catch (e) {
    manejarError(e, res, next);
  }
};

exports.actualizarEncuesta = async (req, res, next) => {
  try {
    res.json(await svc.actualizarEncuesta(req.params.id, req.body, usuarioDe(req)));
  } catch (e) {
    manejarError(e, res, next);
  }
};

exports.publicarEncuesta = async (req, res, next) => {
  try {
    res.json(await svc.publicarEncuesta(req.params.id, usuarioDe(req)));
  } catch (e) {
    manejarError(e, res, next);
  }
};

exports.cerrarEncuesta = async (req, res, next) => {
  try {
    res.json(await svc.cerrarEncuesta(req.params.id, usuarioDe(req)));
  } catch (e) {
    manejarError(e, res, next);
  }
};

exports.eliminarEncuesta = async (req, res, next) => {
  try {
    res.json(await svc.eliminarEncuesta(req.params.id));
  } catch (e) {
    manejarError(e, res, next);
  }
};

exports.resultadosEncuesta = async (req, res, next) => {
  try {
    res.json(await svc.resultadosEncuesta(req.params.id));
  } catch (e) {
    manejarError(e, res, next);
  }
};

exports.informeEncuestaPdf = async (req, res, next) => {
  try {
    const { generarInformeEncuestaPdf } = require('../services/informeEncuestaJornadaPdf');
    const { launchBrowser, htmlToPdfBuffer } = require('../services/htmlToPdf');
    const { html, res: data, contrato } = await generarInformeEncuestaPdf(req.params.id);
    const browser = await launchBrowser();
    try {
      const pdf = await htmlToPdfBuffer(browser, html);
      const cod = String(contrato?.codContrato || data?.encuesta?._id || 'encuesta').replace(
        /[^\w.-]+/g,
        '_',
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="informe_encuesta_${cod}.pdf"`);
      return res.send(pdf);
    } finally {
      await browser.close().catch(() => {});
    }
  } catch (e) {
    manejarError(e, res, next);
  }
};
