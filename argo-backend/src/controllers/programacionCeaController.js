const svc = require('../services/programacionCea');
const clasesSvc = require('../services/programacionCeaClases');

exports.programas = async (_req, res, next) => {
  try {
    const rows = await svc.listarProgramasCea();
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

exports.obtenerConfig = async (_req, res, next) => {
  try {
    res.json(await svc.obtenerConfig());
  } catch (e) {
    next(e);
  }
};

exports.guardarConfig = async (req, res, next) => {
  try {
    const data = await svc.guardarConfig(req.body, req.user);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

exports.festivos = async (req, res, next) => {
  try {
    const anio = req.query.anio || new Date().getFullYear();
    res.json({ anio: Number(anio), fechas: svc.listarFestivos(anio) });
  } catch (e) {
    next(e);
  }
};

exports.listarTemas = async (req, res, next) => {
  try {
    const rows = await svc.listarTemas(req.params.idProg);
    if (rows === null) return res.status(404).json({ message: 'Programa CEA no encontrado' });
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

exports.crearTema = async (req, res, next) => {
  try {
    const result = await svc.crearTema(req.params.idProg, req.body, req.user);
    if (result.error) return res.status(result.status).json({ message: result.error });
    res.status(201).json(result.doc);
  } catch (e) {
    next(e);
  }
};

exports.actualizarTema = async (req, res, next) => {
  try {
    const result = await svc.actualizarTema(req.params.id, req.body, req.user);
    if (result.error) return res.status(result.status).json({ message: result.error });
    res.json(result.doc);
  } catch (e) {
    next(e);
  }
};

exports.eliminarTema = async (req, res, next) => {
  try {
    const result = await svc.eliminarTema(req.params.id);
    if (result.error) return res.status(result.status).json({ message: result.error });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

exports.rastreoGlobal = async (req, res, next) => {
  try {
    const soloPendientes = req.query.soloPendientes === '1' || req.query.soloPendientes === 'true';
    res.json(await svc.rastreoGlobal({ soloPendientes }));
  } catch (e) {
    next(e);
  }
};

exports.rastreoAlumno = async (req, res, next) => {
  try {
    res.json(await svc.rastreoAlumno(req.params.numDoc));
  } catch (e) {
    next(e);
  }
};

exports.alertasPendientes = async (_req, res, next) => {
  try {
    res.json(await svc.alertasPendientes());
  } catch (e) {
    next(e);
  }
};

exports.recursos = async (_req, res, next) => {
  try {
    res.json(await clasesSvc.recursosProgramacion());
  } catch (e) {
    next(e);
  }
};

exports.listarClases = async (req, res, next) => {
  try {
    res.json(await clasesSvc.listarClases(req));
  } catch (e) {
    next(e);
  }
};

exports.obtenerClase = async (req, res, next) => {
  try {
    const doc = await clasesSvc.obtenerClase(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Clase no encontrada' });
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

exports.crearClase = async (req, res, next) => {
  try {
    const result = await clasesSvc.crearClase(req.body, req);
    if (result?.error) {
      return res.status(result.status || 400).json({ message: result.error, conflictos: result.conflictos });
    }
    res.status(201).json(result);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message, conflictos: e.conflictos });
    next(e);
  }
};

exports.actualizarClase = async (req, res, next) => {
  try {
    const result = await clasesSvc.actualizarClase(req.params.id, req.body, req);
    if (result?.error) {
      return res.status(result.status || 400).json({ message: result.error, conflictos: result.conflictos });
    }
    res.json(result.doc);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message, conflictos: e.conflictos });
    next(e);
  }
};

exports.cancelarClase = async (req, res, next) => {
  try {
    const result = await clasesSvc.cancelarClase(req.params.id, req);
    if (result?.error) return res.status(result.status).json({ message: result.error });
    res.json(result.doc);
  } catch (e) {
    next(e);
  }
};

exports.verificarConflictos = async (req, res, next) => {
  try {
    const excludeId = req.query.excludeId || null;
    res.json(await clasesSvc.verificarConflictos(req.body, req, excludeId));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.iniciarClase = async (req, res, next) => {
  try {
    const result = await clasesSvc.iniciarClase(req.params.id, req);
    if (result?.error) return res.status(result.status).json({ message: result.error });
    res.json(result.doc);
  } catch (e) {
    next(e);
  }
};

exports.finalizarClase = async (req, res, next) => {
  try {
    const result = await clasesSvc.finalizarClase(req.params.id, req);
    if (result?.error) return res.status(result.status).json({ message: result.error });
    res.json(result.doc);
  } catch (e) {
    next(e);
  }
};

exports.listarInscripciones = async (req, res, next) => {
  try {
    res.json(await clasesSvc.listarInscripciones(req.params.id));
  } catch (e) {
    next(e);
  }
};

exports.inscribirAlumno = async (req, res, next) => {
  try {
    const result = await clasesSvc.inscribirAlumno(req.params.id, req.body, req);
    if (result?.error) return res.status(result.status).json({ message: result.error });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

exports.quitarInscripcion = async (req, res, next) => {
  try {
    const result = await clasesSvc.quitarInscripcion(req.params.id, req.params.numDoc, req);
    if (result?.error) return res.status(result.status).json({ message: result.error });
    res.json(result);
  } catch (e) {
    next(e);
  }
};

exports.alumnosElegibles = async (req, res, next) => {
  try {
    const rows = await clasesSvc.alumnosElegibles(req.params.id, req.query.q || '');
    if (rows === null) return res.status(404).json({ message: 'Clase no encontrada' });
    res.json(rows);
  } catch (e) {
    next(e);
  }
};
