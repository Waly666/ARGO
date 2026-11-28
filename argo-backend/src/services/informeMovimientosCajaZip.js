const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const upload = require('../middleware/upload');
const { atPageCssPara } = require('./configPaginasInformes');
const { obtenerConfigRecibo } = require('./configRecibo');
const { launchBrowser, htmlToPdfBuffer } = require('./htmlToPdf');
const { libro } = require('./informeMovimientosCajaExcel');
const { canonicoMetodoPago } = require('../utils/metodoPagoCanonico');
const { esFormaPagoEfectivo } = require('../utils/referenciaPago');

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dinero(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function conceptoCorto(texto) {
  const s = String(texto || '').trim();
  if (!s) return '—';
  if (s.length <= 42) return s;
  return `${s.slice(0, 41).trimEnd()}…`;
}

function medioPago(forma) {
  const canon = canonicoMetodoPago(forma);
  if (canon === 'Efectivo' || canon === 'Transferencia') return canon;
  return canon || 'Otro';
}

function etiquetaSoporte(f) {
  if (esFormaPagoEfectivo(f.formaPago)) return 'No aplica';
  return f.sinSoporte ? 'Sin soporte' : 'Con soporte';
}

function cuentaPago(f) {
  const cuenta = String(f.cuenta || '').trim();
  if (cuenta) return cuenta;
  return esFormaPagoEfectivo(f.formaPago) ? 'Caja' : 'Sin cuenta registrada';
}

function gruposPago(filas) {
  const ordenMedio = (m) => (m === 'Efectivo' ? 0 : m === 'Transferencia' ? 1 : 2);
  const map = new Map();
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
    (a, b) => ordenMedio(a.medio) - ordenMedio(b.medio) || b.total - a.total || a.cuenta.localeCompare(b.cuenta, 'es'),
  );
}

function htmlResumenPagos(filas) {
  const vigentes = filas.filter((f) => !f.anulado);
  const suma = (medio) => vigentes.filter((f) => medioPago(f.formaPago) === medio).reduce((a, f) => a + (Number(f.valor) || 0), 0);
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
      return `<tr${cls}><td>${esc(g.medio)}</td><td title="${esc(g.cuenta)}">${esc(g.cuenta)}</td><td class="soporte">${esc(g.soporte)}</td><td class="num">${esc(g.cantidad)}</td><td class="num">${esc(dinero(g.total))}</td></tr>`;
    })
    .join('');
  const otrosStat = otros ? `<div class="stat"><span>Otros medios</span><strong>${esc(dinero(otros))}</strong></div>` : '';
  return `<div class="sec">Pagos: motivo, medio y cuenta</div>
    <p class="nota">Totales de comprobantes vigentes. El efectivo no exige soporte. Transferencia y los demás medios quedan marcados si el sistema tiene o no la imagen del comprobante.</p>
    <div class="stats">
      <div class="stat"><span>Total en efectivo</span><strong>${esc(dinero(efectivo))}</strong></div>
      <div class="stat"><span>Total en transferencia</span><strong>${esc(dinero(transferencia))}</strong></div>
      ${otrosStat}
    </div>
    <table class="tbl tbl-resumen"><thead><tr><th>Medio</th><th>Cuenta</th><th>Soporte</th><th class="num">Pagos</th><th class="num">Total</th></tr></thead>
    <tbody>${filasHtml || '<tr><td colspan="5">Sin pagos vigentes</td></tr>'}</tbody></table>`;
}

