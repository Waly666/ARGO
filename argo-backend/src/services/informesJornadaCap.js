const XLSX = require('xlsx');
const mongoose = require('mongoose');
const Contratacion = require('../models/Contratacion');
const JornadaCap = require('../models/JornadaCap');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const AsisClasJorCap = require('../models/AsisClasJorCap');
const InscripcionClase = require('../models/InscripcionClase');
const Certificado = require('../models/Certificado');
const DatosAlumno = require('../models/DatosAlumno');
const { parseFechaCalendario } = require('../utils/fechaCalendario');
const { buscarPrograma } = require('./programaServicio');
const { mapaNombresCarpas, normalizarIdCarpa } = require('./carpaJornada');

function oid(v) {
  if (!v) return null;
  if (v instanceof mongoose.Types.ObjectId) return v;
  try {
    return new mongoose.Types.ObjectId(String(v));
  } catch {
    return null;
  }
}

function nombreAlumno(a) {
  if (!a) return '';
  return [a.nombre1, a.nombre2, a.apellido1, a.apellido2].filter(Boolean).join(' ').trim();
}

function ymd(d) {
  if (!d) return '';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  return x.toISOString().slice(0, 10);
}

function hhmm(d) {
  if (!d) return '';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
}

function filtrosQuery(query = {}) {
  const idContrato = query.idContrato ? oid(query.idContrato) : null;
  const idJornada = query.idJornada ? oid(query.idJornada) : null;
  const idClase = query.idClase ? oid(query.idClase) : null;
  const desde = query.desde ? parseFechaCalendario(query.desde) : null;
  let hasta = query.hasta ? parseFechaCalendario(query.hasta) : null;
  if (hasta) {
    hasta = new Date(hasta);
    hasta.setHours(23, 59, 59, 999);
  }
  return { idContrato, idJornada, idClase, desde, hasta };
}

async function cargarContextoInformes(query = {}) {
  const { idContrato, idJornada, idClase, desde, hasta } = filtrosQuery(query);

  const qJor = {};
  if (idJornada) {
    qJor._id = idJornada;
  } else {
    if (idContrato) qJor.idContrato = idContrato;
    if (desde || hasta) {
      qJor.fechaProgramacion = {};
      if (desde) qJor.fechaProgramacion.$gte = desde;
      if (hasta) qJor.fechaProgramacion.$lte = hasta;
    }
  }

  let jornadas = await JornadaCap.find(qJor).sort({ fechaProgramacion: 1 }).lean();
  if (idContrato && idJornada) {
    jornadas = jornadas.filter((j) => String(j.idContrato) === String(idContrato));
  }
  const jornadaIds = jornadas.map((j) => j._id);
  const contratoIds = [...new Set(jornadas.map((j) => String(j.idContrato)).filter(Boolean))];

  const qClase = {};
  if (idClase) {
    qClase._id = idClase;
  } else if (jornadaIds.length) {
    qClase.idJornada = { $in: jornadaIds };
  } else {
    qClase._id = { $in: [] };
  }

  const [contratos, clasesRaw] = await Promise.all([
    contratoIds.length
      ? Contratacion.find({ _id: { $in: contratoIds.map(oid).filter(Boolean) } })
          .select(
            'codContrato nombreComercial razoSocial numeroAlumnos numSesCert numeObjeJornada estado numerojornadas tipoCertificado fechaInicJornadas fechaFinJornadas objetoContrato supervisor',
          )
          .lean()
      : [],
    jornadaIds.length || idClase
      ? ClaseJornadaCap.find(qClase).sort({ fechaClase: 1 }).lean()
      : [],
  ]);

  let clases = clasesRaw;
  if (idClase && jornadaIds.length) {
    clases = clasesRaw.filter((c) => jornadaIds.some((jid) => String(c.idJornada) === String(jid)));
  } else if (idClase && !jornadaIds.length) {
    // Clase suelta: cargar su jornada
    const jid = clasesRaw[0]?.idJornada;
    if (jid) {
      const jExtra = await JornadaCap.findById(jid).lean();
      if (jExtra) {
        jornadas.push(jExtra);
        jornadaIds.push(jExtra._id);
        if (jExtra.idContrato && !contratoIds.includes(String(jExtra.idContrato))) {
          contratoIds.push(String(jExtra.idContrato));
          const cExtra = await Contratacion.findById(jExtra.idContrato)
            .select(
              'codContrato nombreComercial razoSocial numeroAlumnos numSesCert numeObjeJornada estado numerojornadas tipoCertificado fechaInicJornadas fechaFinJornadas objetoContrato supervisor',
            )
            .lean();
          if (cExtra) contratos.push(cExtra);
        }
      }
    }
  }

  const claseIds = clases.map((c) => c._id);
  const qCert = {
    generadoAutoJornada: true,
    estado: { $ne: 'anulado' },
  };
  if (idJornada) {
    qCert.idJornada = idJornada;
  } else if (contratoIds.length) {
    qCert.idContrato = { $in: contratoIds.map(oid).filter(Boolean) };
  } else {
    qCert._id = { $in: [] };
  }

  const [inscs, asis, certsRaw] = await Promise.all([
    claseIds.length
      ? InscripcionClase.find({ idClase: { $in: claseIds } }).lean()
      : [],
    claseIds.length
      ? AsisClasJorCap.find({ idclaseJornada: { $in: claseIds } }).lean()
      : [],
    Certificado.find(qCert).sort({ fechaEmision: -1 }).lean(),
  ]);

  let certs = certsRaw;
  if (idContrato) {
    certs = certs.filter((c) => String(c.idContrato) === String(idContrato));
  }
  if (idJornada) {
    certs = certs.filter((c) => !c.idJornada || String(c.idJornada) === String(idJornada));
  }

  const numDocs = new Set();
  for (const i of inscs) if (i.numDoc != null) numDocs.add(Number(i.numDoc));
  for (const a of asis) if (a.numDocAlumno != null) numDocs.add(Number(a.numDocAlumno));
  for (const c of certs) if (c.numDoc != null) numDocs.add(Number(c.numDoc));

  const alumnos = numDocs.size
    ? await DatosAlumno.find({ numDoc: { $in: [...numDocs] } }).lean()
    : [];

  const progIds = [...new Set(clases.map((c) => String(c.idPrograma || '').trim()).filter(Boolean))];
  const progMap = new Map();
  for (const pid of progIds) {
    const p = await buscarPrograma(pid);
    progMap.set(pid, (p?.nombreProg || p?.nomCert || pid || '').trim());
  }

  const carpaIds = clases.map((c) => normalizarIdCarpa(c.idCarpa)).filter((x) => x != null);
  const carpaNombres = await mapaNombresCarpas(carpaIds);

  const empIds = [
    ...new Set(clases.map((c) => c.idEmpleadoInstructor).filter((x) => x != null)),
  ];
  let instructorByEmp = new Map();
  if (empIds.length) {
    const Empleado = require('../models/Empleado');
    const { nombreEmpleado } = require('./instructorJornada');
    const empleados = await Empleado.find({ idEmpleado: { $in: empIds } }).lean();
    instructorByEmp = new Map(empleados.map((e) => [e.idEmpleado, nombreEmpleado(e)]));
  }
  for (const cl of clases) {
    cl.instructorNombre =
      (cl.idEmpleadoInstructor != null ? instructorByEmp.get(cl.idEmpleadoInstructor) : '') ||
      cl.idinstructor ||
      '';
  }

  return {
    jornadas,
    contratos,
    clases,
    inscs,
    asis,
    certs,
    alumnos,
    progMap,
    carpaNombres,
  };
}

