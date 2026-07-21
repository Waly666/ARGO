const EmpleadoEvaluacion = require('../models/EmpleadoEvaluacion');
const Empleado = require('../models/Empleado');
const Cargo = require('../models/Cargo');
const {
  normalizarEmpleadoLegacy,
  nombreCompletoEmpleado,
} = require('../utils/empleadoDoc');

function filtroIdEmpleado(id) {
  const q = String(id ?? '').trim();
  const n = Number(q);
  const or = [{ idEmpleado: q }];
  if (Number.isFinite(n)) or.push({ idEmpleado: n });
  return { $or: or };
}

async function buscarEmpleado(id) {
  return Empleado.findOne(filtroIdEmpleado(id)).lean();
}

function parsePuntaje(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n * 10) / 10;
  if (rounded < 1 || rounded > 10) return null;
  return rounded;
}

function parseCompetencias(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    if (!item) continue;
    const puntaje = parsePuntaje(item.puntaje);
    if (puntaje == null) continue;
    const idCompetencia =
      item.idCompetencia != null && item.idCompetencia !== ''
        ? Number(item.idCompetencia)
        : null;
    out.push({
      idCompetencia: Number.isFinite(idCompetencia) ? idCompetencia : null,
      codigo: String(item.codigo || '').trim(),
      nombre: String(item.nombre || '').trim() || 'Competencia',
      puntaje,
    });
  }
  return out;
}

function promedioCompetencias(comps) {
  if (!comps?.length) return null;
  const suma = comps.reduce((s, c) => s + Number(c.puntaje || 0), 0);
  return Math.round((suma / comps.length) * 10) / 10;
}

function pickEvaluacion(body) {
  const dto = {};
  if (body.fecha != null && body.fecha !== '') {
    const d = new Date(body.fecha);
    if (!Number.isNaN(d.getTime())) dto.fecha = d;
  }
  if (body.periodo != null) dto.periodo = String(body.periodo).trim();
  const comps = parseCompetencias(body.competencias);
  if (comps.length) {
    dto.competencias = comps;
    dto.puntaje = promedioCompetencias(comps);
  } else if (body.puntaje != null && body.puntaje !== '') {
    const p = parsePuntaje(body.puntaje);
    if (p != null) dto.puntaje = p;
    dto.competencias = [];
  }
  if (body.tipo != null) dto.tipo = String(body.tipo).trim() || 'desempeño';
  if (body.observaciones != null) dto.observaciones = String(body.observaciones).trim();
  return dto;
}

