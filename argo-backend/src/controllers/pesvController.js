const pesv = require('../services/pesv/pesvService');
const pesvCaptura = require('../services/pesv/pesvCapturaService');
const pesvPdfConfig = require('../services/pesv/pesvPdfConfigService');
const upload = require('../middleware/upload');

function userFromReq(req) {
  return req.user || {};
}

async function getConfig(_req, res, next) {
  try {
    res.json(await pesv.obtenerConfig());
  } catch (e) {
    next(e);
  }
}

async function putConfig(req, res, next) {
  try {
    res.json(await pesv.guardarConfig(req.body || {}, userFromReq(req)));
  } catch (e) {
    next(e);
  }
}

async function getConfigPdf(_req, res, next) {
  try {
    res.json(await pesvPdfConfig.obtenerConfigPdf());
  } catch (e) {
    next(e);
  }
}

async function putConfigPdf(req, res, next) {
  try {
    res.json(await pesvPdfConfig.guardarConfigPdf(req.body || {}, userFromReq(req)));
  } catch (e) {
    next(e);
  }
}

async function postConfigPdfImagen(req, res, next) {
  try {
    const zona = req.params.zona;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Archivo de imagen requerido' });
    }
    const rel = upload.publicUrl('pesv-pdf-layout', file.filename);
    const out = await pesvPdfConfig.actualizarImagenPdf(zona, rel, userFromReq(req));
    res.json({ ...out, imagenRuta: rel });
  } catch (e) {
    next(e);
  }
}

async function postConfigPdfPortadaDocumento(req, res, next) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Archivo PNG o JPG requerido' });
    }
    const mime = String(file.mimetype || '').toLowerCase();
    if (!mime.includes('png') && !mime.includes('jpeg') && !mime.includes('jpg')) {
      return res.status(400).json({ message: 'Solo PNG o JPG para portada' });
    }
    const rel = upload.publicUrl('pesv-pdf-portadas', file.filename);
    const out = await pesvPdfConfig.actualizarPortadaDocumento(
      req.params.itemNo,
      rel,
      userFromReq(req),
    );
    res.json({ ...out, imagenRuta: rel });
  } catch (e) {
    next(e);
  }
}

async function getAutodiagnostico(req, res, next) {
  try {
    res.json(await pesv.obtenerAutodiagnostico(req.query.vigencia));
  } catch (e) {
    next(e);
  }
}

async function putAutodiagnostico(req, res, next) {
  try {
    res.json(await pesv.guardarAutodiagnostico(req.body || {}, userFromReq(req)));
  } catch (e) {
    next(e);
  }
}

async function getCatalogoFase1(_req, res, next) {
  try {
    res.json(pesv.catalogoFase1());
  } catch (e) {
    next(e);
  }
}

async function getCatalogoFase2(_req, res, next) {
  try {
    res.json(pesv.catalogoFase2());
  } catch (e) {
    next(e);
  }
}

async function getFase1(req, res, next) {
  try {
    res.json(await pesv.obtenerFase1(req.query.vigencia));
  } catch (e) {
    next(e);
  }
}

async function putFase1(req, res, next) {
  try {
    res.json(await pesv.guardarFase1(req.body || {}, userFromReq(req)));
  } catch (e) {
    next(e);
  }
}

async function getCapturaIndice(req, res, next) {
  try {
    res.json(await pesvCaptura.indiceCaptura(req.query.vigencia));
  } catch (e) {
    next(e);
  }
}

async function getCaptura(req, res, next) {
  try {
    res.json(await pesvCaptura.obtenerCaptura(req.query.vigencia, req.query.itemNo));
  } catch (e) {
    next(e);
  }
}

async function putCaptura(req, res, next) {
  try {
    res.json(await pesvCaptura.guardarCaptura(req.body || {}, userFromReq(req)));
  } catch (e) {
    next(e);
  }
}

async function postFase1Generar(req, res, next) {
  try {
    await pesv.generarDocumentoFase1(req.params.vigencia, req.params.itemNo, userFromReq(req));
    res.json({ ok: true });
  } catch (e) {
    if (e.status === 501) {
      return res.status(501).json({
        message: e.message,
        code: e.code,
        meta: e.meta,
      });
    }
    next(e);
  }
}

async function postFase1Adjunto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Archivo requerido' });
    const out = await pesv.adjuntarFase1Item(
      req.params.vigencia,
      req.params.itemNo,
      req.file,
      userFromReq(req),
    );
    res.json(out);
  } catch (e) {
    next(e);
  }
}

async function getFase2(req, res, next) {
  try {
    res.json(await pesv.obtenerFase2(req.query.vigencia, req.query.mes));
  } catch (e) {
    next(e);
  }
}

async function putFase2(req, res, next) {
  try {
    res.json(await pesv.guardarFase2(req.body || {}, userFromReq(req)));
  } catch (e) {
    next(e);
  }
}

async function getResumen(req, res, next) {
  try {
    res.json(await pesv.resumen(req.query.vigencia));
  } catch (e) {
    next(e);
  }
}

async function getSugerenciasFlota(req, res, next) {
  try {
    res.json(await pesv.sugerenciasFlota(req.query.vigencia, req.query.mes));
  } catch (e) {
    next(e);
  }
}

async function getTablero(req, res, next) {
  try {
    res.json(await pesv.obtenerTablero(req.query.vigencia));
  } catch (e) {
    next(e);
  }
}

async function postFase2Adjunto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Archivo requerido' });
    const out = await pesv.adjuntarFase2Evidencia(
      req.params.vigencia,
      req.params.mes,
      req.params.tab,
      req.params.evidenciaId,
      req.file,
      userFromReq(req),
    );
    res.json(out);
  } catch (e) {
    next(e);
  }
}

/** Sirve ruta relativa de evidencia bajo uploads (solo lectura autenticada vía API estática global). */
function urlAdjunto(relative) {
  if (!relative) return null;
  return `/uploads/${String(relative).replace(/^\/+/, '')}`;
}

module.exports = {
  getConfig,
  putConfig,
  getConfigPdf,
  putConfigPdf,
  postConfigPdfImagen,
  postConfigPdfPortadaDocumento,
  getAutodiagnostico,
  putAutodiagnostico,
  getCatalogoFase1,
  getCatalogoFase2,
  getFase1,
  putFase1,
  postFase1Adjunto,
  postFase1Generar,
  getCapturaIndice,
  getCaptura,
  putCaptura,
  getFase2,
  putFase2,
  getResumen,
  getSugerenciasFlota,
  getTablero,
  postFase2Adjunto,
  urlAdjunto,
};
