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
          .select('codContrato nombreComercial razoSocial numeroAlumnos numSesCert numeObjeJornada estado')
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
            .select('codContrato nombreComercial razoSocial numeroAlumnos numSesCert numeObjeJornada estado')
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
  for (const c of ctx.certs) {
    const key = `${c.idContrato}|${Number(c.numDoc)}`;
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
    const cert = m.certByContratoDoc.get(`${jornada.idContrato}|${numDoc}`);
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

function agregarDesdeFilasClase(filasClase, groupKeyFn) {
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
      };
      map.set(key, g);
    }
    if (f.asistio) g.clasesAsistidas += 1;
    if (f.inscrito) g.clasesInscrito += 1;
    if (f.programa) g.programas.add(f.programa);
    if (f.carpa) g.carpas.add(f.carpa);
    if (f.certificadoCodigo && !g.certificadoCodigo) {
      g.certificadoCodigo = f.certificadoCodigo;
      g.certificadoFecha = f.certificadoFecha;
      g.certificadoEstado = f.certificadoEstado;
    }
  }
  return [...map.values()].map((g) => ({
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
    idJornada: g.idJornada,
    idJornadaCorto: g.idJornadaCorto,
    fechaJornada: g.fechaJornada,
    municipio: g.municipio,
    direccion: g.direccion,
    estadoJornada: g.estadoJornada,
    metaAlumnosJornada: g.metaAlumnosJornada,
    clasesAsistidas: g.clasesAsistidas,
    clasesInscrito: g.clasesInscrito,
    programas: [...g.programas].join('; '),
    carpas: [...g.carpas].join('; '),
    certificadoCodigo: g.certificadoCodigo || '',
    certificadoFecha: g.certificadoFecha || '',
    certificadoEstado: g.certificadoEstado || '',
    certificado: g.certificadoCodigo ? 'Sí' : 'No',
  }));
}

function construirFilasPorJornada(filasClase) {
  return agregarDesdeFilasClase(filasClase, (f) => `${f.idJornada}|${f.numDoc}`);
}

function construirFilasPorContrato(filasClase) {
  const rows = agregarDesdeFilasClase(filasClase, (f) => `${f.idContrato}|${f.numDoc}`);
  return rows.map((r) => {
    const { idJornada, idJornadaCorto, fechaJornada, municipio, direccion, estadoJornada, metaAlumnosJornada, ...rest } =
      r;
    return rest;
  });
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

function resumenDesdeFilas(filasClase, filasCert) {
  const alumnosUnicos = new Set(filasClase.map((f) => f.numDoc));
  const asistencias = filasClase.filter((f) => f.asistio).length;
  const inscritos = filasClase.filter((f) => f.inscrito).length;
  return {
    totalFilasClase: filasClase.length,
    alumnosUnicos: alumnosUnicos.size,
    registrosAsistencia: asistencias,
    registrosInscripcion: inscritos,
    certificados: filasCert.length,
  };
}

async function generarInformesJornada(query = {}) {
  const ctx = await cargarContextoInformes(query);
  const porClase = construirFilasPorClase(ctx);
  const porJornada = construirFilasPorJornada(porClase);
  const porContrato = construirFilasPorContrato(porClase);
  const certificados = construirFilasCertificados(ctx);
  return {
    filtros: {
      idContrato: query.idContrato || null,
      idJornada: query.idJornada || null,
      idClase: query.idClase || null,
      desde: query.desde || null,
      hasta: query.hasta || null,
    },
    resumen: resumenDesdeFilas(porClase, certificados),
    porClase,
    porJornada,
    porContrato,
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
      ['programas', 'Programas'],
      ['carpas', 'Carpas'],
      ['certificado', 'Certificado'],
      ['certificadoCodigo', 'Código certificado'],
      ['certificadoFecha', 'Fecha certificado'],
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
      ['clasesInscrito', 'Clases inscrito'],
      ['clasesAsistidas', 'Clases asistidas'],
      ['programas', 'Programas'],
      ['carpas', 'Carpas'],
      ['certificado', 'Certificado'],
      ['certificadoCodigo', 'Código certificado'],
      ['certificadoFecha', 'Fecha certificado'],
    ],
  },
  certificados: {
    nombre: 'Certificados',
    columnas: [
      ['codigoCert', 'Código'],
      ['fechaEmision', 'Fecha emisión'],
      ['estado', 'Estado'],
      ['encabezado', 'Encabezado'],
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

  if (t === 'por-clase' || t === 'completo') append('porClase', data.porClase);
  if (t === 'por-jornada' || t === 'completo') append('porJornada', data.porJornada);
  if (t === 'por-contrato' || t === 'completo') append('porContrato', data.porContrato);
  if (t === 'certificados' || t === 'completo') append('certificados', data.certificados);

  if (!wb.SheetNames.length) {
    append('porClase', data.porClase);
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