function mapsDesdeContexto(ctx) {
  const jorById = new Map(ctx.jornadas.map((j) => [String(j._id), j]));
  const contrById = new Map(ctx.contratos.map((c) => [String(c._id), c]));
  const claseById = new Map(ctx.clases.map((c) => [String(c._id), c]));
  const alByDoc = new Map(ctx.alumnos.map((a) => [Number(a.numDoc), a]));

  const inscByClaseDoc = new Map();
  for (const i of ctx.inscs) {
    inscByClaseDoc.set(`${i.idClase}|${Number(i.numDoc)}`, i);
  }
  const asisByClaseDoc = new Map();
  for (const a of ctx.asis) {
    asisByClaseDoc.set(`${a.idclaseJornada}|${Number(a.numDocAlumno)}`, a);
  }

  const certByContratoDoc = new Map();
  const certByClaseDoc = new Map();
  for (const c of ctx.certs) {
    const nd = Number(c.numDoc);
    if (c.idClaseJornada) {
      certByClaseDoc.set(`${String(c.idClaseJornada)}|${nd}`, c);
    }
    const key = `${c.idContrato}|${nd}`;
    if (!certByContratoDoc.has(key)) certByContratoDoc.set(key, c);
  }

  return {
    jorById,
    contrById,
    claseById,
    alByDoc,
    inscByClaseDoc,
    asisByClaseDoc,
    certByContratoDoc,
    certByClaseDoc,
  };
}

function filaBaseAlumno(al, numDoc) {
  return {
    numDoc: numDoc ?? al?.numDoc ?? '',
    nombreAlumno: nombreAlumno(al),
    nombre1: al?.nombre1 || '',
    nombre2: al?.nombre2 || '',
    apellido1: al?.apellido1 || '',
    apellido2: al?.apellido2 || '',
    telefono: al?.telefono || al?.celular || '',
    email: al?.email || '',
    empresaNombre: al?.empresaNombre || '',
  };
}

function construirFilasPorClase(ctx) {
  const m = mapsDesdeContexto(ctx);
  const keys = new Set([...m.inscByClaseDoc.keys(), ...m.asisByClaseDoc.keys()]);
  const filas = [];

  for (const key of keys) {
    const [idClase, numDocStr] = key.split('|');
    const numDoc = Number(numDocStr);
    const clase = m.claseById.get(String(idClase));
    if (!clase) continue;
    const jornada = m.jorById.get(String(clase.idJornada));
    if (!jornada) continue;
    const contrato = m.contrById.get(String(jornada.idContrato));
    const al = m.alByDoc.get(numDoc);
    const insc = m.inscByClaseDoc.get(key);
    const asis = m.asisByClaseDoc.get(key);
    const cert =
      m.certByClaseDoc.get(`${String(clase._id)}|${numDoc}`) ||
      m.certByContratoDoc.get(`${jornada.idContrato}|${numDoc}`);
    const idCarpa = normalizarIdCarpa(clase.idCarpa);
    const progId = String(clase.idPrograma || '').trim();

    filas.push({
      ...filaBaseAlumno(al, numDoc),
      codContrato: contrato?.codContrato || '',
      contratoLabel: contrato
        ? `${contrato.codContrato || ''} — ${contrato.nombreComercial || contrato.razoSocial || ''}`.trim()
        : '',
      idContrato: String(jornada.idContrato || ''),
      idJornada: String(jornada._id),
      idJornadaCorto: String(jornada._id).slice(-6).toUpperCase(),
      fechaJornada: ymd(jornada.fechaProgramacion),
      municipio: jornada.municipio || '',
      direccion: jornada.direccion || '',
      estadoJornada: jornada.estado || '',
      metaAlumnosJornada: jornada.numeObjeJornada ?? '',
      idClase: String(clase._id),
      idClaseCorto: String(clase._id).slice(-6).toUpperCase(),
      programa: ctx.progMap.get(progId) || progId || '',
      ubicacion: clase.ubicacion || '',
      carpa: idCarpa != null ? ctx.carpaNombres.get(idCarpa) || `Carpa ${idCarpa}` : '',
      estadoClase: clase.estado || '',
      instructor: clase.instructorNombre || clase.idinstructor || '',
      horaInicio: hhmm(clase.horaInicio),
      horaFin: hhmm(clase.horaFin),
      inscrito: !!insc,
      asistio: !!asis,
      fechaInscripcion: ymd(insc?.createdAt),
      fechaAsistencia: ymd(asis?.createdAt),
      certificadoCodigo: cert?.codigoCert || '',
      certificadoFecha: ymd(cert?.fechaEmision),
      certificadoEstado: cert?.estado || '',
    });
  }

  filas.sort((a, b) => {
    const fa = `${a.fechaJornada}|${a.codContrato}|${a.idClase}|${a.numDoc}`;
    const fb = `${b.fechaJornada}|${b.codContrato}|${b.idClase}|${b.numDoc}`;
    return fa.localeCompare(fb);
  });
  return filas;
}