function ventasPorServicio(filas) {
  const map = new Map();
  for (const f of filas) {
    if (f.anulado) continue;
    const lineas = Array.isArray(f.servicios) && f.servicios.length
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
  return [...map.values()].sort((a, b) => b.valor - a.valor || b.cobros - a.cobros || a.nombre.localeCompare(b.nombre, 'es'));
}

function htmlBarras(titulo, items, tono, maxValor) {
  if (!items.length) return '';
  const max = maxValor && maxValor > 0 ? maxValor : Math.max(...items.map((i) => i.valor), 1);
  const suma = items.reduce((a, i) => a + (Number(i.valor) || 0), 0) || 1;
  const mostrarParte = !(maxValor && maxValor > 0);
  const rows = items
    .map((item, i) => {
      const ancho = Math.max(3, Math.round((item.valor / max) * 100));
      const parte = Math.round((item.valor / suma) * 1000) / 10;
      const parteHtml = mostrarParte ? ` <em>${esc(parte)}%</em>` : '';
      return `<div class="barra"><span class="barra-pos">${item.puesto ?? i + 1}</span><div class="barra-cuerpo"><div class="barra-meta"><span class="barra-nombre" title="${esc(item.etiqueta)}">${esc(item.etiqueta)}</span><span class="barra-val">${esc(item.texto)}${parteHtml}</span></div><span class="barra-pista"><span class="barra-fill" style="width:${ancho}%"></span></span></div></div>`;
    })
    .join('');
  return `<article class="grafico tono-${tono}"><h3>${esc(titulo)}</h3>${rows}</article>`;
}

function htmlVentas(filas) {
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
      return `<tr><td class="num">${i + 1}</td><td class="concepto" title="${esc(v.nombre)}">${esc(v.nombre)}</td><td class="num">${esc(v.cobros)}</td><td class="num">${esc(dinero(v.valor))}</td><td class="num">${esc(pct)}%</td></tr>`;
    })
    .join('');
  const nota = ventas.length > tope
    ? `Cada servicio se cuenta por su valor dentro del comprobante. Un recibo con varios servicios suma en cada uno. Los gráficos muestran los ${tope} primeros; la tabla lista los ${ventas.length}. Los anulados no entran.`
    : 'Cada servicio se cuenta por su valor dentro del comprobante. Un recibo con varios servicios suma en cada uno. Los anulados no entran.';
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
    <p class="nota">${esc(nota)}</p>
    <div class="stats">
      <div class="stat stat-nombre"><span>Más vendido</span><strong>${esc(mas.nombre)}</strong><em>${esc(dinero(mas.valor))} · ${esc(mas.cobros)} cobro${mas.cobros === 1 ? '' : 's'}</em></div>
      <div class="stat stat-nombre"><span>Menos vendido</span><strong>${esc(menos.nombre)}</strong><em>${esc(dinero(menos.valor))} · ${esc(menos.cobros)} cobro${menos.cobros === 1 ? '' : 's'}</em></div>
    </div>
    <div class="graficos">
      ${htmlBarras('Recaudo por servicio', porValor.map((v) => ({ etiqueta: v.nombre, valor: v.valor, texto: dinero(v.valor) })), 'navy')}
      ${htmlBarras('Cantidad de cobros', porCantidad.map((v) => ({ etiqueta: v.nombre, valor: v.cobros, texto: String(v.cobros) })), 'teal')}
      ${graficoMenos}
    </div>
    <table class="tbl tbl-resumen"><thead><tr><th class="num">#</th><th class="concepto">Servicio o concepto</th><th class="num">Cobros</th><th class="num">Valor</th><th class="num">Parte</th></tr></thead><tbody>${cuerpo}</tbody></table>`;
}

