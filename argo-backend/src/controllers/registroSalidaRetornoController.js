const mongoose = require('mongoose');
// Registro de salida y retorno: evidencia del desplazamiento, aparte de la inspección.
const Registro = require('../models/RegistroSalidaRetornoVehiculo');
const { ESTADOS_SALIDA, MOTIVOS_SALIDA } = Registro;
const Vehiculo = require('../models/Vehiculo');
const Empleado = require('../models/Empleado');
const InspeccionVehiculo = require('../models/InspeccionVehiculo');
const ClaseProgramadaCea = require('../models/ClaseProgramadaCea');
const InscripcionClaseCea = require('../models/InscripcionClaseCea');
const DatosAlumno = require('../models/DatosAlumno');

function nombrePersona(p) {
  if (!p) return '';
  return [p.nombre1, p.nombre2, p.apellido1, p.apellido2].filter(Boolean).join(' ').trim();
}

function oid(value) {
  const s = String(value || '').trim();
  return mongoose.Types.ObjectId.isValid(s) ? s : null;
}

function numero(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function fecha(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diaBogota(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function resultadoInspeccion(doc) {
  if (!doc) return '';
  const apto = doc.aptoLaborar;
  if (apto === true || apto === 'si' || apto === 'SI' || apto === 'Sí') return 'Apto';
  if (apto === false || apto === 'no' || apto === 'NO') return 'No apto';
  return apto ? String(apto) : 'Registrada';
}

function etiquetaClase(clase) {
  if (!clase) return '';
  const hora = [clase.horaDesde, clase.horaHasta].filter(Boolean).join('–');
  return ['Clase práctica', diaBogota(clase.fechaClase), hora].filter(Boolean).join(' · ');
}

async function siguienteNumero() {
  const ultimo = await Registro.findOne().sort({ numeroSecuencia: -1 }).select('numeroSecuencia').lean();
  return (ultimo?.numeroSecuencia || 0) + 1;
}

async function alumnosDeClase(claseId) {
  if (!claseId) return [];
  const inscripciones = await InscripcionClaseCea.find({ idClase: claseId })
    .select('numDoc estado')
    .lean();
  const docs = [...new Set(inscripciones.map((i) => i.numDoc).filter((n) => n != null))];
  if (!docs.length) return [];
  const alumnos = await DatosAlumno.find({ numDoc: { $in: docs } })
    .select('numDoc nombre1 nombre2 apellido1 apellido2')
    .lean();
  const porDoc = new Map(alumnos.map((a) => [a.numDoc, a]));
  return inscripciones.map((i) => ({
    numDoc: i.numDoc,
    nombre: nombrePersona(porDoc.get(i.numDoc)) || String(i.numDoc),
    estado: i.estado,
  }));
}

async function armarRegistro(body, previo) {
  const placa = String(body.placa || previo?.placa || '').trim().toUpperCase();
  const vehiculo = await Vehiculo.findOne({ placa }).select('_id placa').lean();
  if (!vehiculo) {
    const err = new Error('Seleccione un vehículo del inventario.');
    err.status = 400;
    throw err;
  }

  const idEmpleado = Number(body.idEmpleadoConductor || previo?.idEmpleadoConductor);
  const conductor = await Empleado.findOne({ idEmpleado }).select('idEmpleado nombre1 nombre2 apellido1 apellido2 conduce').lean();
  if (!conductor || conductor.conduce !== true) {
    const err = new Error('El responsable debe ser un empleado marcado como conductor.');
    err.status = 400;
    throw err;
  }

  const motivo = MOTIVOS_SALIDA.includes(body.motivo) ? body.motivo : previo?.motivo;
  if (!motivo) {
    const err = new Error('Indique el motivo del desplazamiento.');
    err.status = 400;
    throw err;
  }

  let claseId = body.claseId === '' ? null : oid(body.claseId) || previo?.claseId || null;
  let claseResumen = '';
  let alumnoNumDoc = body.alumnoNumDoc === '' ? null : numero(body.alumnoNumDoc);
  let alumnoNombre = '';
  if (motivo === 'clase') {
    if (!claseId) {
      const err = new Error('Si el motivo es una clase, enlace la clase práctica existente.');
      err.status = 400;
      throw err;
    }
    const clase = await ClaseProgramadaCea.findById(claseId).lean();
    if (!clase || clase.tipoClase !== 'practica') {
      const err = new Error('La clase enlazada no existe o no es práctica.');
      err.status = 400;
      throw err;
    }
    if (String(clase.idVehiculo || '').toUpperCase() !== vehiculo.placa) {
      const err = new Error('La clase no corresponde al vehículo seleccionado.');
      err.status = 400;
      throw err;
    }
    claseResumen = etiquetaClase(clase);
    const alumnos = await alumnosDeClase(claseId);
    const elegido = alumnos.find((a) => a.numDoc === alumnoNumDoc) || (alumnos.length === 1 ? alumnos[0] : null);
    if (alumnos.length && !elegido) {
      const err = new Error('Seleccione el alumno inscrito en la clase.');
      err.status = 400;
      throw err;
    }
    alumnoNumDoc = elegido?.numDoc ?? null;
    alumnoNombre = elegido?.nombre || '';
  } else {
    claseId = null;
    alumnoNumDoc = null;
  }

  const fechaHoraSalida = body.fechaHoraSalida !== undefined ? fecha(body.fechaHoraSalida) : previo?.fechaHoraSalida || null;
  const fechaHoraRegreso = body.fechaHoraRegreso !== undefined ? fecha(body.fechaHoraRegreso) : previo?.fechaHoraRegreso || null;
  const kilometrajeInicial = body.kilometrajeInicial !== undefined ? numero(body.kilometrajeInicial) : previo?.kilometrajeInicial ?? null;
  const kilometrajeFinal = body.kilometrajeFinal !== undefined ? numero(body.kilometrajeFinal) : previo?.kilometrajeFinal ?? null;
  if (kilometrajeInicial != null && kilometrajeInicial < 0) {
    const err = new Error('El kilometraje inicial no puede ser negativo.');
    err.status = 400;
    throw err;
  }
  if (kilometrajeFinal != null && kilometrajeInicial != null && kilometrajeFinal < kilometrajeInicial) {
    const err = new Error('El kilometraje final no puede ser menor que el inicial.');
    err.status = 400;
    throw err;
  }
  if (fechaHoraRegreso && fechaHoraSalida && fechaHoraRegreso < fechaHoraSalida) {
    const err = new Error('La hora de regreso no puede ser anterior a la salida.');
    err.status = 400;
    throw err;
  }

  let inspeccionId = body.inspeccionId === '' ? null : oid(body.inspeccionId);
  if (body.inspeccionId === undefined) inspeccionId = previo?.inspeccionId || null;
  let inspeccionResultado = '';
  if (inspeccionId) {
    const inspeccion = await InspeccionVehiculo.findById(inspeccionId).lean();
    if (!inspeccion || String(inspeccion.placa || '').toUpperCase() !== vehiculo.placa) {
      const err = new Error('La inspección no corresponde a este vehículo.');
      err.status = 400;
      throw err;
    }
    inspeccionResultado = resultadoInspeccion(inspeccion);
  }

  const estado = ESTADOS_SALIDA.includes(body.estado) ? body.estado : previo?.estado || 'programado';
  if ((estado === 'en_curso' || estado === 'finalizado') && !fechaHoraSalida) {
    const err = new Error('Para dejar el desplazamiento en curso o finalizado registre la fecha y hora de salida.');
    err.status = 400;
    throw err;
  }
  if (estado === 'finalizado' && !fechaHoraRegreso) {
    const err = new Error('Para finalizar registre la fecha y hora de regreso.');
    err.status = 400;
    throw err;
  }

  const kilometrosRecorridos =
    kilometrajeInicial != null && kilometrajeFinal != null ? kilometrajeFinal - kilometrajeInicial : null;

  return {
    vehiculoId: vehiculo._id,
    placa: vehiculo.placa,
    idEmpleadoConductor: conductor.idEmpleado,
    nombreConductor: nombrePersona(conductor),
    motivo,
    claseId,
    claseResumen,
    alumnoNumDoc,
    alumnoNombre,
    origen: String(body.origen ?? previo?.origen ?? '').trim(),
    destino: String(body.destino ?? previo?.destino ?? '').trim(),
    fechaHoraSalida,
    kilometrajeInicial,
    inspeccionId,
    inspeccionResultado,
    fechaHoraRegreso,
    kilometrajeFinal,
    kilometrosRecorridos,
    observaciones: String(body.observaciones ?? previo?.observaciones ?? '').trim(),
    incidente: String(body.incidente ?? previo?.incidente ?? '').trim(),
    estado,
  };
}

async function apoyos(req, res, next) {
  try {
    const placa = String(req.query.placa || '').trim().toUpperCase();
    const fechaDia = String(req.query.fecha || diaBogota()).trim();
    const claseId = oid(req.query.claseId);

    const [vehiculos, conductores] = await Promise.all([
      Vehiculo.find({ estado: { $in: ['Libre', 'Ocupado'] } })
        .select('placa nombreMarca modelo claseVehiculo')
        .sort({ placa: 1 })
        .lean(),
      Empleado.find({ conduce: true })
        .select('idEmpleado nombre1 nombre2 apellido1 apellido2')
        .sort({ apellido1: 1, nombre1: 1 })
        .lean(),
    ]);

    let clases = [];
    let inspecciones = [];
    if (placa && fechaDia) {
      const inicio = new Date(`${fechaDia}T00:00:00-05:00`);
      const fin = new Date(`${fechaDia}T23:59:59.999-05:00`);
      clases = await ClaseProgramadaCea.find({
        tipoClase: 'practica',
        idVehiculo: placa,
        fechaClase: { $gte: inicio, $lte: fin },
        estado: { $ne: 'CANCELADA' },
      })
        .select('fechaClase horaDesde horaHasta estado idEmpleadoInstructor')
        .sort({ horaDesde: 1 })
        .lean();
      inspecciones = await InspeccionVehiculo.find({ placa, fecha: fechaDia })
        .select('fecha hora aptoLaborar consecutivo')
        .lean();
    }

    const alumnos = claseId ? await alumnosDeClase(claseId) : [];
    res.json({
      vehiculos: vehiculos.map((v) => ({
        id: String(v._id),
        placa: v.placa,
        label: [v.placa, v.nombreMarca, v.modelo].filter(Boolean).join(' · '),
      })),
      conductores: conductores.map((c) => ({
        idEmpleado: c.idEmpleado,
        nombre: nombrePersona(c),
      })),
      clases: clases.map((c) => ({
        id: String(c._id),
        resumen: etiquetaClase(c),
        estado: c.estado,
      })),
      inspecciones: inspecciones.map((i) => ({
        id: String(i._id),
        label: [i.consecutivo, i.fecha, i.hora, resultadoInspeccion(i)].filter(Boolean).join(' · '),
        resultado: resultadoInspeccion(i),
      })),
      alumnos,
    });
  } catch (e) {
    next(e);
  }
}

async function listar(req, res, next) {
  try {
    const filtro = {};
    if (ESTADOS_SALIDA.includes(req.query.estado)) filtro.estado = req.query.estado;
    if (req.query.placa) filtro.placa = String(req.query.placa).trim().toUpperCase();
    const desde = fecha(req.query.desde);
    const hasta = fecha(req.query.hasta);
    if (desde || hasta) {
      filtro.fechaHoraSalida = {};
      if (desde) filtro.fechaHoraSalida.$gte = desde;
      if (hasta) filtro.fechaHoraSalida.$lte = hasta;
    }
    const items = await Registro.find(filtro).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

async function crear(req, res, next) {
  try {
    const datos = await armarRegistro(req.body, null);
    const usuario = req.user?.username || '';
    let n = await siguienteNumero();
    let doc;
    for (let intento = 0; intento < 3; intento += 1) {
      try {
        doc = await Registro.create({
          ...datos,
          numeroSecuencia: n,
          numeroRegistro: `SR-${String(n).padStart(5, '0')}`,
          creadoPor: usuario,
          cerradoPor: datos.estado === 'finalizado' || datos.estado === 'cancelado' ? usuario : '',
          cerradoEn: datos.estado === 'finalizado' || datos.estado === 'cancelado' ? new Date() : null,
        });
        break;
      } catch (e) {
        if (e?.code === 11000) {
          n += 1;
          continue;
        }
        throw e;
      }
    }
    res.status(201).json({ item: doc });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
}

async function actualizar(req, res, next) {
  try {
    const previo = await Registro.findById(req.params.id);
    if (!previo) return res.status(404).json({ message: 'Registro no encontrado.' });
    const datos = await armarRegistro(req.body, previo.toObject());
    const usuario = req.user?.username || '';
    const cierra = datos.estado === 'finalizado' || datos.estado === 'cancelado';
    Object.assign(previo, datos);
    if (cierra && !previo.cerradoEn) {
      previo.cerradoPor = usuario;
      previo.cerradoEn = new Date();
    }
    if (!cierra) {
      previo.cerradoPor = '';
      previo.cerradoEn = null;
    }
    await previo.save();
    res.json({ item: previo });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
}

module.exports = { apoyos, listar, crear, actualizar };