function etiquetaContrato(contrato) {
  if (!contrato) return '';
  return `${contrato.codContrato || ''} — ${contrato.nombreComercial || contrato.razoSocial || ''}`.trim();
}

function agregarDesdeFilasClase(filasClase, groupKeyFn, opts = {}) {
  const { omitJornadaCols = false } = opts;
  const map = new Map();
  for (const f of filasClase) {
    const key = groupKeyFn(f);
    let g = map.get(key);
    if (!g) {
      g = {
        ...f,
        clasesAsistidas: 0,
        clasesInscrito: 0,
        programas: new Set(),
        carpas: new Set(),
        fechasJornada: new Set(),
        municipios: new Set(),
        instructores: new Set(),
        detalleClases: [],
      };
      map.set(key, g);
    }
    if (f.asistio) g.clasesAsistidas += 1;
    if (f.inscrito) g.clasesInscrito += 1;
    if (f.programa) g.programas.add(f.programa);
    if (f.carpa) g.carpas.add(f.carpa);
    if (f.fechaJornada) g.fechasJornada.add(f.fechaJornada);
    if (f.municipio) g.municipios.add(f.municipio);
    if (f.instructor) g.instructores.add(f.instructor);
    if (f.inscrito || f.asistio) {
      g.detalleClases.push({
        idClaseCorto: f.idClaseCorto,
        programa: f.programa,
        instructor: f.instructor,
        inscrito: f.inscrito,
        asistio: f.asistio,
        certificadoCodigo: f.certificadoCodigo,
      });
    }
    if (f.certificadoCodigo && !g.certificadoCodigo) {
      g.certificadoCodigo = f.certificadoCodigo;
      g.certificadoFecha = f.certificadoFecha;
      g.certificadoEstado = f.certificadoEstado;
    }
  }
  return [...map.values()].map((g) => {
    const fechas = [...g.fechasJornada].sort();
    const base = {
      numDoc: g.numDoc,
      nombreAlumno: g.nombreAlumno,
      nombre1: g.nombre1,
      nombre2: g.nombre2,
      apellido1: g.apellido1,
      apellido2: g.apellido2,
      telefono: g.telefono,
      email: g.email,
      empresaNombre: g.empresaNombre,
      codContrato: g.codContrato,
      contratoLabel: g.contratoLabel,
      idContrato: g.idContrato,
      fechasJornada: fechas.join('; '),
      numJornadas: fechas.length,
      municipios: [...g.municipios].join('; '),
      instructores: [...g.instructores].join('; '),
      detalleClases: g.detalleClases
        .map((d) => {
          const prog = d.programa || '—';
          const inst = d.instructor ? ` · ${d.instructor}` : '';
          const est = d.asistio ? 'asistió' : d.inscrito ? 'inscrito' : '—';
          const cert = d.certificadoCodigo ? ` · cert. ${d.certificadoCodigo}` : '';
          return `${prog}${inst}: ${est}${cert}`;
        })
        .join(' | '),
      clasesAsistidas: g.clasesAsistidas,
      clasesInscrito: g.clasesInscrito,
      programas: [...g.programas].join('; '),
      carpas: [...g.carpas].join('; '),
      certificadoCodigo: g.certificadoCodigo || '',
      certificadoFecha: g.certificadoFecha || '',
      certificadoEstado: g.certificadoEstado || '',
      certificado: g.certificadoCodigo ? 'Sí' : 'No',
    };
    if (!omitJornadaCols) {
      Object.assign(base, {
        idJornada: g.idJornada,
        idJornadaCorto: g.idJornadaCorto,
        fechaJornada: g.fechaJornada,
        municipio: g.municipio,
        direccion: g.direccion,
        estadoJornada: g.estadoJornada,
        metaAlumnosJornada: g.metaAlumnosJornada,
      });
    }
    return base;
  });
}

function construirFilasPorJornada(filasClase) {
  return agregarDesdeFilasClase(filasClase, (f) => `${f.idJornada}|${f.numDoc}`);
}

function construirFilasTrazabilidad(filasClase) {
  return construirFilasPorJornada(filasClase);
}