function cssAnalisis() {
  return `
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 12px; }
  .stat { border: 1px solid #94a3b8; background: #edf2f7; padding: 8px; text-align: center; }
  .stat span { display: block; font-size: 8pt; text-transform: uppercase; color: #1e3a5f; }
  .stat strong { font-size: 12pt; color: #1a1a1a; }
  .stat em { display: block; margin-top: 2px; font-style: normal; font-size: 8pt; font-weight: 600; color: #334155; }
  .stat.stat-nombre strong { font-size: 9pt; line-height: 1.25; }
  .sec { margin: 14px 0 6px; font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #1e3a5f; border-bottom: 1px solid #bbb; padding-bottom: 3px; }
  .nota { margin: 0 0 8px; font-size: 8pt; color: #444; font-weight: 400; }
  table.tbl td.usuario, table.tbl th.usuario { width: 8%; }
  table.tbl.tbl-auditoria { table-layout: auto; font-size: 8pt; }
  table.tbl.tbl-auditoria th, table.tbl.tbl-auditoria td {
    white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: anywhere; vertical-align: top;
  }
  table.tbl-resumen { table-layout: auto; font-size: 8pt; }
  table.tbl-resumen th, table.tbl-resumen td { white-space: normal; font-size: 8pt; }
  .graficos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .grafico { border: 1px solid #d6dee8; border-top: 3px solid #1a365d; background: #fff; padding: 8px 10px 4px; break-inside: avoid; page-break-inside: avoid; }
  .grafico.tono-teal { border-top-color: #0f766e; }
  .grafico.tono-slate { border-top-color: #64748b; }
  .grafico:last-child:nth-child(odd) { grid-column: 1 / -1; }
  .grafico h3 { margin: 0 0 8px; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.04em; color: #1e3a5f; }
  .barra { display: grid; grid-template-columns: 16px 1fr; gap: 6px; align-items: center; margin-bottom: 7px; }
  .barra-pos { width: 16px; height: 16px; border-radius: 50%; background: #1a365d; color: #fff; font-size: 6.5pt; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .tono-teal .barra-pos { background: #0f766e; }
  .tono-slate .barra-pos { background: #64748b; }
  .barra-meta { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 2px; }
  .barra-nombre { font-size: 7.5pt; overflow: hidden; }
  .barra-val { font-size: 7pt; font-weight: 700; white-space: nowrap; }
  .barra-val em { font-style: normal; font-weight: 600; color: #64748b; margin-left: 3px; }
  .barra-pista { display: block; height: 8px; background: #e8eef5; border-radius: 99px; overflow: hidden; }
  .barra-fill { display: block; height: 100%; border-radius: 99px; background: #1e4d8c; }
  .tono-navy .barra:nth-of-type(1) .barra-fill { background: #0f2744; }
  .tono-navy .barra:nth-of-type(2) .barra-fill { background: #1a365d; }
  .tono-navy .barra:nth-of-type(3) .barra-fill { background: #1e4d8c; }
  .tono-navy .barra:nth-of-type(n + 4) .barra-fill { background: #2b6cb0; }
  .tono-teal .barra-fill { background: #0f766e; }
  .tono-slate .barra-fill { background: #94a3b8; }
  .badge-sin-soporte { display: inline-block; font-size: 7pt; font-weight: 700; text-transform: uppercase; margin-left: 4px; padding: 1px 5px; background: #feb2b2; color: #742a2a; }
  `;
}

