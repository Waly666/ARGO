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
const { TIPO_CERTIFICADO_POR_CLASE } = require('../constants/jornadaCapacitacion');

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

  let jornadasQ = { idContrato };
  if (idJornadaF) jornadasQ._id = idJornadaF;
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
      certificado: certDocs.has(a.numDoc) || (certPorAlumno.get(a.numDoc) || []).length > 0,
    }));
    if (!esPorClase) {
      alumnosConFlag.forEach((a) => {
        if ((certPorAlumno.get(a.numDoc) || []).some((x) => !x.idClaseJornada)) {
          a.certificado = true;
          alumnosCertificados.add(a.numDoc);
        }
      });
    }
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
      alumnosInscritos: alumnosConFlag.length,
      alumnosCertificados: alumnosConFlag.filter((a) => a.certificado).length,
      alumnos: alumnosConFlag.sort((a, b) =>
        a.nombreCompleto.localeCompare(b.nombreCompleto, 'es', { sensitivity: 'base' }),
      ),
    });
  }

  const porJornada = jornadas.map((j) => {
    const jid = String(j._id);
    const clasesJ = porClase.filter((c) => c.idJornada === jid);
    const alumnosSet = new Set();
    const certSet = new Set();
    for (const c of clasesJ) {
      c.alumnos.forEach((a) => {
        alumnosSet.add(a.numDoc);
        if (a.certificado) certSet.add(a.numDoc);
      });
    }
    return {
      _id: jid,
      fechaProgramacion: j.fechaProgramacion,
      fechaLabel: fmtFechaSolo(j.fechaProgramacion) || '—',
      municipio: j.municipio || '',
      direccion: j.direccion || '',
      estado: j.estado || '',
      indiceEnDia: j.indiceEnDia || 1,
      numClases: clasesJ.length,
      clasesFinalizadas: clasesJ.filter((c) => String(c.estado).toUpperCase() === 'FINALIZADO').length,
      alumnosCapacitados: alumnosSet.size,
      alumnosCertificados: certSet.size,
      clases: clasesJ,
    };
  });

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
      });
    }
    const row = instMap.get(key);
    row.numClases += 1;
    if (String(c.estado).toUpperCase() === 'FINALIZADO') row.clasesDictadas += 1;
    c.alumnos.forEach((a) => row.alumnos.add(a.numDoc));
  }
  const porInstructor = [...instMap.values()]
    .map((r) => ({
      idEmpleadoInstructor: r.idEmpleadoInstructor,
      instructorNombre: r.instructorNombre,
      numClases: r.numClases,
      clasesDictadas: r.clasesDictadas,
      alumnosCapacitados: r.alumnos.size,
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
      /** Preferir data URL embebida para PDF/Chromium (ruta relativa no carga en page.setContent). */
      logoUrl: config?.urlLogoDataUrl || '',
      urlLogo: config?.urlLogo || '',
    },
    filtros: {
      idJornada: idJornadaF ? String(idJornadaF) : null,
      idClase: idClaseF ? String(idClaseF) : null,
      idPrograma: idProgramaF || null,
      idInstructor: Number.isFinite(idInstructorF) ? idInstructorF : null,
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
    },
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
      return `Clases dictadas por instructor — ${data.porInstructor[0]?.instructorNombre || ''}`.trim();
    default:
      return 'Informe de capacitación del contrato';
  }
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
  '#6366f1',
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

function htmlChartsDashboard(charts) {
  const c = charts || {};
  return `<div class="charts-grid">
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
      ${htmlPieChart(c.alumnosPorPrograma || [], { kind: 'programa', colLabel: 'Programa', colValue: 'Alumnos', unit: 'alumnos' })}
    </section>
    <section class="chart-card">
      <h3 class="sec">Clases dictadas por instructor</h3>
      <p class="chart-hint">Participación sobre el total de clases dictadas del gráfico.</p>
      ${htmlBarChart(c.clasesPorInstructor || [], { colLabel: 'Instructor', colValue: 'Clases', colorOffset: 4 })}
    </section>
  </div>`;
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
  const logoSrc = emp.logoUrl || emp.urlLogoDataUrl || '';
  const logo = logoSrc
    ? `<img class="logo" src="${esc(logoSrc)}" alt="${esc(emp.nombre || 'Logo')}" />`
    : `<div class="logo-ph">${esc((emp.nombre || 'ARGO').slice(0, 2).toUpperCase())}</div>`;

  let cuerpo = '';

  if (alcance === 'instructor') {
    cuerpo += `<h3 class="sec">Clases dictadas por instructor</h3>`;
    for (const inst of data.porInstructor || []) {
      const clases = (data.porClase || []).filter(
        (cl) =>
          (inst.idEmpleadoInstructor != null &&
            Number(cl.idEmpleadoInstructor) === Number(inst.idEmpleadoInstructor)) ||
          cl.instructorNombre === inst.instructorNombre,
      );
      cuerpo += `<h4>${esc(inst.instructorNombre)} — ${inst.clasesDictadas} dictada(s) / ${inst.numClases} clase(s) · ${inst.alumnosCapacitados} alumno(s)</h4>`;
      for (const cl of clases) {
        cuerpo += `<p class="sub"><strong>${esc(cl.fechaLabel)}</strong> · ${esc(cl.programaNombre)} · ${esc(cl.estado)}</p>`;
        cuerpo += htmlTablaAlumnos(cl.alumnos);
      }
    }
  } else if (alcance === 'programa') {
    for (const p of data.porPrograma || []) {
      cuerpo += `<h3 class="sec">${esc(p.programaNombre)}</h3>`;
      cuerpo += `<p>${p.numClases} clase(s) · ${p.alumnosCapacitados} capacitado(s) · ${p.alumnosCertificados} certificado(s)</p>`;
      const clases = (data.porClase || []).filter((cl) => cl.idPrograma === p.idPrograma);
      for (const cl of clases) {
        cuerpo += `<p class="sub"><strong>${esc(cl.fechaLabel)}</strong> · ${esc(cl.instructorNombre)} · ${esc(cl.estado)}</p>`;
        cuerpo += htmlTablaAlumnos(cl.alumnos);
      }
    }
  } else if (alcance === 'clase') {
    for (const cl of data.porClase || []) {
      cuerpo += `<h3 class="sec">Clase · ${esc(cl.programaNombre)}</h3>`;
      cuerpo += `<p>${esc(cl.fechaLabel)} · Instructor: ${esc(cl.instructorNombre)} · Estado: ${esc(cl.estado)}</p>`;
      cuerpo += htmlTablaAlumnos(cl.alumnos);
    }
  } else {
    // contrato o jornada
    for (const j of data.porJornada || []) {
      cuerpo += `<h3 class="sec">Jornada ${esc(j.fechaLabel)}${j.municipio ? ` — ${esc(j.municipio)}` : ''}</h3>`;
      cuerpo += `<p>${j.numClases} clase(s) · ${j.alumnosCapacitados} capacitado(s) · ${j.alumnosCertificados} certificado(s) · Estado: ${esc(j.estado)}</p>`;
      for (const cl of j.clases || []) {
        cuerpo += `<h4>Clase ${cl.indiceClaseEnJornada}: ${esc(cl.programaNombre)} · ${esc(cl.instructorNombre)}</h4>`;
        cuerpo += htmlTablaAlumnos(cl.alumnos);
      }
    }
  }

  const chartsBlock =
    alcance === 'contrato' ? htmlChartsDashboard(data.charts) : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>${esc(titulo)}</title>
<style>
  ${atPage}
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; font-size: 10pt; }
  .hdr { display: flex; gap: 14px; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 12px; }
  .logo { max-height: 64px; max-width: 160px; object-fit: contain; }
  .logo-ph { width: 56px; height: 56px; border: 2px solid #1e3a5f; border-radius: 6px; display:flex; align-items:center; justify-content:center; font-weight:800; color:#1e3a5f; }
  h1 { margin: 0 0 4px; font-size: 14pt; color: #1e3a5f; }
  .muted, .sub { color: #555; font-size: 9pt; }
  .titulo { text-align: center; margin: 12px 0; padding: 10px; background: #f8f9fb; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; }
  .titulo h2 { margin: 0; font-size: 12pt; text-transform: uppercase; color: #1e3a5f; letter-spacing: .06em; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
  .kpi { border: 1px solid #94a3b8; background: #edf2f7; padding: 8px; text-align: center; }
  .kpi span { display:block; font-size: 8pt; text-transform: uppercase; color: #1e3a5f; }
  .kpi strong { font-size: 14pt; }
  .sec { margin: 14px 0 6px; color: #1e3a5f; border-bottom: 1px solid #bbb; padding-bottom: 3px; text-transform: uppercase; font-size: 10pt; }
  h4 { margin: 10px 0 4px; font-size: 10pt; }
  .t { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9pt; }
  .t th, .t td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
  .t th { background: #e2e8f0; }
  .t .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .chart-t { margin-top: 6px; font-size: 8pt; }
  .chart-t tfoot td { font-weight: 700; background: #f1f5f9; }
  .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0 16px; }
  .chart-card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px 10px; background: #fff; break-inside: avoid; page-break-inside: avoid; }
  .chart-card .sec { margin-top: 2px; font-size: 9pt; }
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
  .ftr { margin-top: 18px; font-size: 8pt; color: #666; border-top: 1px solid #ddd; padding-top: 8px; }
  @media print {
    .no-print { display: none !important; }
    .charts-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 700px) {
    .charts-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
  <header class="hdr">
    ${logo}
    <div>
      <h1>${esc(emp.nombre || 'Centro de Capacitación')}</h1>
      <p class="muted">${[emp.nit && `NIT ${emp.nit}`, emp.ciudad, emp.direccion, emp.telefono].filter(Boolean).map(esc).join(' · ')}</p>
    </div>
  </header>
  <div class="titulo">
    <h2>${esc(titulo)}</h2>
    <p class="muted">Presentado a: <strong>${esc(c.cliente || 'Empresa contratante')}</strong>${c.nit ? ` · NIT ${esc(c.nit)}` : ''}</p>
    <p class="muted">Contrato <strong>${esc(c.codContrato || c._id)}</strong>${c.ciudad ? ` · ${esc(c.ciudad)}` : ''}</p>
  </div>
  <div class="kpis">
    <div class="kpi"><span>Jornadas</span><strong>${k.jornadas || 0}</strong></div>
    <div class="kpi"><span>Clases dictadas</span><strong>${k.clasesDictadas || 0}/${k.clasesTotales || 0}</strong></div>
    <div class="kpi"><span>Alumnos capacitados</span><strong>${k.alumnosCapacitados || 0}</strong></div>
    <div class="kpi"><span>Alumnos certificados</span><strong>${k.alumnosCertificados || 0}</strong></div>
  </div>
  ${chartsBlock}
  ${cuerpo || '<p class="muted">No hay datos para el alcance seleccionado.</p>'}
  <div class="ftr">
    Generado el ${esc(fmtFechaSolo(data.generadoAt) || new Date().toLocaleDateString('es-CO'))}.
    Documento de seguimiento de capacitación — uso empresarial.
  </div>
</body>
</html>`;
}

module.exports = {
  obtenerDashboardInformeContrato,
  buildHtmlInformeContratoPdf,
  alcanceTitulo,
};
