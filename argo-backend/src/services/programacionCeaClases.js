const ClaseProgramadaCea = require('../models/ClaseProgramadaCea');
const InscripcionClaseCea = require('../models/InscripcionClaseCea');
const TemaProgramaCea = require('../models/TemaProgramaCea');
const DatosAlumno = require('../models/DatosAlumno');
const Empleado = require('../models/Empleado');
const Vehiculo = require('../models/Vehiculo');
const { models: cat } = require('../models/catalogos');
const { TIPOS_CLASE_CEA } = require('../constants/programacionCea');
const { obtenerConfig } = require('./configProgramacionCea');
const { diaProgramable, horarioParaDia } = require('./festivosColombia');
const {
  buscarProgramaCea,
  rastreoAlumno,
  labelPrograma,
  horasClase,
} = require('./programacionCeaRastreo');
const { idProgDePrograma } = require('./programaServicio');
const { empleadoPorUsuarioId, nombreEmpleado, listarInstructoresConUsuario } = require('./instructorJornada');
const { tieneAlguno, permisosParaRol } = require('./rolesPermisos');

function err(msg, status = 400) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

function inicioDia(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseFechaYmd(str) {
  if (str instanceof Date) return inicioDia(str);
  const m = String(str || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : inicioDia(d);
}

function parseHoraMinutos(horaStr) {
  const m = String(horaStr ?? '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function minutosAHora(mins) {
  const h = Math.floor(mins / 60) % 24;
  const min = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function calcularHoraHasta(horaDesde, duracionHoras) {
  const start = parseHoraMinutos(horaDesde);
  if (start == null || !duracionHoras) return '';
  return minutosAHora(start + Math.round(Number(duracionHoras) * 60));
}

function rangoMinutosClase(clase, bufferExtra = 0) {
  const desde = parseHoraMinutos(clase.horaDesde);
  let hasta = parseHoraMinutos(clase.horaHasta);
  if (desde == null) return null;
  if (hasta == null && clase.duracionHoras > 0) {
    hasta = desde + Math.round(Number(clase.duracionHoras) * 60);
  }
  if (hasta == null || hasta <= desde) return null;
  return { desde, hasta: hasta + bufferExtra };
}

function rangosSeSolapan(a, b) {
  if (!a || !b) return false;
  return a.desde < b.hasta && b.desde < a.hasta;
}

function bloqueConfigPorTipo(tipo, config) {
  if (tipo === 'teoria') return config.aula;
  if (tipo === 'taller') return config.taller;
  return config.vehiculo;
}

async function resolverInstructorCea(req, body = {}) {
  const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
  const puedeAsignar = tieneAlguno(permisos, ['programacion_cea.gestionar']);

  const idEmpleadoRaw = body.idEmpleadoInstructor ?? body.idEmpleado;
  if (idEmpleadoRaw != null && idEmpleadoRaw !== '' && puedeAsignar) {
    const idEmpleado = Number(idEmpleadoRaw);
    if (!Number.isFinite(idEmpleado)) throw err('idEmpleadoInstructor inválido');
    const emp = await Empleado.findOne({ idEmpleado }).lean();
    if (!emp) throw err('Empleado instructor no encontrado', 404);
    return {
      idEmpleadoInstructor: emp.idEmpleado,
      idUsuarioInstructor: emp.idUsuario ? String(emp.idUsuario) : '',
      instructorNombre: nombreEmpleado(emp),
    };
  }

  const emp = await empleadoPorUsuarioId(req.user?.sub);
  if (!emp) {
    throw err('Su usuario debe estar vinculado a un empleado en RRHH para operar clases CEA.');
  }
  return {
    idEmpleadoInstructor: emp.idEmpleado,
    idUsuarioInstructor: emp.idUsuario ? String(emp.idUsuario) : String(req.user?.sub || ''),
    instructorNombre: nombreEmpleado(emp),
  };
}

async function filtroClasesPorRol(req) {
  const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
  if (tieneAlguno(permisos, ['programacion_cea.gestionar'])) return null;
  const emp = await empleadoPorUsuarioId(req.user?.sub);
  const or = [];
  if (emp?.idEmpleado != null) or.push({ idEmpleadoInstructor: emp.idEmpleado });
  const uid = req.user?.sub ? String(req.user.sub) : '';
  if (uid) or.push({ idUsuarioInstructor: uid });
  if (!or.length) return { _id: null };
  return { $or: or };
}

async function dtoClase(clase) {
  if (!clase) return null;
  const doc = clase.toObject ? clase.toObject() : { ...clase };
  let temaNombre = '';
  if (doc.idTema) {
    const tema = await TemaProgramaCea.findById(doc.idTema).lean();
    temaNombre = tema?.nombre || '';
  }
  let instructorNombre = doc.instructorNombre || '';
  if (!instructorNombre && doc.idEmpleadoInstructor) {
    const emp = await Empleado.findOne({ idEmpleado: doc.idEmpleadoInstructor }).lean();
    instructorNombre = nombreEmpleado(emp);
  }
  let aulaNombre = '';
  if (doc.idAula) {
    const a = await cat.aulas.findOne({ $or: [{ idAula: doc.idAula }, { _id: doc.idAula }] }).lean();
    aulaNombre = a?.nombre || a?.descrAula || String(doc.idAula);
  }
  let tallerNombre = '';
  if (doc.idTaller) {
    const t = await cat.talleres.findOne({ $or: [{ idTaller: doc.idTaller }, { _id: doc.idTaller }] }).lean();
    tallerNombre = t?.nombre || String(doc.idTaller);
  }
  const prog = await buscarProgramaCea(doc.idProg);
  const inscritos = await InscripcionClaseCea.countDocuments({ idClase: doc._id });
  return {
    ...doc,
    temaNombre,
    instructorNombre,
    aulaNombre,
    tallerNombre,
    programaLabel: prog ? labelPrograma(prog) : doc.idProg,
    inscritos,
    cupoDisponible: doc.cupoMaximo != null ? Math.max(0, doc.cupoMaximo - inscritos) : null,
  };
}

async function validarHorarioClase({ tipoClase, fechaClase, horaDesde, horaHasta, duracionHoras, config }) {
  const bloque = bloqueConfigPorTipo(tipoClase, config);
  if (!diaProgramable(fechaClase, bloque)) {
    throw err('La fecha seleccionada no está habilitada para programar (día, sábado, domingo o festivo).');
  }
  const horario = horarioParaDia(bloque, fechaClase);
  const ini = parseHoraMinutos(horaDesde);
  let fin = parseHoraMinutos(horaHasta);
  if (tipoClase === 'practica' && duracionHoras > 0) {
    fin = ini != null ? ini + Math.round(Number(duracionHoras) * 60) : null;
  }
  const hIni = parseHoraMinutos(horario?.horaDesde || bloque.horaDesde);
  const hFin = parseHoraMinutos(horario?.horaHasta || bloque.horaHasta);
  if (ini == null || fin == null) throw err('Indique horaDesde y horaHasta válidas (HH:mm).');
  if (ini < hIni || fin > hFin) {
    throw err(`El horario debe estar entre ${horario?.horaDesde || bloque.horaDesde} y ${horario?.horaHasta || bloque.horaHasta} para este tipo de día.`);
  }
  if (fin <= ini) throw err('La hora de fin debe ser posterior a la de inicio.');
}

async function detectarConflictos(claseData, excludeId = null) {
  const config = await obtenerConfig();
  const buffer = Number(config.vehiculo?.bufferMinutos) || 0;
  const fecha = inicioDia(claseData.fechaClase);
  const finDia = new Date(fecha);
  finDia.setDate(finDia.getDate() + 1);

  const q = {
    fechaClase: { $gte: fecha, $lt: finDia },
    estado: { $nin: ['CANCELADA'] },
  };
  if (excludeId) q._id = { $ne: excludeId };

  const existentes = await ClaseProgramadaCea.find(q).lean();
  const rangoNuevo = rangoMinutosClase(claseData, claseData.tipoClase === 'practica' ? buffer : 0);
  if (!rangoNuevo) return [];

  const conflictos = [];
  for (const ex of existentes) {
    const bufEx = ex.tipoClase === 'practica' ? buffer : 0;
    const rangoEx = rangoMinutosClase(ex, bufEx);
    if (!rangosSeSolapan(rangoNuevo, rangoEx)) continue;

    if (claseData.idVehiculo && ex.idVehiculo && String(claseData.idVehiculo) === String(ex.idVehiculo)) {
      conflictos.push({ tipo: 'vehiculo', mensaje: `Vehículo ocupado (${ex.horaDesde}–${ex.horaHasta})`, idClase: ex._id });
    }
    if (claseData.idAula && ex.idAula && String(claseData.idAula) === String(ex.idAula)) {
      conflictos.push({ tipo: 'aula', mensaje: `Aula ocupada (${ex.horaDesde}–${ex.horaHasta})`, idClase: ex._id });
    }
    if (claseData.idTaller && ex.idTaller && String(claseData.idTaller) === String(ex.idTaller)) {
      conflictos.push({ tipo: 'taller', mensaje: `Taller ocupado (${ex.horaDesde}–${ex.horaHasta})`, idClase: ex._id });
    }
    if (
      claseData.idEmpleadoInstructor &&
      ex.idEmpleadoInstructor &&
      Number(claseData.idEmpleadoInstructor) === Number(ex.idEmpleadoInstructor)
    ) {
      conflictos.push({ tipo: 'instructor', mensaje: `Instructor ocupado (${ex.horaDesde}–${ex.horaHasta})`, idClase: ex._id });
    }
  }
  return conflictos;
}

async function armarDatosClase(body, req, { excludeId = null } = {}) {
  const config = await obtenerConfig();
  const idProg = String(body.idProg || '').trim();
  const tipoClase = String(body.tipoClase || '').trim();
  if (!idProg) throw err('idProg es obligatorio');
  if (!TIPOS_CLASE_CEA.includes(tipoClase)) throw err('tipoClase inválido');

  const prog = await buscarProgramaCea(idProg);
  if (!prog) throw err('Programa CEA no encontrado', 404);

  const fechaClase = body.fechaClase != null ? parseFechaYmd(body.fechaClase) : null;
  if (!fechaClase) throw err('fechaClase inválida (YYYY-MM-DD)');

  let horaDesde = String(body.horaDesde || '').trim();
  let horaHasta = String(body.horaHasta || '').trim();
  let duracionHoras = body.duracionHoras != null && body.duracionHoras !== '' ? Number(body.duracionHoras) : null;

  if (tipoClase === 'practica') {
    const permitidas = config.vehiculo?.duracionesPermitidas || [1, 2, 3, 4];
    if (!duracionHoras || !permitidas.includes(duracionHoras)) {
      throw err(`Duración de práctica inválida. Permitidas: ${permitidas.join(', ')} h`);
    }
    if (!horaDesde) throw err('horaDesde es obligatoria');
    horaHasta = calcularHoraHasta(horaDesde, duracionHoras);
  } else if (!horaDesde || !horaHasta) {
    throw err('horaDesde y horaHasta son obligatorias');
  }

  const instructor = await resolverInstructorCea(req, body);

  let idTema = body.idTema || null;
  let idAula = String(body.idAula || '').trim();
  let idTaller = String(body.idTaller || '').trim();
  let idVehiculo = String(body.idVehiculo || '').trim();
  let cupoMaximo = body.cupoMaximo != null && body.cupoMaximo !== '' ? Number(body.cupoMaximo) : null;

  if (tipoClase === 'teoria') {
    if (!idTema) throw err('Seleccione un tema de teoría');
    if (!idAula) throw err('Seleccione un aula');
    idTaller = '';
    idVehiculo = '';
    if (!cupoMaximo) cupoMaximo = config.aula?.cupoMaximoDefault || 25;
  } else if (tipoClase === 'taller') {
    if (!idTema) throw err('Seleccione un tema de taller');
    if (!idTaller) throw err('Seleccione ubicación de taller');
    idAula = '';
    idVehiculo = '';
    if (!cupoMaximo) cupoMaximo = config.taller?.cupoMaximoDefault || 20;
  } else {
    idTema = null;
    idAula = '';
    idTaller = '';
    if (!idVehiculo) throw err('Seleccione un vehículo');
    const veh = await Vehiculo.findOne({
      $or: [{ placa: idVehiculo.toUpperCase() }, { _id: idVehiculo }],
    }).lean();
    if (!veh) throw err('Vehículo no encontrado', 404);
    idVehiculo = veh.placa;
    cupoMaximo = 1;
    duracionHoras = duracionHoras || 1;
  }

  if (fechaClase) {
    await validarHorarioClase({ tipoClase, fechaClase, horaDesde, horaHasta, duracionHoras, config });
  }

  const data = {
    idProg: String(idProgDePrograma(prog)),
    tipoClase,
    idTema: idTema || null,
    fechaClase,
    horaDesde,
    horaHasta,
    duracionHoras,
    idAula,
    idTaller,
    idVehiculo,
    idEmpleadoInstructor: instructor.idEmpleadoInstructor,
    idUsuarioInstructor: instructor.idUsuarioInstructor,
    cupoMaximo,
    observaciones: String(body.observaciones || '').trim(),
  };

  if (fechaClase) {
    const conflictos = await detectarConflictos(data, excludeId);
    if (conflictos.length) {
      const e = err('Conflicto de programación detectado');
      e.status = 409;
      e.conflictos = conflictos;
      throw e;
    }
  }

  return data;
}

async function listarClases(req) {
  const q = {};
  const rolFiltro = await filtroClasesPorRol(req);
  if (rolFiltro) Object.assign(q, rolFiltro);

  const { desde, hasta, fecha, idProg, tipoClase, estado } = req.query || {};
  if (fecha) {
    const d = parseFechaYmd(fecha);
    if (d) {
      const fin = new Date(d);
      fin.setDate(fin.getDate() + 1);
      q.fechaClase = { $gte: d, $lt: fin };
    }
  } else if (desde || hasta) {
    q.fechaClase = {};
    if (desde) q.fechaClase.$gte = parseFechaYmd(desde) || new Date(desde);
    if (hasta) {
      const h = parseFechaYmd(hasta) || new Date(hasta);
      h.setDate(h.getDate() + 1);
      q.fechaClase.$lt = h;
    }
  }
  if (idProg) q.idProg = String(idProg);
  if (tipoClase) q.tipoClase = String(tipoClase);
  if (estado) q.estado = String(estado);

  const rows = await ClaseProgramadaCea.find(q).sort({ fechaClase: 1, horaDesde: 1 }).lean();
  const out = [];
  for (const r of rows) out.push(await dtoClase(r));
  return out;
}

async function obtenerClase(id) {
  const clase = await ClaseProgramadaCea.findById(id);
  if (!clase) return null;
  return dtoClase(clase);
}

async function crearClase(body, req) {
  try {
    const data = await armarDatosClase(body, req);
    const clase = await ClaseProgramadaCea.create({
      ...data,
      estado: 'PROGRAMADA',
      inscritos: 0,
      userAddReg: req.user?.username || 'sistema',
    });
    return dtoClase(clase);
  } catch (e) {
    if (e.conflictos) {
      return { error: e.message, status: e.status || 409, conflictos: e.conflictos };
    }
    throw e;
  }
}

async function actualizarClase(id, body, req) {
  const clase = await ClaseProgramadaCea.findById(id);
  if (!clase) return { error: 'Clase no encontrada', status: 404 };
  if (clase.estado === 'FINALIZADO') return { error: 'No se puede editar una clase finalizada', status: 409 };
  if (clase.estado === 'EN PROCESO') return { error: 'No se puede editar una clase en curso', status: 409 };

  const merged = {
    idProg: body.idProg ?? clase.idProg,
    tipoClase: body.tipoClase ?? clase.tipoClase,
    idTema: body.idTema ?? clase.idTema,
    fechaClase: body.fechaClase ?? clase.fechaClase,
    horaDesde: body.horaDesde ?? clase.horaDesde,
    horaHasta: body.horaHasta ?? clase.horaHasta,
    duracionHoras: body.duracionHoras ?? clase.duracionHoras,
    idAula: body.idAula ?? clase.idAula,
    idTaller: body.idTaller ?? clase.idTaller,
    idVehiculo: body.idVehiculo ?? clase.idVehiculo,
    idEmpleadoInstructor: body.idEmpleadoInstructor ?? clase.idEmpleadoInstructor,
    cupoMaximo: body.cupoMaximo ?? clase.cupoMaximo,
    observaciones: body.observaciones ?? clase.observaciones,
  };

  try {
    const data = await armarDatosClase(merged, req, { excludeId: id });
    Object.assign(clase, data);
    clase.userChangeRecord = req.user?.username || 'sistema';
    await clase.save();
    return { doc: await dtoClase(clase) };
  } catch (e) {
    if (e.conflictos) return { error: e.message, status: e.status || 409, conflictos: e.conflictos };
    throw e;
  }
}

async function cancelarClase(id, req) {
  const clase = await ClaseProgramadaCea.findById(id);
  if (!clase) return { error: 'Clase no encontrada', status: 404 };
  if (clase.estado === 'EN PROCESO') return { error: 'Finalice la clase antes de cancelarla', status: 409 };
  if (clase.estado === 'FINALIZADO') return { error: 'La clase ya está finalizada', status: 409 };
  clase.estado = 'CANCELADA';
  clase.userChangeRecord = req.user?.username || 'sistema';
  await clase.save();
  return { doc: await dtoClase(clase) };
}

async function verificarConflictos(body, req, excludeId = null) {
  try {
    const data = await armarDatosClase(body, req, { excludeId });
    return { ok: true, conflictos: [], horaDesde: data.horaDesde, horaHasta: data.horaHasta };
  } catch (e) {
    if (e.conflictos) return { ok: false, conflictos: e.conflictos, message: e.message };
    throw e;
  }
}

async function iniciarClase(id, req) {
  const clase = await ClaseProgramadaCea.findById(id);
  if (!clase) return { error: 'Clase no encontrada', status: 404 };
  if (clase.estado === 'FINALIZADO') return { error: 'La clase ya está finalizada', status: 409 };
  if (clase.estado === 'CANCELADA') return { error: 'La clase está cancelada', status: 409 };
  if (clase.estado === 'EN PROCESO' && clase.horaInicio) {
    return { doc: await dtoClase(clase) };
  }
  if (!clase.idEmpleadoInstructor) return { error: 'La clase no tiene instructor asignado', status: 400 };

  clase.horaInicio = new Date();
  clase.horaFin = null;
  clase.duracionSegundos = null;
  clase.estado = 'EN PROCESO';
  clase.userChangeRecord = req.user?.username || 'sistema';
  await clase.save();
  return { doc: await dtoClase(clase) };
}

async function finalizarClase(id, req) {
  const clase = await ClaseProgramadaCea.findById(id);
  if (!clase) return { error: 'Clase no encontrada', status: 404 };
  if (clase.estado === 'FINALIZADO') return { doc: await dtoClase(clase) };
  if (clase.estado !== 'EN PROCESO' || !clase.horaInicio) {
    return { error: 'Inicie la clase antes de finalizarla', status: 409 };
  }

  clase.horaFin = new Date();
  clase.duracionSegundos = Math.max(0, Math.round((clase.horaFin - clase.horaInicio) / 1000));
  clase.estado = 'FINALIZADO';
  clase.userChangeRecord = req.user?.username || 'sistema';
  await clase.save();

  await InscripcionClaseCea.updateMany(
    { idClase: clase._id, estado: 'INSCRITO' },
    { $set: { estado: 'ASISTIO' } },
  );

  return { doc: await dtoClase(clase) };
}

function tipoHorasDesdeClase(tipoClase) {
  if (tipoClase === 'teoria') return 'teoria';
  if (tipoClase === 'taller') return 'taller';
  return 'practica';
}

async function elegirOrigenInscripcion(numDoc, idProg, tipoHoras, origenPreferido) {
  const rastreo = await rastreoAlumno(numDoc);
  const filas = (rastreo.filas || []).filter((f) => f.tipoHoras === tipoHoras && f.pendientes > 0);
  if (!filas.length) return null;

  if (origenPreferido) {
    const f = filas.find((x) => x.origenHoras === origenPreferido);
    if (f) return f;
  }
  if (tipoHoras === 'practica') {
    const mat = filas.find((x) => x.origenHoras === 'matricula');
    if (mat) return mat;
    return filas.find((x) => x.origenHoras === 'hora_practica_extra') || filas[0];
  }
  return filas.find((x) => x.origenHoras === 'matricula') || filas[0];
}

async function inscribirAlumno(idClase, body, req) {
  const clase = await ClaseProgramadaCea.findById(idClase);
  if (!clase) return { error: 'Clase no encontrada', status: 404 };
  if (clase.estado === 'FINALIZADO' || clase.estado === 'CANCELADA') {
    return { error: 'No se puede inscribir en esta clase', status: 409 };
  }

  const numDoc = Number(body.numDoc);
  if (!Number.isFinite(numDoc)) return { error: 'numDoc inválido', status: 400 };

  const existe = await InscripcionClaseCea.findOne({ idClase: clase._id, numDoc });
  if (existe) return { error: 'El alumno ya está inscrito en esta clase', status: 409 };

  const inscritos = await InscripcionClaseCea.countDocuments({ idClase: clase._id });
  if (clase.cupoMaximo != null && inscritos >= clase.cupoMaximo) {
    return { error: 'Cupo de la clase completo', status: 409 };
  }

  const tipoHoras = tipoHorasDesdeClase(clase.tipoClase);
  const origenPreferido = body.origenHoras || null;
  const fila = await elegirOrigenInscripcion(numDoc, clase.idProg, tipoHoras, origenPreferido);
  if (!fila) {
    return { error: 'El alumno no tiene horas pendientes de programación para este tipo de clase', status: 400 };
  }

  const horasAsignadas = horasClase(clase);
  if (fila.pendientes < horasAsignadas) {
    return {
      error: `Horas pendientes insuficientes (${fila.pendientes} h pendientes, la clase requiere ${horasAsignadas} h)`,
      status: 400,
    };
  }

  const alumno = await DatosAlumno.findOne({ numDoc }).lean();
  if (!alumno) return { error: 'Alumno no encontrado', status: 404 };

  const ins = await InscripcionClaseCea.create({
    idClase: clase._id,
    numDoc,
    idMat: fila.idMat || null,
    idLiq: fila.idLiq || null,
    idServ: fila.idServ,
    idProg: clase.idProg,
    origenHoras: fila.origenHoras,
    tipoHoras,
    horasAsignadas,
    estado: 'INSCRITO',
    userAddReg: req.user?.username || 'sistema',
  });

  await ClaseProgramadaCea.updateOne({ _id: clase._id }, { $set: { inscritos: inscritos + 1 } });

  return {
    inscripcion: ins.toObject(),
    alumnoNombre: [alumno.apellido1, alumno.apellido2, alumno.nombre1, alumno.nombre2].filter(Boolean).join(' '),
    clase: await dtoClase(clase),
  };
}

async function listarInscripciones(idClase) {
  const rows = await InscripcionClaseCea.find({ idClase }).sort({ createdAt: 1 }).lean();
  const out = [];
  for (const r of rows) {
    const alumno = await DatosAlumno.findOne({ numDoc: r.numDoc }).lean();
    out.push({
      ...r,
      alumnoNombre: alumno
        ? [alumno.apellido1, alumno.apellido2, alumno.nombre1, alumno.nombre2].filter(Boolean).join(' ')
        : String(r.numDoc),
    });
  }
  return out;
}

async function quitarInscripcion(idClase, numDoc, req) {
  const clase = await ClaseProgramadaCea.findById(idClase);
  if (!clase) return { error: 'Clase no encontrada', status: 404 };
  if (clase.estado === 'FINALIZADO') return { error: 'No se puede modificar inscripciones de clase finalizada', status: 409 };
  if (clase.estado === 'EN PROCESO') return { error: 'No se puede quitar inscripciones con la clase en curso', status: 409 };

  const n = Number(numDoc);
  const ins = await InscripcionClaseCea.findOneAndDelete({ idClase, numDoc: n });
  if (!ins) return { error: 'Inscripción no encontrada', status: 404 };

  const inscritos = await InscripcionClaseCea.countDocuments({ idClase });
  await ClaseProgramadaCea.updateOne({ _id: idClase }, { $set: { inscritos } });
  return { ok: true, clase: await dtoClase(clase) };
}

async function alumnosElegibles(idClase, q = '') {
  const clase = await ClaseProgramadaCea.findById(idClase).lean();
  if (!clase) return null;
  const tipoHoras = tipoHorasDesdeClase(clase.tipoClase);
  const ya = new Set(
    (await InscripcionClaseCea.find({ idClase }).select('numDoc').lean()).map((i) => i.numDoc),
  );

  const mats = await require('../models/Matricula').find({ idProg: clase.idProg, estado: { $ne: 'anulada' } }).lean();
  const candidatos = new Set(mats.map((m) => m.numDoc));

  const liqs = await require('../models/Liquidacion').find({ idProg: clase.idProg }).lean();
  for (const l of liqs) if (l.numDoc != null) candidatos.add(l.numDoc);

  const out = [];
  for (const numDoc of candidatos) {
    if (ya.has(numDoc)) continue;
    const fila = await elegirOrigenInscripcion(numDoc, clase.idProg, tipoHoras);
    if (!fila || fila.pendientes <= 0) continue;
    const alumno = await DatosAlumno.findOne({ numDoc }).lean();
    const nombre = alumno
      ? [alumno.apellido1, alumno.apellido2, alumno.nombre1, alumno.nombre2].filter(Boolean).join(' ')
      : String(numDoc);
    if (q && !nombre.toLowerCase().includes(q.toLowerCase()) && !String(numDoc).includes(q)) continue;
    out.push({
      numDoc,
      alumnoNombre: nombre,
      pendientes: fila.pendientes,
      origenHoras: fila.origenHoras,
      servicioLabel: fila.servicioLabel,
    });
  }
  return out.sort((a, b) => a.alumnoNombre.localeCompare(b.alumnoNombre, 'es'));
}

async function recursosProgramacion() {
  const aulas = await cat.aulas.find({}).limit(500).lean();
  const talleres = await cat.talleres.find({}).limit(500).lean();
  const vehiculos = await Vehiculo.find({ estado: { $ne: 'Baja' } }).select('placa nombreMarca nombreLinea modelo estado').lean();
  const instructores = await listarInstructoresConUsuario();
  return {
    aulas: aulas.map((a) => ({ id: String(a.idAula ?? a._id), nombre: a.nombre || a.descrAula || a.idAula })),
    talleres: talleres.map((t) => ({ id: String(t.idTaller ?? t._id), nombre: t.nombre || t.ubicacion || t.idTaller })),
    vehiculos: vehiculos.map((v) => ({
      id: v.placa,
      placa: v.placa,
      label: [v.placa, v.nombreMarca, v.modelo].filter(Boolean).join(' · '),
      estado: v.estado,
    })),
    instructores,
  };
}

module.exports = {
  listarClases,
  obtenerClase,
  crearClase,
  actualizarClase,
  cancelarClase,
  verificarConflictos,
  iniciarClase,
  finalizarClase,
  listarInscripciones,
  inscribirAlumno,
  quitarInscripcion,
  alumnosElegibles,
  recursosProgramacion,
  listarInstructoresConUsuario,
};
