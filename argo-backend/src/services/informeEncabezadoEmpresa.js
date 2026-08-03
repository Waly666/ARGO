/**
 * Encabezado de empresa y tipografía unificados para informes HTML/PDF del ERP.
 * Fuente títulos: Exo · cuerpo y datos: Roboto.
 */

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Exo:wght@400;600;700;800&family=Roboto:wght@400;500;700&display=swap';

function informeGoogleFontsLinkHtml() {
  return `<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="${GOOGLE_FONTS_URL}" rel="stylesheet"/>`;
}

function informeTipografiaCss() {
  return `
  html, body {
    font-family: 'Roboto', system-ui, Arial, Helvetica, sans-serif;
  }
  .no-print.toolbar button,
  .no-print.toolbar .hint-tool {
    font-family: 'Roboto', system-ui, sans-serif;
  }
  .doc-empresa h1,
  .doc-empresa .doc-sede,
  .doc-titulo-block h2,
  .sec-grande,
  .destacado-contrato .lbl,
  .destacado-contrato .val,
  .chart-section-title,
  .doc-logo-placeholder {
    font-family: 'Exo', 'Roboto', sans-serif;
  }
  `;
}

function informeEncabezadoEmpresaCss() {
  return `
  .doc-header {
    display: flex; gap: 14px; align-items: flex-start;
    border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 12px;
  }
  .doc-logo-img { max-height: 72px; max-width: 180px; object-fit: contain; flex-shrink: 0; }
  .doc-logo-placeholder {
    width: 56px; height: 56px; border: 2px solid #1e3a5f; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 13px; color: #1e3a5f; flex-shrink: 0;
  }
  .doc-empresa h1 {
    margin: 0 0 4px; font-size: 16pt; font-weight: 700; color: #1e3a5f;
  }
  .doc-empresa .doc-sede {
    margin: 0 0 4px; font-size: 10pt; font-weight: 600; color: #334155;
  }
  .doc-empresa p { margin: 0; font-size: 9pt; color: #333; line-height: 1.4; }
  `;
}

function informeDocumentoBaseCss() {
  return `${informeTipografiaCss()}\n${informeEncabezadoEmpresaCss()}`;
}

function normalizarEmpresaCapacitadora(emp = {}) {
  const ciudadParts = [emp.ciudad, emp.departamento].filter((x) => String(x || '').trim());
  return {
    nombre: emp.nombre || emp.nombreEmpresa || 'Centro de Capacitación',
    nit: emp.nit || emp.nitEmpresa || '',
    telefono: emp.telefono || '',
    email: emp.email || '',
    direccion: emp.direccion || '',
    ciudad: ciudadParts.length ? ciudadParts.join(', ') : String(emp.ciudad || '').trim(),
    logoUrl: emp.logoUrl || emp.urlLogoDataUrl || emp.urlLogo || '',
    sede: emp.sede || emp.sedeLabel || emp.nombreSede || '',
  };
}

function lineasContactoEmpresaHtml(norm, esc) {
  return [
    norm.nit ? `<p>NIT: ${esc(norm.nit)}</p>` : '',
    norm.telefono ? `<p>Tel: ${esc(norm.telefono)}</p>` : '',
    norm.email ? `<p>Email: ${esc(norm.email)}</p>` : '',
    norm.direccion ? `<p>Dir: ${esc(norm.direccion)}</p>` : '',
    norm.ciudad ? `<p>${esc(norm.ciudad)}</p>` : '',
  ]
    .filter(Boolean)
    .join('');
}

function htmlEncabezadoEmpresa(emp, esc) {
  const norm = normalizarEmpresaCapacitadora(emp);
  const logo = norm.logoUrl
    ? `<img class="doc-logo-img" src="${esc(norm.logoUrl)}" alt="${esc(norm.nombre)}" />`
    : `<div class="doc-logo-placeholder">${esc((norm.nombre || 'ARGO').slice(0, 2).toUpperCase())}</div>`;
  const sedeHtml = norm.sede ? `<p class="doc-sede">${esc(norm.sede)}</p>` : '';

  return `<header class="doc-header">
    ${logo}
    <div class="doc-empresa">
      <h1>${esc(norm.nombre)}</h1>
      ${sedeHtml}
      ${lineasContactoEmpresaHtml(norm, esc)}
    </div>
  </header>`;
}

module.exports = {
  informeGoogleFontsLinkHtml,
  informeTipografiaCss,
  informeEncabezadoEmpresaCss,
  informeDocumentoBaseCss,
  normalizarEmpresaCapacitadora,
  htmlEncabezadoEmpresa,
};
