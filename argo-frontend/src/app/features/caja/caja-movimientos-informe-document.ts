import { ConfigRecibo } from '../../core/services/config.service';
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

const DEFAULT_AT_PAGE = '@page { size: letter landscape; margin: 10mm; }';

export type MovimientoInformeFila = {
  fecha: string;
  recibo: string;
  sesion: string;
  tercero: string;
  documento: string;
  tipo: string;
  concepto: string;
  formaPago: string;
  valor: number;
  anulado: boolean;
  placa?: string;
  /** Pago distinto de efectivo sin imagen de soporte. */
  sinSoporte?: boolean;
};

export type FiltrosInformeMovimientos = {
  desde?: string;
  hasta?: string;
  documento?: string;
  tipo?: string;
  concepto?: string;
};

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dinero(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function css(atPageCss: string): string {
  return `
  ${atPageCss}
  ${informePrintToolbarCss()}
  ${informeDocumentoBaseCss()}
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: #fff !important;
    color: #1a1a1a !important;
    font-size: 8pt;
    line-height: 1.2;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
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
  .doc-meta {
    width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9pt;
  }
  .doc-meta td { padding: 2px 0; vertical-align: top; }
  .doc-meta td:first-child { width: 130px; font-weight: 600; color: #555; }
  .stats {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px;
    margin-bottom: 12px;
  }
  .stat {
    border: 1px solid #94a3b8; background: #edf2f7; padding: 8px; text-align: center;
  }
  .stat span { display: block; font-size: 8pt; text-transform: uppercase; color: #1e3a5f; }
  .stat strong { font-size: 12pt; color: #1a1a1a; }
  .stat.alerta { background: #fff5f5; border-color: #c53030; }
  .stat.alerta span, .stat.alerta strong { color: #9b2c2c; }
  .sec {
    margin: 14px 0 6px; font-size: 10pt; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.4px; color: #1e3a5f; border-bottom: 1px solid #bbb; padding-bottom: 3px;
  }
  table.tbl {
    width: 100%; border-collapse: collapse; margin-bottom: 8px;
    font-size: 7pt; line-height: 1.15; table-layout: fixed;
  }
  table.tbl th, table.tbl td {
    border: 1px solid #999; padding: 1px 3px; vertical-align: middle;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  table.tbl th { background: #1a365d; color: #fff; font-weight: 700; text-align: left; font-size: 6.5pt; }
  table.tbl td.concepto, table.tbl th.concepto { width: 28%; font-size: 6.5pt; }
  table.tbl td.num, table.tbl th.num { text-align: right; white-space: nowrap; }
  table.tbl tbody tr:nth-child(even) td { background: #f8fafc; }
  table.tbl tbody tr.sin-soporte td {
    background: #fecaca; color: #7f1d1d; font-weight: 700;
  }
  table.tbl tbody tr.sin-soporte td.soporte {
    background: #dc2626; color: #fff; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.03em; white-space: nowrap;
  }
  table.tbl tr.anulado td { color: #9f1239; text-decoration: line-through; }
  table.tbl tr.total td { background: #1a365d; color: #fff; font-weight: 700; text-decoration: none; }
  .badge-sin-soporte {
    display: inline-block; font-size: 7.5pt; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.04em;
    padding: 1px 5px; border-radius: 2px; margin-left: 4px;
    background: #feb2b2; color: #742a2a; white-space: nowrap;
    text-decoration: none;
  }
  .alerta-soporte {
    border: 1px solid #c53030; background: #fff5f5; padding: 8px 10px;
    margin: 0 0 12px; font-size: 9pt;
  }
  .alerta-soporte strong { color: #9b2c2c; display: block; margin-bottom: 4px; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  .doc-footer {
    margin-top: 18px; padding-top: 10px; border-top: 1px solid #ccc;
    font-size: 8pt; color: #666; text-align: center;
  }
  .firmas {
    display: grid; grid-template-columns: 1fr 1fr; gap: 56px;
    margin-top: 22px; font-size: 8pt; text-align: center;
    page-break-inside: avoid;
  }
  .firmas .linea {
    border-top: 1px solid #333;
    margin-top: 72px;
    padding-top: 8px;
  }
  @media print { body { padding: 0 !important; } }
  @media screen {
    body { padding: 12px 16px 24px; background: #e5e7eb !important; }
    .doc { background: #fff; padding: 14mm 12mm; box-shadow: 0 4px 24px rgba(0,0,0,.15); }
  }
`;
}

export function buildInformeMovimientosCajaHtml(opts: {
  titulo: string;
  filtros: FiltrosInformeMovimientos;
  filas: MovimientoInformeFila[];
  incluirPlaca?: boolean;
  /** Columna y resalte de ingresos sin soporte. Solo el informe de ingresos. */
  columnaSoporte?: boolean;
  empresa?: ConfigRecibo | null;
  atPageCss?: string;
}): string {
  const atPage = opts.atPageCss || DEFAULT_AT_PAGE;
  const vigentes = opts.filas.filter((f) => !f.anulado);
  const total = vigentes.reduce((a, f) => a + (Number(f.valor) || 0), 0);
  const sinSoporte = opts.filas.filter((f) => f.sinSoporte).length;
  const meta = [
    opts.filtros.desde || opts.filtros.hasta
      ? `<tr><td>Periodo</td><td>${esc(opts.filtros.desde || '…')} — ${esc(opts.filtros.hasta || '…')}</td></tr>`
      : '<tr><td>Periodo</td><td>Todo el histórico consultado</td></tr>',
    `<tr><td>Documento</td><td>${esc(opts.filtros.documento || 'Todos')}</td></tr>`,
    `<tr><td>Tipo</td><td>${esc(opts.filtros.tipo || 'Todos')}</td></tr>`,
    `<tr><td>Concepto</td><td>${esc(opts.filtros.concepto || 'Todos')}</td></tr>`,
    `<tr><td>Generado</td><td>${esc(new Date().toLocaleString('es-CO'))}</td></tr>`,
  ].join('');

  const cols = [
    'Fecha',
    'Recibo',
    'Sesión',
    'Tercero',
    'Documento',
    'Tipo',
    'Concepto',
    ...(opts.incluirPlaca ? ['Placa'] : []),
    'Pago',
    ...(opts.columnaSoporte ? ['Soporte'] : []),
    'Valor',
  ];
  const th = cols
    .map((c, i) => {
      const clases = [c === 'Concepto' ? 'concepto' : '', i === cols.length - 1 ? 'num' : ''].filter(Boolean).join(' ');
      return `<th class="${clases}">${esc(c)}</th>`;
    })
    .join('');
  const body = opts.filas
    .map((f) => {
      const celdas = [
        f.fecha,
        f.recibo,
        f.sesion,
        f.tercero,
        f.documento,
        f.tipo,
        f.concepto,
        ...(opts.incluirPlaca ? [f.placa || '—'] : []),
        f.formaPago,
      ];
      const soporteTd = opts.columnaSoporte
        ? `<td class="soporte">${f.sinSoporte ? 'Falta soporte' : '—'}</td>`
        : '';
      const tds = celdas
        .map((c, i) => {
          const texto = esc(c || '—');
          const badge = i === 1 && f.sinSoporte ? '<span class="badge-sin-soporte">Sin soporte</span>' : '';
          const esConcepto = i === 6;
          const titulo = esConcepto ? ` title="${esc(c || '')}"` : '';
          const clase = esConcepto ? ' class="concepto"' : '';
          return `<td${clase}${titulo}>${texto}${badge}</td>`;
        })
        .join('');
      const clases = [f.anulado ? 'anulado' : '', f.sinSoporte ? 'sin-soporte' : ''].filter(Boolean).join(' ');
      const marca = f.anulado ? ' (anulado)' : '';
      return `<tr class="${clases}">${tds}${soporteTd}<td class="num">${esc(dinero(f.valor))}${esc(marca)}</td></tr>`;
    })
    .join('');
  const vacio = `<tr><td colspan="${cols.length}">Sin movimientos para los filtros elegidos</td></tr>`;
  const alertaSoporte = sinSoporte
    ? `<div class="alerta-soporte"><strong>Alerta: ${sinSoporte} ingreso${sinSoporte === 1 ? '' : 's'} sin soporte adjunto</strong><p style="margin:0">Están resaltados en la tabla. El efectivo no exige soporte; estas filas son pagos distintos de efectivo sin imagen de comprobante.</p></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  ${informeGoogleFontsLinkHtml()}
  <title>${esc(opts.titulo)}</title>
  <style>${css(atPage)}</style>
</head>
<body>
  ${informePrintToolbarHtml({ label: 'Acciones del informe', pdfName: opts.titulo })}
  <div class="doc">
    ${htmlEncabezadoEmpresa(opts.empresa)}
    <div class="doc-titulo-block">
      <h2>${esc(opts.titulo)}</h2>
      <p>Informe de caja</p>
    </div>
    <table class="doc-meta">${meta}</table>
    <div class="stats">
      <div class="stat"><span>Movimientos</span><strong>${esc(opts.filas.length)}</strong></div>
      <div class="stat"><span>Anulados</span><strong>${esc(opts.filas.length - vigentes.length)}</strong></div>
      <div class="stat"><span>Total vigente</span><strong>${esc(dinero(total))}</strong></div>
      ${sinSoporte ? `<div class="stat alerta"><span>Sin soporte</span><strong>${esc(sinSoporte)}</strong></div>` : ''}
    </div>
    ${alertaSoporte}
    <div class="sec">${esc(opts.titulo)} (${opts.filas.length})</div>
    <table class="tbl">
      <thead><tr>${th}</tr></thead>
      <tbody>
        ${body || vacio}
        <tr class="total">
          <td colspan="${cols.length - 1}">Total (sin anulados)</td>
          <td class="num">${esc(dinero(total))}</td>
        </tr>
      </tbody>
    </table>
    <div class="firmas">
      <div><div class="linea">Elaborado por</div></div>
      <div><div class="linea">Revisado / Aprobado</div></div>
    </div>
    <footer class="doc-footer"><p>${esc(opts.empresa?.mensajePie || 'Documento generado por ARGO')}</p></footer>
  </div>
  ${informePrintToolbarScript(opts.titulo)}
</body>
</html>`;
}

export function abrirInformeMovimientosCaja(html: string): boolean {
  const w = window.open('', '_blank', 'width=1100,height=780,scrollbars=yes');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
