import { ConfigRecibo } from '../../core/services/config.service';
import {
  ReferidorInformeDashboard,
  TipoReferidorComercial,
} from '../../core/services/referidor-comercial.service';
import {
  dashboardChartsHtml,
  dashboardPrintCss,
} from './referidor-informe-dashboard.util';
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

const AT_PAGE = '@page { size: letter portrait; margin: 12mm 10mm; }';

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
  .doc { max-width: 8.5in; margin: 0 auto; }
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
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 12px;
  }
  .stat {
    border: 1px solid #94a3b8; background: #edf2f7; padding: 6px 8px; text-align: center;
  }
  .stat span {
    display: block; font-size: 7pt; text-transform: uppercase; color: #1e3a5f; letter-spacing: 0.04em;
  }
  .stat strong { display: block; font-size: 11pt; color: #1a1a1a; margin-top: 2px; }
  ${dashboardPrintCss()}
  .sec {
    margin: 12px 0 5px; font-size: 9pt; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.04em; color: #1e3a5f; border-bottom: 1px solid #bbb; padding-bottom: 2px;
  }
  table.tbl {
    width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 7.5pt;
    table-layout: fixed;
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
    .doc {
      width: 8.5in; min-height: 11in;
      background: #fff; padding: 12mm 10mm; box-shadow: 0 4px 24px rgba(0,0,0,.12);
    }
  }
`;
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
  <table class="tbl tbl-pagos">
    <colgroup>
      <col style="width:8%" />
      <col style="width:13%" />
      <col style="width:12%" />
      <col style="width:35%" />
      <col style="width:20%" />
      <col style="width:12%" />
    </colgroup>
    <thead><tr>
      <th>Fecha</th><th>Recibo</th><th>Doc.</th><th>Programa</th><th>${esc(col)}</th><th class="num">Valor</th>
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
        <td>${esc(c.referidor)}</td>
      </tr>`,
    )
    .join('');
  return `<h3 class="sec">Detalle de certificados (${(data.detalle?.certificados || []).length})</h3>
  <table class="tbl tbl-certs">
    <colgroup>
      <col style="width:10%" />
      <col style="width:13%" />
      <col style="width:28%" />
      <col style="width:35%" />
      <col style="width:14%" />
    </colgroup>
    <thead><tr>
      <th>Emisión</th><th>Código</th><th>Alumno</th><th>Programa</th><th>${esc(col)}</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="5">Sin certificados.</td></tr>'}</tbody>
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
        <td class="num">${cop(m.saldo)}</td>
      </tr>`,
    )
    .join('');
  return `<h3 class="sec">Detalle de matrículas comerciales (${(data.detalle?.matriculas || []).length})</h3>
  <table class="tbl tbl-mats">
    <colgroup>
      <col style="width:9%" />
      <col style="width:10%" />
      <col style="width:34%" />
      <col style="width:24%" />
      <col style="width:11%" />
      <col style="width:12%" />
    </colgroup>
    <thead><tr>
      <th>Fecha</th><th>Doc.</th><th>Programa</th><th>${esc(col)}</th><th class="num">Valor</th><th class="num">Saldo</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="6">Sin matrículas.</td></tr>'}</tbody>
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
    ${dashboardChartsHtml(data)}
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
