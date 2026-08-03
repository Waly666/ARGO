const Contratacion = require('../models/Contratacion');
const { resultadosEncuesta } = require('./encuestasJornadaCap');
const { obtenerConfigRecibo } = require('./configRecibo');
const { atPageCssPara } = require('./configPaginasInformes');
const {
  informePrintToolbarCss,
  informePrintToolbarHtml,
  informePrintToolbarScript,
} = require('./informePrintToolbar');
const {
  informeGoogleFontsLinkHtml,
  informeDocumentoBaseCss,
  htmlEncabezadoEmpresa,
} = require('./informeEncabezadoEmpresa');

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtNota(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return String(Math.round(n * 100) / 100);
}

const ASPECT_COLORS = {
  claridad: '#38bdf8',
  utilidad: '#34d399',
  instructor: '#a78bfa',
  organizacion: '#fbbf24',
  recomendaria: '#fb7185',
};

const SAT_COLORS = {
  Excelente: '#34d399',
  Buena: '#38bdf8',
  Regular: '#fbbf24',
  'Necesita mejorar': '#fb7185',
};

const PALETTE = [
  '#38bdf8',
  '#34d399',
  '#a78bfa',
  '#818cf8',
  '#fb7185',
  '#2dd4bf',
  '#60a5fa',
  '#c084fc',
  '#f472b6',
  '#4ade80',
];

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
  return [
    `M ${x0} ${y0}`,
    `A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`,
    `L ${xi0} ${yi0}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${xi1} ${yi1}`,
    'Z',
  ].join(' ');
}