function htmlInforme({ titulo, filtros, filas, empresa, atPageCss, columnaSoporte, incluirPlaca, analisisIngresos }) {
  const vigentes = filas.filter((f) => !f.anulado);
  const total = vigentes.reduce((a, f) => a + (Number(f.valor) || 0), 0);
  const sinSoporte = filas.filter((f) => f.sinSoporte).length;
  const periodo = filtros.desde || filtros.hasta
    ? `${filtros.desde || '…'} — ${filtros.hasta || '…'}`
    : 'Todo el histórico consultado';
  const docFiltro = filtros.numDoc || filtros.numeroDocumento || filtros.doc || 'Todos';
  const cols = [
    'Fecha', 'Recibo',
    ...(analisisIngresos ? ['Elaboró'] : []),
    'Sesión', 'Tercero', 'Documento', 'Tipo', 'Concepto',
    ...(incluirPlaca ? ['Placa'] : []),
    'Pago',
    ...(analisisIngresos ? ['Cuenta'] : []),
    ...(columnaSoporte ? ['Soporte'] : []),
    'Valor',
  ];
  const th = cols.map((c) => {
    const clases = [c === 'Valor' ? 'num' : '', c === 'Concepto' ? 'concepto' : '', c === 'Elaboró' ? 'usuario' : ''].filter(Boolean).join(' ');
    return `<th${clases ? ` class="${clases}"` : ''}>${esc(c)}</th>`;
  }).join('');
  const body = filas.map((f) => {
    const celdas = [
      f.fecha, f.recibo,
      ...(analisisIngresos ? [f.elaboro || '—'] : []),
      f.sesion, f.tercero, f.documento, f.tipo,
      analisisIngresos ? f.concepto : conceptoCorto(f.concepto),
      ...(incluirPlaca ? [f.placa || '—'] : []),
      f.formaPago,
      ...(analisisIngresos ? [cuentaPago(f)] : []),
    ];
    const tds = celdas.map((c, i) => {
      const esConcepto = i === 6 + (analisisIngresos ? 1 : 0);
      const esUsuario = analisisIngresos && i === 2;
      const clase = esConcepto ? ' class="concepto"' : esUsuario ? ' class="usuario"' : '';
      const titulo = esConcepto || esUsuario ? ` title="${esc(c || '')}"` : '';
      const badge = analisisIngresos && i === 1 && f.sinSoporte ? '<span class="badge-sin-soporte">Sin soporte</span>' : '';
      return `<td${clase}${titulo}>${esc(c || '—')}${badge}</td>`;
    }).join('');
    const soporte = columnaSoporte ? `<td class="soporte">${f.sinSoporte ? 'Falta soporte' : '—'}</td>` : '';
    const cls = [f.anulado ? 'anulado' : '', f.sinSoporte ? 'sin-soporte' : ''].filter(Boolean).join(' ');
    const marca = f.anulado ? ' (anulado)' : '';
    return `<tr class="${cls}">${tds}${soporte}<td class="num">${esc(dinero(f.valor))}${esc(marca)}</td></tr>`;
  }).join('');
  const alerta = sinSoporte
    ? `<div class="alerta"><strong>Alerta: ${sinSoporte} ingreso${sinSoporte === 1 ? '' : 's'} sin soporte adjunto</strong></div>`
    : '';
  const nombre = empresa?.nombreEmpresa || 'ARGO';
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/>
<style>
  ${atPageCss || '@page { size: letter landscape; margin: 10mm; }'}
  * { box-sizing: border-box; }
  html, body { margin: 0; color: #1a1a1a; font: 8pt/1.2 Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1 { margin: 0 0 2px; font-size: 12pt; color: #1e3a5f; }
  .sub { margin: 0 0 8px; color: #444; }
  table.meta { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  table.meta td { padding: 1px 0; }
  table.meta td:first-child { width: 90px; font-weight: 700; color: #555; }
  table.tbl { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 7pt; line-height: 1.15; }
  table.tbl th, table.tbl td { border: 1px solid #999; padding: 1px 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; }
  table.tbl th { background: #1a365d; color: #fff; font-size: 6.5pt; text-align: left; }
  table.tbl td.concepto, table.tbl th.concepto { width: 28%; }
  table.tbl td.num, table.tbl th.num { text-align: right; }
  table.tbl tr.sin-soporte td { background: #fecaca; color: #7f1d1d; font-weight: 700; }
  table.tbl tr.sin-soporte td.soporte { background: #dc2626; color: #fff; }
  table.tbl tr.anulado td { color: #9f1239; text-decoration: line-through; }
  table.tbl tr.total td { background: #1a365d; color: #fff; font-weight: 700; text-decoration: none; }
  .alerta { border: 1px solid #c53030; background: #fff5f5; color: #9b2c2c; padding: 4px 8px; margin: 0 0 8px; font-weight: 700; }
  ${analisisIngresos ? cssAnalisis() : ''}
  .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 16px; text-align: center; page-break-inside: avoid; }
  .firmas .linea { border-top: 1px solid #333; margin-top: 72px; padding-top: 6px; }
</style></head><body>
  <h1>${esc(nombre)}</h1>
  <p class="sub">${esc(titulo)}${empresa?.nit ? ` · NIT ${esc(empresa.nit)}` : ''}</p>
  <table class="meta">
    <tr><td>Periodo</td><td>${esc(periodo)}</td></tr>
    <tr><td>Documento</td><td>${esc(docFiltro)}</td></tr>
    <tr><td>Tipo</td><td>${esc(filtros.tipo || 'Todos')}</td></tr>
    <tr><td>Concepto</td><td>${esc(filtros.concepto || 'Todos')}</td></tr>
    <tr><td>Movimientos</td><td>${filas.length} · Anulados ${filas.length - vigentes.length} · Total vigente ${esc(dinero(total))}${sinSoporte ? ` · Sin soporte ${sinSoporte}` : ''}</td></tr>
  </table>
  ${alerta}
  ${analisisIngresos ? htmlResumenPagos(filas) : ''}
  ${analisisIngresos ? htmlVentas(filas) : ''}
  <table class="tbl${analisisIngresos ? ' tbl-auditoria' : ''}"><thead><tr>${th}</tr></thead><tbody>
    ${body || `<tr><td colspan="${cols.length}">Sin movimientos</td></tr>`}
    <tr class="total"><td colspan="${cols.length - 1}">Total (sin anulados)</td><td class="num">${esc(dinero(total))}</td></tr>
  </tbody></table>
  <div class="firmas"><div><div class="linea">Elaborado por</div></div><div><div class="linea">Revisado / Aprobado</div></div></div>
</body></html>`;
}

function archivoSoporte(url) {
  let rel = String(url || '').trim();
  if (!rel) return null;
  try {
    if (/^https?:\/\//i.test(rel)) rel = new URL(rel).pathname;
  } catch {
    /* ruta local */
  }
  rel = rel.replace(/^\/+/, '');
  if (rel.toLowerCase().startsWith('uploads/')) rel = rel.slice('uploads/'.length);
  const abs = upload.resolvePath(rel);
  if (!abs) return null;
  const base = path.resolve(upload.baseDir);
  const resolved = path.resolve(abs);
  const relativo = path.relative(base, resolved);
  if (!relativo || relativo.startsWith('..') || path.isAbsolute(relativo)) return null;
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) return null;
  return resolved;
}

function nombreSoporte(numRecibo, filePath, usados) {
  const ext = (path.extname(filePath) || '').toLowerCase();
  let base = String(numRecibo || '').trim().replace(/[^\w.\-]+/g, '_');
  if (!base || base === '.' || base === '_') base = 'sin-recibo';
  let nombre = `${base}${ext}`;
  let n = 2;
  while (usados.has(nombre)) {
    nombre = `${base}_${n}${ext}`;
    n += 1;
  }
  usados.add(nombre);
  return nombre;
}

async function enviarPaquete(res, opts) {
  const atPageCss = await atPageCssPara(
    opts.atPageKey,
    opts.analisisIngresos ? { sizeOverride: '279.4mm 215.9mm' } : {},
  );
  let empresa = null;
  try {
    empresa = await obtenerConfigRecibo(opts.idSede || null);
  } catch {
    empresa = null;
  }
  const html = htmlInforme({
    titulo: opts.titulo,
    filtros: opts.filtros,
    filas: opts.filasPdf,
    empresa,
    atPageCss,
    columnaSoporte: opts.columnaSoporte,
    incluirPlaca: opts.incluirPlaca,
    analisisIngresos: opts.analisisIngresos,
  });
  const browser = await launchBrowser();
  let pdfBuffer;
  try {
    pdfBuffer = await htmlToPdfBuffer(
      browser,
      html,
      opts.analisisIngresos
        ? { format: 'Letter', landscape: true, preferCSSPageSize: false }
        : undefined,
    );
  } finally {
    await browser.close().catch(() => {});
  }
  const xlsxBuffer = libro({
    titulo: opts.titulo,
    filtros: opts.filtros,
    headers: opts.headers,
    filas: opts.filasExcel,
    totalVigente: opts.totalVigente,
  });
  const usados = new Set();
  const soportes = [];
  for (const s of opts.soportes || []) {
    const archivo = archivoSoporte(s.url);
    if (!archivo) continue;
    soportes.push({
      path: archivo,
      nombre: nombreSoporte(s.numRecibo, archivo, usados),
    });
  }
  const base = opts.nombreBase;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${base}.zip"`);
  res.setHeader('Cache-Control', 'no-store');
  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.on('error', (err) => {
    if (!res.headersSent) res.status(500).json({ message: err.message || 'No se pudo armar el ZIP.' });
    else res.destroy(err);
  });
  archive.pipe(res);
  archive.append(pdfBuffer, { name: `${base}.pdf` });
  archive.append(xlsxBuffer, { name: `${base}.xlsx` });
  for (const s of soportes) archive.file(s.path, { name: `soportes/${s.nombre}` });
  await archive.finalize();
}

module.exports = { enviarPaquete };
