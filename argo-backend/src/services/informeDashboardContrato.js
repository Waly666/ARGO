const mongoose = require('mongoose');
const Contratacion = require('../models/Contratacion');
const JornadaCap = require('../models/JornadaCap');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const AsisClasJorCap = require('../models/AsisClasJorCap');
const Certificado = require('../models/Certificado');
const DatosAlumno = require('../models/DatosAlumno');
const { parseNumDoc } = require('../utils/numDoc');
const { enriquecerClases } = require('./instructorJornada');
const { obtenerConfigRecibo } = require('./configRecibo');
const { fmtFechaSolo } = require('../utils/timezoneColombia');
const { parseFechaCalendario } = require('../utils/fechaCalendario');
const { TIPO_CERTIFICADO_POR_CLASE } = require('../constants/jornadaCapacitacion');
const { caracterizarDesdeDocs } = require('./caracterizacionPoblacion');

function toObjectId(raw) {
  if (!raw) return null;
  try {
    return raw instanceof mongoose.Types.ObjectId ? raw : new mongoose.Types.ObjectId(String(raw));
  } catch {
    return null;
  }
}

function nombreAlumno(a) {
  if (!a) return '';
  return [a.nombre1, a.nombre2, a.apellido1, a.apellido2].filter(Boolean).join(' ').trim();
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtHoraInforme(valor) {
  if (!valor) return '—';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

function duracionClaseSegundos(clase) {
  const guardada = Number(clase?.duracionSegundos);
  if (Number.isFinite(guardada) && guardada >= 0) return guardada;
  if (!clase?.horaInicio || !clase?.horaFin) return null;
  const inicio = new Date(clase.horaInicio).getTime();
  const fin = new Date(clase.horaFin).getTime();
  if (!Number.isFinite(inicio) || !Number.isFinite(fin) || fin < inicio) return null;
  return Math.round((fin - inicio) / 1000);
}

function fmtDuracionInforme(segundos) {
  const total = Number(segundos);
  if (!Number.isFinite(total) || total < 0) return '—';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

function buildChartsJornada(clasesJ) {
  const clasesFinalizadas = clasesJ.filter((c) => String(c.estado).toUpperCase() === 'FINALIZADO').length;
  const clasesEnProceso = clasesJ.filter((c) => String(c.estado).toUpperCase() === 'EN PROCESO').length;
  const progMap = new Map();
  const instMap = new Map();
  const alumnosSet = new Set();
  const certSet = new Set();

  for (const c of clasesJ) {
    const progKey = c.idPrograma || c.programaNombre || '_sin_';
    if (!progMap.has(progKey)) {
      progMap.set(progKey, {
        label: c.programaNombre || c.idPrograma || 'Sin programa',
        alumnos: new Set(),
      });
    }

    const instKey =
      c.idEmpleadoInstructor != null && Number.isFinite(Number(c.idEmpleadoInstructor))
        ? String(c.idEmpleadoInstructor)
        : c.instructorNombre || '_sin_';
    if (!instMap.has(instKey)) {
      instMap.set(instKey, {
        label: c.instructorNombre || 'Sin instructor',
        value: 0,
      });
    }
    if (String(c.estado).toUpperCase() === 'FINALIZADO') {
      instMap.get(instKey).value += 1;
    }

    c.alumnos.forEach((a) => {
      alumnosSet.add(a.numDoc);
      progMap.get(progKey).alumnos.add(a.numDoc);
      if (a.certificado) certSet.add(a.numDoc);
    });
  }

  return {
    clasesPorEstado: [
      { label: 'Finalizadas', value: clasesFinalizadas },
      { label: 'En proceso', value: clasesEnProceso },
      {
        label: 'Programadas',
        value: Math.max(0, clasesJ.length - clasesFinalizadas - clasesEnProceso),
      },
    ],
    certificacionAlumnos: [
      { label: 'Certificados', value: certSet.size },
      { label: 'Pendientes', value: Math.max(0, alumnosSet.size - certSet.size) },
    ],
    alumnosPorPrograma: [...progMap.values()]
      .map((p) => ({ label: p.label, value: p.alumnos.size }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    clasesPorInstructor: [...instMap.values()]
      .map((i) => ({ label: i.label, value: i.value }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es')),
  };
}

/** Campos de origen + demografía para charts (contrato o por jornada). */
function chartsDesdeCaracterizacion(caract) {
  const c = caract || {};
  return {
    porEdad: c.porEdad || [],
    porGenero: c.porGenero || [],
    porEstadoCivil: c.porEstadoCivil || [],
    porEstrato: c.porEstrato || [],
    porRegimenSalud: c.porRegimenSalud || [],
    porNivelFormacion: c.porNivelFormacion || [],
    porOcupacion: c.porOcupacion || [],
    porDiscapacidad: c.porDiscapacidad || [],
    porMultiCulturalidad: c.porMultiCulturalidad || [],
    porOrigenJornada: c.porOrigenJornada || [],
    porTipoInstitucion: c.porTipoInstitucion || [],
    porColegio: c.porColegio || [],
    porGradoColegio: c.porGradoColegio || [],
    porEstamento: c.porEstamento || [],
    porCargoEstamento: c.porCargoEstamento || [],
    porDependenciaEstamento: c.porDependenciaEstamento || [],
    porEmpresa: c.porEmpresa || [],
  };
}

/**
 * Dashboard + detalle de capacitación de un contrato (para ficha Informes).
 * Filtros opcionales: idJornada, idClase, idPrograma, idInstructor (idEmpleado).
 */
async function obtenerDashboardInformeContrato(idContratoRaw, filtros = {}) {
  const idContrato = toObjectId(idContratoRaw);
  if (!idContrato) return null;

  const contrato = await Contratacion.findById(idContrato).lean();
  if (!contrato) return null;

  const idJornadaF = toObjectId(filtros.idJornada);
  const idClaseF = toObjectId(filtros.idClase);
  const idProgramaF = String(filtros.idPrograma || '').trim();
  const idInstructorF =
    filtros.idInstructor != null && String(filtros.idInstructor).trim() !== ''
      ? Number(filtros.idInstructor)
      : null;
  const desdeF = filtros.desde ? parseFechaCalendario(filtros.desde) : null;
  const hastaBase = filtros.hasta ? parseFechaCalendario(filtros.hasta) : null;
  const hastaExclusiva = hastaBase
    ? new Date(hastaBase.getTime() + 24 * 60 * 60 * 1000)
    : null;

  let jornadasQ = { idContrato };
  if (idJornadaF) jornadasQ._id = idJornadaF;
  if (desdeF || hastaExclusiva) {
    jornadasQ.fechaProgramacion = {};
    if (desdeF) jornadasQ.fechaProgramacion.$gte = desdeF;
    if (hastaExclusiva) jornadasQ.fechaProgramacion.$lt = hastaExclusiva;
  }
  let jornadas = await JornadaCap.find(jornadasQ)
    .sort({ fechaProgramacion: 1, indiceEnDia: 1, createdAt: 1 })
    .lean();

  let clasesQ = { idJornada: { $in: jornadas.map((j) => j._id) } };
  if (idClaseF) clasesQ._id = idClaseF;
  if (idProgramaF) clasesQ.idPrograma = idProgramaF;
  if (Number.isFinite(idInstructorF)) {
    clasesQ.$or = [
      { idEmpleadoInstructor: idInstructorF },
      { idEmpleadoInstructor: String(idInstructorF) },
    ];
  }

  let clases = jornadas.length
    ? await ClaseJornadaCap.find(clasesQ).sort({ fechaClase: 1, indiceClaseEnJornada: 1 }).lean()
    : [];

  if (idClaseF && clases.length) {
    const jIds = new Set(clases.map((c) => String(c.idJornada)));
    jornadas = jornadas.filter((j) => jIds.has(String(j._id)));
  }

  const claseIds = clases.map((c) => c._id);
  const enriched = claseIds.length ? await enriquecerClases(clases) : [];
  const claseById = new Map(enriched.map((c) => [String(c._id), c]));

  const asistencias = claseIds.length
    ? await AsisClasJorCap.find({ idclaseJornada: { $in: claseIds } }).lean()
    : [];

  const certQuery = {
    idContrato,
    estado: { $ne: 'anulado' },
    generadoAutoJornada: true,
  };
  if (idJornadaF) certQuery.idJornada = idJornadaF;
  if (idClaseF) certQuery.idClaseJornada = idClaseF;
  const certificados = await Certificado.find(certQuery)
    .select('numDoc idJornada idClaseJornada codigoCert fechaEmision')
    .lean();

  const numDocs = [
    ...new Set(
      [
        ...asistencias.map((a) => parseNumDoc(a.numDocAlumno)),
        ...certificados.map((c) => parseNumDoc(c.numDoc)),
      ].filter((n) => n != null),
    ),
  ];
  const alumnosDocs = numDocs.length
    ? await DatosAlumno.find({ numDoc: { $in: numDocs } }).lean()
    : [];
  const alumnoMap = new Map();
  for (const a of alumnosDocs) {
    const nd = parseNumDoc(a.numDoc);
    if (nd != null) alumnoMap.set(nd, a);
  }

  const asistPorClase = new Map();
  for (const a of asistencias) {
    const cid = String(a.idclaseJornada);
    if (!asistPorClase.has(cid)) asistPorClase.set(cid, []);
    const nd = parseNumDoc(a.numDocAlumno);
    if (nd == null) continue;
    asistPorClase.get(cid).push({
      numDoc: nd,
      nombreCompleto: nombreAlumno(alumnoMap.get(nd)) || `Doc. ${nd}`,
    });
  }

  const certPorClase = new Map();
  const certPorAlumno = new Map();
  for (const c of certificados) {
    const nd = parseNumDoc(c.numDoc);
    if (nd == null) continue;
    if (c.idClaseJornada) {
      const cid = String(c.idClaseJornada);
      if (!certPorClase.has(cid)) certPorClase.set(cid, new Set());
      certPorClase.get(cid).add(nd);
    }
    if (!certPorAlumno.has(nd)) certPorAlumno.set(nd, []);
    certPorAlumno.get(nd).push({
      codigoCert: c.codigoCert || '',
      idClaseJornada: c.idClaseJornada ? String(c.idClaseJornada) : null,
      fechaEmision: c.fechaEmision,
    });
  }

  const esPorClase = contrato.tipoCertificado === TIPO_CERTIFICADO_POR_CLASE;
  const jornadaById = new Map(jornadas.map((j) => [String(j._id), j]));
  const alumnosUnicos = new Set();
  const alumnosCertificados = new Set();

  const porClase = [];
  for (const cl of enriched) {
    const cid = String(cl._id);
    const alumnos = asistPorClase.get(cid) || [];
    alumnos.forEach((a) => alumnosUnicos.add(a.numDoc));
    const certDocs = certPorClase.get(cid) || new Set();
    certDocs.forEach((nd) => alumnosCertificados.add(nd));
    const alumnosConFlag = alumnos.map((a) => ({
      ...a,
      certificado: esPorClase
        ? certDocs.has(a.numDoc)
        : (certPorAlumno.get(a.numDoc) || []).some((x) => !x.idClaseJornada),
    }));
    if (!esPorClase) {
      alumnosConFlag.forEach((a) => {
        if ((certPorAlumno.get(a.numDoc) || []).some((x) => !x.idClaseJornada)) {
          a.certificado = true;
          alumnosCertificados.add(a.numDoc);
        }
      });
    }
    const jornadaClase = jornadaById.get(String(cl.idJornada));
    const duracionSegundos = duracionClaseSegundos(cl);
    porClase.push({
      _id: cid,
      idJornada: String(cl.idJornada),
      fechaClase: cl.fechaClase || cl.fechaJornada,
      fechaLabel: fmtFechaSolo(cl.fechaClase || cl.fechaJornada) || '—',
      indiceClaseEnJornada: cl.indiceClaseEnJornada || 1,
      estado: cl.estado || '',
      idPrograma: cl.idPrograma || '',
      programaNombre: cl.programaNombre || cl.idPrograma || 'Sin programa',
      idEmpleadoInstructor: cl.idEmpleadoInstructor ?? null,
      instructorNombre: cl.instructorNombre || cl.idinstructor || 'Sin instructor',
      jornadaNumero: jornadaClase?.indiceEnDia || 1,
      jornadaFecha: jornadaClase?.fechaProgramacion || cl.fechaClase || cl.fechaJornada,
      jornadaMunicipio: jornadaClase?.municipio || '',
      jornadaLabel: [
        `Jornada ${jornadaClase?.indiceEnDia || 1}`,
        fmtFechaSolo(jornadaClase?.fechaProgramacion || cl.fechaClase || cl.fechaJornada) || '—',
        jornadaClase?.municipio || '',
      ]
        .filter(Boolean)
        .join(' · '),
      horaInicio: cl.horaInicio || null,
      horaFin: cl.horaFin || null,
      horaInicioLabel: fmtHoraInforme(cl.horaInicio),
      horaFinLabel: fmtHoraInforme(cl.horaFin),
      duracionSegundos,
      duracionLabel: fmtDuracionInforme(duracionSegundos),
      alumnosInscritos: alumnosConFlag.length,
      alumnosCertificados: alumnosConFlag.filter((a) => a.certificado).length,
      alumnos: alumnosConFlag.sort((a, b) =>
        a.nombreCompleto.localeCompare(b.nombreCompleto, 'es', { sensitivity: 'base' }),
      ),
    });
  }

  const porJornada = await Promise.all(
    jornadas.map(async (j) => {
      const jid = String(j._id);
      const clasesJ = porClase.filter((c) => c.idJornada === jid);
      const alumnosSet = new Set();
      const certSet = new Set();
      const programasMap = new Map();
      for (const c of clasesJ) {
        programasMap.set(c.idPrograma || c.programaNombre, c.programaNombre || 'Sin programa');
        c.alumnos.forEach((a) => {
          alumnosSet.add(a.numDoc);
          if (a.certificado) certSet.add(a.numDoc);
        });
      }
      const docsJornada = [...alumnosSet].map((nd) => alumnoMap.get(nd)).filter(Boolean);
      const caracterizacionPoblacion = await caracterizarDesdeDocs(docsJornada);
      return {
        _id: jid,
        fechaProgramacion: j.fechaProgramacion,
        fechaLabel: fmtFechaSolo(j.fechaProgramacion) || '—',
        municipio: j.municipio || '',
        direccion: j.direccion || '',
        estado: j.estado || '',
        indiceEnDia: j.indiceEnDia || 1,
        numClases: clasesJ.length,
        clasesFinalizadas: clasesJ.filter((c) => String(c.estado).toUpperCase() === 'FINALIZADO')
          .length,
        alumnosCapacitados: alumnosSet.size,
        alumnosCertificados: certSet.size,
        numProgramas: programasMap.size,
        programas: [...programasMap.values()].sort((a, b) => a.localeCompare(b, 'es')),
        charts: {
          ...buildChartsJornada(clasesJ),
          ...chartsDesdeCaracterizacion(caracterizacionPoblacion),
        },
        caracterizacionPoblacion,
        clases: clasesJ,
      };
    }),
  );

  const progMap = new Map();
  for (const c of porClase) {
    const key = c.idPrograma || '_sin_';
    if (!progMap.has(key)) {
      progMap.set(key, {
        idPrograma: c.idPrograma || '',
        programaNombre: c.programaNombre,
        numClases: 0,
        clasesDictadas: 0,
        alumnos: new Set(),
        certificados: new Set(),
      });
    }
    const row = progMap.get(key);
    row.numClases += 1;
    if (String(c.estado).toUpperCase() === 'FINALIZADO') row.clasesDictadas += 1;
    c.alumnos.forEach((a) => {
      row.alumnos.add(a.numDoc);
      if (a.certificado) row.certificados.add(a.numDoc);
    });
  }
  const porPrograma = [...progMap.values()]
    .map((r) => ({
      idPrograma: r.idPrograma,
      programaNombre: r.programaNombre,
      numClases: r.numClases,
      clasesDictadas: r.clasesDictadas,
      alumnosCapacitados: r.alumnos.size,
      alumnosCertificados: r.certificados.size,
    }))
    .sort((a, b) => a.programaNombre.localeCompare(b.programaNombre, 'es'));

  const instMap = new Map();
  for (const c of porClase) {
    const key =
      c.idEmpleadoInstructor != null && Number.isFinite(Number(c.idEmpleadoInstructor))
        ? String(c.idEmpleadoInstructor)
        : c.instructorNombre || '_sin_';
    if (!instMap.has(key)) {
      instMap.set(key, {
        idEmpleadoInstructor: c.idEmpleadoInstructor,
        instructorNombre: c.instructorNombre,
        numClases: 0,
        clasesDictadas: 0,
        alumnos: new Set(),
        certificados: new Set(),
        duracionSegundos: 0,
      });
    }
    const row = instMap.get(key);
    row.numClases += 1;
    if (String(c.estado).toUpperCase() === 'FINALIZADO') row.clasesDictadas += 1;
    c.alumnos.forEach((a) => {
      row.alumnos.add(a.numDoc);
      if (a.certificado) row.certificados.add(a.numDoc);
    });
    if (Number.isFinite(Number(c.duracionSegundos))) {
      row.duracionSegundos += Number(c.duracionSegundos);
    }
  }
  const porInstructor = [...instMap.values()]
    .map((r) => ({
      idEmpleadoInstructor: r.idEmpleadoInstructor,
      instructorNombre: r.instructorNombre,
      numClases: r.numClases,
      clasesDictadas: r.clasesDictadas,
      alumnosCapacitados: r.alumnos.size,
      alumnosCertificados: r.certificados.size,
      duracionSegundos: r.duracionSegundos,
      duracionLabel: fmtDuracionInforme(r.duracionSegundos),
    }))
    .sort((a, b) => a.instructorNombre.localeCompare(b.instructorNombre, 'es'));

  const clasesDictadas = porClase.filter((c) => String(c.estado).toUpperCase() === 'FINALIZADO').length;
  const clasesEnProceso = porClase.filter((c) => String(c.estado).toUpperCase() === 'EN PROCESO').length;

  // Opciones de filtro (catálogo del contrato sin restringir por filtro actual)
  const todasJornadas = await JornadaCap.find({ idContrato })
    .select('fechaProgramacion municipio estado indiceEnDia')
    .sort({ fechaProgramacion: 1 })
    .lean();
  const todasClases = await ClaseJornadaCap.find({
    idJornada: { $in: await JornadaCap.find({ idContrato }).distinct('_id') },
  })
    .select('idJornada idPrograma idEmpleadoInstructor indiceClaseEnJornada fechaClase estado')
    .lean();
  const todasEnriched = todasClases.length ? await enriquecerClases(todasClases) : [];

  const opcionesPrograma = new Map();
  const opcionesInstructor = new Map();
  for (const c of todasEnriched) {
    if (c.idPrograma) {
      opcionesPrograma.set(String(c.idPrograma), c.programaNombre || c.idPrograma);
    }
    if (c.idEmpleadoInstructor != null) {
      opcionesInstructor.set(
        String(c.idEmpleadoInstructor),
        c.instructorNombre || c.idinstructor || `Instructor ${c.idEmpleadoInstructor}`,
      );
    }
  }

  const config = await obtenerConfigRecibo(contrato.idSede || null).catch(() => ({}));

  const docsCapacitados = [...alumnosUnicos]
    .map((nd) => alumnoMap.get(nd))
    .filter(Boolean);
  const caracterizacionPoblacion = await caracterizarDesdeDocs(docsCapacitados);

  return {
    contrato: {
      _id: String(contrato._id),
      codContrato: contrato.codContrato || '',
      cliente:
        contrato.nombreComercial ||
        contrato.razoSocial ||
        contrato.clienteNombre ||
        '',
      nit: contrato.numeroIdentificacion || contrato.clienteIdentificacion || '',
      ciudad: contrato.ciudad || '',
      objetoContrato: contrato.objetoContrato || contrato.objeto || '',
      estado: contrato.estado || '',
      tipoCertificado: contrato.tipoCertificado || 'global',
      numerojornadas: contrato.numerojornadas || 0,
      numeroAlumnos: contrato.numeroAlumnos || 0,
    },
    empresaCapacitadora: {
      nombre: config?.nombreEmpresa || 'Centro de Capacitación',
      nit: config?.nitEmpresa || '',
      ciudad: config?.ciudad || '',
      direccion: config?.direccion || '',
      telefono: config?.telefono || '',
      email: config?.email || '',
      /** Preferir data URL embebida para PDF/Chromium (ruta relativa no carga en page.setContent). */
      logoUrl: config?.urlLogoDataUrl || '',
      urlLogo: config?.urlLogo || '',
    },
    filtros: {
      idJornada: idJornadaF ? String(idJornadaF) : null,
      idClase: idClaseF ? String(idClaseF) : null,
      idPrograma: idProgramaF || null,
      idInstructor: Number.isFinite(idInstructorF) ? idInstructorF : null,
      desde: desdeF ? String(filtros.desde) : null,
      hasta: hastaBase ? String(filtros.hasta) : null,
    },
    kpis: {
      jornadas: porJornada.length,
      clasesTotales: porClase.length,
      clasesDictadas,
      clasesEnProceso,
      alumnosCapacitados: alumnosUnicos.size,
      alumnosCertificados: alumnosCertificados.size,
      certificadosEmitidos: certificados.length,
      metaAlumnos: Math.max(0, parseInt(contrato.numeroAlumnos, 10) || 0),
      metaJornadas: Math.max(0, parseInt(contrato.numerojornadas, 10) || 0),
    },
    charts: {
      clasesPorEstado: [
        { label: 'Finalizadas', value: clasesDictadas },
        { label: 'En proceso', value: clasesEnProceso },
        {
          label: 'Programadas',
          value: Math.max(0, porClase.length - clasesDictadas - clasesEnProceso),
        },
      ],
      alumnosPorJornada: porJornada.map((j) => ({
        label: j.fechaLabel,
        value: j.alumnosCapacitados,
      })),
      alumnosPorPrograma: porPrograma.map((p) => ({
        label: p.programaNombre,
        value: p.alumnosCapacitados,
      })),
      clasesPorInstructor: porInstructor.map((i) => ({
        label: i.instructorNombre,
        value: i.clasesDictadas,
      })),
      ...chartsDesdeCaracterizacion(caracterizacionPoblacion),
    },
    caracterizacionPoblacion,
    porJornada,
    porClase,
    porPrograma,
    porInstructor,
    opciones: {
      jornadas: todasJornadas.map((j) => ({
        value: String(j._id),
        label: `${fmtFechaSolo(j.fechaProgramacion) || '—'} · ${j.municipio || 'Sin municipio'} · ${j.estado || ''}`.trim(),
      })),
      clases: todasEnriched.map((c) => ({
        value: String(c._id),
        idJornada: String(c.idJornada),
        label: [
          fmtFechaSolo(c.fechaClase || c.fechaJornada) || '—',
          c.programaNombre || c.idPrograma || 'Sin programa',
          c.instructorNombre || '',
        ]
          .filter(Boolean)
          .join(' · '),
      })),
      programas: [...opcionesPrograma.entries()].map(([value, label]) => ({ value, label })),
      instructores: [...opcionesInstructor.entries()].map(([value, label]) => ({
        value,
        label,
      })),
    },
    generadoAt: new Date().toISOString(),
  };
}

function alcanceTitulo(alcance, data) {
  switch (alcance) {
    case 'jornada':
      return `Informe de jornada — ${data.porJornada[0]?.fechaLabel || ''}`.trim();
    case 'clase':
      return `Informe de clase — ${data.porClase[0]?.programaNombre || ''}`.trim();
    case 'programa':
      return `Informe por programa — ${data.porPrograma[0]?.programaNombre || ''}`.trim();
    case 'instructor':
      return data.filtros?.idInstructor != null
        ? `Desarrollo de clases — ${data.porInstructor[0]?.instructorNombre || 'Instructor'}`
        : 'Desarrollo de clases por instructor';
    case 'desarrollo-general':
      return 'Informe general de desarrollo de clases';
    default:
      return 'Informe de capacitación del contrato';
  }
}

function alcanceResumenTitulo(alcance) {
  switch (alcance) {
    case 'jornada':
      return 'Resumen gráfico de la jornada';
    case 'clase':
      return 'Resumen gráfico de la clase';
    case 'programa':
      return 'Resumen gráfico del programa';
    case 'instructor':
      return 'Resumen gráfico del instructor';
    default:
      return 'Resumen gráfico general del contrato';
  }
}

function alcanceResumenNumericoTitulo(alcance) {
  switch (alcance) {
    case 'jornada':
      return 'Resumen de la jornada';
    case 'clase':
      return 'Resumen de la clase';
    case 'programa':
      return 'Resumen del programa';
    case 'instructor':
      return 'Resumen del instructor';
    default:
      return 'Resumen general del contrato';
  }
}

function alcanceDetalleTitulo(alcance) {
  switch (alcance) {
    case 'jornada':
      return 'Desarrollo de la jornada';
    case 'clase':
      return 'Detalle de la clase y alumnos';
    case 'programa':
      return 'Desarrollo del programa';
    case 'instructor':
      return 'Desarrollo por instructor';
    case 'desarrollo-general':
      return 'Desarrollo general por instructores';
    default:
      return 'Desarrollo por jornadas';
  }
}

function subtituloInformeContrato(alcance) {
  switch (alcance) {
    case 'jornada':
      return 'Resultados de la jornada de capacitación';
    case 'clase':
      return 'Detalle de clase y participantes';
    case 'programa':
      return 'Seguimiento del programa de capacitación';
    case 'instructor':
    case 'desarrollo-general':
      return 'Desarrollo de clases por instructor';
    default:
      return 'Seguimiento de jornadas de capacitación';
  }
}

const {
  informeGoogleFontsLinkHtml,
  informeDocumentoBaseCss,
  htmlEncabezadoEmpresa,
} = require('./informeEncabezadoEmpresa');

function htmlEncabezadoInformeFormal({
  emp,
  contrato,
  titulo,
  subtitulo,
  generado,
  resumenTitulo,
  kpis,
  valorDestacado,
  etiquetaDestacado = 'Alumnos certificados',
}) {
  const c = contrato || {};
  const k = kpis || {};

  return `${htmlEncabezadoEmpresa(emp, esc)}

  <div class="doc-titulo-block">
    <h2>${esc(titulo)}</h2>
    <p>${esc(subtitulo)}</p>
  </div>

  <div class="destacado-contrato">
    <div class="item">
      <span class="lbl">Contrato</span>
      <span class="val">${esc(c.codContrato || c._id || '—')}</span>
    </div>
    <div class="item">
      <span class="lbl">${esc(etiquetaDestacado)}</span>
      <span class="val">${esc(valorDestacado)}</span>
    </div>
  </div>

  <table class="doc-meta">
    <tr><td>Presentado a</td><td><strong>${esc(c.cliente || 'Empresa contratante')}</strong>${c.nit ? ` · NIT ${esc(c.nit)}` : ''}</td></tr>
    <tr><td>Alcance</td><td>${esc(resumenTitulo)}</td></tr>
    <tr><td>Generado</td><td>${esc(generado)}</td></tr>
    ${c.ciudad ? `<tr><td>Ciudad</td><td>${esc(c.ciudad)}</td></tr>` : ''}
  </table>

  <div class="stats">
    <div class="stat"><span>Jornadas</span><strong>${k.jornadas || 0}</strong></div>
    <div class="stat"><span>Clases dictadas</span><strong>${k.clasesDictadas || 0}/${k.clasesTotales || 0}</strong></div>
    <div class="stat"><span>Alumnos capacitados</span><strong>${k.alumnosCapacitados || 0}</strong></div>
    <div class="stat"><span>Alumnos certificados</span><strong>${k.alumnosCertificados || 0}</strong></div>
  </div>`;
}

function formatPct(n) {
  if (!Number.isFinite(n)) return '0%';
  const rounded = Math.round(n * 10) / 10;
  return `${rounded}%`;
}

const CHART_PALETTE = [
  '#0ea5e9',
  '#10b981',
  '#8b5cf6',
  '#fbbf24',
  '#f43f5e',
  '#14b8a6',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#22c55e',
];

const CHART_PALETTE_ESTADO = {
  Finalizadas: '#10b981',
  'En proceso': '#0ea5e9',
  Programadas: '#8b5cf6',
};

function chartColor(i, offset = 0) {
  return CHART_PALETTE[(i + offset) % CHART_PALETTE.length];
}

function htmlChartDataTable(items, colLabel, colValue) {
  const list = (items || []).filter((x) => Number(x.value) >= 0);
  if (!list.length) return '';
  const total = list.reduce((s, x) => s + (Number(x.value) || 0), 0);
  const rows = list
    .map((it, i) => {
      const value = Number(it.value) || 0;
      const pct = total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
      const color = it.color || chartColor(i);
      return `<tr>
        <td><span class="swatch" style="background:${esc(color)}"></span>${esc(it.label)}</td>
        <td class="num">${esc(value)}</td>
        <td class="num">${esc(formatPct(pct))}</td>
      </tr>`;
    })
    .join('');
  return `<table class="t chart-t">
    <thead><tr><th>${esc(colLabel)}</th><th class="num">${esc(colValue)}</th><th class="num">% del total</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td>Total</td><td class="num">${esc(total)}</td><td class="num">100%</td></tr></tfoot>
  </table>`;
}

function htmlBarChart(items, opts = {}) {
  const { maxH = 90, colorOffset = 0, colLabel = 'Concepto', colValue = 'Cantidad' } = opts;
  const list = (items || []).filter((x) => Number(x.value) >= 0).slice(0, 12);
  if (!list.length) return '<p class="muted">Sin datos</p>';
  const values = list.map((i) => Number(i.value) || 0);
  const max = Math.max(1, ...values);
  const total = values.reduce((s, n) => s + n, 0);
  const enriched = list.map((i, idx) => {
    const value = Number(i.value) || 0;
    return {
      ...i,
      value,
      color: chartColor(idx, colorOffset),
      pctAltura: Math.max(4, Math.round((value / max) * maxH)),
      pctTotal: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
    };
  });
  const bars = enriched
    .map(
      (i) =>
        `<div class="bar">
          <div class="bar-val"><strong>${esc(i.value)}</strong><em>${esc(formatPct(i.pctTotal))}</em></div>
          <div class="bar-fill" style="height:${i.pctAltura}px;background:${esc(i.color)}"></div>
          <span class="bar-lbl">${esc(i.label)}</span>
        </div>`,
    )
    .join('');
  return `<div class="bars">${bars}</div>${htmlChartDataTable(enriched, colLabel, colValue)}`;
}

function htmlHBarChart(items, opts = {}) {
  const { colorOffset = 0, colLabel = 'Concepto', colValue = 'Cantidad' } = opts;
  const list = (items || []).filter((x) => Number(x.value) > 0).slice(0, 10);
  if (!list.length) return '<p class="muted">Sin datos</p>';
  const values = list.map((i) => Number(i.value) || 0);
  const max = Math.max(1, ...values);
  const total = values.reduce((s, n) => s + n, 0);
  const enriched = list.map((i, idx) => {
    const value = Number(i.value) || 0;
    return {
      ...i,
      value,
      color: chartColor(idx, colorOffset),
      pctBar: Math.max(4, Math.round((value / max) * 100)),
      pctTotal: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
    };
  });
  const rows = enriched
    .map(
      (i) =>
        `<div class="hbar-row">
          <span class="hbar-lbl">${esc(i.label)}</span>
          <div class="hbar-track"><i style="width:${i.pctBar}%;background:${esc(i.color)}"></i></div>
          <span class="hbar-meta"><strong>${esc(i.value)}</strong><em>${esc(formatPct(i.pctTotal))}</em></span>
        </div>`,
    )
    .join('');
  return `<div class="hbars">${rows}</div>${htmlChartDataTable(enriched, colLabel, colValue)}`;
}

function htmlStackChart(items, opts = {}) {
  const { colorOffset = 0, colLabel = 'Concepto', colValue = 'Cantidad', unit = 'alumnos' } = opts;
  const list = (items || []).filter((x) => Number(x.value) > 0).slice(0, 8);
  if (!list.length) return '<p class="muted">Sin datos</p>';
  const total = list.reduce((s, i) => s + (Number(i.value) || 0), 0);
  const enriched = list.map((i, idx) => {
    const value = Number(i.value) || 0;
    return {
      ...i,
      value,
      color: chartColor(idx, colorOffset),
      pctTotal: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
    };
  });
  const segs = enriched
    .map(
      (i) =>
        `<i class="stack-seg" style="flex-grow:${Math.max(i.pctTotal, 0.5)};background:${esc(i.color)}" title="${esc(i.label)}: ${esc(i.value)}"></i>`,
    )
    .join('');
  const legend = enriched
    .map(
      (i) =>
        `<li><span class="swatch" style="background:${esc(i.color)}"></span><span class="leg-lbl">${esc(i.label)}</span><strong>${esc(i.value)}</strong><em>${esc(formatPct(i.pctTotal))}</em></li>`,
    )
    .join('');
  return `<div class="stack-wrap">
    <div class="stack-bar">${segs}</div>
    <ul class="pie-legend">${legend}</ul>
    <p class="muted">Total ${esc(total)} ${esc(unit)}</p>
  </div>${htmlChartDataTable(enriched, colLabel, colValue)}`;
}

function htmlRankChart(items, opts = {}) {
  const { colorOffset = 0, colLabel = 'Concepto', colValue = 'Cantidad' } = opts;
  const list = (items || []).filter((x) => Number(x.value) > 0).slice(0, 8);
  if (!list.length) return '<p class="muted">Sin datos</p>';
  const values = list.map((i) => Number(i.value) || 0);
  const max = Math.max(1, ...values);
  const total = values.reduce((s, n) => s + n, 0);
  const enriched = list.map((i, idx) => {
    const value = Number(i.value) || 0;
    return {
      ...i,
      value,
      color: chartColor(idx, colorOffset),
      pctBar: Math.max(4, Math.round((value / max) * 100)),
      pctTotal: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
      rank: idx + 1,
    };
  });
  const rows = enriched
    .map(
      (i) =>
        `<div class="rank-row">
          <span class="rank-n">${esc(i.rank)}</span>
          <div class="rank-body">
            <div class="rank-top"><span>${esc(i.label)}</span><b>${esc(i.value)}</b><em>${esc(formatPct(i.pctTotal))}</em></div>
            <div class="rank-track"><i style="width:${i.pctBar}%;background:${esc(i.color)}"></i></div>
          </div>
        </div>`,
    )
    .join('');
  return `<div class="ranks">${rows}</div>${htmlChartDataTable(enriched, colLabel, colValue)}`;
}

function htmlCruceJornadas(jornadas) {
  const list = jornadas || [];
  if (!list.length) return '';
  const programasContrato = new Set();
  let totalAlumnosJornada = 0;
  let totalClases = 0;
  const rows = list
    .map((j) => {
      const programas = j.programas || [];
      programas.forEach((p) => programasContrato.add(p));
      totalAlumnosJornada += Number(j.alumnosCapacitados) || 0;
      totalClases += Number(j.numClases) || 0;
      return `<tr>
        <td>${esc(referenciaJornada(j))}</td>
        <td class="num">${esc(j.alumnosCapacitados || 0)}</td>
        <td class="num">${esc(j.numClases || 0)}</td>
        <td class="num">${esc(j.numProgramas || 0)}</td>
        <td>${esc(programas.join(', ') || 'Sin programas')}</td>
      </tr>`;
    })
    .join('');

  const maxValor = Math.max(
    1,
    ...list.flatMap((j) => [
      Number(j.alumnosCapacitados) || 0,
      Number(j.numClases) || 0,
      Number(j.numProgramas) || 0,
    ]),
  );
  const chart = list
    .map((j) => {
      const series = [
        ['Alumnos', Number(j.alumnosCapacitados) || 0, 'cruce-bar--alumnos'],
        ['Clases', Number(j.numClases) || 0, 'cruce-bar--clases'],
        ['Programas', Number(j.numProgramas) || 0, 'cruce-bar--programas'],
      ];
      return `<div class="cruce-chart-row">
        <strong>${esc(referenciaJornada(j))}</strong>
        <div class="cruce-series">
          ${series
            .map(
              ([label, value, clase]) => `<div class="cruce-serie">
                <span>${esc(label)}</span>
                <div class="cruce-track"><i class="${clase}" style="width:${Math.max(value ? 4 : 0, Math.round((value / maxValor) * 100))}%"></i></div>
                <b>${esc(value)}</b>
              </div>`,
            )
            .join('')}
        </div>
      </div>`;
    })
    .join('');

  return `<section class="cruce-jornadas">
    <h3 class="chart-section-title">Cuadro de referencias cruzadas por jornada</h3>
    <p class="chart-hint">Relación entre alumnos capacitados, clases realizadas y programas impartidos en cada jornada.</p>
    <table class="t cruce-table">
      <thead><tr><th>Jornada</th><th class="num">Alumnos</th><th class="num">Clases</th><th class="num">Programas</th><th>Programas impartidos</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr>
        <td><strong>Totales</strong></td>
        <td class="num"><strong>${esc(totalAlumnosJornada)}</strong></td>
        <td class="num"><strong>${esc(totalClases)}</strong></td>
        <td class="num"><strong>${esc(programasContrato.size)}</strong></td>
        <td><strong>${esc([...programasContrato].sort((a, b) => a.localeCompare(b, 'es')).join(', ') || 'Sin programas')}</strong></td>
      </tr></tfoot>
    </table>
    <h3 class="chart-section-title chart-section-title--sub">Gráfico comparativo por jornada</h3>
    <div class="cruce-chart">${chart}</div>
  </section>`;
}

function donutSlicePath(cx, cy, r, rInner, a0, a1) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const xi0 = cx + rInner * Math.cos(a1);
  const yi0 = cy + rInner * Math.sin(a1);
  const xi1 = cx + rInner * Math.cos(a0);
  const yi1 = cy + rInner * Math.sin(a0);
  if (Math.abs(a1 - a0) >= Math.PI * 2 - 1e-6) {
    const mid = a0 + Math.PI;
    const xm = cx + r * Math.cos(mid);
    const ym = cy + r * Math.sin(mid);
    const xim = cx + rInner * Math.cos(mid);
    const yim = cy + rInner * Math.sin(mid);
    return [
      `M ${x0} ${y0}`,
      `A ${r} ${r} 0 1 1 ${xm} ${ym}`,
      `A ${r} ${r} 0 1 1 ${x0} ${y0}`,
      `L ${xi1} ${yi1}`,
      `A ${rInner} ${rInner} 0 1 0 ${xim} ${yim}`,
      `A ${rInner} ${rInner} 0 1 0 ${xi1} ${yi1}`,
      'Z',
    ].join(' ');
  }
  return [
    `M ${x0} ${y0}`,
    `A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`,
    `L ${xi0} ${yi0}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${xi1} ${yi1}`,
    'Z',
  ].join(' ');
}

function htmlPieChart(items, opts = {}) {
  const { kind = 'programa', colLabel = 'Concepto', colValue = 'Cantidad', unit = 'total' } = opts;
  const list = (items || []).filter((x) => Number(x.value) > 0).slice(0, 8);
  if (!list.length) return '<p class="muted">Sin datos</p>';
  const totalRaw = list.reduce((s, x) => s + (Number(x.value) || 0), 0);
  const total = totalRaw || 1;
  const cx = 50;
  const cy = 50;
  const r = 36;
  const rInner = 20;
  const rLabel = (r + rInner) / 2;
  let angle = -Math.PI / 2;
  const slices = list.map((it, i) => {
    const value = Number(it.value) || 0;
    const pct = Math.round((value / total) * 1000) / 10;
    const sweep = (value / total) * Math.PI * 2;
    const a0 = angle;
    const a1 = angle + sweep;
    const aMid = a0 + sweep / 2;
    angle = a1;
    const color =
      kind === 'estado'
        ? CHART_PALETTE_ESTADO[it.label] || chartColor(i)
        : chartColor(i);
    return {
      label: it.label,
      value,
      pct,
      color,
      path: donutSlicePath(cx, cy, r, rInner, a0, a1),
      labelX: cx + rLabel * Math.cos(aMid),
      labelY: cy + rLabel * Math.sin(aMid),
      showLabel: pct >= 8 || sweep >= 0.45,
    };
  });
  const paths = slices
    .map((s) => `<path d="${s.path}" fill="${esc(s.color)}"><title>${esc(s.label)}: ${s.value} (${formatPct(s.pct)})</title></path>`)
    .join('');
  const labels = slices
    .filter((s) => s.showLabel)
    .map(
      (s) =>
        `<text x="${s.labelX.toFixed(2)}" y="${s.labelY.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" class="pie-lbl">${esc(formatPct(s.pct))}</text>`,
    )
    .join('');
  const legend = slices
    .map(
      (s) =>
        `<li><span class="swatch" style="background:${esc(s.color)}"></span><span class="leg-lbl">${esc(s.label)}</span><strong>${esc(s.value)}</strong><em>${esc(formatPct(s.pct))}</em></li>`,
    )
    .join('');
  return `<div class="pie-wrap">
    <div class="pie-visual">
      <svg viewBox="0 0 100 100" class="pie-svg">${paths}${labels}</svg>
      <div class="pie-center"><strong>${esc(totalRaw)}</strong><span>${esc(unit)}</span></div>
    </div>
    <ul class="pie-legend">${legend}</ul>
  </div>${htmlChartDataTable(slices, colLabel, colValue)}`;
}

function htmlChartsOrigenYCaracterizacion(charts) {
  const c = charts || {};
  return `<h3 class="chart-section-title chart-section-title--sub">Origen de alumnos en jornada</h3>
  <p class="chart-hint chart-hint--section">
    Clasificación de participantes (institución educativa, estamento, empresa u operativo / calle) y detalle asociado.
  </p>
  <div class="charts-grid charts-grid--compact">
    <section class="chart-card">
      <h3 class="sec">Por origen en jornada</h3>
      ${htmlStackChart(c.porOrigenJornada || [], { colLabel: 'Origen', colValue: 'Alumnos', colorOffset: 0 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Tipo de institución</h3>
      ${htmlPieChart(c.porTipoInstitucion || [], { kind: 'programa', colLabel: 'Tipo', colValue: 'Alumnos', unit: 'alumnos' })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Institución educativa / colegio</h3>
      ${htmlRankChart(c.porColegio || [], { colLabel: 'Institución', colValue: 'Alumnos', colorOffset: 1 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Grado / programa</h3>
      ${htmlBarChart(c.porGradoColegio || [], { colLabel: 'Grado o programa', colValue: 'Alumnos', colorOffset: 2 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Estamento público</h3>
      ${htmlHBarChart(c.porEstamento || [], { colLabel: 'Estamento', colValue: 'Alumnos', colorOffset: 3 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Cargo (estamento)</h3>
      ${htmlHBarChart(c.porCargoEstamento || [], { colLabel: 'Cargo', colValue: 'Alumnos', colorOffset: 4 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Dependencia (estamento)</h3>
      ${htmlRankChart(c.porDependenciaEstamento || [], { colLabel: 'Dependencia', colValue: 'Alumnos', colorOffset: 5 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Empresa</h3>
      ${htmlHBarChart(c.porEmpresa || [], { colLabel: 'Empresa', colValue: 'Alumnos', colorOffset: 1 })}
    </section>
  </div>
  <h3 class="chart-section-title chart-section-title--sub">Caracterización de población</h3>
  <div class="charts-grid charts-grid--compact">
    <section class="chart-card">
      <h3 class="sec">Por edad</h3>
      ${htmlBarChart(c.porEdad || [], { colLabel: 'Rango', colValue: 'Alumnos', colorOffset: 0 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Por género</h3>
      ${htmlPieChart(c.porGenero || [], { kind: 'programa', colLabel: 'Género', colValue: 'Alumnos', unit: 'alumnos' })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Estado civil</h3>
      ${htmlHBarChart(c.porEstadoCivil || [], { colLabel: 'Estado civil', colValue: 'Alumnos', colorOffset: 2 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Estrato socioeconómico</h3>
      ${htmlBarChart(c.porEstrato || [], { colLabel: 'Estrato', colValue: 'Alumnos', colorOffset: 2 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Régimen de salud</h3>
      ${htmlStackChart(c.porRegimenSalud || [], { colLabel: 'Régimen', colValue: 'Alumnos', colorOffset: 3 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Nivel de formación</h3>
      ${htmlHBarChart(c.porNivelFormacion || [], { colLabel: 'Nivel', colValue: 'Alumnos', colorOffset: 3 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Ocupación</h3>
      ${htmlRankChart(c.porOcupacion || [], { colLabel: 'Ocupación', colValue: 'Alumnos', colorOffset: 5 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Discapacidad</h3>
      ${htmlHBarChart(c.porDiscapacidad || [], { colLabel: 'Discapacidad', colValue: 'Alumnos', colorOffset: 4 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Multiculturalidad</h3>
      ${htmlRankChart(c.porMultiCulturalidad || [], { colLabel: 'Grupo', colValue: 'Alumnos', colorOffset: 1 })}
    </section>
  </div>`;
}

function htmlChartsDashboard(charts, titulo = 'Resumen gráfico general del contrato', opts = {}) {
  const { tituloGrande = false } = opts;
  const c = charts || {};
  const tituloHtml = tituloGrande
    ? `<div class="sec-grande">${esc(titulo)}</div>`
    : `<h3 class="chart-section-title">${esc(titulo)}</h3>`;
  return `${tituloHtml}
  <div class="charts-grid charts-grid--compact">
    <section class="chart-card">
      <h3 class="sec">Alumnos por jornada</h3>
      <p class="chart-hint">Participación sobre el total de alumnos capacitados del gráfico.</p>
      ${htmlBarChart(c.alumnosPorJornada || [], { colLabel: 'Jornada', colValue: 'Alumnos', colorOffset: 0 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Clases por estado</h3>
      <p class="chart-hint">Participación sobre el total de clases del gráfico.</p>
      ${htmlPieChart(c.clasesPorEstado || [], { kind: 'estado', colLabel: 'Estado', colValue: 'Clases', unit: 'clases' })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Alumnos por programa</h3>
      <p class="chart-hint">Participación sobre el total de alumnos del gráfico.</p>
      ${htmlHBarChart(c.alumnosPorPrograma || [], { colLabel: 'Programa', colValue: 'Alumnos', colorOffset: 2 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Clases dictadas por instructor</h3>
      <p class="chart-hint">Participación sobre el total de clases dictadas del gráfico.</p>
      ${htmlBarChart(c.clasesPorInstructor || [], { colLabel: 'Instructor', colValue: 'Clases', colorOffset: 4 })}
    </section>
  </div>
  ${htmlChartsOrigenYCaracterizacion(c)}`;
}

const TITULO_GRAFICO_GENERAL = 'Resumen gráfico general del contrato';

/** Gráficos principales: siempre primero tras cabecera y KPIs. */
function buildChartsBlock(data, alcance) {
  const parts = [];
  const muestraGeneral = [
    'contrato',
    'desarrollo-general',
    'instructor',
    'programa',
    'clase',
    'jornada',
  ].includes(alcance);

  if (muestraGeneral) {
    parts.push(
      htmlChartsDashboard(data.charts, TITULO_GRAFICO_GENERAL, { tituloGrande: true }),
    );
  }
  if (alcance === 'jornada' && data.porJornada?.[0]) {
    parts.push(
      htmlChartsJornada(data.porJornada[0], alcanceResumenTitulo(alcance), true),
    );
  }
  return parts.join('\n');
}

function htmlResumenFinalContrato(data, kpis, duracionTotalSegundos) {
  const k = kpis || {};
  return `<div class="sec-grande">Resumen numérico complementario</div>
  <div class="stats stats--cinco">
    <div class="stat"><span>Instructores</span><strong>${esc((data.porInstructor || []).length)}</strong></div>
    <div class="stat"><span>Clases dictadas</span><strong>${esc(k.clasesDictadas || 0)}/${esc(k.clasesTotales || 0)}</strong></div>
    <div class="stat"><span>Duración total</span><strong>${esc(fmtDuracionInforme(duracionTotalSegundos))}</strong></div>
    <div class="stat"><span>Capacitados únicos</span><strong>${esc(k.alumnosCapacitados || 0)}</strong></div>
    <div class="stat"><span>Certificados únicos</span><strong>${esc(k.alumnosCertificados || 0)}</strong></div>
  </div>`;
}

function htmlChartsJornada(jornada, titulo = 'Resumen gráfico', compact = false) {
  const c = jornada?.charts || {};
  return `<h3 class="chart-section-title chart-section-title--sub">${esc(titulo)}</h3>
  <div class="charts-grid charts-grid--jornada${compact ? ' charts-grid--compact' : ''}">
    <section class="chart-card">
      <h3 class="sec">Certificación de alumnos</h3>
      <p class="chart-hint">Estado de certificación de los alumnos capacitados en esta jornada.</p>
      ${htmlBarChart(c.certificacionAlumnos || [], { colLabel: 'Indicador', colValue: 'Alumnos', colorOffset: 1 })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Clases por estado</h3>
      <p class="chart-hint">Distribución del avance de clases de esta jornada.</p>
      ${htmlPieChart(c.clasesPorEstado || [], { kind: 'estado', colLabel: 'Estado', colValue: 'Clases', unit: 'clases' })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Alumnos por programa</h3>
      <p class="chart-hint">Participación de alumnos capacitados por programa en esta jornada.</p>
      ${htmlPieChart(c.alumnosPorPrograma || [], { kind: 'programa', colLabel: 'Programa', colValue: 'Alumnos', unit: 'alumnos' })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Clases dictadas por instructor</h3>
      <p class="chart-hint">Clases finalizadas por instructor dentro de esta jornada.</p>
      ${htmlBarChart(c.clasesPorInstructor || [], { colLabel: 'Instructor', colValue: 'Clases', colorOffset: 4 })}
    </section>
  </div>
  ${htmlChartsOrigenYCaracterizacion(c)}`;
}

function htmlTablaAlumnos(alumnos) {
  if (!alumnos?.length) return '<p class="muted">Sin alumnos con asistencia.</p>';
  const rows = alumnos
    .map(
      (a) =>
        `<tr><td>${esc(a.numDoc)}</td><td>${esc(a.nombreCompleto)}</td><td>${a.certificado ? 'Sí' : 'No'}</td></tr>`,
    )
    .join('');
  return `<table class="t"><thead><tr><th>Documento</th><th>Alumno</th><th>Certificado</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function referenciaJornada(j) {
  const etiqueta =
    j?.indiceEnDia > 1 ? `Jornada ${j.indiceEnDia}` : 'Jornada';
  const fecha = j?.fechaLabel && j.fechaLabel !== '—' ? j.fechaLabel : '';
  const lugar = [j?.municipio, j?.direccion].filter(Boolean).join(' — ');
  return [etiqueta, fecha, lugar].filter(Boolean).join(' · ');
}

function htmlEncabezadoJornada(j) {
  const stats = [
    `${j.numClases} clase(s)`,
    `${j.alumnosCapacitados} capacitado(s)`,
    `${j.alumnosCertificados} certificado(s)`,
    j.estado ? `Estado: ${j.estado}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return `<h3 class="jornada-section-title">${esc(referenciaJornada(j))}</h3>
  <p class="jornada-section-sub">${esc(stats)}</p>`;
}

function referenciaClase(cl) {
  const etiqueta = `Clase ${cl.indiceClaseEnJornada || 1}`;
  const programa = cl.programaNombre || 'Sin programa';
  const instructor = cl.instructorNombre || 'Sin instructor';
  return `${etiqueta} · ${programa} · ${instructor}`;
}

function htmlEncabezadoClase(cl) {
  const numAlumnos = cl.alumnosInscritos ?? cl.alumnos?.length ?? 0;
  const stats = [
    cl.fechaLabel && cl.fechaLabel !== '—' ? cl.fechaLabel : '',
    cl.estado ? `Estado: ${cl.estado}` : '',
    `${numAlumnos} alumno(s)`,
    cl.alumnosCertificados != null ? `${cl.alumnosCertificados} certificado(s)` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return `<h4 class="clase-section-title">${esc(referenciaClase(cl))}</h4>
  <p class="clase-section-sub">${esc(stats)}</p>`;
}

function htmlTablaDesarrolloInstructor(clases) {
  const rows = (clases || [])
    .map(
      (cl) => `<tr>
        <td>${esc(cl.jornadaLabel || `Jornada ${cl.jornadaNumero || 1}`)}</td>
        <td>${esc(cl.fechaLabel || '—')}</td>
        <td>${esc(`Clase ${cl.indiceClaseEnJornada || 1} · ${cl.programaNombre || 'Sin programa'}`)}</td>
        <td class="num">${esc(cl.horaInicioLabel || '—')}</td>
        <td class="num">${esc(cl.horaFinLabel || '—')}</td>
        <td class="num">${esc(cl.duracionLabel || '—')}</td>
        <td class="num">${esc(cl.alumnosInscritos || 0)}</td>
        <td class="num">${esc(cl.alumnosCertificados || 0)}</td>
      </tr>`,
    )
    .join('');
  if (!rows) return '<p class="muted">Este instructor no tiene clases con los filtros seleccionados.</p>';
  const clasesFinalizadas = clases.filter(
    (cl) => String(cl.estado || '').toUpperCase() === 'FINALIZADO',
  ).length;
  const capacitados = new Set();
  const certificados = new Set();
  let duracion = 0;
  for (const cl of clases) {
    for (const a of cl.alumnos || []) {
      capacitados.add(a.numDoc);
      if (a.certificado) certificados.add(a.numDoc);
    }
    if (Number.isFinite(Number(cl.duracionSegundos))) duracion += Number(cl.duracionSegundos);
  }
  return `<table class="t desarrollo-inst">
    <thead><tr>
      <th>Jornada</th><th>Fecha</th><th>Clase / programa</th>
      <th class="num">Inicio</th><th class="num">Fin</th><th class="num">Duración</th>
      <th class="num">Capacitados</th><th class="num">Certificados</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr>
      <td colspan="2"><strong>Total instructor</strong></td>
      <td><strong>${esc(clasesFinalizadas)} finalizada(s) / ${esc(clases.length)} clase(s)</strong></td>
      <td colspan="2"></td>
      <td class="num"><strong>${esc(fmtDuracionInforme(duracion))}</strong></td>
      <td class="num"><strong>${esc(capacitados.size)}</strong></td>
      <td class="num"><strong>${esc(certificados.size)}</strong></td>
    </tr></tfoot>
  </table>`;
}

/**
 * HTML imprimible / PDF del informe dirigido a la empresa contratante.
 */
async function buildHtmlInformeContratoPdf(data, alcance = 'contrato') {
  const emp = data.empresaCapacitadora || {};
  const c = data.contrato || {};
  const k = data.kpis || {};
  const titulo = alcanceTitulo(alcance, data);
  const { atPageCssPara } = require('./configPaginasInformes');
  const atPage = await atPageCssPara('informe_contrato_jornadas');

  let cuerpo = '';

  if (alcance === 'instructor' || alcance === 'desarrollo-general') {
    cuerpo += `<h3 class="chart-section-title">${esc(alcanceDetalleTitulo(alcance))}</h3>`;
    for (const inst of data.porInstructor || []) {
      const clases = (data.porClase || []).filter(
        (cl) =>
          (inst.idEmpleadoInstructor != null &&
            Number(cl.idEmpleadoInstructor) === Number(inst.idEmpleadoInstructor)) ||
          cl.instructorNombre === inst.instructorNombre,
      );
      cuerpo += `<h3 class="jornada-section-title">Instructor · ${esc(inst.instructorNombre)}</h3>`;
      cuerpo += `<p class="jornada-section-sub">${inst.clasesDictadas} dictada(s) / ${inst.numClases} clase(s) · ${inst.alumnosCapacitados} capacitado(s) · ${inst.alumnosCertificados || 0} certificado(s) · duración ${esc(inst.duracionLabel || '—')}</p>`;
      cuerpo += htmlTablaDesarrolloInstructor(clases);
    }
  } else if (alcance === 'programa') {
    cuerpo += `<h3 class="chart-section-title">${esc(alcanceDetalleTitulo(alcance))}</h3>`;
    for (const p of data.porPrograma || []) {
      cuerpo += `<h3 class="programa-section-title">Programa · ${esc(p.programaNombre)}</h3>`;
      cuerpo += `<p class="programa-section-sub">${p.numClases} clase(s) · ${p.alumnosCapacitados} capacitado(s) · ${p.alumnosCertificados} certificado(s)</p>`;
      const clases = (data.porClase || []).filter((cl) => cl.idPrograma === p.idPrograma);
      for (const cl of clases) {
        cuerpo += htmlEncabezadoClase(cl);
        cuerpo += htmlTablaAlumnos(cl.alumnos);
      }
    }
  } else if (alcance === 'clase') {
    cuerpo += `<h3 class="chart-section-title">${esc(alcanceDetalleTitulo(alcance))}</h3>`;
    for (const cl of data.porClase || []) {
      cuerpo += htmlEncabezadoClase(cl);
      cuerpo += htmlTablaAlumnos(cl.alumnos);
    }
  } else {
    // contrato o jornada
    const jornadasInforme = data.porJornada || [];
    if (jornadasInforme.length) {
      cuerpo += `<h3 class="chart-section-title">${esc(alcanceDetalleTitulo(alcance))}</h3>`;
    }
    for (const [indiceJornada, j] of jornadasInforme.entries()) {
      cuerpo += htmlEncabezadoJornada(j);
      if (alcance === 'contrato') {
        cuerpo += htmlChartsJornada(j);
      }
      cuerpo += `<h3 class="chart-section-title chart-section-title--sub">Detalle de clases y alumnos</h3>`;
      for (const cl of j.clases || []) {
        cuerpo += htmlEncabezadoClase(cl);
        cuerpo += htmlTablaAlumnos(cl.alumnos);
      }
      if (indiceJornada < jornadasInforme.length - 1) {
        cuerpo += `<div class="page-break" aria-hidden="true"></div>`;
      }
    }
  }

  const chartsBlock = buildChartsBlock(data, alcance);
  const cruceJornadasBlock =
    alcance === 'contrato' || alcance === 'jornada' ? htmlCruceJornadas(data.porJornada) : '';
  const resumenNumericoTitulo = alcanceResumenNumericoTitulo(alcance);
  const generado = new Date(data.generadoAt || Date.now()).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
  });
  const valorDestacado =
    alcance === 'instructor' || alcance === 'desarrollo-general'
      ? String(k.clasesDictadas || 0)
      : String(k.alumnosCertificados || 0);
  const etiquetaDestacado =
    alcance === 'instructor' || alcance === 'desarrollo-general'
      ? 'Clases dictadas'
      : 'Alumnos certificados';
  const encabezadoFormal = htmlEncabezadoInformeFormal({
    emp,
    contrato: c,
    titulo,
    subtitulo: subtituloInformeContrato(alcance),
    generado,
    resumenTitulo: resumenNumericoTitulo,
    kpis: k,
    valorDestacado,
    etiquetaDestacado,
  });
  const duracionTotalInforme = (data.porClase || []).reduce(
    (total, cl) =>
      total + (Number.isFinite(Number(cl.duracionSegundos)) ? Number(cl.duracionSegundos) : 0),
    0,
  );
  const resumenComplementario =
    alcance === 'instructor' || alcance === 'desarrollo-general'
      ? htmlResumenFinalContrato(data, k, duracionTotalInforme)
      : '';
  const detalleTieneContenido = Boolean(String(cuerpo || '').trim());
  const saltoAntesDetalle = detalleTieneContenido ? '<div class="page-break" aria-hidden="true"></div>' : '';

  const { informePrintToolbar } = require('./informePrintToolbar');
  const toolbar = informePrintToolbar({
    label: 'Acciones del informe',
    pdfName: `informe-contrato-${c.codContrato || 'jornadas'}`,
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
${informeGoogleFontsLinkHtml()}
<title>${esc(titulo)}</title>
<style>
  ${atPage}
  ${toolbar.css}
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  ${informeDocumentoBaseCss()}
  html, body {
    margin: 0; padding: 0;
    background: #fff !important; color: #1a1a1a !important;
    font-size: 9.5pt; line-height: 1.35;
  }
  .doc { max-width: 100%; margin: 0 auto; }
  .doc-titulo-block {
    text-align: center; margin: 12px 0 14px;
    border-top: 1px solid #ccc; border-bottom: 1px solid #ccc;
    padding: 10px 0; background: #f8f9fb;
  }
  .doc-titulo-block h2 {
    margin: 0; font-size: 12pt; text-transform: uppercase; letter-spacing: 1px;
    color: #1e3a5f; font-weight: 700;
  }
  .doc-titulo-block p { margin: 4px 0 0; font-size: 9pt; color: #444; }
  .doc-meta { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9pt; }
  .doc-meta td { padding: 2px 0; vertical-align: top; }
  .doc-meta td:first-child { width: 130px; font-weight: 600; color: #555; }
  .stats {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px;
  }
  .stat {
    border: 1px solid #94a3b8; background: #edf2f7; padding: 8px; text-align: center;
  }
  .stat span { display: block; font-size: 8pt; text-transform: uppercase; color: #1e3a5f; }
  .stat strong { font-size: 12pt; color: #1a1a1a; }
  .destacado-contrato {
    text-align: center; margin: 8px 0 12px;
    display: flex; flex-wrap: wrap; justify-content: center; gap: 16px 28px;
  }
  .destacado-contrato .item { text-align: center; }
  .destacado-contrato .lbl {
    display: block; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.08em;
    color: #1e3a5f; font-weight: 700; margin-bottom: 2px;
  }
  .destacado-contrato .val {
    display: block; font-size: 18pt; font-weight: 800; color: #1a365d;
  }
  .sec-grande {
    margin: 16px 0 8px; padding: 10px 12px;
    background: #1a365d; color: #fff; border-radius: 2px;
    font-size: 12pt; font-weight: 800;
    break-after: avoid; page-break-after: avoid;
  }
  .muted, .sub { color: #64748b; font-size: 9pt; }
  .stats--cinco { grid-template-columns: repeat(5, 1fr); }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 10px 0; }
  .kpi { border: 1px solid #94a3b8; background: #edf2f7; padding: 8px; text-align: center; }
  .kpi span { display:block; font-size: 8pt; text-transform: uppercase; color: #1e3a5f; margin-bottom: 2px; }
  .kpi strong { font-size: 12pt; color: #1a1a1a; }
  .sec { margin: 14px 0 6px; color: #1e3a5f; border-bottom: 1px solid #bbb; padding-bottom: 3px; text-transform: uppercase; font-size: 10pt; }
  h4 { margin: 10px 0 4px; font-size: 10pt; }
  .t { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9pt; }
  .t th, .t td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
  .t th { background: #e2e8f0; }
  .t .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .desarrollo-inst { font-size: 7.5pt; }
  .desarrollo-inst th, .desarrollo-inst td { padding: 3px 4px; }
  .desarrollo-inst tfoot td { background: #e8eef6; }
  .resumen-final { margin-top: 18px; break-inside: avoid; page-break-inside: avoid; }
  .resumen-final h3 { color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 4px; }
  .cruce-jornadas { margin: 12px 0 16px; }
  .cruce-table { font-size: 8pt; }
  .cruce-table tfoot td { background: #e8eef6; }
  .cruce-chart { display: grid; gap: 9px; margin: 8px 0 14px; }
  .cruce-chart-row { break-inside: avoid; page-break-inside: avoid; }
  .cruce-chart-row > strong { display: block; margin-bottom: 3px; color: #334155; font-size: 8pt; }
  .cruce-series { display: grid; gap: 2px; }
  .cruce-serie { display: grid; grid-template-columns: 54px 1fr 28px; gap: 5px; align-items: center; font-size: 7pt; }
  .cruce-serie span { color: #64748b; }
  .cruce-serie b { text-align: right; font-variant-numeric: tabular-nums; }
  .cruce-track { height: 9px; overflow: hidden; border-radius: 5px; background: #e2e8f0; }
  .cruce-track i { display: block; height: 100%; border-radius: inherit; }
  .cruce-bar--alumnos { background: #0284c7; }
  .cruce-bar--clases { background: #0f766e; }
  .cruce-bar--programas { background: #7c3aed; }
  .chart-t { margin-top: 6px; font-size: 8pt; }
  .chart-t tfoot td { font-weight: 700; background: #f1f5f9; }
  .chart-section-title { margin: 12px 0 6px; padding: 6px 10px; border-left: 4px solid #1e3a5f; border-radius: 0 6px 6px 0; background: linear-gradient(90deg, #e2eaf5, #f4f7fb); color: #1e3a5f; font-size: 11pt; text-transform: uppercase; letter-spacing: .03em; break-after: avoid; page-break-after: avoid; }
  .chart-section-title--sub { margin-top: 10px; font-size: 10pt; border-left-width: 3px; background: linear-gradient(90deg, #eef2f7, #fafbfc); color: #334155; }
  .jornada-section-title { margin: 18px 0 4px; padding: 10px 12px; border-left: 5px solid #0f766e; border-radius: 0 8px 8px 0; background: linear-gradient(90deg, #d7efe9, #eefaf7); color: #134e4a; font-size: 12pt; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; box-shadow: 0 1px 3px rgba(15,23,42,.08); break-after: avoid; page-break-after: avoid; }
  .jornada-section-sub { margin: 0 0 10px 12px; font-size: 9pt; color: #475569; }
  .programa-section-title { margin: 18px 0 4px; padding: 10px 12px; border-left: 5px solid #7c3aed; border-radius: 0 8px 8px 0; background: linear-gradient(90deg, #ede9fe, #f7f5ff); color: #5b21b6; font-size: 12pt; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; box-shadow: 0 1px 3px rgba(15,23,42,.08); break-after: avoid; page-break-after: avoid; }
  .programa-section-sub { margin: 0 0 10px 12px; font-size: 9pt; color: #64748b; }
  .clase-section-title { margin: 12px 0 4px; padding: 8px 11px; border-left: 4px solid #b45309; border-radius: 0 6px 6px 0; background: linear-gradient(90deg, #fdecd7, #fff8ef); color: #9a3412; font-size: 10.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; break-after: avoid; page-break-after: avoid; }
  .clase-section-sub { margin: 0 0 8px 11px; font-size: 8.5pt; color: #64748b; }
  .page-break { break-after: page; page-break-after: always; height: 0; }
  .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0 16px; }
  .charts-grid--compact { gap: 8px; margin: 6px 0 10px; }
  .charts-grid--compact .chart-card { padding: 6px 8px 7px; }
  .charts-grid--compact .chart-hint { margin: 0 0 4px; font-size: 7pt; }
  .charts-grid--compact .bars { min-height: 84px; }
  .charts-grid--compact .pie-wrap { grid-template-columns: 74px 1fr; }
  .charts-grid--compact .pie-visual { width: 74px; height: 74px; }
  .charts-grid--compact .chart-t { margin-top: 4px; font-size: 7pt; }
  .charts-grid--compact .chart-t th, .charts-grid--compact .chart-t td { padding: 2px 5px; }
  .chart-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px 10px; background: #fff; box-shadow: 0 1px 4px rgba(15,23,42,.07); break-inside: avoid; page-break-inside: avoid; }
  .chart-card .sec { margin-top: 0; margin-bottom: 4px; font-size: 9pt; border-bottom: none; color: #1e3a5f; }
  .chart-hint { margin: 0 0 8px; font-size: 7.5pt; color: #64748b; }
  .bars { display: flex; align-items: flex-end; gap: 8px; min-height: 110px; margin: 4px 0 8px; }
  .bar { flex: 1; text-align: center; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 3px; }
  .bar-fill { width: 100%; max-width: 36px; border-radius: 3px 3px 0 0; }
  .bar-val { display: flex; flex-direction: column; align-items: center; line-height: 1.05; font-size: 7.5pt; }
  .bar-val strong { font-weight: 800; color: #0f172a; }
  .bar-val em { font-style: normal; font-weight: 700; color: #0369a1; font-size: 7pt; }
  .bar-lbl { font-size: 7pt; color: #555; word-break: break-word; max-width: 70px; }
  .pie-wrap { display: grid; grid-template-columns: 88px 1fr; gap: 10px; align-items: center; margin: 4px 0 8px; }
  .pie-visual { position: relative; width: 88px; height: 88px; }
  .pie-svg { width: 100%; height: 100%; }
  .pie-svg path { stroke: #fff; stroke-width: 0.7; }
  .pie-lbl { fill: #fff; font-size: 5.2px; font-weight: 800; paint-order: stroke; stroke: rgba(15,23,42,.65); stroke-width: .55px; }
  .pie-center { position: absolute; inset: 28%; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; pointer-events:none; }
  .pie-center strong { font-size: 9pt; line-height: 1.05; color: #0f172a; }
  .pie-center span { font-size: 6pt; text-transform: uppercase; color: #64748b; letter-spacing: .03em; }
  .pie-legend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; font-size: 7.5pt; }
  .pie-legend li { display: grid; grid-template-columns: 8px minmax(0,1fr) auto auto; gap: 4px; align-items: center; }
  .pie-legend strong { font-variant-numeric: tabular-nums; }
  .pie-legend em { font-style: normal; color: #64748b; font-variant-numeric: tabular-nums; min-width: 2.2rem; text-align: right; }
  .leg-lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #334155; }
  .swatch { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px; vertical-align: middle; }
  .hbars { display: flex; flex-direction: column; gap: 5px; margin: 4px 0 8px; }
  .hbar-row { display: grid; grid-template-columns: 72px 1fr 36px; gap: 5px; align-items: center; }
  .hbar-lbl { font-size: 7pt; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hbar-track { height: 8px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
  .hbar-track i { display: block; height: 100%; border-radius: 999px; min-width: 2px; }
  .hbar-meta { text-align: right; line-height: 1.05; }
  .hbar-meta strong { display: block; font-size: 7.5pt; }
  .hbar-meta em { font-style: normal; font-size: 6.5pt; color: #0369a1; font-weight: 700; }
  .stack-wrap { margin: 4px 0 8px; }
  .stack-bar { display: flex; height: 14px; border-radius: 999px; overflow: hidden; background: #e2e8f0; margin-bottom: 6px; }
  .stack-seg { display: block; min-width: 2px; }
  .ranks { display: flex; flex-direction: column; gap: 5px; margin: 4px 0 8px; }
  .rank-row { display: grid; grid-template-columns: 16px 1fr; gap: 5px; align-items: start; }
  .rank-n { width: 14px; height: 14px; border-radius: 3px; background: #38bdf8; color: #fff; font-size: 7pt; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .rank-top { display: flex; gap: 4px; align-items: baseline; font-size: 7pt; margin-bottom: 2px; }
  .rank-top span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #334155; }
  .rank-top b { font-variant-numeric: tabular-nums; }
  .rank-top em { font-style: normal; color: #0369a1; font-weight: 700; font-size: 6.5pt; }
  .rank-track { height: 5px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
  .rank-track i { display: block; height: 100%; border-radius: 999px; min-width: 2px; }
  @media print { .charts-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 700px) { .charts-grid { grid-template-columns: 1fr; } }
  .doc-footer {
    margin-top: 18px; padding-top: 10px; border-top: 1px solid #ccc;
    font-size: 8pt; color: #666; text-align: center;
  }
  @media print { body { padding: 0 !important; } .no-print { display: none !important; } }
  @media screen {
    body { padding: 12px 16px 24px; background: #e5e7eb !important; }
    .doc { background: #fff; padding: 14mm 12mm; box-shadow: 0 4px 24px rgba(0,0,0,.15); }
  }
</style>
</head>
<body>
  ${toolbar.html}
  <div class="doc">
  ${encabezadoFormal}
  ${chartsBlock}
  ${resumenComplementario}
  ${cruceJornadasBlock}
  ${saltoAntesDetalle}
  ${cuerpo || '<p class="muted">No hay datos para el alcance seleccionado.</p>'}
  <div class="doc-footer">
    Generado el ${esc(generado)}.
    Documento de seguimiento de capacitación — uso empresarial.
  </div>
  </div>
  ${toolbar.script}
</body>
</html>`;
}

module.exports = {
  obtenerDashboardInformeContrato,
  buildHtmlInformeContratoPdf,
  alcanceTitulo,
};