function construirFilasPorContrato(filasClase) {
  return agregarDesdeFilasClase(filasClase, (f) => `${f.idContrato}|${f.numDoc}`, {
    omitJornadaCols: true,
  });
}

function construirResumenContratos(ctx, filasClase) {
  const m = mapsDesdeContexto(ctx);
  const byContrato = new Map();

  for (const contrato of ctx.contratos) {
    const id = String(contrato._id);
    byContrato.set(id, {
      codContrato: contrato.codContrato || '',
      contratoLabel: etiquetaContrato(contrato),
      idContrato: id,
      cliente: contrato.nombreComercial || contrato.razoSocial || '',
      estadoContrato: contrato.estado || '',
      tipoCertificado: contrato.tipoCertificado || '',
      metaAlumnosContrato: contrato.numeroAlumnos ?? '',
      sesionesCertificar: contrato.numSesCert ?? '',
      jornadasPlanificadas: contrato.numerojornadas ?? '',
      fechaInicio: ymd(contrato.fechaInicJornadas),
      fechaFin: ymd(contrato.fechaFinJornadas),
      supervisor: contrato.supervisor || '',
      jornadasRegistradas: 0,
      clasesProgramadas: 0,
      alumnosUnicos: new Set(),
      alumnosAsistieron: new Set(),
      municipios: new Set(),
      instructores: new Set(),
      primeraJornada: '',
      ultimaJornada: '',
      certificadosEmitidos: 0,
    });
  }

  const fechasPorContrato = new Map();
  for (const j of ctx.jornadas) {
    const cid = String(j.idContrato);
    const g = byContrato.get(cid);
    if (!g) continue;
    g.jornadasRegistradas += 1;
    if (j.municipio) g.municipios.add(j.municipio);
    const f = ymd(j.fechaProgramacion);
    if (f) {
      if (!fechasPorContrato.has(cid)) fechasPorContrato.set(cid, []);
      fechasPorContrato.get(cid).push(f);
    }
  }
  for (const [cid, fechas] of fechasPorContrato) {
    const g = byContrato.get(cid);
    if (!g || !fechas.length) continue;
    fechas.sort();
    g.primeraJornada = fechas[0];
    g.ultimaJornada = fechas[fechas.length - 1];
  }

  for (const cl of ctx.clases) {
    const jornada = m.jorById.get(String(cl.idJornada));
    if (!jornada) continue;
    const g = byContrato.get(String(jornada.idContrato));
    if (!g) continue;
    g.clasesProgramadas += 1;
    if (cl.instructorNombre) g.instructores.add(cl.instructorNombre);
  }

  for (const f of filasClase) {
    const g = byContrato.get(String(f.idContrato));
    if (!g) continue;
    g.alumnosUnicos.add(f.numDoc);
    if (f.asistio) g.alumnosAsistieron.add(f.numDoc);
    if (f.instructor) g.instructores.add(f.instructor);
    if (f.municipio) g.municipios.add(f.municipio);
  }

  for (const c of ctx.certs) {
    const g = byContrato.get(String(c.idContrato));
    if (g) g.certificadosEmitidos += 1;
  }

  return [...byContrato.values()]
    .map((g) => ({
      codContrato: g.codContrato,
      contratoLabel: g.contratoLabel,
      idContrato: g.idContrato,
      cliente: g.cliente,
      estadoContrato: g.estadoContrato,
      tipoCertificado: g.tipoCertificado,
      metaAlumnosContrato: g.metaAlumnosContrato,
      sesionesCertificar: g.sesionesCertificar,
      jornadasPlanificadas: g.jornadasPlanificadas,
      jornadasRegistradas: g.jornadasRegistradas,
      clasesProgramadas: g.clasesProgramadas,
      fechaInicio: g.fechaInicio,
      fechaFin: g.fechaFin,
      primeraJornada: g.primeraJornada,
      ultimaJornada: g.ultimaJornada,
      alumnosUnicos: g.alumnosUnicos.size,
      alumnosAsistieron: g.alumnosAsistieron.size,
      certificadosEmitidos: g.certificadosEmitidos,
      municipios: [...g.municipios].join('; '),
      instructores: [...g.instructores].join('; '),
      supervisor: g.supervisor,
    }))
    .sort((a, b) => String(a.codContrato).localeCompare(String(b.codContrato)));
}

