import { ConfigRecibo } from '../../core/services/config.service';
import {
  ReferidorChartItem,
  ReferidorInformeDashboard,
  TipoReferidorComercial,
} from '../../core/services/referidor-comercial.service';
import {
  informePrintToolbarCss,
  informePrintToolbarHtml,
  informePrintToolbarScript,
} from '../../core/utils/informe-print-toolbar.util';
import {
  htmlEncabezadoEmpresa,
  informeDocumentoBaseCss,
  informeGoogleFontsLinkHtml,
} from '../../core/utils/informe-encabezado-empresa.util';

export interface ReferidorInformeFiltrosImpresion {
  desde: string;
  hasta: string;
  programa: string;
  tipoCapacitacion: string;
  tipoCertificado: string;
  referidor: string;
}

export interface ReferidorInformePrintOpts {
  tipo: TipoReferidorComercial;
  data: ReferidorInformeDashboard;
  filtros: ReferidorInformeFiltrosImpresion;
  empresa?: ConfigRecibo | null;
}

const AT_PAGE = '@page { size: A4 landscape; margin: 10mm; }';

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

function fechaTxt(v: string | null | undefined): string {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return esc(v);
  return d.toLocaleDateString('es-CO');
}

function docCss(): string {
  return `
  ${AT_PAGE}
  ${informePrintToolbarCss()}
  ${informeDocumentoBaseCss()}
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: #fff !important;
    color: #1a1a1a !important;
    font-size: 9pt;
    line-height: 1.35;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc { max-width: 100%; margin: 0 auto; }
  .doc-titulo-block {
    text-align: center; margin: 10px 0 12px;
    border-top: 1px solid #ccc; border-bottom: 1px solid #ccc;
    padding: 8px 0; background: #f8f9fb;
  }
  .doc-titulo-block h2 {
    margin: 0; font-size: 12pt; text-transform: uppercase; letter-spacing: 0.06em;
    color: #1e3a5f; font-weight: 700;
  }
  .doc-titulo-block p { margin: 4px 0 0; font-size: 8.5pt; color: #444; }
  .doc-meta {
    width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 8.5pt;
  }
  .doc-meta td { padding: 2px 6px 2px 0; vertical-align: top; }
  .doc-meta td:first-child { width: 140px; font-weight: 600; color: #555; }
  .stats {
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 12px;
  }
  .stat {
    border: 1px solid #94a3b8; background: #edf2f7; padding: 6px 8px; text-align: center;
  }
  .stat span {
    display: block; font-size: 7pt; text-transform: uppercase; color: #1e3a5f; letter-spacing: 0.04em;
  }
  .stat strong { display: block; font-size: 11pt; color: #1a1a1a; margin-top: 2px; }
  .charts {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;
  }
  .chart-box {
    border: 1px solid #cbd5e1; padding: 8px; background: #fafbfc;
  }
  .chart-box h4 {
    margin: 0 0 6px; font-size: 8pt; text-transform: uppercase; color: #1e3a5f;
    border-bottom: 1px solid #ddd; padding-bottom: 3px;
  }
  .bar-row {
    display: grid; grid-template-columns: 52px 1fr 72px; gap: 4px; align-items: center;
    font-size: 7.5pt; margin-bottom: 3px;
  }
  .bar-track {
    height: 7px; background: #e2e8f0; border-radius: 999px; overflow: hidden;
  }
  .bar-fill { height: 100%; background: #2563eb; border-radius: 999px; }
  .bar-fill.violet { background: #7c3aed; }
  .sec {
    margin: 12px 0 5px; font-size: 9pt; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.04em; color: #1e3a5f; border-bottom: 1px solid #bbb; padding-bottom: 2px;
  }
  table.tbl {
    width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 7.5pt;
  }
  table.tbl th, table.tbl td {
    border: 1px solid #999; padding: 3px 4px; vertical-align: top; word-wrap: break-word;
  }
  table.tbl th {
    background: #1a365d; color: #fff; font-weight: 700; text-align: left;
  }
  table.tbl tbody tr:nth-child(even) td { background: #f8fafc; }
  .num { text-align: right; white-space: nowrap; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  .doc-footer {
    margin-top: 14px; padding-top: 8px; border-top: 1px solid #ccc;
    font-size: 7.5pt; color: #666; text-align: center;
  }
  @media print { body { padding: 0 !important; } }
  @media screen {
    body { padding: 12px 16px 24px; background: #e5e7eb !important; }
    .doc { background: #fff; padding: 12mm 10mm; box-shadow: 0 4px 24px rgba(0,0,0,.12); }
  }
`;
}

