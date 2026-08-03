const Contratacion = require('../models/Contratacion');
const JornadaCap = require('../models/JornadaCap');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const AsisClasJorCap = require('../models/AsisClasJorCap');
const InscripcionClase = require('../models/InscripcionClase');
const DatosAlumno = require('../models/DatosAlumno');
const { enriquecerClases } = require('./instructorJornada');
const { obtenerConfigRecibo } = require('./configRecibo');
const { esc } = require('./reciboHtmlShared');
const { informeGoogleFontsLinkHtml, informeDocumentoBaseCss, htmlEncabezadoEmpresa } = require('./informeEncabezadoEmpresa');
const { fmtFecha, fmtFechaSolo } = require('../utils/timezoneColombia');
const { informePrintToolbar } = require('./informePrintToolbar');

function fmtHoraCorta(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleTimeString('es-CO', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

function nombreAlumno(al) {
  if (!al) return '';
  return [al.nombre1, al.nombre2, al.apellido1, al.apellido2].filter(Boolean).join(' ').trim();
}

function docKey(n) {
  const num = Number(n);
  return Number.isFinite(num) ? num : String(n ?? '').trim();
}

/** Asistencias de la clase (ObjectId o string legacy). */
async function asistenciasDeClase(idClase) {
  const sid = String(idClase);
  return AsisClasJorCap.find({
    $or: [{ idclaseJornada: idClase }, { idclaseJornada: sid }],
  }).lean();
}

/**
 * HTML imprimible: listado de asistencia de una clase de jornada.
 * Incluye columna de firma en blanco para uso en campo.
 * La columna «Asistió» muestra Sí + hora cuando hay registro digital (admin e instructor).
 */
async function buildHtmlListadoAsistenciaClase(idClase, idSede) {
  const claseRaw = await ClaseJornadaCap.findById(idClase).lean();
  if (!claseRaw) {
    const err = new Error('Clase no encontrada');
    err.status = 404;
    throw err;
  }

  const jornada = await JornadaCap.findById(claseRaw.idJornada).lean();
  let contrato = null;
  if (jornada?.idContrato) {
    contrato = await Contratacion.findById(jornada.idContrato)
      .select('codContrato nombreComercial razoSocial')
      .lean();
  }

  const codContrato = String(contrato?.codContrato || '').trim();
  const cliente = String(contrato?.nombreComercial || contrato?.razoSocial || '').trim();
  const contratoLabel = codContrato
    ? `${codContrato}${cliente ? ` — ${cliente}` : ''}`
    : cliente || '—';

  const [clase] = await enriquecerClases([
    {
      ...claseRaw,
      fechaJornada: jornada?.fechaProgramacion,
      municipioJornada: jornada?.municipio,
      codContrato,
      contratoLabel,
      clienteNombre: cliente,
    },
  ]);

  const idClaseStr = String(claseRaw._id);
  const inscripciones = await InscripcionClase.find({
    $or: [{ idClase: claseRaw._id }, { idClase: idClaseStr }],
  })
    .sort({ createdAt: 1 })
    .lean();
  const docs = [
    ...new Set(
      inscripciones.map((i) => docKey(i.numDoc)).filter((n) => n !== '' && n != null),
    ),
  ];
  const alumnos = docs.length
    ? await DatosAlumno.find({ numDoc: { $in: docs } }).lean()
    : [];
  const mapAlu = new Map(alumnos.map((a) => [docKey(a.numDoc), a]));
  const asistencias = await asistenciasDeClase(claseRaw._id);
  const mapAsis = new Map();
  for (const a of asistencias) {
    mapAsis.set(docKey(a.numDocAlumno), a);
  }

  const filas = [];
  const vistos = new Set();
  for (let idx = 0; idx < inscripciones.length; idx++) {
    const ins = inscripciones[idx];
    const nd = docKey(ins.numDoc);
    vistos.add(nd);
    const al = mapAlu.get(nd);
    const asis = mapAsis.get(nd);
    filas.push({
      n: filas.length + 1,
      numDoc: nd,
      nombre: nombreAlumno(al) || '—',
      asistio: !!asis,
      horaAsis: asis?.createdAt ? fmtHoraCorta(asis.createdAt) : '',
    });
  }
  // Alumnos con asistencia pero sin fila de inscripción (datos legacy / sync).
  for (const [nd, asis] of mapAsis) {
    if (vistos.has(nd)) continue;
    let al = mapAlu.get(nd);
    if (!al) {
      al = await DatosAlumno.findOne({ numDoc: nd }).lean();
    }
    filas.push({
      n: filas.length + 1,
      numDoc: nd,
      nombre: nombreAlumno(al) || '—',
      asistio: true,
      horaAsis: asis?.createdAt ? fmtHoraCorta(asis.createdAt) : '',
    });
  }

  const config = await obtenerConfigRecibo(idSede);
  const { atPageCssPara } = require('./configPaginasInformes');
  // Carta (letter) vertical — independiente del A4 apaisado de otros listados de jornadas.
  const atPage = await atPageCssPara('listado_asistencia_clase');

  const fechaClase = clase.fechaClase || jornada?.fechaProgramacion;
  const horaInicio = fmtHoraCorta(clase.horaInicio);
  const horaFin = fmtHoraCorta(clase.horaFin);
  const horario =
    horaInicio || horaFin
      ? `${horaInicio || '—'} → ${horaFin || '—'}`
      : '—';

  const conAsistencia = filas.filter((f) => f.asistio).length;
  const generacion = fmtFecha(new Date());
  const toolbar = informePrintToolbar({
    label: 'Acciones del listado',
    pdfName: `listado-asistencia-${codContrato || 'clase'}`,
  });

  const filasHtml = filas.length
    ? filas
        .map((f) => {
          const asisTxt = f.asistio
            ? `Sí${f.horaAsis ? ` ${esc(f.horaAsis)}` : ''}`
            : 'Pendiente';
          return `<tr>
      <td class="n">${f.n}</td>
      <td class="doc">${esc(String(f.numDoc))}</td>
      <td class="nom">${esc(f.nombre)}</td>
      <td class="asis ${f.asistio ? 'asis-si' : 'asis-no'}">${asisTxt}</td>
      <td class="firma"></td>
    </tr>`;
        })
        .join('\n')
    : `<tr><td colspan="5" class="empty">Sin alumnos inscritos en esta clase.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  ${informeGoogleFontsLinkHtml()}
  <title>Listado de asistencia — ${esc(contratoLabel)}</title>
  <style>
    ${atPage}
    ${toolbar.css}
    ${informeDocumentoBaseCss()}
    * { box-sizing: border-box; }
    body {
      font-size: 10pt;
      line-height: 1.35;
      color: #111;
      margin: 0;
      padding: 12px 14px 18px;
      width: 100%;
      max-width: 216mm;
    }
    h1 {
      font-family: 'Exo', 'Roboto', sans-serif;
      font-size: 14pt;
      margin: 14px 0 8px;
      text-align: center;
      letter-spacing: 0.02em;
    }
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 16px;
      margin: 0 0 14px;
      font-size: 9.5pt;
    }
    .meta .k { color: #555; font-weight: 600; }
    .meta .v { font-weight: 500; }
    .meta .full { grid-column: 1 / -1; }
    .resumen {
      margin: 0 0 10px;
      font-size: 9.5pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    th, td {
      border: 1px solid #222;
      padding: 5px 6px;
      vertical-align: middle;
    }
    th {
      background: #f0f0f0;
      font-weight: 700;
      text-align: left;
    }
    td.n { width: 28px; text-align: center; }
    td.doc { width: 90px; white-space: nowrap; }
    td.asis {
      width: 88px;
      text-align: center;
      white-space: nowrap;
      font-weight: 700;
    }
    td.asis-si { color: #047857; background: #ecfdf5; }
    td.asis-no { color: #64748b; font-weight: 500; }
    td.firma { height: 28px; min-width: 120px; }
    td.empty { text-align: center; color: #666; padding: 16px; }
    .firmas-pie {
      display: flex;
      gap: 40px;
      margin-top: 28px;
    }
    .firmas-pie .bloque {
      flex: 1;
      text-align: center;
      font-size: 9pt;
    }
    .firmas-pie .linea {
      border-top: 1px solid #000;
      margin: 40px 12px 6px;
    }
    .pie {
      margin-top: 18px;
      font-size: 8pt;
      color: #666;
      text-align: right;
    }
    @media print {
      body { padding: 0; max-width: none; }
      td.asis-si { background: #ecfdf5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${toolbar.html}
  ${htmlEncabezadoEmpresa(config, esc)}
  <h1>LISTADO DE ASISTENCIA</h1>
  <div class="meta">
    <div class="full"><span class="k">Contrato:</span> <span class="v">${esc(contratoLabel)}</span></div>
    <div><span class="k">Fecha:</span> <span class="v">${esc(fechaClase ? fmtFechaSolo(fechaClase) : '—')}</span></div>
    <div><span class="k">Estado clase:</span> <span class="v">${esc(clase.estado || '—')}</span></div>
    <div class="full"><span class="k">Programa:</span> <span class="v">${esc(clase.programaNombre || clase.idPrograma || '—')}</span></div>
    <div><span class="k">Instructor:</span> <span class="v">${esc(clase.instructorNombre || '—')}</span></div>
    <div><span class="k">Horario:</span> <span class="v">${esc(horario)}</span></div>
    <div><span class="k">Ubicación:</span> <span class="v">${esc(clase.ubicacion || '—')}</span></div>
    <div><span class="k">Municipio:</span> <span class="v">${esc(clase.municipioJornada || jornada?.municipio || '—')}</span></div>
    ${clase.carpaNombre ? `<div class="full"><span class="k">Carpa:</span> <span class="v">${esc(clase.carpaNombre)}</span></div>` : ''}
  </div>
  <p class="resumen">
    Inscritos: <strong>${filas.length}</strong>
    · Con asistencia registrada: <strong>${conAsistencia}</strong>
    · Pendientes: <strong>${filas.length - conAsistencia}</strong>
  </p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Documento</th>
        <th>Nombre completo</th>
        <th>Asistió</th>
        <th>Firma</th>
      </tr>
    </thead>
    <tbody>
      ${filasHtml}
    </tbody>
  </table>
  <div class="firmas-pie">
    <div class="bloque">
      <div class="linea"></div>
      <div>Instructor</div>
      <div>${esc(clase.instructorNombre || '')}</div>
    </div>
    <div class="bloque">
      <div class="linea"></div>
      <div>Supervisor / responsable</div>
    </div>
  </div>
  <p class="pie">Generado ${esc(generacion)} · ARGO</p>
  ${toolbar.script}
</body>
</html>`;
}

module.exports = {
  buildHtmlListadoAsistenciaClase,
  asistenciasDeClase,
};
