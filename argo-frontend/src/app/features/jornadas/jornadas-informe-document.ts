import { ConfigRecibo } from '../../core/services/config.service';

export type ColumnaInformeJornada = { k: string; l: string };

/** Colores alineados a comprobantes media carta / informes de caja. */
const DOC_CSS = `
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: #fff !important;
    color: #1a1a1a !important;
    font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
    font-size: 9.5pt;
    line-height: 1.35;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc { max-width: 100%; margin: 0 auto; }
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
    font-family: Georgia, 'Times New Roman', serif;
  }
  .doc-empresa p { margin: 0; font-size: 9pt; color: #333; }
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
  .doc-meta td:first-child { width: 120px; font-weight: 600; color: #555; }
  .stats {
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
    margin-bottom: 12px;
  }
  .stat {
    border: 1px solid #94a3b8; background: #edf2f7; padding: 8px; text-align: center;
  }
  .stat span { display: block; font-size: 8pt; text-transform: uppercase; color: #1e3a5f; }
  .stat strong { font-size: 12pt; color: #1a1a1a; }
  .sec {
    margin: 14px 0 6px; font-size: 10pt; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.4px; color: #1e3a5f; border-bottom: 1px solid #bbb; padding-bottom: 3px;
  }
  .sec-grande {
    margin: 16px 0 8px; padding: 10px 12px;
    background: #1a365d; color: #fff; border-radius: 2px;
    font-size: 13pt; font-weight: 800; letter-spacing: 0.03em;
  }
  .destacado-contrato {
    text-align: center; margin: 8px 0 12px;
    display: flex; flex-wrap: wrap; justify-content: center; gap: 16px 28px;
  }
  .destacado-contrato .item { text-align: center; }
  .destacado-contrato .lbl {
    display: block; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.08em;
    color: #1e3a5f; font-weight: 700; margin-bottom: 2px;
  }
  .destacado-contrato .val {
    display: block; font-size: 22pt; font-weight: 800; color: #1a365d; letter-spacing: 0.04em;
  }
  .destacado-contrato .extra {
    display: block; font-size: 9pt; color: #555; margin-top: 2px;
  }
  table.tbl {
    width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 8pt;
  }
  table.tbl th, table.tbl td {
    border: 1px solid #999; padding: 3px 5px; vertical-align: top;
  }
  table.tbl th {
    background: #1a365d; color: #fff; font-weight: 700; text-align: left;
  }
  table.tbl tbody tr:nth-child(even) td { background: #f8fafc; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  .doc-footer {
    margin-top: 18px; padding-top: 10px; border-top: 1px solid #ccc;
    font-size: 8pt; color: #666; text-align: center;
  }
  .firmas {
    display: grid; grid-template-columns: 1fr 1fr; gap: 40px;
    margin-top: 28px; font-size: 9pt; text-align: center;
  }
  .firmas .linea {
    border-top: 1px solid #333; margin-bottom: 6px; padding-top: 4px;
  }
  .toolbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 99;
    background: #1e3a5f; color: #fff; padding: 10px 16px;
    display: flex; gap: 10px; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,.2);
  }
  .toolbar button {
    background: #fff; color: #1e3a5f; border: none; padding: 8px 16px;
    border-radius: 4px; font-weight: 600; cursor: pointer; font-size: 10pt;
  }
  .toolbar span { font-size: 10pt; opacity: .9; }
  @media print {
    .toolbar { display: none !important; }
    body { padding: 0 !important; }
  }
  @media screen {
    body { padding: 56px 16px 24px; background: #e5e7eb !important; }
    .doc {
      background: #fff; padding: 14mm 12mm;
      box-shadow: 0 4px 24px rgba(0,0,0,.15);
    }
  }
`;

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function celda(v: unknown): string {
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (v == null || v === '') return '—';
  return esc(v);
}

function encabezadoEmpresa(empresa: ConfigRecibo | null | undefined): string {
  const institucion = esc(empresa?.nombreEmpresa || 'ARGO');
  const lineas = [
    empresa?.nit ? `NIT: ${esc(empresa.nit)}` : '',
    empresa?.telefono ? `Tel: ${esc(empresa.telefono)}` : '',
    empresa?.direccion ? `Dir: ${esc(empresa.direccion)}` : '',
    [empresa?.ciudad, empresa?.departamento].filter(Boolean).map((x) => esc(String(x))).join(', '),
    empresa?.email ? `Email: ${esc(empresa.email)}` : '',
  ]
    .filter(Boolean)
    .map((l) => `<p>${l}</p>`)
    .join('');

  const logoSrc = empresa?.urlLogoDataUrl || empresa?.urlLogo || '';
  const logoHtml = logoSrc
    ? `<img class="doc-logo-img" src="${esc(logoSrc)}" alt="${institucion}" />`
    : `<div class="doc-logo-placeholder">ARGO</div>`;

  return `
    <header class="doc-header">
      ${logoHtml}
      <div class="doc-empresa">
        <h1>${institucion}</h1>
        ${lineas}
      </div>
    </header>`;
}

function pieDocumento(empresa: ConfigRecibo | null | undefined): string {
  const msg = esc(empresa?.mensajePie || 'Documento generado por ARGO — Jornadas de Capacitación');
  return `
    <div class="firmas">
      <div><div class="linea">Elaborado por</div></div>
      <div><div class="linea">Revisado / Aprobado</div></div>
    </div>
    <footer class="doc-footer"><p>${msg}</p></footer>`;
}