function serialize(row) {
  if (!row) return null;
  const competencias = Array.isArray(row.competencias)
    ? row.competencias.map((c) => ({
        idCompetencia: c.idCompetencia ?? null,
        codigo: c.codigo || '',
        nombre: c.nombre || '',
        puntaje: c.puntaje,
      }))
    : [];
  return {
    _id: String(row._id),
    idEmpleado: row.idEmpleado,
    fecha: row.fecha ? new Date(row.fecha).toISOString().slice(0, 10) : null,
    periodo: row.periodo || '',
    puntaje: row.puntaje,
    competencias,
    tipo: row.tipo || 'desempeño',
    observaciones: row.observaciones || '',
    evaluadoPor: row.evaluadoPor || null,
    evaluadoPorNombre: row.evaluadoPorNombre || '',
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
}

exports.listarPorEmpleado = async (req, res, next) => {
  try {
    const emp = await buscarEmpleado(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Empleado no encontrado' });
    const rows = await EmpleadoEvaluacion.find({ idEmpleado: emp.idEmpleado })
      .sort({ fecha: -1, createdAt: -1 })
      .lean();
    res.json(rows.map(serialize));
  } catch (e) {
    next(e);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const emp = await buscarEmpleado(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Empleado no encontrado' });
    const dto = pickEvaluacion(req.body);
    if (!dto.fecha) return res.status(400).json({ message: 'fecha es obligatoria' });
    if (dto.puntaje == null) {
      return res.status(400).json({
        message: 'Debe calificar al menos una competencia (1–10) o indicar puntaje general',
      });
    }
    const user = req.user?.username || 'sistema';
    const nombre = [req.user?.nombres, req.user?.apellidos].filter(Boolean).join(' ').trim();
    const now = new Date();
    const doc = await EmpleadoEvaluacion.create({
      idEmpleado: emp.idEmpleado,
      fecha: dto.fecha,
      periodo: dto.periodo || '',
      puntaje: dto.puntaje,
      competencias: dto.competencias || [],
      tipo: dto.tipo || 'desempeño',
      observaciones: dto.observaciones || '',
      evaluadoPor: user,
      evaluadoPorNombre: nombre,
      createdAt: now,
      updatedAt: now,
      userAddReg: user,
      userChangeRecord: user,
    });
    res.status(201).json(serialize(doc.toObject ? doc.toObject() : doc));
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const emp = await buscarEmpleado(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Empleado no encontrado' });
    const ev = await EmpleadoEvaluacion.findOne({
      _id: req.params.evalId,
      idEmpleado: emp.idEmpleado,
    });
    if (!ev) return res.status(404).json({ message: 'Evaluación no encontrada' });
    const dto = pickEvaluacion(req.body);
    if (
      Array.isArray(req.body.competencias) &&
      req.body.competencias.length &&
      dto.puntaje == null
    ) {
      return res.status(400).json({ message: 'Competencias con puntaje inválido (1–10)' });
    }
    if (req.body.puntaje != null && req.body.puntaje !== '' && dto.puntaje == null && !dto.competencias?.length) {
      return res.status(400).json({ message: 'puntaje inválido (escala 1 a 10)' });
    }
    const user = req.user?.username || 'sistema';
    Object.assign(ev, dto, { updatedAt: new Date(), userChangeRecord: user });
    await ev.save();
    res.json(serialize(ev.toObject()));
  } catch (e) {
    next(e);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const emp = await buscarEmpleado(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Empleado no encontrado' });
    const result = await EmpleadoEvaluacion.deleteOne({
      _id: req.params.evalId,
      idEmpleado: emp.idEmpleado,
    });
    if (!result.deletedCount) return res.status(404).json({ message: 'Evaluación no encontrada' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

/** Informe agregado de desempeño. */
exports.informeDesempeno = async (req, res, next) => {
  try {
    const desde = req.query.desde ? new Date(String(req.query.desde)) : null;
    const hasta = req.query.hasta ? new Date(String(req.query.hasta)) : null;
    const idEmpleadoRaw = req.query.idEmpleado;
    const cargoIdRaw = req.query.cargoId;
    const q = String(req.query.q || '').trim();

    const match = {};
    if (desde && !Number.isNaN(desde.getTime())) {
      match.fecha = { ...(match.fecha || {}), $gte: desde };
    }
    if (hasta && !Number.isNaN(hasta.getTime())) {
      const fin = new Date(hasta);
      fin.setHours(23, 59, 59, 999);
      match.fecha = { ...(match.fecha || {}), $lte: fin };
    }
    if (idEmpleadoRaw != null && idEmpleadoRaw !== '') {
      const n = Number(idEmpleadoRaw);
      if (Number.isFinite(n)) match.idEmpleado = n;
    }

    const evals = await EmpleadoEvaluacion.find(match).sort({ fecha: -1 }).lean();
    const byEmp = new Map();
    for (const ev of evals) {
      const id = Number(ev.idEmpleado);
      if (!byEmp.has(id)) byEmp.set(id, []);
      byEmp.get(id).push(ev);
    }

    let empFilter = {};
    if (cargoIdRaw != null && cargoIdRaw !== '') {
      const c = Number(cargoIdRaw);
      if (Number.isFinite(c)) empFilter.cargoId = c;
    }
    const ids = [...byEmp.keys()];
    if (ids.length) {
      empFilter = { ...empFilter, idEmpleado: { $in: ids } };
    } else if (!q && !cargoIdRaw) {
      // sin evaluaciones en el rango: devolver vacío
      return res.json({
        filtros: {
          desde: req.query.desde || null,
          hasta: req.query.hasta || null,
          idEmpleado: idEmpleadoRaw || null,
          cargoId: cargoIdRaw || null,
          q: q || null,
        },
        resumen: { empleadosConEval: 0, totalEvaluaciones: 0, promedioGeneral: null },
        porEmpleado: [],
      });
    }

    let empleados = await Empleado.find(ids.length ? { idEmpleado: { $in: ids } } : empFilter)
      .lean();
    if (cargoIdRaw != null && cargoIdRaw !== '') {
      const c = Number(cargoIdRaw);
      if (Number.isFinite(c)) {
        empleados = empleados.filter((e) => Number(e.cargoId) === c);
      }
    }
    if (q.length >= 2) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      empleados = empleados.filter((raw) => {
        const e = normalizarEmpleadoLegacy(raw);
        const nombre = nombreCompletoEmpleado(e);
        return (
          re.test(nombre) ||
          re.test(String(e.numeroDocumento || '')) ||
          re.test(String(e.primerNombre || '')) ||
          re.test(String(e.primerApellido || ''))
        );
      });
    }

    const cargoIds = [...new Set(empleados.map((e) => e.cargoId).filter((x) => x != null))];
    const cargos = cargoIds.length
      ? await Cargo.find({ idCargo: { $in: cargoIds } }).lean()
      : [];
    const cargoMap = new Map(cargos.map((c) => [Number(c.idCargo), c.nombre]));

    const porEmpleado = [];
    let sumaGlobal = 0;
    let nGlobal = 0;

    for (const raw of empleados) {
      const e = normalizarEmpleadoLegacy(raw);
      const id = Number(e.idEmpleado);
      const lista = (byEmp.get(id) || []).map(serialize);
      if (!lista.length) continue;
      const suma = lista.reduce((s, x) => s + Number(x.puntaje || 0), 0);
      const promedio = Math.round((suma / lista.length) * 10) / 10;
      sumaGlobal += suma;
      nGlobal += lista.length;
      const ultima = lista[0];
      porEmpleado.push({
        idEmpleado: id,
        numeroDocumento: e.numeroDocumento || '',
        nombreCompleto: nombreCompletoEmpleado(e),
        cargoNombre: cargoMap.get(Number(e.cargoId)) || null,
        estado: e.estado || null,
        numEvaluaciones: lista.length,
        promedio,
        ultimaPuntaje: ultima?.puntaje ?? null,
        ultimaFecha: ultima?.fecha ?? null,
        evaluaciones: lista,
      });
    }

    porEmpleado.sort((a, b) => String(a.nombreCompleto).localeCompare(String(b.nombreCompleto), 'es'));

    res.json({
      filtros: {
        desde: req.query.desde || null,
        hasta: req.query.hasta || null,
        idEmpleado: idEmpleadoRaw || null,
        cargoId: cargoIdRaw || null,
        q: q || null,
      },
      resumen: {
        empleadosConEval: porEmpleado.length,
        totalEvaluaciones: nGlobal,
        promedioGeneral: nGlobal ? Math.round((sumaGlobal / nGlobal) * 10) / 10 : null,
      },
      porEmpleado,
    });
  } catch (e) {
    next(e);
  }
};