function construirCatalogoJornadas(ctx, filasClase) {
  const m = mapsDesdeContexto(ctx);
  const map = new Map();

  for (const j of ctx.jornadas) {
    const contrato = m.contrById.get(String(j.idContrato));
    map.set(String(j._id), {
      codContrato: contrato?.codContrato || '',
      contratoLabel: etiquetaContrato(contrato),
      idContrato: String(j.idContrato || ''),
      idJornada: String(j._id),
      idJornadaCorto: String(j._id).slice(-6).toUpperCase(),
      fechaJornada: ymd(j.fechaProgramacion),
      municipio: j.municipio || '',
      direccion: j.direccion || '',
      estadoJornada: j.estado || '',
      metaAlumnos: j.numeObjeJornada ?? '',
      numClases: 0,
      clasesFinalizadas: 0,
      alumnosInscritos: new Set(),
      alumnosAsistieron: new Set(),
      instructores: new Set(),
      programas: new Set(),
      certificadosEmitidos: 0,
    });
  }

  for (const cl of ctx.clases) {
    const g = map.get(String(cl.idJornada));
    if (!g) continue;
    g.numClases += 1;
    if (String(cl.estado || '').toUpperCase() === 'FINALIZADO') g.clasesFinalizadas += 1;
    if (cl.instructorNombre) g.instructores.add(cl.instructorNombre);
    const progId = String(cl.idPrograma || '').trim();
    if (progId) g.programas.add(ctx.progMap.get(progId) || progId);
  }

  for (const f of filasClase) {
    const g = map.get(String(f.idJornada));
    if (!g) continue;
    if (f.inscrito) g.alumnosInscritos.add(f.numDoc);
    if (f.asistio) g.alumnosAsistieron.add(f.numDoc);
  }

  for (const c of ctx.certs) {
    if (!c.idJornada) continue;
    const g = map.get(String(c.idJornada));
    if (g) g.certificadosEmitidos += 1;
  }

  return [...map.values()]
    .map((g) => ({
      codContrato: g.codContrato,
      contratoLabel: g.contratoLabel,
      idContrato: g.idContrato,
      idJornada: g.idJornada,
      idJornadaCorto: g.idJornadaCorto,
      fechaJornada: g.fechaJornada,
      municipio: g.municipio,
      direccion: g.direccion,
      estadoJornada: g.estadoJornada,
      metaAlumnos: g.metaAlumnos,
      numClases: g.numClases,
      clasesFinalizadas: g.clasesFinalizadas,
      alumnosInscritos: g.alumnosInscritos.size,
      alumnosAsistieron: g.alumnosAsistieron.size,
      instructores: [...g.instructores].join('; '),
      programas: [...g.programas].join('; '),
      certificadosEmitidos: g.certificadosEmitidos,
    }))
    .sort((a, b) => `${a.fechaJornada}|${a.codContrato}`.localeCompare(`${b.fechaJornada}|${b.codContrato}`));
}

function construirCatalogoClases(ctx, filasClase) {
  const m = mapsDesdeContexto(ctx);
  const map = new Map();

  for (const cl of ctx.clases) {
    const jornada = m.jorById.get(String(cl.idJornada));
    const contrato = jornada ? m.contrById.get(String(jornada.idContrato)) : null;
    const progId = String(cl.idPrograma || '').trim();
    const idCarpa = normalizarIdCarpa(cl.idCarpa);
    map.set(String(cl._id), {
      codContrato: contrato?.codContrato || '',
      contratoLabel: etiquetaContrato(contrato),
      idContrato: String(jornada?.idContrato || ''),
      idJornada: String(jornada?._id || ''),
      idJornadaCorto: jornada ? String(jornada._id).slice(-6).toUpperCase() : '',
      fechaJornada: jornada ? ymd(jornada.fechaProgramacion) : '',
      municipio: jornada?.municipio || '',
      estadoJornada: jornada?.estado || '',
      idClase: String(cl._id),
      idClaseCorto: String(cl._id).slice(-6).toUpperCase(),
      indiceClaseEnJornada: cl.indiceClaseEnJornada ?? '',
      programa: ctx.progMap.get(progId) || progId || '',
      carpa: idCarpa != null ? ctx.carpaNombres.get(idCarpa) || `Carpa ${idCarpa}` : '',
      ubicacion: cl.ubicacion || '',
      estadoClase: cl.estado || '',
      instructor: cl.instructorNombre || cl.idinstructor || '',
      horaInicio: hhmm(cl.horaInicio),
      horaFin: hhmm(cl.horaFin),
      alumnosInscritos: new Set(),
      alumnosAsistieron: new Set(),
      certificadosEmitidos: 0,
    });
  }

  for (const f of filasClase) {
    const g = map.get(String(f.idClase));
    if (!g) continue;
    if (f.inscrito) g.alumnosInscritos.add(f.numDoc);
    if (f.asistio) g.alumnosAsistieron.add(f.numDoc);
  }

  for (const c of ctx.certs) {
    if (!c.idClaseJornada) continue;
    const g = map.get(String(c.idClaseJornada));
    if (g) g.certificadosEmitidos += 1;
  }

  return [...map.values()]
    .map((g) => ({
      codContrato: g.codContrato,
      contratoLabel: g.contratoLabel,
      idContrato: g.idContrato,
      idJornada: g.idJornada,
      idJornadaCorto: g.idJornadaCorto,
      fechaJornada: g.fechaJornada,
      municipio: g.municipio,
      estadoJornada: g.estadoJornada,
      idClase: g.idClase,
      idClaseCorto: g.idClaseCorto,
      indiceClaseEnJornada: g.indiceClaseEnJornada,
      programa: g.programa,
      carpa: g.carpa,
      ubicacion: g.ubicacion,
      estadoClase: g.estadoClase,
      instructor: g.instructor,
      horaInicio: g.horaInicio,
      horaFin: g.horaFin,
      alumnosInscritos: g.alumnosInscritos.size,
      alumnosAsistieron: g.alumnosAsistieron.size,
      certificadosEmitidos: g.certificadosEmitidos,
    }))
    .sort((a, b) =>
      `${a.fechaJornada}|${a.codContrato}|${a.indiceClaseEnJornada}|${a.idClase}`.localeCompare(
        `${b.fechaJornada}|${b.codContrato}|${b.indiceClaseEnJornada}|${b.idClase}`,
      ),
    );
}

function construirResumenAlumnos(filasClase) {
  return construirFilasPorContrato(filasClase);
}

