import { ConfigRecibo } from '../../core/services/config.service';
import { canonicoMetodoPago } from '../../core/utils/metodo-pago.util';
import { esFormaPagoEfectivo } from '../../core/utils/referencia-pago.util';
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
  /** Usuario que registró el comprobante. */
  elaboro?: string;
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
  /** Cuenta que recibe el pago. En efectivo, caja. */
  cuenta?: string;
  /** Servicios del comprobante. Un recibo con varios ítems aporta una línea por servicio. */
  servicios?: { nombre: string; valor: number }[];
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

function medioPago(forma: string): string {
  const canon = canonicoMetodoPago(forma);
  if (canon === 'Efectivo' || canon === 'Transferencia') return canon;
  return canon || 'Otro';
}

function etiquetaSoporte(f: MovimientoInformeFila): string {
  if (esFormaPagoEfectivo(f.formaPago)) return 'No aplica';
  return f.sinSoporte ? 'Sin soporte' : 'Con soporte';
}

function cuentaPago(f: MovimientoInformeFila): string {
  const cuenta = String(f.cuenta || '').trim();
  if (cuenta) return cuenta;
  return esFormaPagoEfectivo(f.formaPago) ? 'Caja' : 'Sin cuenta registrada';
}

type GrupoPago = {
  medio: string;
  cuenta: string;
  soporte: string;
  cantidad: number;
  total: number;
};

function gruposPago(filas: MovimientoInformeFila[]): GrupoPago[] {
  const ordenMedio = (m: string) => (m === 'Efectivo' ? 0 : m === 'Transferencia' ? 1 : 2);
  const map = new Map<string, GrupoPago>();
  for (const f of filas) {
    if (f.anulado) continue;
    const medio = medioPago(f.formaPago);
    const cuenta = cuentaPago(f);
    const soporte = etiquetaSoporte(f);
    const key = `${medio}\u0000${cuenta}\u0000${soporte}`;
    const prev = map.get(key) || { medio, cuenta, soporte, cantidad: 0, total: 0 };
    prev.cantidad += 1;
    prev.total += Number(f.valor) || 0;
    map.set(key, prev);
  }
  return [...map.values()].sort(
    (a, b) =>
      ordenMedio(a.medio) - ordenMedio(b.medio) ||
      b.total - a.total ||
      a.cuenta.localeCompare(b.cuenta, 'es'),
  );
}

type VentaServicio = { nombre: string; valor: number; cobros: number };

function ventasPorServicio(filas: MovimientoInformeFila[]): VentaServicio[] {
  const map = new Map<string, VentaServicio>();
  for (const f of filas) {
    if (f.anulado) continue;
    const lineas = f.servicios?.length
      ? f.servicios
      : [{ nombre: f.concepto || 'Sin concepto', valor: Number(f.valor) || 0 }];
    for (const linea of lineas) {
      const nombre = String(linea.nombre || 'Sin concepto').trim() || 'Sin concepto';
      const key = nombre.toLocaleLowerCase('es');
      const prev = map.get(key) || { nombre, valor: 0, cobros: 0 };
      prev.valor += Number(linea.valor) || 0;
      prev.cobros += 1;
      map.set(key, prev);
    }
  }
  return [...map.values()].sort(
    (a, b) => b.valor - a.valor || b.cobros - a.cobros || a.nombre.localeCompare(b.nombre, 'es'),
  );
}

