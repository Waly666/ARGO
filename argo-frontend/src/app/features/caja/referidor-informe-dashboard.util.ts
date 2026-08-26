import {
  ReferidorChartItem,
  ReferidorInformeDashboard,
  ReferidorResumenRow,
} from '../../core/services/referidor-comercial.service';
import {
  CHART_PALETTE,
  ChartSlice,
  donutSegmentPaths,
  slicesFromRows,
} from '../dashboard/dashboard-chart.helpers';

export const REFERIDOR_DASH_TOP_PROGRAMAS = 5;
export const REFERIDOR_DASH_TOP_GESTORES = 8;

export function topNChartItems(items: ReferidorChartItem[], max = REFERIDOR_DASH_TOP_PROGRAMAS): ReferidorChartItem[] {
  if (!items?.length) return [];
  const sorted = [...items].sort((a, b) => b.value - a.value);
  if (sorted.length <= max) return sorted;
  const top = sorted.slice(0, max);
  const otros = sorted.slice(max).reduce((a, i) => a + i.value, 0);
  if (otros > 0) top.push({ label: 'Otros', value: otros });
  return top;
}

export function shortChartLabel(label: string, maxLen = 26): string {
  const s = String(label || '').trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 1)}…`;
}

export function chartSlicesFromItems(items: ReferidorChartItem[]): ChartSlice[] {
  return slicesFromRows(items, (r) => r.label, (r) => r.value, CHART_PALETTE);
}

export function topGestoresItems(resumen: ReferidorResumenRow[], max = REFERIDOR_DASH_TOP_GESTORES): ReferidorChartItem[] {
  return (resumen || [])
    .slice()
    .sort((a, b) => b.totalPagado - a.totalPagado || b.certificados - a.certificados)
    .slice(0, max)
    .map((r) => ({ label: r.nombre, value: r.totalPagado }));
}

export function barWidthPct(value: number, items: ReferidorChartItem[]): number {
  const max = Math.max(...items.map((i) => i.value), 1);
  return Math.max(4, Math.round((value / max) * 100));
}

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cop(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function donutSvgPaths(slices: ChartSlice[]): string {
  return donutSegmentPaths(slices, 140, 24)
    .map((s) => `<path d="${s.d}" fill="${esc(s.color)}"/>`)
    .join('');
}

function donutLegendHtml(slices: ChartSlice[], moneda: boolean): string {
  return slices
    .map((s) => {
      const val = moneda ? cop(s.value) : String(s.value);
      return `<li>
        <span class="dot" style="background:${esc(s.color)}"></span>
        <span class="lbl">${esc(shortChartLabel(s.label, 22))}</span>
        <span class="val">${esc(val)} · ${s.pct}%</span>
      </li>`;
    })
    .join('');
}

function compactBarChartHtml(
  title: string,
  items: ReferidorChartItem[],
  tone: 'sky' | 'violet' | 'emerald',
  moneda: boolean,
): string {
  if (!items?.length) {
    return `<article class="dash-card"><h4>${esc(title)}</h4><p class="dash-empty">Sin datos en el período.</p></article>`;
  }
  const rows = items
    .map((item) => {
      const pct = barWidthPct(item.value, items);
      const val = moneda ? cop(item.value) : String(item.value);
      return `<div class="dash-bar">
        <span class="dash-bar-lbl">${esc(shortChartLabel(item.label, 10))}</span>
        <div class="dash-bar-track"><div class="dash-bar-fill ${tone}" style="width:${pct}%"></div></div>
        <span class="dash-bar-val">${esc(val)}</span>
      </div>`;
    })
    .join('');
  return `<article class="dash-card"><h4>${esc(title)}</h4>${rows}</article>`;
}

function donutChartHtml(title: string, items: ReferidorChartItem[], moneda: boolean): string {
  const top = topNChartItems(items);
  if (!top.length) {
    return `<article class="dash-card dash-card--donut"><h4>${esc(title)}</h4><p class="dash-empty">Sin datos.</p></article>`;
  }
  const slices = chartSlicesFromItems(top);
  return `<article class="dash-card dash-card--donut">
    <h4>${esc(title)}</h4>
    <div class="dash-donut-wrap">
      <svg viewBox="0 0 140 140" class="dash-donut" aria-hidden="true">${donutSvgPaths(slices)}</svg>
      <ul class="dash-legend">${donutLegendHtml(slices, moneda)}</ul>
    </div>
  </article>`;
}

function rankGestoresHtml(resumen: ReferidorResumenRow[]): string {
  const items = topGestoresItems(resumen);
  if (!items.length) {
    return `<article class="dash-card dash-card--wide"><h4>Top gestores por recaudo</h4><p class="dash-empty">Sin movimientos.</p></article>`;
  }
  const rows = items
    .map((item, i) => {
      const pct = barWidthPct(item.value, items);
      return `<div class="dash-rank">
        <span class="dash-rank-pos">${i + 1}</span>
        <span class="dash-rank-name">${esc(shortChartLabel(item.label, 24))}</span>
        <div class="dash-bar-track"><div class="dash-bar-fill emerald" style="width:${pct}%"></div></div>
        <span class="dash-bar-val">${esc(cop(item.value))}</span>
      </div>`;
    })
    .join('');
  return `<article class="dash-card dash-card--wide"><h4>Top gestores por recaudo</h4>${rows}</article>`;
}

export function dashboardPrintCss(): string {
  return `
  .dashboard { margin-bottom: 12px; break-inside: avoid; }
  .dash-grid {
    display: grid; gap: 8px; margin-bottom: 8px;
  }
  .dash-grid--2 { grid-template-columns: 1fr 1fr; }
  .dash-card {
    border: 1px solid #cbd5e1; border-radius: 6px; padding: 7px 8px; background: #fafbfc;
    break-inside: avoid;
  }
  .dash-card h4 {
    margin: 0 0 6px; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.05em;
    color: #1e3a5f; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;
  }
  .dash-card--wide { grid-column: 1 / -1; }
  .dash-empty { margin: 0; font-size: 7.5pt; color: #64748b; font-style: italic; }
  .dash-bar, .dash-rank {
    display: grid; grid-template-columns: 42px 1fr 62px; gap: 4px; align-items: center;
    font-size: 7pt; margin-bottom: 3px;
  }
  .dash-rank { grid-template-columns: 16px minmax(72px, 1fr) 1fr 62px; }
  .dash-rank-pos {
    font-size: 6.5pt; font-weight: 700; color: #64748b; text-align: center;
  }
  .dash-rank-name { font-size: 7pt; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dash-bar-lbl { font-size: 7pt; color: #475569; }
  .dash-bar-track {
    height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden;
  }
  .dash-bar-fill { height: 100%; border-radius: 999px; }
  .dash-bar-fill.sky { background: linear-gradient(90deg, #2563eb, #38bdf8); }
  .dash-bar-fill.violet { background: linear-gradient(90deg, #7c3aed, #a78bfa); }
  .dash-bar-fill.emerald { background: linear-gradient(90deg, #059669, #34d399); }
  .dash-bar-val { text-align: right; font-size: 6.5pt; white-space: nowrap; color: #1e293b; }
  .dash-donut-wrap {
    display: flex; gap: 8px; align-items: center;
  }
  .dash-donut { width: 72px; height: 72px; flex-shrink: 0; }
  .dash-legend {
    list-style: none; margin: 0; padding: 0; flex: 1; min-width: 0;
    display: flex; flex-direction: column; gap: 2px;
  }
  .dash-legend li {
    display: grid; grid-template-columns: 7px 1fr auto; gap: 4px; align-items: baseline;
    font-size: 6.5pt; color: #334155;
  }
  .dash-legend .dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 2px; }
  .dash-legend .lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dash-legend .val { color: #64748b; white-space: nowrap; font-size: 6pt; }
  @media print {
    .dash-grid--2 { grid-template-columns: 1fr 1fr; }
  }
`;
}

export function dashboardChartsHtml(data: ReferidorInformeDashboard): string {
  const charts = data.charts || {
    pagosPorMes: [],
    certificadosPorMes: [],
    pagosPorPrograma: [],
    certificadosPorPrograma: [],
  };
  return `<section class="dashboard">
    <h3 class="sec">Dashboard comercial</h3>
    <div class="dash-grid dash-grid--2">
      ${compactBarChartHtml('Pagos por mes', charts.pagosPorMes, 'sky', true)}
      ${compactBarChartHtml('Certificados por mes', charts.certificadosPorMes, 'violet', false)}
    </div>
    <div class="dash-grid dash-grid--2">
      ${donutChartHtml('Pagos por programa', charts.pagosPorPrograma, true)}
      ${donutChartHtml('Certificados por programa', charts.certificadosPorPrograma, false)}
    </div>
    ${rankGestoresHtml(data.resumen || [])}
  </section>`;
}
