const Vehiculo = require('../models/Vehiculo');
const Empleado = require('../models/Empleado');
const InspeccionVehiculo = require('../models/InspeccionVehiculo');
const { empleadoPorUsuarioId, nombreEmpleado } = require('./instructorJornada');
const {
  cargarIndiceClases,
  resolverIdClaseVehiculo,
} = require('./configRequisitosDocumentosVehiculos');
const { calcularDocumentosRequeridos: calcularDocsVehiculo } = require('./vehiculoDocumentos');
const { calcularDocumentosRequeridosInspeccion } = require('./empleadoDocumentos');
const { fechaHoyStr, horaActualStr, normSi } = require('../utils/inspeccionClaseVehiculo');
const { normalizarRol } = require('../utils/roles');
const { itemsInspeccionPorClase, previewConsecutivoInspeccion, reservarConsecutivoInspeccion } = require('./configFormatoInspeccionVehiculos');

const PRIMERA_REVISION = 'Primera revisión';

function observacionEstadoDocumento(doc) {
  if (!doc.subido) return 'Sin registrar';
  if (doc.vencido) return 'Vencido';
  if (doc.faltaFechaVence) return 'Falta fecha de vencimiento';
  if (doc.vencePronto) return 'Por vencer';
  return '';
}

function documentoCumple(doc) {
  return !!(doc.subido && !doc.vencido && !doc.vencePronto && !doc.faltaFechaVence);
}

function mapDocumentosCumplimiento(documentos) {
  return (documentos || []).map((d) => {
    const cumple = documentoCumple(d);
    return {
      id: String(d.id),
      nombre: String(d.nombre || '').trim(),
      si: cumple,
      observacion: cumple ? '' : observacionEstadoDocumento(d),
    };
  });
}

async function armarChecklistDocumentosVehiculo(vehiculo) {
  const res = await calcularDocsVehiculo(vehiculo);
  return mapDocumentosCumplimiento(res.documentos);
}

async function armarChecklistDocumentosInstructor(empleado) {
  if (!empleado?.idEmpleado) return [];
  const res = await calcularDocumentosRequeridosInspeccion(empleado);
  return mapDocumentosCumplimiento(res.documentos);
}

function mapCatalogChecklist(rows, idField, labelField) {
  return (rows || []).map((r) => ({
    id: String(r[idField]),
    nombre: String(r[labelField] || '').trim(),
    si: null,
    observacion: '',
  }));
}

function mergeChecklist(plantilla, guardado, labelField = 'nombre') {
  const byId = new Map((guardado || []).map((r) => [String(r.id), r]));
  return (plantilla || []).map((p) => {
    const prev = byId.get(String(p.id));
    return {
      id: String(p.id),
      nombre: String(p.nombre || p.item || p.aspecto || prev?.[labelField] || '').trim(),
      si: prev?.si != null ? normSi(prev.si) : null,
      observacion: String(prev?.observacion || '').trim(),
    };
  });
}

