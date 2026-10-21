const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const upload = require('../middleware/upload');
const { atPageCssPara } = require('./configPaginasInformes');
const { obtenerConfigRecibo } = require('./configRecibo');
const { launchBrowser, htmlToPdfBuffer } = require('./htmlToPdf');
const { libro } = require('./informeMovimientosCajaExcel');

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

function htmlInforme({ titulo, filtros, filas, empresa, atPageCss, columnaSoporte, incluirPlaca }) {
  const vigentes = filas.filter((f) => !f.anulado);
  const total = vigentes.reduce((a, f) => a + (Number(f.valor) || 0), 0);
  const sinSoporte = filas.filter((f) => f.sinSoporte).length;
  const periodo = filtros.desde || filtros.hasta
    ? `${filtros.desde || '…'} — ${filtros.hasta || '…'}`
    : 'Todo el histórico consultado';
  const docFiltro = filtros.numDoc || filtros.numeroDocumento || filtros.doc || 'Todos';
  const cols = [
    'Fecha', 'Recibo', 'Sesión', 'Tercero', 'Documento', 'Tipo', 'Concepto',
    ...(incluirPlaca ? ['Placa'] : []),
    'Pago',
    ...(columnaSoporte ? ['Soporte'] : []),
    'Valor',
  ];
  const th = cols.map((c) => `<th${c === 'Valor' ? ' class="num"' : ''}${c === 'Concepto' ? ' class="concepto"' : ''}>${esc(c)}</th>`).join('');
  const body = filas.map((f) => {
    const celdas = [
      f.fecha, f.recibo, f.sesion, f.tercero, f.documento, f.tipo, conceptoCorto(f.concepto),
      ...(incluirPlaca ? [f.placa || '—'] : []),
      f.formaPago,
    ];
    const tds = celdas.map((c, i) => {
      const concepto = i === 6 ? ` class="concepto" title="${esc(f.concepto || '')}"` : '';
      return `<td${concepto}>${esc(c || '—')}</td>`;
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
  <table class="tbl"><thead><tr>${th}</tr></thead><tbody>
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
  const atPageCss = await atPageCssPara(opts.atPageKey);
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
  });
  const browser = await launchBrowser();
  let pdfBuffer;
  try {
    pdfBuffer = await htmlToPdfBuffer(browser, html);
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