function construirFilasInstructores(filasClase) {
  const map = new Map();
  for (const f of filasClase) {
    const instructor = String(f.instructor || '').trim();
    if (!instructor) continue;
    const key = `${instructor}|${f.idClase}`;
    let g = map.get(key);
    if (!g) {
      g = {
        instructor,
        codContrato: f.codContrato,
        contratoLabel: f.contratoLabel,
        idContrato: f.idContrato,
        idJornada: f.idJornada,
        idJornadaCorto: f.idJornadaCorto,
        fechaJornada: f.fechaJornada,
        municipio: f.municipio,
        idClase: f.idClase,
        idClaseCorto: f.idClaseCorto,
        programa: f.programa,
        carpa: f.carpa,
        estadoClase: f.estadoClase,
        horaInicio: f.horaInicio,
        horaFin: f.horaFin,
        alumnosInscritos: new Set(),
        alumnosAsistieron: new Set(),
      };
      map.set(key, g);
    }
    if (f.inscrito) g.alumnosInscritos.add(f.numDoc);
    if (f.asistio) g.alumnosAsistieron.add(f.numDoc);
  }
  return [...map.values()]
    .map((g) => ({
      instructor: g.instructor,
      codContrato: g.codContrato,
      contratoLabel: g.contratoLabel,
      idContrato: g.idContrato,
      idJornadaCorto: g.idJornadaCorto,
      fechaJornada: g.fechaJornada,
      municipio: g.municipio,
      idClaseCorto: g.idClaseCorto,
      programa: g.programa,
      carpa: g.carpa,
      estadoClase: g.estadoClase,
      horaInicio: g.horaInicio,
      horaFin: g.horaFin,
      alumnosInscritos: g.alumnosInscritos.size,
      alumnosAsistieron: g.alumnosAsistieron.size,
    }))
    .sort((a, b) =>
      `${a.fechaJornada}|${a.codContrato}|${a.instructor}`.localeCompare(
        `${b.fechaJornada}|${b.codContrato}|${b.instructor}`,
      ),
    );
}

function construirFilasCertificados(ctx) {
  const m = mapsDesdeContexto(ctx);
  const filas = [];
  for (const cert of ctx.certs) {
    const al = m.alByDoc.get(Number(cert.numDoc));
    const contrato = m.contrById.get(String(cert.idContrato));
    const jornada = cert.idJornada ? m.jorById.get(String(cert.idJornada)) : null;
    filas.push({
      ...filaBaseAlumno(al, cert.numDoc),
      empresaNombre: cert.empresaNombre || al?.empresaNombre || '',
      codigoCert: cert.codigoCert || '',
      fechaEmision: ymd(cert.fechaEmision || cert.createdAt),
      estado: cert.estado || '',
      encabezado: cert.encabezado || '',
      codContrato: contrato?.codContrato || '',
      contratoLabel: contrato
        ? `${contrato.codContrato || ''} — ${contrato.nombreComercial || contrato.razoSocial || ''}`.trim()
        : '',
      idContrato: String(cert.idContrato || ''),
      idJornada: cert.idJornada ? String(cert.idJornada) : '',
      idJornadaCorto: cert.idJornada ? String(cert.idJornada).slice(-6).toUpperCase() : '',
      fechaJornada: jornada ? ymd(jornada.fechaProgramacion) : '',
      municipio: jornada?.municipio || '',
      direccion: jornada?.direccion || '',
    });
  }
  return filas;
}

function resumenDesdeFilas(filasClase, filasCert, extras = {}) {
  const alumnosUnicos = new Set(filasClase.map((f) => f.numDoc));
  const asistencias = filasClase.filter((f) => f.asistio).length;
  const inscritos = filasClase.filter((f) => f.inscrito).length;
  return {
    totalFilasClase: filasClase.length,
    alumnosUnicos: alumnosUnicos.size,
    registrosAsistencia: asistencias,
    registrosInscripcion: inscritos,
    certificados: filasCert.length,
    contratos: extras.contratos ?? 0,
    jornadas: extras.jornadas ?? 0,
    instructores: extras.instructores ?? 0,
  };
}

async function generarInformesJornada(query = {}) {
  const ctx = await cargarContextoInformes(query);
  const porClase = construirFilasPorClase(ctx);
  const trazabilidad = construirFilasTrazabilidad(porClase);
  const resumenContratos = construirResumenContratos(ctx, porClase);
  const catalogoJornadas = construirCatalogoJornadas(ctx, porClase);
  const catalogoClases = construirCatalogoClases(ctx, porClase);
  const alumnos = construirResumenAlumnos(porClase);
  const instructores = construirFilasInstructores(porClase);
  const certificados = construirFilasCertificados(ctx);
  const instructoresUnicos = new Set(instructores.map((i) => i.instructor).filter(Boolean));
  return {
    filtros: {
      idContrato: query.idContrato || null,
      idJornada: query.idJornada || null,
      idClase: query.idClase || null,
      desde: query.desde || null,
      hasta: query.hasta || null,
    },
    resumen: resumenDesdeFilas(porClase, certificados, {
      contratos: resumenContratos.length,
      jornadas: catalogoJornadas.length,
      instructores: instructoresUnicos.size,
    }),
    porClase,
    trazabilidad,
    resumenContratos,
    catalogoJornadas,
    catalogoClases,
    alumnos,
    instructores,
    certificados,
  };
}

