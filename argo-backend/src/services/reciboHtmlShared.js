function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(n) {
  return Number(n || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

function fmtFecha(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function lineaHtml(ancho = 32) {
  return `<div class="line">${'─'.repeat(ancho)}</div>`;
}

function bloqueEmpresaHtml(config) {
  const v = (x) => esc((x || '').toString().trim() || '—');
  return `
  <div class="center empresa">${v(config.nombreEmpresa)}</div>
  <div class="center dato">NIT: ${v(config.nit)}</div>
  <div class="center dato">Tel: ${v(config.telefono)}</div>
  <div class="center dato">Dir: ${v(config.direccion)}</div>
  <div class="center dato">Ciudad: ${v(config.ciudad)}</div>
  <div class="center dato">Email: ${v(config.email)}</div>`;
}

function estilosRecibo(mm, w) {
  return `
    @page { size: ${mm}mm auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Courier New", Consolas, monospace;
      font-size: 11px;
      line-height: 1.35;
      margin: 0;
      padding: 8px;
      width: ${w}px;
      max-width: ${w}px;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .empresa { font-weight: bold; font-size: 12px; margin-bottom: 2px; }
    .dato { font-size: 10px; line-height: 1.3; }
    .titulo { font-weight: bold; margin: 6px 0 2px; letter-spacing: 0.5px; font-size: 11px; }
    .slogan { font-size: 10px; margin-bottom: 4px; font-style: italic; }
    .line { text-align: center; color: #333; margin: 4px 0; overflow: hidden; white-space: nowrap; }
    table { width: 100%; border-collapse: collapse; }
    td { vertical-align: top; padding: 2px 0; }
    td.k { width: 42%; font-weight: bold; }
    td.v { width: 58%; text-align: right; word-break: break-word; }
    .total { font-size: 13px; font-weight: bold; margin-top: 6px; text-align: center; }
    .pie { font-size: 9px; text-align: center; margin-top: 8px; color: #333; }
    .firma { margin-top: 14px; font-size: 10px; }
    .firma .linea-firma { border-top: 1px solid #000; margin: 28px 8px 4px; }
    .firma p { margin: 2px 0; text-align: center; }
    .nota-legal { font-size: 9px; margin-top: 8px; text-align: center; color: #444; }
    .qr { text-align: center; margin: 8px 0; }
    .qr img { width: 100px; height: 100px; }
    .no-print { margin-top: 12px; text-align: center; }
    @media print {
      .no-print { display: none !important; }
      body { width: ${w}px; }
    }
  `;
}

module.exports = {
  esc,
  fmtMoney,
  fmtFecha,
  lineaHtml,
  bloqueEmpresaHtml,
  estilosRecibo,
};