function barChartHtml(title: string, items: ReferidorChartItem[], clase: 'sky' | 'violet', moneda: boolean): string {
  if (!items?.length) {
    return `<div class="chart-box"><h4>${esc(title)}</h4><p>Sin datos en el período.</p></div>`;
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  const rows = items
    .map((item) => {
      const pct = Math.max(4, Math.round((item.value / max) * 100));
      const val = moneda ? cop(item.value) : String(item.value);
      return `<div class="bar-row">
        <span>${esc(item.label)}</span>
        <div class="bar-track"><div class="bar-fill ${clase}" style="width:${pct}%"></div></div>
        <span class="num">${esc(val)}</span>
      </div>`;
    })
    .join('');
  return `<div class="chart-box"><h4>${esc(title)}</h4>${rows}</div>`;
}

function tablaResumen(tipo: TipoReferidorComercial, data: ReferidorInformeDashboard): string {
  const col = 'Gestor';
  const rows = (data.resumen || [])
    .map(
      (r) => `<tr>
        <td>${esc(r.nombre)}</td>
        <td class="num">${r.matriculas}</td>
        <td class="num">${cop(r.totalPagado)}</td>
        <td class="num">${r.certificados}</td>
        <td class="num">${cop(r.pendienteCobro)}</td>
      </tr>`,
    )
    .join('');
  return `<h3 class="sec">Resumen por ${esc(col.toLowerCase())}</h3>
  <table class="tbl">
    <thead><tr>
      <th>${esc(col)}</th><th>Matrículas</th><th>Pagado</th><th>Certificados</th><th>Pendiente</th>
    </tr></thead>
    <tbody>${rows || `<tr><td colspan="5">Sin movimientos comerciales en el período.</td></tr>`}</tbody>
  </table>`;
}

function tablaPagos(tipo: TipoReferidorComercial, data: ReferidorInformeDashboard): string {
  const col = 'Gestor';
  const rows = (data.detalle?.pagos || [])
    .map(
      (p) => `<tr>
        <td>${fechaTxt(p.fecha)}</td>
        <td>${esc(p.numRecibo || '—')}</td>
        <td>${esc(p.numDoc)}</td>
        <td>${esc(p.programa)}</td>
        <td>${esc(p.referidor)}</td>
        <td class="num">${cop(p.valor)}</td>
      </tr>`,
    )
    .join('');
  return `<h3 class="sec">Detalle de pagos (${(data.detalle?.pagos || []).length})</h3>
  <table class="tbl">
    <thead><tr>
      <th>Fecha</th><th>Recibo</th><th>Doc.</th><th>Programa</th><th>${esc(col)}</th><th>Valor</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="6">Sin pagos.</td></tr>'}</tbody>
  </table>`;
}

function tablaCertificados(tipo: TipoReferidorComercial, data: ReferidorInformeDashboard): string {
  const col = 'Gestor';
  const rows = (data.detalle?.certificados || [])
    .map(
      (c) => `<tr>
        <td>${fechaTxt(c.fechaEmision)}</td>
        <td>${esc(c.codigoCert || '—')}</td>
        <td>${esc(c.nombre)} (${esc(c.numDoc)})</td>
        <td>${esc(c.programa)}</td>
        <td>${esc(c.tipoCertificado)}</td>
        <td>${esc(c.referidor)}</td>
      </tr>`,
    )
    .join('');
  return `<h3 class="sec">Detalle de certificados (${(data.detalle?.certificados || []).length})</h3>
  <table class="tbl">
    <thead><tr>
      <th>Emisión</th><th>Código</th><th>Alumno</th><th>Programa</th><th>Tipo</th><th>${esc(col)}</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="6">Sin certificados.</td></tr>'}</tbody>
  </table>`;
}

function tablaMatriculas(tipo: TipoReferidorComercial, data: ReferidorInformeDashboard): string {
  const col = 'Gestor';
  const rows = (data.detalle?.matriculas || [])
    .map(
      (m) => `<tr>
        <td>${fechaTxt(m.fechaMat)}</td>
        <td>${esc(m.numDoc)}</td>
        <td>${esc(m.programa)}</td>
        <td>${esc(m.referidor)}</td>
        <td class="num">${cop(m.valorMat)}</td>
        <td class="num">${cop(m.abonado)}</td>
        <td class="num">${cop(m.saldo)}</td>
      </tr>`,
    )
    .join('');
  return `<h3 class="sec">Detalle de matrículas comerciales (${(data.detalle?.matriculas || []).length})</h3>
  <table class="tbl">
    <thead><tr>
      <th>Fecha</th><th>Doc.</th><th>Programa</th><th>${esc(col)}</th><th>Valor</th><th>Abonado</th><th>Saldo</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="7">Sin matrículas.</td></tr>'}</tbody>
  </table>`;
}

export function imprimirReferidorInforme(opts: ReferidorInformePrintOpts): boolean {
  const { tipo, data, filtros, empresa } = opts;
  const titulo = 'Informe de gestores comerciales';
  const pdfName = 'informe-gestores';
  const k = data.kpis;
  const refLabel = 'Gestor';

  const periodo =
    filtros.desde && filtros.hasta
      ? `${fechaTxt(filtros.desde)} — ${fechaTxt(filtros.hasta)}`
      : 'Sin filtro de fechas';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>${esc(titulo)}</title>
  ${informeGoogleFontsLinkHtml()}
  <style>${docCss()}</style>
</head>
<body>
  ${informePrintToolbarHtml({ label: 'Informe referidor comercial', pdfName: titulo })}
  <div class="doc">
    ${htmlEncabezadoEmpresa(empresa)}
    <div class="doc-titulo-block">
      <h2>${esc(titulo)}</h2>
      <p>Tarifa gestor (5) · Generado ${esc(new Date().toLocaleString('es-CO'))}</p>
    </div>
    <table class="doc-meta">
      <tr><td>Período</td><td>${esc(periodo)}</td></tr>
      <tr><td>Programa</td><td>${esc(filtros.programa || 'Todos')}</td></tr>
      <tr><td>Tipo capacitación</td><td>${esc(filtros.tipoCapacitacion || 'Todos')}</td></tr>
      <tr><td>Tipo certificado</td><td>${esc(filtros.tipoCertificado || 'Todos')}</td></tr>
      <tr><td>${esc(refLabel)}</td><td>${esc(filtros.referidor || 'Todos los gestores')}</td></tr>
    </table>
    <div class="stats">
      <div class="stat"><span>Pagos cobrados</span><strong>${esc(cop(k.totalPagado))}</strong></div>
      <div class="stat"><span>Certificados</span><strong>${esc(k.totalCertificados)}</strong></div>
      <div class="stat"><span>Matrículas</span><strong>${esc(k.matriculasComerciales)}</strong></div>
      <div class="stat"><span>${esc(refLabel)}es activos</span><strong>${esc(k.referidoresActivos)}</strong></div>
      <div class="stat"><span>Pendiente cobro</span><strong>${esc(cop(k.pendienteCobro))}</strong></div>
    </div>
    <h3 class="sec">Indicadores del período</h3>
    <div class="charts">
      ${barChartHtml('Pagos por mes', data.charts?.pagosPorMes || [], 'sky', true)}
      ${barChartHtml('Certificados por mes', data.charts?.certificadosPorMes || [], 'violet', false)}
      ${barChartHtml('Pagos por programa', data.charts?.pagosPorPrograma || [], 'sky', true)}
      ${barChartHtml('Certificados por programa', data.charts?.certificadosPorPrograma || [], 'violet', false)}
    </div>
    ${tablaResumen(tipo, data)}
    ${tablaPagos(tipo, data)}
    ${tablaCertificados(tipo, data)}
    ${tablaMatriculas(tipo, data)}
    <footer class="doc-footer">
      <p>${esc(empresa?.mensajePie || 'Documento generado por ARGO')}</p>
    </footer>
  </div>
  ${informePrintToolbarScript(pdfName)}
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}