const HOJAS = {
  porClase: {
    nombre: 'Por clase',
    columnas: [
      ['codContrato', 'Contrato'],
      ['contratoLabel', 'Contrato (detalle)'],
      ['fechaJornada', 'Fecha jornada'],
      ['idJornadaCorto', 'ID jornada'],
      ['municipio', 'Municipio'],
      ['direccion', 'Dirección'],
      ['estadoJornada', 'Estado jornada'],
      ['metaAlumnosJornada', 'Meta alumnos jornada'],
      ['idClaseCorto', 'ID clase'],
      ['programa', 'Programa'],
      ['ubicacion', 'Ubicación'],
      ['carpa', 'Carpa'],
      ['estadoClase', 'Estado clase'],
      ['instructor', 'Instructor'],
      ['horaInicio', 'Hora inicio'],
      ['horaFin', 'Hora fin'],
      ['numDoc', 'Documento'],
      ['nombreAlumno', 'Nombre completo'],
      ['nombre1', 'Nombre 1'],
      ['nombre2', 'Nombre 2'],
      ['apellido1', 'Apellido 1'],
      ['apellido2', 'Apellido 2'],
      ['telefono', 'Teléfono'],
      ['email', 'Email'],
      ['empresaNombre', 'Empresa'],
      ['inscrito', 'Inscrito'],
      ['asistio', 'Asistió'],
      ['fechaInscripcion', 'Fecha inscripción'],
      ['fechaAsistencia', 'Fecha asistencia'],
      ['certificadoCodigo', 'Código certificado'],
      ['certificadoFecha', 'Fecha certificado'],
      ['certificadoEstado', 'Estado certificado'],
    ],
  },
  porJornada: {
    nombre: 'Por jornada',
    columnas: [
      ['codContrato', 'Contrato'],
      ['contratoLabel', 'Contrato (detalle)'],
      ['fechaJornada', 'Fecha jornada'],
      ['idJornadaCorto', 'ID jornada'],
      ['municipio', 'Municipio'],
      ['direccion', 'Dirección'],
      ['estadoJornada', 'Estado jornada'],
      ['metaAlumnosJornada', 'Meta alumnos'],
      ['numDoc', 'Documento'],
      ['nombreAlumno', 'Nombre completo'],
      ['telefono', 'Teléfono'],
      ['email', 'Email'],
      ['empresaNombre', 'Empresa'],
      ['clasesInscrito', 'Clases inscrito'],
      ['clasesAsistidas', 'Clases asistidas'],
      ['instructores', 'Instructores'],
      ['programas', 'Programas'],
      ['carpas', 'Carpas'],
      ['detalleClases', 'Detalle clases'],
      ['certificado', 'Certificado'],
      ['certificadoCodigo', 'Código certificado'],
      ['certificadoFecha', 'Fecha certificado'],
    ],
  },
  trazabilidad: {
    nombre: 'Trazabilidad',
    columnas: [
      ['codContrato', 'Contrato'],
      ['contratoLabel', 'Contrato (detalle)'],
      ['fechaJornada', 'Fecha jornada'],
      ['idJornadaCorto', 'ID jornada'],
      ['municipio', 'Municipio'],
      ['numDoc', 'Documento'],
      ['nombreAlumno', 'Alumno'],
      ['empresaNombre', 'Empresa'],
      ['clasesInscrito', 'Clases inscrito'],
      ['clasesAsistidas', 'Clases asistidas'],
      ['instructores', 'Instructores'],
      ['programas', 'Programas'],
      ['detalleClases', 'Detalle por clase'],
      ['certificado', 'Certificado'],
      ['certificadoCodigo', 'Código certificado'],
    ],
  },
  porContrato: {
    nombre: 'Por contrato',
    columnas: [
      ['codContrato', 'Contrato'],
      ['contratoLabel', 'Contrato (detalle)'],
      ['numDoc', 'Documento'],
      ['nombreAlumno', 'Nombre completo'],
      ['telefono', 'Teléfono'],
      ['email', 'Email'],
      ['empresaNombre', 'Empresa'],
      ['numJornadas', 'Jornadas'],
      ['fechasJornada', 'Fechas jornadas'],
      ['municipios', 'Municipios'],
      ['instructores', 'Instructores'],
      ['clasesInscrito', 'Clases inscrito'],
      ['clasesAsistidas', 'Clases asistidas'],
      ['programas', 'Programas'],
      ['carpas', 'Carpas'],
      ['detalleClases', 'Detalle clases'],
      ['certificado', 'Certificado'],
      ['certificadoCodigo', 'Código certificado'],
      ['certificadoFecha', 'Fecha certificado'],
    ],
  },
  resumenContratos: {
    nombre: 'Contratos',
    columnas: [
      ['codContrato', 'Contrato'],
      ['contratoLabel', 'Contrato (detalle)'],
      ['cliente', 'Cliente'],
      ['estadoContrato', 'Estado'],
      ['tipoCertificado', 'Tipo certificación'],
      ['metaAlumnosContrato', 'Meta alumnos'],
      ['sesionesCertificar', 'Sesiones cert.'],
      ['jornadasPlanificadas', 'Jornadas planificadas'],
      ['jornadasRegistradas', 'Jornadas registradas'],
      ['clasesProgramadas', 'Clases programadas'],
      ['fechaInicio', 'Inicio contrato'],
      ['fechaFin', 'Fin contrato'],
      ['primeraJornada', 'Primera jornada'],
      ['ultimaJornada', 'Última jornada'],
      ['alumnosUnicos', 'Alumnos únicos'],
      ['alumnosAsistieron', 'Alumnos asistieron'],
      ['certificadosEmitidos', 'Certificados'],
      ['municipios', 'Municipios'],
      ['instructores', 'Instructores'],
      ['supervisor', 'Supervisor'],
    ],
  },
  catalogoJornadas: {
    nombre: 'Jornadas',
    columnas: [
      ['codContrato', 'Contrato'],
      ['contratoLabel', 'Contrato (detalle)'],
      ['idJornadaCorto', 'ID jornada'],
      ['fechaJornada', 'Fecha jornada'],
      ['municipio', 'Municipio'],
      ['direccion', 'Dirección'],
      ['estadoJornada', 'Estado'],
      ['metaAlumnos', 'Meta alumnos'],
      ['numClases', 'Clases'],
      ['clasesFinalizadas', 'Clases finalizadas'],
      ['alumnosInscritos', 'Alumnos inscritos'],
      ['alumnosAsistieron', 'Alumnos asistieron'],
      ['instructores', 'Instructores'],
      ['programas', 'Programas'],
      ['certificadosEmitidos', 'Certificados'],
    ],
  },
  catalogoClases: {
    nombre: 'Clases',
    columnas: [
      ['codContrato', 'Contrato'],
      ['fechaJornada', 'Fecha jornada'],
      ['idJornadaCorto', 'ID jornada'],
      ['municipio', 'Municipio'],
      ['idClaseCorto', 'ID clase'],
      ['indiceClaseEnJornada', 'Nº clase'],
      ['programa', 'Programa'],
      ['carpa', 'Carpa'],
      ['ubicacion', 'Ubicación'],
      ['estadoClase', 'Estado'],
      ['instructor', 'Instructor'],
      ['horaInicio', 'Hora inicio'],
      ['horaFin', 'Hora fin'],
      ['alumnosInscritos', 'Inscritos'],
      ['alumnosAsistieron', 'Asistieron'],
      ['certificadosEmitidos', 'Certificados'],
    ],
  },
  alumnos: {
    nombre: 'Alumnos',
    columnas: [
      ['codContrato', 'Contrato'],
      ['numDoc', 'Documento'],
      ['nombreAlumno', 'Nombre completo'],
      ['telefono', 'Teléfono'],
      ['email', 'Email'],
      ['empresaNombre', 'Empresa'],
      ['numJornadas', 'Jornadas'],
      ['fechasJornada', 'Fechas jornadas'],
      ['municipios', 'Municipios'],
      ['clasesInscrito', 'Clases inscrito'],
      ['clasesAsistidas', 'Clases asistidas'],
      ['programas', 'Programas'],
      ['instructores', 'Instructores'],
      ['certificado', 'Certificado'],
      ['certificadoCodigo', 'Código certificado'],
      ['certificadoFecha', 'Fecha certificado'],
    ],
  },
  instructores: {
    nombre: 'Instructores',
    columnas: [
      ['instructor', 'Instructor'],
      ['codContrato', 'Contrato'],
      ['fechaJornada', 'Fecha jornada'],
      ['municipio', 'Municipio'],
      ['idClaseCorto', 'ID clase'],
      ['programa', 'Programa'],
      ['carpa', 'Carpa'],
      ['estadoClase', 'Estado clase'],
      ['horaInicio', 'Hora inicio'],
      ['horaFin', 'Hora fin'],
      ['alumnosInscritos', 'Alumnos inscritos'],
      ['alumnosAsistieron', 'Alumnos asistieron'],
    ],
  },
  certificados: {
    nombre: 'Certificados',
    columnas: [
      ['codigoCert', 'Código'],
      ['encabezado', 'Encabezado'],
      ['fechaEmision', 'Fecha emisión'],
      ['estado', 'Estado'],
      ['numDoc', 'Documento'],
      ['nombreAlumno', 'Nombre completo'],
      ['telefono', 'Teléfono'],
      ['email', 'Email'],
      ['empresaNombre', 'Empresa'],
      ['codContrato', 'Contrato'],
      ['contratoLabel', 'Contrato (detalle)'],
      ['idJornadaCorto', 'ID jornada'],
      ['fechaJornada', 'Fecha jornada'],
      ['municipio', 'Municipio'],
      ['direccion', 'Dirección'],
    ],
  },
};