function htmlResumenPagos(filas: MovimientoInformeFila[]): string {
  const vigentes = filas.filter((f) => !f.anulado);
  const suma = (medio: string) =>
    vigentes
      .filter((f) => medioPago(f.formaPago) === medio)
      .reduce((a, f) => a + (Number(f.valor) || 0), 0);
  const efectivo = suma('Efectivo');
  const transferencia = suma('Transferencia');
  const otros = vigentes
    .filter((f) => {
      const m = medioPago(f.formaPago);
      return m !== 'Efectivo' && m !== 'Transferencia';
    })
    .reduce((a, f) => a + (Number(f.valor) || 0), 0);
  const grupos = gruposPago(filas);
  const filasHtml = grupos
    .map((g) => {
      const cls = g.soporte === 'Sin soporte' ? ' class="sin-soporte"' : '';
      return `<tr${cls}>
        <td>${esc(g.medio)}</td>
        <td title="${esc(g.cuenta)}">${esc(g.cuenta)}</td>
        <td class="soporte">${esc(g.soporte)}</td>
        <td class="num">${esc(g.cantidad)}</td>
        <td class="num">${esc(dinero(g.total))}</td>
      </tr>`;
    })
    .join('');
  const vacio = '<tr><td colspan="5">Sin pagos vigentes</td></tr>';
  const otrosStat = otros
    ? `<div class="stat"><span>Otros medios</span><strong>${esc(dinero(otros))}</strong></div>`
    : '';
  return `<div class="sec">Pagos: motivo, medio y cuenta</div>
    <p class="nota">Totales de comprobantes vigentes. El efectivo no exige soporte. Transferencia y los demás medios quedan marcados si el sistema tiene o no la imagen del comprobante.</p>
    <div class="stats">
      <div class="stat"><span>Total en efectivo</span><strong>${esc(dinero(efectivo))}</strong></div>
      <div class="stat"><span>Total en transferencia</span><strong>${esc(dinero(transferencia))}</strong></div>
      ${otrosStat}
    </div>
    <table class="tbl tbl-resumen">
      <thead><tr>
        <th>Medio</th><th>Cuenta</th><th>Soporte</th><th class="num">Pagos</th><th class="num">Total</th>
      </tr></thead>
      <tbody>${filasHtml || vacio}</tbody>
    </table>`;
}

function htmlBarras(
  titulo: string,
  items: { etiqueta: string; valor: number; texto: string; puesto?: number }[],
  tono: 'navy' | 'teal' | 'slate',
  maxValor?: number,
): string {
  if (!items.length) return '';
  const max = maxValor && maxValor > 0 ? maxValor : Math.max(...items.map((i) => i.valor), 1);
  const suma = items.reduce((a, i) => a + (Number(i.valor) || 0), 0) || 1;
  const mostrarParte = !(maxValor && maxValor > 0);
  const rows = items
    .map((item, i) => {
      const ancho = Math.max(3, Math.round((item.valor / max) * 100));
      const parte = Math.round((item.valor / suma) * 1000) / 10;
      const parteHtml = mostrarParte ? ` <em>${esc(parte)}%</em>` : '';
      return `<div class="barra">
        <span class="barra-pos">${item.puesto ?? i + 1}</span>
        <div class="barra-cuerpo">
          <div class="barra-meta">
            <span class="barra-nombre" title="${esc(item.etiqueta)}">${esc(item.etiqueta)}</span>
            <span class="barra-val">${esc(item.texto)}${parteHtml}</span>
          </div>
          <span class="barra-pista"><span class="barra-fill" style="width:${ancho}%"></span></span>
        </div>
      </div>`;
    })
    .join('');
  return `<article class="grafico tono-${tono}"><h3>${esc(titulo)}</h3>${rows}</article>`;
}