function tablaHtml(
  columnas: ColumnaInformeJornada[],
  filas: Record<string, unknown>[],
): string {
  const th = columnas.map((c) => `<th>${esc(c.l)}</th>`).join('');
  const body = filas
    .map(
      (row) =>
        `<tr>${columnas.map((c) => `<td>${celda(row[c.k])}</td>`).join('')}</tr>`,
    )
    .join('');
  return `
    <table class="tbl">
      <thead><tr>${th}</tr></thead>
      <tbody>${body || `<tr><td colspan="${columnas.length}">Sin datos</td></tr>`}</tbody>
    </table>`;
}

export function buildJornadasInformeHtml(opts: {
  titulo: string;
  subtitulo?: string;
  filtros?: { contrato?: string; jornada?: string; clase?: string; desde?: string; hasta?: string };
  /** Código de contrato en grande cuando el informe está filtrado. */
  codigoContratoDestacado?: string;
  /** ID corto de jornada en grande cuando el informe está filtrado. */
  idJornadaDestacado?: string;
  fechaJornadaDestacada?: string;
  idClaseDestacado?: string;
  resumen?: {
    alumnosUnicos?: number;
    totalFilasClase?: number;
    registrosAsistencia?: number;
    registrosInscripcion?: number;
    certificados?: number;
  };
  secciones: Array<{
    titulo: string;
    tituloGrande?: boolean;
    columnas: ColumnaInformeJornada[];
    filas: Record<string, unknown>[];
  }>;
  empresa?: ConfigRecibo | null;
}): string {
  const metaRows = [
    !opts.codigoContratoDestacado && opts.filtros?.contrato
      ? `<tr><td>Contrato</td><td>${esc(opts.filtros.contrato)}</td></tr>`
      : '',
    !opts.idJornadaDestacado && opts.filtros?.jornada
      ? `<tr><td>Jornada</td><td>${esc(opts.filtros.jornada)}</td></tr>`
      : '',
    !opts.idClaseDestacado && opts.filtros?.clase
      ? `<tr><td>Clase</td><td>${esc(opts.filtros.clase)}</td></tr>`
      : '',
    opts.filtros?.desde || opts.filtros?.hasta
      ? `<tr><td>Periodo</td><td>${esc(opts.filtros.desde || '…')} — ${esc(opts.filtros.hasta || '…')}</td></tr>`
      : '',
    `<tr><td>Generado</td><td>${esc(new Date().toLocaleString('es-CO'))}</td></tr>`,
  ]
    .filter(Boolean)
    .join('');

  const itemsDestacados: string[] = [];
  if (opts.codigoContratoDestacado) {
    itemsDestacados.push(`
      <div class="item">
        <span class="lbl">Contrato</span>
        <span class="val">${esc(opts.codigoContratoDestacado)}</span>
      </div>`);
  }
  if (opts.idJornadaDestacado) {
    itemsDestacados.push(`
      <div class="item">
        <span class="lbl">ID jornada</span>
        <span class="val">${esc(opts.idJornadaDestacado)}</span>
        ${opts.fechaJornadaDestacada ? `<span class="extra">${esc(opts.fechaJornadaDestacada)}</span>` : ''}
      </div>`);
  }
  if (opts.idClaseDestacado) {
    itemsDestacados.push(`
      <div class="item">
        <span class="lbl">ID clase</span>
        <span class="val">${esc(opts.idClaseDestacado)}</span>
      </div>`);
  }
  const contratoGrande = itemsDestacados.length
    ? `<div class="destacado-contrato">${itemsDestacados.join('')}</div>`
    : '';

  const resumen = opts.resumen
    ? `<div class="stats">
        <div class="stat"><span>Alumnos únicos</span><strong>${esc(opts.resumen.alumnosUnicos ?? 0)}</strong></div>
        <div class="stat"><span>Por clase</span><strong>${esc(opts.resumen.totalFilasClase ?? 0)}</strong></div>
        <div class="stat"><span>Asistencias</span><strong>${esc(opts.resumen.registrosAsistencia ?? 0)}</strong></div>
        <div class="stat"><span>Inscripciones</span><strong>${esc(opts.resumen.registrosInscripcion ?? 0)}</strong></div>
        <div class="stat"><span>Certificados</span><strong>${esc(opts.resumen.certificados ?? 0)}</strong></div>
      </div>`
    : '';

  const secciones = opts.secciones
    .map(
      (s) => `
      <div class="${s.tituloGrande ? 'sec-grande' : 'sec'}">${esc(s.titulo)} (${s.filas.length})</div>
      ${tablaHtml(s.columnas, s.filas)}
    `,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${esc(opts.titulo)}</title>
  <style>${DOC_CSS}</style>
</head>
<body>
  <div class="toolbar no-print">
    <button type="button" onclick="window.print()">Imprimir / Guardar PDF</button>
    <button type="button" onclick="window.close()">Cerrar</button>
    <span>${esc(opts.titulo)}</span>
  </div>
  <div class="doc">
    ${encabezadoEmpresa(opts.empresa)}
    <div class="doc-titulo-block">
      <h2>${esc(opts.titulo)}</h2>
      ${opts.subtitulo ? `<p>${esc(opts.subtitulo)}</p>` : ''}
    </div>
    ${contratoGrande}
    <table class="doc-meta">${metaRows}</table>
    ${resumen}
    ${secciones}
    ${pieDocumento(opts.empresa)}
  </div>
</body>
</html>`;
}

export function abrirInformeJornadasPdf(html: string): boolean {
  const w = window.open('', '_blank', 'width=1100,height=780,scrollbars=yes');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