function hojaDesdeFilas(filas, def) {
  const headers = def.columnas.map(([, et]) => et);
  const rows = filas.map((f) =>
    def.columnas.map(([clave]) => {
      const v = f[clave];
      if (typeof v === 'boolean') return v ? 'Sí' : 'No';
      return v == null ? '' : v;
    }),
  );
  return XLSX.utils.aoa_to_sheet([headers, ...rows]);
}

async function exportarInformesJornadaExcel(query = {}, tipo = 'completo') {
  const data = await generarInformesJornada(query);
  const wb = XLSX.utils.book_new();
  const fecha = new Date().toISOString().slice(0, 10);
  const t = String(tipo || 'completo').toLowerCase();

  const append = (key, filas) => {
    const def = HOJAS[key];
    const ws = hojaDesdeFilas(filas, def);
    XLSX.utils.book_append_sheet(wb, ws, def.nombre.slice(0, 31));
  };

  if (t === 'resumen-contratos' || t === 'contratos' || t === 'completo') {
    append('resumenContratos', data.resumenContratos);
  }
  if (t === 'trazabilidad' || t === 'completo') append('trazabilidad', data.trazabilidad);
  if (t === 'catalogo-jornadas' || t === 'jornadas' || t === 'completo') {
    append('catalogoJornadas', data.catalogoJornadas);
  }
  if (t === 'catalogo-clases' || t === 'clases' || t === 'completo') {
    append('catalogoClases', data.catalogoClases);
  }
  if (t === 'alumnos' || t === 'completo') append('alumnos', data.alumnos);
  if (t === 'instructores' || t === 'completo') append('instructores', data.instructores);
  if (t === 'certificados' || t === 'completo') append('certificados', data.certificados);

  if (!wb.SheetNames.length) {
    append('resumenContratos', data.resumenContratos);
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const sufijo = t === 'completo' ? 'completo' : t;
  return {
    buffer,
    nombre: `informes-jornadas-${sufijo}-${fecha}.xlsx`,
  };
}

module.exports = {
  generarInformesJornada,
  exportarInformesJornadaExcel,
};