function truncLabel(text, max = 36) {
  const t = String(text || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function fmtPct(n) {
  if (!Number.isFinite(Number(n))) return '0%';
  return `${Math.round(Number(n) * 10) / 10}%`;
}

function etiquetaSatisfaccion(prom) {
  const n = Number(prom);
  if (!Number.isFinite(n)) return '—';
  if (n >= 4.5) return 'Excelente';
  if (n >= 3.5) return 'Buena';
  if (n >= 2.5) return 'Regular';
  return 'Necesita mejorar';
}

function calcularKpis(res) {
  const proms = [];
  const instructores = new Set();
  for (const f of res.filas || []) {
    for (const c of f.calificacionesCarpa || []) {
      if (c.promedio != null && Number.isFinite(Number(c.promedio))) {
        proms.push(Number(c.promedio));
      }
      if (c.instructorNombre) instructores.add(String(c.instructorNombre).trim());
    }
  }
  const promedioGlobal = proms.length
    ? Math.round((proms.reduce((a, b) => a + b, 0) / proms.length) * 100) / 100
    : null;
  return {
    respuestas: res.totalRespuestas ?? 0,
    promedioGlobal,
    capacitaciones: res.promediosCarpa?.length ?? 0,
    instructores: instructores.size,
    evaluaciones: proms.length,
  };
}

function calcularAspectosGlobales(res) {
  const aspectos = res.aspectos?.length ? res.aspectos : [];
  const acum = new Map(aspectos.map((a) => [a.key, { label: a.label, sum: 0, n: 0 }]));
  for (const f of res.filas || []) {
    for (const c of f.calificacionesCarpa || []) {
      for (const asp of aspectos) {
        const v = Number(c.aspectos?.[asp.key]);
        if (v >= 1 && v <= 5) {
          const row = acum.get(asp.key);
          row.sum += v;
          row.n += 1;
        }
      }
    }
  }
  return aspectos.map((asp) => {
    const row = acum.get(asp.key);
    const value = row.n ? Math.round((row.sum / row.n) * 100) / 100 : null;
    return {
      key: asp.key,
      label: row.label,
      value,
      color: ASPECT_COLORS[asp.key] || PALETTE[0],
      pctBar: value != null ? Math.max(8, Math.round((value / 5) * 100)) : 0,
    };
  });
}

function calcularSatisfaccion(res) {
  const buckets = new Map([
    ['Excelente', 0],
    ['Buena', 0],
    ['Regular', 0],
    ['Necesita mejorar', 0],
  ]);
  for (const f of res.filas || []) {
    for (const c of f.calificacionesCarpa || []) {
      if (c.promedio == null) continue;
      const b = etiquetaSatisfaccion(c.promedio);
      if (buckets.has(b)) buckets.set(b, buckets.get(b) + 1);
    }
  }
  const totalRaw = [...buckets.values()].reduce((a, b) => a + b, 0);
  const total = totalRaw || 1;
  const cx = 50;
  const cy = 50;
  const r = 36;
  const rInner = 20;
  const rLabel = (r + rInner) / 2;
  let angle = -Math.PI / 2;
  const list = [...buckets.entries()].filter(([, v]) => v > 0);
  const slices = list.map(([label, value], i) => {
    const pct = Math.round((value / total) * 1000) / 10;
    const sweep = (value / total) * Math.PI * 2;
    const a0 = angle;
    const a1 = angle + sweep;
    const aMid = a0 + sweep / 2;
    angle = a1;
    return {
      label,
      value,
      pct,
      color: SAT_COLORS[label] || PALETTE[i % PALETTE.length],
      path: donutSlicePath(cx, cy, r, rInner, a0, a1),
      labelX: cx + rLabel * Math.cos(aMid),
      labelY: cy + rLabel * Math.sin(aMid),
      showLabel: pct >= 10 || sweep >= 0.45,
    };
  });
  return { total: totalRaw, slices };
}

function buildRadarData(aspectos) {
  const cx = 50;
  const cy = 50;
  const rad = 38;
  const n = aspectos.length || 1;
  const points = aspectos.map((it, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const dist = ((Number(it.value) || 0) / 5) * rad;
    return {
      label: it.label,
      value: it.value,
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
      axisX: cx + rad * Math.cos(angle),
      axisY: cy + rad * Math.sin(angle),
    };
  });
  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ');
  const grid = [0.25, 0.5, 0.75, 1].map((scale) =>
    aspectos
      .map((_, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const dist = scale * rad;
        return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`;
      })
      .join(' '),
  );
  return { points, polygon, grid };
}

function buildRankingItems(res) {
  return (res.promediosCarpa || [])
    .filter((c) => c.promedioGeneral != null && Number.isFinite(Number(c.promedioGeneral)))
    .sort((a, b) => Number(b.promedioGeneral) - Number(a.promedioGeneral))
    .slice(0, 12)
    .map((c, i) => ({
      label: truncLabel(c.programaNombre || c.nombre, 36),
      sublabel: c.instructorNombre || 'Sin instructor',
      value: Number(c.promedioGeneral),
      pctBar: Math.max(8, Math.round((Number(c.promedioGeneral) / 5) * 100)),
      color: PALETTE[i % PALETTE.length],
    }));
}

/** Contrato con pocos programas: gráficos más compactos para caber en menos páginas. */
function esInformePequeno(res) {
  const nCap = (res.promediosCarpa || []).length;
  const nResp = Number(res.totalRespuestas) || 0;
  return nCap <= 5 && nResp <= 40;
}

function htmlBarRow(label, value, color = '#1e3a5f') {
  const v = Number(value);
  const pct = Number.isFinite(v) ? Math.max(v > 0 ? 8 : 0, Math.round((v / 5) * 100)) : 0;
  return `
    <div class="hbar">
      <span class="hbar-lbl">${esc(label)}</span>
      <div class="hbar-track"><div class="hbar-fill" style="width:${pct}%;background:${color}"></div></div>
      <span class="hbar-val">${fmtNota(v)}/5</span>
    </div>`;
}

function htmlChartAspectos(aspectos) {
  if (!aspectos.length) return '<p class="muted">Sin datos</p>';
  return `<div class="hbars">${aspectos.map((a) => htmlBarRow(a.label, a.value, a.color)).join('')}</div>`;
}

function htmlChartRadar(aspectos) {
  const radar = buildRadarData(aspectos);
  if (!radar.points.length) return '<p class="muted">Sin datos</p>';
  const gridPaths = radar.grid.map((ring) => `<polygon points="${ring}" class="radar-grid"/>`).join('');
  const axes = radar.points
    .map((p) => `<line x1="50" y1="50" x2="${p.axisX}" y2="${p.axisY}" class="radar-axis"/>`)
    .join('');
  const dots = radar.points
    .map(
      (p) =>
        `<circle cx="${p.x}" cy="${p.y}" r="2.2" class="radar-dot"><title>${esc(p.label)}: ${fmtNota(p.value)}/5</title></circle>`,
    )
    .join('');
  const legend = radar.points
    .map((p) => `<li><strong>${fmtNota(p.value)}</strong> ${esc(p.label)}</li>`)
    .join('');
  return `
    <div class="radar-wrap">
      <svg viewBox="0 0 100 100" class="radar-svg" role="img" aria-label="Radar de aspectos">
        ${gridPaths}${axes}
        <polygon points="${radar.polygon}" class="radar-area"/>
        ${dots}
      </svg>
      <ul class="radar-legend">${legend}</ul>
    </div>`;
}

function htmlChartPie(satisfaccion) {
  if (!satisfaccion.slices.length) return '<p class="muted">Sin datos</p>';
  const slices = satisfaccion.slices
    .map(
      (s) =>
        `<path d="${s.path}" fill="${s.color}"><title>${esc(s.label)}: ${s.value} (${fmtPct(s.pct)})</title></path>` +
        (s.showLabel
          ? `<text x="${s.labelX}" y="${s.labelY}" class="pie-lbl" text-anchor="middle" dominant-baseline="middle">${fmtPct(s.pct)}</text>`
          : ''),
    )
    .join('');
  const legend = satisfaccion.slices
    .map(
      (s) =>
        `<li><span class="pie-swatch" style="background:${s.color}"></span><span>${esc(s.label)}</span><strong>${s.value}</strong><em>${fmtPct(s.pct)}</em></li>`,
    )
    .join('');
  return `
    <div class="pie-wrap">
      <div class="pie-visual">
        <svg viewBox="0 0 100 100" class="pie-svg">${slices}</svg>
        <div class="pie-center"><strong>${satisfaccion.total}</strong><span>eval.</span></div>
      </div>
      <ul class="pie-legend">${legend}</ul>
    </div>`;
}

function htmlChartRanking(items) {
  if (!items.length) return '<p class="muted">Sin ranking disponible.</p>';
  return `<div class="ranking">${items
    .map(
      (it) => `
      <div class="rank-row">
        <div class="rank-head">
          <span class="rank-prog">${esc(it.label)}</span>
          <span class="rank-inst">${esc(it.sublabel)}</span>
        </div>
        <div class="rank-bar"><div class="rank-fill" style="width:${it.pctBar}%;background:${it.color}"></div></div>
        <span class="rank-val">${fmtNota(it.value)}/5</span>
      </div>`,
    )
    .join('')}</div>`;
}

function htmlResumenVisual(res, aspectos, satisfaccion, rankingItems, { compact = false } = {}) {
  const gridClass = compact ? 'charts-grid charts-grid--compact' : 'charts-grid';
  return `
  <div class="${gridClass}">
    <section class="chart-card chart-card--wide">
      <h4>Promedio por aspecto</h4>
      <p class="chart-hint">Escala 1–5 · promedio de todas las calificaciones</p>
      ${htmlChartAspectos(aspectos)}
    </section>
    <section class="chart-card">
      <h4>Radar de aspectos</h4>
      <p class="chart-hint">Perfil global de la encuesta</p>
      ${htmlChartRadar(aspectos)}
    </section>
    <section class="chart-card">
      <h4>Nivel de satisfacción</h4>
      <p class="chart-hint">Distribución por calificación global de cada capacitación</p>
      ${htmlChartPie(satisfaccion)}
    </section>
    <section class="chart-card chart-card--wide">
      <h4>Ranking — programa e instructor</h4>
      <p class="chart-hint">Promedio general por capacitación</p>
      ${htmlChartRanking(rankingItems)}
    </section>
  </div>`;
}

function htmlTablaPromedios(res) {
  const aspectos = res.aspectos || [];
  const thAsp = aspectos.map((a) => `<th>${esc(a.label)}</th>`).join('');
  const rows = (res.promediosCarpa || [])
    .map((c) => {
      const aspCells = aspectos
        .map((a) => {
          const v = c.aspectos?.[a.key]?.promedio;
          return `<td>${fmtNota(v)}</td>`;
        })
        .join('');
      return `<tr>
        <td><strong>${esc(c.programaNombre || c.nombre)}</strong></td>
        <td>${esc(c.instructorNombre || '—')}</td>
        <td>${fmtNota(c.promedioGeneral)}</td>
        ${aspCells}
      </tr>`;
    })
    .join('');
  if (!rows) return '<p class="muted">Sin promedios por capacitación.</p>';
  return `
    <table class="tbl">
      <thead><tr>
        <th>Programa</th><th>Instructor</th><th>Promedio</th>${thAsp}
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function buildHtmlInformeEncuestaPdf(res, extras = {}) {
  const emp = extras.empresaCapacitadora || {};
  const contrato = extras.contrato || {};
  const encuesta = res.encuesta || {};
  const kpis = calcularKpis(res);
  const aspectos = calcularAspectosGlobales(res);
  const satisfaccion = calcularSatisfaccion(res);
  const rankingItems = buildRankingItems(res);
  const informePequeno = esInformePequeno(res);
  const nCap = (res.promediosCarpa || []).length;
  const saltoAntesPromedios = nCap > 8 ? '<div class="page-break"></div>' : '';
  const atPage = await atPageCssPara('informe_encuesta_jornadas');
  const generado = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  const pdfName = `encuesta-${contrato.codContrato || encuesta._id || 'satisfaccion'}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
${informeGoogleFontsLinkHtml()}
<title>${esc(pdfName)}</title>
<style>
${atPage}
${informePrintToolbarCss()}
${informeDocumentoBaseCss()}
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  background: #fff !important; color: #1a1a1a !important;
  font-size: 9.5pt; line-height: 1.35;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
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
.sec {
  margin: 14px 0 6px; font-size: 10pt; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: #1e3a5f; border-bottom: 1px solid #bbb; padding-bottom: 3px;
}
.sec-grande {
  margin: 16px 0 8px; padding: 10px 12px;
  background: #1a365d; color: #fff; border-radius: 2px;
  font-size: 12pt; font-weight: 800;
  break-after: avoid; page-break-after: avoid;
}
.muted { color: #666; font-size: 9pt; }
.charts-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 8px 0 14px;
}
.charts-grid--compact { gap: 8px; margin: 6px 0 10px; }
.charts-grid--compact .chart-card { padding: 6px 8px 7px; }
.charts-grid--compact .chart-hint { margin: 0 0 4px; font-size: 7pt; }
.charts-grid--compact .hbar { font-size: 8pt; grid-template-columns: 96px 1fr 38px; }
.charts-grid--compact .radar-wrap { grid-template-columns: 84px 1fr; }
.charts-grid--compact .radar-svg { width: 84px; height: 84px; }
.charts-grid--compact .pie-wrap { grid-template-columns: 74px 1fr; }
.charts-grid--compact .pie-visual { width: 74px; height: 74px; }
.charts-grid--compact .rank-row { gap: 4px; }
.chart-card {
  border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px 10px;
  background: #fff; box-shadow: 0 1px 4px rgba(15,23,42,.07);
  break-inside: avoid; page-break-inside: avoid;
}
.chart-card--wide { grid-column: 1 / -1; }
.chart-card h4 {
  margin: 0 0 2px; font-size: 9pt; font-weight: 700; color: #1e3a5f;
  text-transform: uppercase; letter-spacing: 0.03em;
}
.chart-hint { margin: 0 0 8px; font-size: 7.5pt; color: #64748b; }
.hbars { display: flex; flex-direction: column; gap: 6px; margin: 4px 0 6px; }
.hbar { display: grid; grid-template-columns: 110px 1fr 42px; gap: 8px; align-items: center; font-size: 8.5pt; }
.hbar-lbl { color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hbar-track { height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
.hbar-fill { height: 100%; border-radius: 999px; }
.hbar-val { font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }
.radar-wrap { display: grid; grid-template-columns: 100px 1fr; gap: 8px; align-items: center; }
.radar-svg { width: 100px; height: 100px; }
.radar-grid { fill: none; stroke: #cbd5e1; stroke-width: 0.35; }
.radar-axis { stroke: #94a3b8; stroke-width: 0.35; }
.radar-area { fill: rgba(56,189,248,.25); stroke: #38bdf8; stroke-width: 1.2; }
.radar-dot { fill: #0ea5e9; stroke: #fff; stroke-width: 0.5; }
.radar-legend { list-style: none; margin: 0; padding: 0; font-size: 7.5pt; display: flex; flex-direction: column; gap: 3px; }
.radar-legend li { color: #334155; }
.radar-legend strong { color: #0f172a; margin-right: 4px; }
.pie-wrap { display: grid; grid-template-columns: 88px 1fr; gap: 10px; align-items: center; }
.pie-visual { position: relative; width: 88px; height: 88px; }
.pie-svg { width: 100%; height: 100%; }
.pie-svg path { stroke: #fff; stroke-width: 0.7; }
.pie-lbl { fill: #fff; font-size: 5.2px; font-weight: 800; paint-order: stroke; stroke: rgba(15,23,42,.65); stroke-width: .55px; }
.pie-center {
  position: absolute; inset: 28%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center; pointer-events: none;
}
.pie-center strong { font-size: 9pt; line-height: 1.05; color: #0f172a; }
.pie-center span { font-size: 6pt; text-transform: uppercase; color: #64748b; letter-spacing: .03em; }
.pie-legend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; font-size: 7.5pt; }
.pie-legend li { display: grid; grid-template-columns: 8px minmax(0,1fr) auto auto; gap: 4px; align-items: center; }
.pie-swatch { display: inline-block; width: 8px; height: 8px; border-radius: 2px; }
.pie-legend strong { font-variant-numeric: tabular-nums; }
.pie-legend em { font-style: normal; color: #64748b; font-variant-numeric: tabular-nums; min-width: 2.2rem; text-align: right; }
.ranking { display: flex; flex-direction: column; gap: 6px; margin: 4px 0 6px; }
.rank-row { display: grid; grid-template-columns: 1fr 42px; gap: 6px; align-items: end; }
.rank-head { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: baseline; font-size: 7.5pt; }
.rank-prog { font-weight: 700; color: #0f172a; }
.rank-inst { color: #64748b; font-size: 7pt; }
.rank-bar { grid-column: 1; height: 8px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
.rank-fill { height: 100%; border-radius: 999px; min-width: 2px; }
.rank-val { font-size: 8pt; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; color: #0f172a; }
table.tbl {
  width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 8pt;
}
table.tbl th, table.tbl td {
  border: 1px solid #999; padding: 3px 5px; vertical-align: top;
}
table.tbl th {
  background: #1a365d; color: #fff; font-weight: 700; text-align: left;
}
table.tbl tbody tr:nth-child(even) td { background: #f8fafc; }
table.tbl--compact { font-size: 7.5pt; }
thead { display: table-header-group; }
tr { page-break-inside: avoid; }
.page-break { break-after: page; page-break-after: always; }
.doc-footer {
  margin-top: 18px; padding-top: 10px; border-top: 1px solid #ccc;
  font-size: 8pt; color: #666; text-align: center;
}
.firmas {
  display: grid; grid-template-columns: 1fr 1fr; gap: 40px;
  margin-top: 28px; font-size: 9pt; text-align: center;
}
.firmas .linea { border-top: 1px solid #333; margin-bottom: 6px; padding-top: 4px; }
@media print { body { padding: 0 !important; } .no-print { display: none !important; } }
@media screen {
  body { padding: 12px 16px 24px; background: #e5e7eb !important; }
  .doc { background: #fff; padding: 14mm 12mm; box-shadow: 0 4px 24px rgba(0,0,0,.15); }
}
</style>
</head>
<body>
${informePrintToolbarHtml({ label: 'Informe encuesta de satisfacción', pdfName })}
<div class="doc">
  ${htmlEncabezadoEmpresa(emp, esc)}

  <div class="doc-titulo-block">
    <h2>Informe de encuesta de satisfacción</h2>
    <p>Resultados de la evaluación de jornadas de capacitación</p>
  </div>

  <div class="destacado-contrato">
    <div class="item">
      <span class="lbl">Contrato</span>
      <span class="val">${esc(contrato.codContrato || '—')}</span>
    </div>
    <div class="item">
      <span class="lbl">Promedio global</span>
      <span class="val">${fmtNota(kpis.promedioGlobal)}<span style="font-size:11pt">/5</span></span>
    </div>
  </div>

  <table class="doc-meta">
    <tr><td>Presentado a</td><td><strong>${esc(contrato.cliente || 'Empresa contratante')}</strong>${contrato.nit ? ` · NIT ${esc(contrato.nit)}` : ''}</td></tr>
    <tr><td>Encuesta</td><td>${esc(encuesta.titulo || '—')}</td></tr>
    <tr><td>Estado</td><td>${esc(encuesta.estado || '—')}</td></tr>
    <tr><td>Generado</td><td>${esc(generado)}</td></tr>
    ${encuesta.instrucciones ? `<tr><td>Instrucciones</td><td>${esc(encuesta.instrucciones)}</td></tr>` : ''}
  </table>

  <div class="stats">
    <div class="stat"><span>Respuestas</span><strong>${kpis.respuestas}</strong></div>
    <div class="stat"><span>Capacitaciones</span><strong>${kpis.capacitaciones}</strong></div>
    <div class="stat"><span>Instructores</span><strong>${kpis.instructores}</strong></div>
    <div class="stat"><span>Evaluaciones</span><strong>${kpis.evaluaciones}</strong></div>
  </div>

  <div class="sec-grande">Resumen visual</div>
  ${htmlResumenVisual(res, aspectos, satisfaccion, rankingItems, { compact: informePequeno })}

  ${saltoAntesPromedios}

  <div class="sec-grande">Promedios por capacitación</div>
  ${htmlTablaPromedios(res)}

  <div class="firmas">
    <div><div class="linea">Elaborado por</div></div>
    <div><div class="linea">Revisado / Aprobado</div></div>
  </div>
  <footer class="doc-footer">
    <p>${esc(emp.mensajePie || 'Documento generado por ARGO — Encuestas de satisfacción')}</p>
    <p class="muted">Informe agregado sin identificación individual de participantes (privacidad de datos).</p>
  </footer>
</div>
${informePrintToolbarScript()}
</body>
</html>`;
}

async function generarInformeEncuestaPdf(idEncuesta) {
  const res = await resultadosEncuesta(idEncuesta);
  const contrato = await Contratacion.findById(res.encuesta?.idContrato).lean();
  if (!contrato) {
    const err = new Error('Contrato no encontrado');
    err.status = 404;
    throw err;
  }
  const config = await obtenerConfigRecibo(contrato.idSede || null).catch(() => ({}));
  const html = await buildHtmlInformeEncuestaPdf(res, {
    contrato: {
      codContrato: contrato.codContrato || '',
      cliente: contrato.nombreComercial || contrato.razoSocial || contrato.clienteNombre || '',
      nit: contrato.numeroIdentificacion || contrato.clienteIdentificacion || '',
      ciudad: contrato.ciudad || '',
    },
    empresaCapacitadora: {
      nombre: config?.nombreEmpresa || 'Centro de Capacitación',
      nit: config?.nitEmpresa || '',
      ciudad: config?.ciudad || '',
      direccion: config?.direccion || '',
      telefono: config?.telefono || '',
      email: config?.email || '',
      logoUrl: config?.urlLogoDataUrl || '',
      mensajePie: config?.mensajePie || '',
    },
  });
  return { html, res, contrato };
}

module.exports = {
  buildHtmlInformeEncuestaPdf,
  generarInformeEncuestaPdf,
};