/** Restaura snapshot guardado de documentos; agrega tipos nuevos de la plantilla vigente. */
function mergeDocumentosChecklist(plantilla, guardado) {
  if (!guardado?.length) return plantilla || [];
  const plantillaById = new Map((plantilla || []).map((p) => [String(p.id), p]));
  const usados = new Set();
  const out = (guardado || []).map((g) => {
    const id = String(g.id);
    usados.add(id);
    const p = plantillaById.get(id);
    return {
      id,
      nombre: String(g.nombre || p?.nombre || '').trim(),
      si: g.si != null ? normSi(g.si) : p?.si != null ? normSi(p.si) : null,
      observacion: String(g.observacion || p?.observacion || '').trim(),
    };
  });
  for (const p of plantilla || []) {
    if (usados.has(String(p.id))) continue;
    out.push(p);
  }
  return out.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

async function resolverEmpleadoInstructorOpcional(userId) {
  return empleadoPorUsuarioId(userId);
}

async function resolverEmpleadoInstructor(userId) {
  const emp = await resolverEmpleadoInstructorOpcional(userId);
  if (!emp) {
    const err = new Error('Su usuario no está vinculado a un empleado. No puede diligenciar inspecciones.');
    err.status = 403;
    throw err;
  }
  return emp;
}

async function nombreEmpleadoPorId(idEmpleado) {
  const id = Number(idEmpleado);
  if (!Number.isFinite(id)) return '';
  const emp = await Empleado.findOne({ idEmpleado: id }).lean();
  return nombreEmpleado(emp).trim();
}

function nombreEmpleadoLogueado(empleado) {
  return nombreEmpleado(empleado).trim();
}

async function nombreEntregaDesdeInspeccion(anterior) {
  if (!anterior) return PRIMERA_REVISION;
  const nom = await nombreEmpleadoPorId(anterior.idEmpleadoInstructor);
  if (nom) return nom;
  const legacy = String(anterior.nombreInstructor || anterior.quienRecibe || '').trim();
  return legacy || PRIMERA_REVISION;
}

function avisoRolInstructor(user) {
  const rol = normalizarRol(user?.rol);
  if (rol === 'instructor') return null;
  const etiqueta = rol === 'admin' ? 'Administrador' : rol;
  return `Su usuario tiene rol «${etiqueta}». Las inspecciones deben ser diligenciadas por un instructor.`;
}

async function resolverCustodiaInspeccion(placa, fecha, empleado) {
  const anterior = await InspeccionVehiculo.findOne({ placa, fecha: { $lt: fecha } })
    .sort({ fecha: -1, hora: -1 })
    .lean();

  const quienRecibe = nombreEmpleadoLogueado(empleado);

  if (!anterior) {
    return {
      quienEntrega: PRIMERA_REVISION,
      quienRecibe,
      esPrimeraRevision: true,
      fechaRevisionAnterior: null,
    };
  }

  const quienEntrega = await nombreEntregaDesdeInspeccion(anterior);

  return {
    quienEntrega,
    quienRecibe,
    esPrimeraRevision: quienEntrega === PRIMERA_REVISION,
    fechaRevisionAnterior: anterior.fecha || null,
  };
}

async function armarPlantillaInspeccion(vehiculo, empleado) {
  const [indiceClases, itemsFormato, documentosVehiculo, documentosInstructor, consecutivo] =
    await Promise.all([
      cargarIndiceClases(),
      itemsInspeccionPorClase(vehiculo),
      armarChecklistDocumentosVehiculo(vehiculo),
      armarChecklistDocumentosInstructor(empleado),
      previewConsecutivoInspeccion(),
    ]);

  const idClase = itemsFormato.idClase || resolverIdClaseVehiculo(vehiculo, indiceClases);

  return {
    placa: String(vehiculo.placa || '').trim(),
    fecha: fechaHoyStr(),
    hora: horaActualStr(),
    combustible: String(vehiculo.combustible || '').trim(),
    idClase,
    claseVehiculo: String(vehiculo.claseVehiculo || '').trim(),
    idEmpleadoInstructor: empleado?.idEmpleado ?? null,
    nombreInstructor: nombreEmpleado(empleado),
    quienEntrega: '',
    quienRecibe: '',
    documentosVehiculo,
    documentosInstructor,
    estadoGeneral: mapCatalogChecklist(itemsFormato.estadoGeneral, 'idItemEsGral', 'item'),
    adaptaciones: mapCatalogChecklist(itemsFormato.adaptaciones, 'idAdaptacion', 'nombre'),
    aspecto1: mapCatalogChecklist(itemsFormato.aspecto1, 'idAspecto1', 'aspecto1'),
    aspecto2: mapCatalogChecklist(itemsFormato.aspecto2, 'idAspecto2', 'aspecto2'),
    aptoLaborar: null,
    observacionesGenerales: '',
    consecutivo,
  };
}

async function obtenerInspeccionDelDia(vehiculo, empleado, fecha, user) {
  const f = fecha || fechaHoyStr();
  const plantilla = await armarPlantillaInspeccion(vehiculo, empleado);
  const placa = plantilla.placa;
  const avisoRol = user ? avisoRolInstructor(user) : null;
  const guardada = await InspeccionVehiculo.findOne({ placa, fecha: f }).lean();
  if (!guardada) {
    const custodia = await resolverCustodiaInspeccion(placa, f, empleado);
    return {
      ...plantilla,
      fecha: f,
      guardada: false,
      _id: null,
      quienEntrega: custodia.quienEntrega,
      quienRecibe: custodia.quienRecibe,
      nombreInstructor: custodia.quienRecibe || plantilla.nombreInstructor,
      esPrimeraRevision: custodia.esPrimeraRevision,
      fechaRevisionAnterior: custodia.fechaRevisionAnterior,
      avisoRolInstructor: avisoRol,
    };
  }

  const custodia = await resolverCustodiaInspeccion(placa, f, empleado);
  const quienRecibe =
    (await nombreEmpleadoPorId(guardada.idEmpleadoInstructor)) || nombreEmpleadoLogueado(empleado);

  return {
    _id: String(guardada._id),
    placa: guardada.placa,
    fecha: guardada.fecha,
    hora: guardada.hora || plantilla.hora,
    combustible: guardada.combustible ?? plantilla.combustible,
    quienEntrega: custodia.quienEntrega,
    quienRecibe,
    idEmpleadoInstructor: guardada.idEmpleadoInstructor ?? plantilla.idEmpleadoInstructor,
    nombreInstructor: quienRecibe || plantilla.nombreInstructor,
    idClase: plantilla.idClase,
    claseVehiculo: plantilla.claseVehiculo,
    documentosVehiculo: mergeDocumentosChecklist(plantilla.documentosVehiculo, guardada.documentosVehiculo),
    documentosInstructor: mergeDocumentosChecklist(plantilla.documentosInstructor, guardada.documentosInstructor),
    estadoGeneral: mergeChecklist(plantilla.estadoGeneral, guardada.estadoGeneral),
    adaptaciones: mergeChecklist(plantilla.adaptaciones, guardada.adaptaciones),
    aspecto1: mergeChecklist(plantilla.aspecto1, guardada.aspecto1),
    aspecto2: mergeChecklist(plantilla.aspecto2, guardada.aspecto2),
    aptoLaborar: normSi(guardada.aptoLaborar),
    observacionesGenerales: String(guardada.observacionesGenerales || '').trim(),
    consecutivo: guardada.consecutivo || plantilla.consecutivo,
    guardada: true,
    esPrimeraRevision: custodia.esPrimeraRevision,
    fechaRevisionAnterior: custodia.fechaRevisionAnterior,
    avisoRolInstructor: avisoRol,
    fechaAudi: guardada.fechaAudi,
    fechaMod: guardada.fechaMod,
  };
}

function normalizeItems(items) {
  return (items || []).map((r) => ({
    id: String(r.id),
    nombre: String(r.nombre || r.item || r.aspecto || '').trim(),
    si: normSi(r.si),
    observacion: String(r.observacion || '').trim(),
  }));
}

async function guardarInspeccion(vehiculo, empleado, body, userLogin, user) {
  const fecha = String(body?.fecha || fechaHoyStr()).trim();
  const plantilla = await armarPlantillaInspeccion(vehiculo, empleado);
  const placa = String(vehiculo.placa || '').trim();
  const existing = await InspeccionVehiculo.findOne({ placa, fecha }).lean();
  const custodia = await resolverCustodiaInspeccion(placa, fecha, empleado);
  const quienEntrega = existing
    ? String(existing.quienEntrega || custodia.quienEntrega).trim()
    : custodia.quienEntrega;
  const quienRecibe = existing
    ? String(existing.quienRecibe || nombreEmpleadoLogueado(empleado)).trim()
    : nombreEmpleadoLogueado(empleado);
  const nombreInstructor = existing
    ? String(existing.nombreInstructor || quienRecibe).trim()
    : quienRecibe;
  const idEmpleadoInstructor = existing?.idEmpleadoInstructor ?? empleado.idEmpleado;
  const consecutivo = existing
    ? String(existing.consecutivo || '').trim() || (await reservarConsecutivoInspeccion())
    : await reservarConsecutivoInspeccion();

  const dto = {
    placa,
    fecha,
    hora: String(body?.hora || horaActualStr()).trim(),
    combustible: String(body?.combustible ?? plantilla.combustible ?? '').trim(),
    quienEntrega,
    quienRecibe,
    idEmpleadoInstructor,
    nombreInstructor,
    documentosVehiculo: normalizeItems(plantilla.documentosVehiculo),
    documentosInstructor: normalizeItems(plantilla.documentosInstructor),
    estadoGeneral: normalizeItems(body?.estadoGeneral ?? plantilla.estadoGeneral),
    adaptaciones: normalizeItems(body?.adaptaciones ?? plantilla.adaptaciones),
    aspecto1: normalizeItems(body?.aspecto1 ?? plantilla.aspecto1),
    aspecto2: normalizeItems(body?.aspecto2 ?? plantilla.aspecto2),
    aptoLaborar: normSi(body?.aptoLaborar),
    observacionesGenerales: String(body?.observacionesGenerales || '').trim(),
    consecutivo,
    userChangeRecord: userLogin,
    fechaMod: new Date(),
  };

  if (existing) {
    await InspeccionVehiculo.findOneAndUpdate({ _id: existing._id }, { $set: dto }, { new: true }).lean();
  } else {
    dto.fechaAudi = new Date();
    dto.userAddReg = userLogin;
    await InspeccionVehiculo.create(dto);
  }

  return obtenerInspeccionDelDia(vehiculo, empleado, fecha, user);
}

async function obtenerVehiculoPorId(id) {
  const vehiculo = await Vehiculo.findById(id).lean();
  if (!vehiculo) {
    const err = new Error('Vehículo no encontrado');
    err.status = 404;
    throw err;
  }
  return vehiculo;
}

async function listarInspecciones(vehiculo, { limit = 50, skip = 0 } = {}) {
  const placa = String(vehiculo.placa || '').trim();
  const q = { placa };
  const [rows, total] = await Promise.all([
    InspeccionVehiculo.find(q)
      .sort({ fecha: -1, hora: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id placa fecha hora nombreInstructor aptoLaborar consecutivo fechaMod fechaAudi')
      .lean(),
    InspeccionVehiculo.countDocuments(q),
  ]);

  return {
    placa,
    total,
    inspecciones: rows.map((r) => ({
      _id: String(r._id),
      placa: r.placa,
      fecha: r.fecha,
      hora: r.hora || '',
      nombreInstructor: r.nombreInstructor || '',
      aptoLaborar: normSi(r.aptoLaborar),
      consecutivo: r.consecutivo || '',
      fechaMod: r.fechaMod || r.fechaAudi || null,
    })),
  };
}

module.exports = {
  resolverEmpleadoInstructor,
  resolverEmpleadoInstructorOpcional,
  armarPlantillaInspeccion,
  obtenerInspeccionDelDia,
  guardarInspeccion,
  listarInspecciones,
  obtenerVehiculoPorId,
  fechaHoyStr,
  PRIMERA_REVISION,
};