function htmlVentas(filas: MovimientoInformeFila[]): string {
  const ventas = ventasPorServicio(filas);
  if (!ventas.length) return '';
  const total = ventas.reduce((a, v) => a + v.valor, 0) || 1;
  const mas = ventas[0];
  const menos = ventas[ventas.length - 1];
  const tope = 12;
  const porValor = ventas.slice(0, tope);
  const porCantidad = [...ventas].sort((a, b) => b.cobros - a.cobros || b.valor - a.valor).slice(0, tope);
  const menosItems = ventas.length > tope ? ventas.slice(-5) : [];
  const cuerpo = ventas
    .map((v, i) => {
      const pct = Math.round((v.valor / total) * 1000) / 10;
      return `<tr>
        <td class="num">${i + 1}</td>
        <td class="concepto" title="${esc(v.nombre)}">${esc(v.nombre)}</td>
        <td class="num">${esc(v.cobros)}</td>
        <td class="num">${esc(dinero(v.valor))}</td>
        <td class="num">${esc(pct)}%</td>
      </tr>`;
    })
    .join('');
  const notaTope =
    ventas.length > tope
      ? `<p class="nota">Cada servicio se cuenta por su valor dentro del comprobante. Un recibo con varios servicios suma en cada uno. Los gráficos muestran los ${tope} primeros; la tabla lista los ${ventas.length}, del que más recauda al que menos. Los anulados no entran.</p>`
      : `<p class="nota">Cada servicio se cuenta por su valor dentro del comprobante. Un recibo con varios servicios suma en cada uno. Los anulados no entran.</p>`;
  const graficoMenos = menosItems.length
    ? htmlBarras(
        'Los que menos se venden',
        menosItems.map((v, i) => ({
          etiqueta: v.nombre,
          valor: v.valor,
          texto: dinero(v.valor),
          puesto: ventas.length - menosItems.length + i + 1,
        })),
        'slate',
        mas.valor,
      )
    : '';
  return `<div class="sec">Ventas por servicio</div>
    ${notaTope}
    <div class="stats">
      <div class="stat stat-nombre"><span>Más vendido</span><strong>${esc(mas.nombre)}</strong><em>${esc(dinero(mas.valor))} · ${esc(mas.cobros)} cobro${mas.cobros === 1 ? '' : 's'}</em></div>
      <div class="stat stat-nombre"><span>Menos vendido</span><strong>${esc(menos.nombre)}</strong><em>${esc(dinero(menos.valor))} · ${esc(menos.cobros)} cobro${menos.cobros === 1 ? '' : 's'}</em></div>
    </div>
    <div class="graficos">
      ${htmlBarras(
        'Recaudo por servicio',
        porValor.map((v) => ({ etiqueta: v.nombre, valor: v.valor, texto: dinero(v.valor) })),
        'navy',
      )}
      ${htmlBarras(
        'Cantidad de cobros',
        porCantidad.map((v) => ({ etiqueta: v.nombre, valor: v.cobros, texto: String(v.cobros) })),
        'teal',
      )}
      ${graficoMenos}
    </div>
    <table class="tbl tbl-resumen">
      <thead><tr>
        <th class="num">#</th><th class="concepto">Servicio o concepto</th><th class="num">Cobros</th><th class="num">Valor</th><th class="num">Parte</th>
      </tr></thead>
      <tbody>${cuerpo}</tbody>
    </table>`;
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
  table.tbl td.concepto, table.tbl th.concepto { width: 22%; font-size: 6.5pt; }
  table.tbl td.usuario, table.tbl th.usuario { width: 8%; }
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
  .nota { margin: 0 0 8px; font-size: 8pt; color: #444; }
  .stat em {
    display: block; margin-top: 2px; font-style: normal; font-size: 8pt;
    font-weight: 600; color: #334155;
  }
  .stat.stat-nombre strong { font-size: 9pt; line-height: 1.25; }
  table.tbl-resumen { table-layout: auto; font-size: 8pt; }
  table.tbl-resumen th, table.tbl-resumen td { white-space: normal; font-size: 8pt; }
  .graficos {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;
  }
  .grafico {
    border: 1px solid #d6dee8; border-top: 3px solid #1a365d; background: #fff;
    padding: 8px 10px 4px; border-radius: 2px;
    break-inside: avoid; page-break-inside: avoid;
  }
  .grafico.tono-teal { border-top-color: #0f766e; }
  .grafico.tono-slate { border-top-color: #64748b; }
  .grafico:last-child:nth-child(odd) { grid-column: 1 / -1; }
  .grafico h3 {
    margin: 0 0 8px; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.04em;
    color: #1e3a5f;
  }
  .barra {
    display: grid; grid-template-columns: 16px 1fr; gap: 6px; align-items: center;
    margin-bottom: 7px;
  }
  .barra-pos {
    width: 16px; height: 16px; border-radius: 50%;
    background: #1a365d; color: #fff; font-size: 6.5pt; font-weight: 700;
    display: flex; align-items: center; justify-content: center; line-height: 1;
  }
  .tono-teal .barra-pos { background: #0f766e; }
  .tono-slate .barra-pos { background: #64748b; }
  .barra-meta {
    display: flex; justify-content: space-between; align-items: baseline; gap: 8px;
    margin-bottom: 2px;
  }
  .barra-nombre {
    font-size: 7.5pt; color: #1e293b; line-height: 1.2;
    overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  }
  .barra-val { font-size: 7pt; color: #1e293b; white-space: nowrap; font-weight: 700; }
  .barra-val em { font-style: normal; font-weight: 600; color: #64748b; margin-left: 3px; }
  .barra-pista { display: block; height: 8px; background: #e8eef5; border-radius: 99px; overflow: hidden; }
  .barra-fill { display: block; height: 100%; border-radius: 99px; background: #1e4d8c; }
  .tono-navy .barra:nth-of-type(1) .barra-fill { background: #0f2744; }
  .tono-navy .barra:nth-of-type(2) .barra-fill { background: #1a365d; }
  .tono-navy .barra:nth-of-type(3) .barra-fill { background: #1e4d8c; }
  .tono-navy .barra:nth-of-type(4) .barra-fill { background: #2b6cb0; }
  .tono-navy .barra:nth-of-type(n + 5) .barra-fill { background: #4a86c5; }
  .tono-teal .barra-fill { background: #0f766e; }
  .tono-teal .barra:nth-of-type(1) .barra-fill { background: #134e4a; }
  .tono-teal .barra:nth-of-type(2) .barra-fill { background: #0f766e; }
  .tono-teal .barra:nth-of-type(3) .barra-fill { background: #0d9488; }
  .tono-teal .barra:nth-of-type(4) .barra-fill { background: #14b8a6; }
  .tono-teal .barra:nth-of-type(n + 5) .barra-fill { background: #2dd4bf; }
  .tono-slate .barra-fill { background: #94a3b8; }
  .tono-slate .barra:nth-of-type(1) .barra-fill { background: #475569; }
  .tono-slate .barra:nth-of-type(n + 2) .barra-fill { background: #94a3b8; }
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
  /** Resumen de medio, cuenta y soporte, más gráficos de venta por servicio. */
  analisisIngresos?: boolean;
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
    ...(opts.analisisIngresos ? ['Elaboró'] : []),
    'Sesión',
    'Tercero',
    'Documento',
    'Tipo',
    'Concepto',
    ...(opts.incluirPlaca ? ['Placa'] : []),
    'Pago',
    ...(opts.analisisIngresos ? ['Cuenta'] : []),
    ...(opts.columnaSoporte ? ['Soporte'] : []),
    'Valor',
  ];
  const th = cols
    .map((c, i) => {
      const clases = [
        c === 'Concepto' ? 'concepto' : '',
        c === 'Elaboró' ? 'usuario' : '',
        i === cols.length - 1 ? 'num' : '',
      ].filter(Boolean).join(' ');
      return `<th class="${clases}">${esc(c)}</th>`;
    })
    .join('');
  const body = opts.filas
    .map((f) => {
      const celdas = [
        f.fecha,
        f.recibo,
        ...(opts.analisisIngresos ? [f.elaboro || '—'] : []),
        f.sesion,
        f.tercero,
        f.documento,
        f.tipo,
        f.concepto,
        ...(opts.incluirPlaca ? [f.placa || '—'] : []),
        f.formaPago,
        ...(opts.analisisIngresos ? [cuentaPago(f)] : []),
      ];
      const soporteTd = opts.columnaSoporte
        ? `<td class="soporte">${f.sinSoporte ? 'Falta soporte' : '—'}</td>`
        : '';
      const tds = celdas
        .map((c, i) => {
          const texto = esc(c || '—');
          const badge = i === 1 && f.sinSoporte ? '<span class="badge-sin-soporte">Sin soporte</span>' : '';
          const esConcepto = i === 6 + (opts.analisisIngresos ? 1 : 0);
          const esUsuario = opts.analisisIngresos && i === 2;
          const titulo = esConcepto || esUsuario ? ` title="${esc(c || '')}"` : '';
          const clase = esConcepto ? ' class="concepto"' : esUsuario ? ' class="usuario"' : '';
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
    ${opts.analisisIngresos ? htmlResumenPagos(opts.filas) : ''}
    ${opts.analisisIngresos ? htmlVentas(opts.filas) : ''}
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
