import { ConfigRecibo } from '../services/config.service';

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Exo:wght@400;600;700;800&family=Roboto:wght@400;500;700&display=swap';

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function informeGoogleFontsLinkHtml(): string {
  return `<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="${GOOGLE_FONTS_URL}" rel="stylesheet"/>`;
}

export function informeTipografiaCss(): string {
  return `
  html, body {
    font-family: 'Roboto', system-ui, Arial, Helvetica, sans-serif;
  }
  .doc-empresa h1,
  .doc-empresa .doc-sede,
  .doc-titulo-block h2,
  .sec-grande,
  .destacado-contrato .lbl,
  .destacado-contrato .val,
  .doc-logo-placeholder {
    font-family: 'Exo', 'Roboto', sans-serif;
  }
  `;
}

export function informeEncabezadoEmpresaCss(): string {
  return `
  .doc-header {
    display: flex; gap: 14px; align-items: flex-start;
    border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 12px;
  }
  .doc-logo-img {
    max-height: 72px; max-width: 180px; object-fit: contain; flex-shrink: 0; display: block;
  }
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

export function informeDocumentoBaseCss(): string {
  return `${informeTipografiaCss()}\n${informeEncabezadoEmpresaCss()}`;
}

export interface EmpresaInformeOpts {
  nombre?: string;
  nombreEmpresa?: string;
  nit?: string;
  nitEmpresa?: string;
  nombreSede?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  logoUrl?: string;
  urlLogoDataUrl?: string;
  urlLogo?: string;
  sede?: string;
  sedeLabel?: string;
}

function normalizarEmpresa(emp: EmpresaInformeOpts | ConfigRecibo | null | undefined) {
  const e = (emp || {}) as EmpresaInformeOpts;
  const ciudadParts = [e.ciudad, e.departamento].filter((x) => String(x || '').trim());
  return {
    nombre: e.nombre || e.nombreEmpresa || 'Centro de Capacitación',
    nit: e.nit || e.nitEmpresa || '',
    telefono: e.telefono || '',
    email: e.email || '',
    direccion: e.direccion || '',
    ciudad: ciudadParts.length ? ciudadParts.join(', ') : String(e.ciudad || '').trim(),
    logoUrl: e.logoUrl || e.urlLogoDataUrl || e.urlLogo || '',
    sede: e.sede || e.sedeLabel || e.nombreSede || '',
  };
}

export function htmlEncabezadoEmpresa(
  empresa: EmpresaInformeOpts | ConfigRecibo | null | undefined,
  opts?: { sedeLabel?: string },
): string {
  const norm = normalizarEmpresa(empresa);
  if (opts?.sedeLabel) norm.sede = opts.sedeLabel;
  const institucion = esc(norm.nombre);
  const lineas = [
    norm.nit ? `<p>NIT: ${esc(norm.nit)}</p>` : '',
    norm.telefono ? `<p>Tel: ${esc(norm.telefono)}</p>` : '',
    norm.email ? `<p>Email: ${esc(norm.email)}</p>` : '',
    norm.direccion ? `<p>Dir: ${esc(norm.direccion)}</p>` : '',
    norm.ciudad ? `<p>${esc(norm.ciudad)}</p>` : '',
  ]
    .filter(Boolean)
    .join('');

  const logoSrc = norm.logoUrl;
  const logoHtml = logoSrc
    ? `<img class="doc-logo-img" src="${esc(logoSrc)}" alt="${institucion}" />`
    : `<div class="doc-logo-placeholder">${esc((norm.nombre || 'ARGO').slice(0, 2).toUpperCase())}</div>`;
  const sedeHtml = norm.sede ? `<p class="doc-sede">${esc(norm.sede)}</p>` : '';

  return `
    <header class="doc-header">
      ${logoHtml}
      <div class="doc-empresa">
        <h1>${institucion}</h1>
        ${sedeHtml}
        ${lineas}
      </div>
    </header>`;
}
