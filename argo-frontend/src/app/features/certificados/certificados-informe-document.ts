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

export type CertificadoInformeFila = {
  codigo: string;
  alumno: string;
  documento: string;
  tipo: string;
  curso: string;
  emision: string;
  estado: 'vigente' | 'vencido' | 'anulado';
  origen: 'migracion' | 'programa';
  elaboro: string;
  ingresos: string[];
};

export type FiltrosInformeCertificados = {
  buscar?: string;
  tipo?: string;
  estado?: string;
  desde?: string;
  hasta?: string;
  empresa?: string;
  origen?: string;
};

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function htmlBarras(
  titulo: string,
  items: { etiqueta: string; valor: number; texto: string }[],
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
        <span class="barra-pos">${i + 1}</span>
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

function conteo(filas: CertificadoInformeFila[], clave: 'tipo' | 'curso'): { nombre: string; n: number }[] {
  const map = new Map<string, number>();
  for (const f of filas) {
    const nombre = String(f[clave] || '').trim() || 'Sin dato';
    map.set(nombre, (map.get(nombre) || 0) + 1);
  }
  return [...map.entries()]
    .map(([nombre, n]) => ({ nombre, n }))
    .sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre, 'es'));
}

function bloqueCursos(titulo: string, filas: CertificadoInformeFila[], tono: 'navy' | 'teal'): string {
  const porCurso = conteo(filas, 'curso');
  if (!porCurso.length) return '';
  const tope = 8;
  const top = porCurso.slice(0, tope);
  const menos = porCurso.length > tope ? porCurso.slice(-4) : [];
  const max = porCurso[0]?.n || 1;
  return `<div class="bloque-origen">
    <h3 class="origen-titulo origen-${tono}">${esc(titulo)} · ${esc(filas.length)}</h3>
    <div class="graficos">
      ${htmlBarras(
        'Cursos que más se expiden',
        top.map((v) => ({ etiqueta: v.nombre, valor: v.n, texto: String(v.n) })),
        tono,
      )}
      ${
        menos.length
          ? htmlBarras(
              'Los que menos se expiden',
              menos.map((v) => ({ etiqueta: v.nombre, valor: v.n, texto: String(v.n) })),
              'slate',
              max,
            )
          : ''
      }
    </div>
  </div>`;
}

function htmlGraficos(filas: CertificadoInformeFila[]): string {
  const programa = filas.filter((f) => f.origen === 'programa');
  const migracion = filas.filter((f) => f.origen === 'migracion');
  const porTipo = conteo(filas, 'tipo');
  if (!filas.length) return '';
  return `<div class="sec">Expedición</div>
    <div class="graficos">
      ${htmlBarras(
        'Migración y programa',
        [
          { etiqueta: 'Expedido con el programa', valor: programa.length, texto: String(programa.length) },
          { etiqueta: 'Migración', valor: migracion.length, texto: String(migracion.length) },
        ].filter((i) => i.valor > 0),
        'navy',
      )}
      ${htmlBarras(
        'Por tipo de capacitación',
        porTipo.slice(0, 12).map((v) => ({ etiqueta: v.nombre, valor: v.n, texto: String(v.n) })),
        'teal',
      )}
    </div>
    ${bloqueCursos('Expedidos con el programa', programa, 'teal')}
    ${bloqueCursos('Certificados de migración', migracion, 'navy')}`;
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
  .doc-meta { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9pt; }
  .doc-meta td { padding: 2px 0; vertical-align: top; }
  .doc-meta td:first-child { width: 130px; font-weight: 600; color: #555; }
  .stats {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px;
    margin-bottom: 12px;
  }
  .stat { border: 1px solid #94a3b8; background: #edf2f7; padding: 8px; text-align: center; }
  .stat span { display: block; font-size: 8pt; text-transform: uppercase; color: #1e3a5f; }
  .stat strong { font-size: 12pt; color: #1a1a1a; }
  .stat em { display: block; margin-top: 2px; font-style: normal; font-size: 8pt; font-weight: 600; color: #334155; }
  .stat.stat-nombre strong { font-size: 9pt; line-height: 1.25; }
  .sec {
    margin: 14px 0 6px; font-size: 10pt; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.4px; color: #1e3a5f; border-bottom: 1px solid #bbb; padding-bottom: 3px;
  }
  .graficos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .grafico {
    border: 1px solid #d6dee8; border-top: 3px solid #1a365d; background: #fff;
    padding: 8px 10px 4px; border-radius: 2px; break-inside: avoid; page-break-inside: avoid;
  }
  .grafico.tono-teal { border-top-color: #0f766e; }
  .grafico.tono-slate { border-top-color: #64748b; }
  .grafico:last-child:nth-child(odd) { grid-column: 1 / -1; }
  .grafico h3 { margin: 0 0 8px; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.04em; color: #1e3a5f; }
  .barra { display: grid; grid-template-columns: 16px 1fr; gap: 6px; align-items: center; margin-bottom: 7px; }
  .barra-pos {
    width: 16px; height: 16px; border-radius: 50%; background: #1a365d; color: #fff;
    font-size: 6.5pt; font-weight: 700; display: flex; align-items: center; justify-content: center;
  }
  .tono-teal .barra-pos { background: #0f766e; }
  .tono-slate .barra-pos { background: #64748b; }
  .barra-meta { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 2px; }
  .barra-nombre {
    font-size: 7.5pt; color: #1e293b; line-height: 1.2; overflow: hidden;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  }
  .barra-val { font-size: 7pt; color: #1e293b; white-space: nowrap; font-weight: 700; }
  .barra-val em { font-style: normal; font-weight: 600; color: #64748b; margin-left: 3px; }
  .barra-pista { display: block; height: 8px; background: #e8eef5; border-radius: 99px; overflow: hidden; }
  .barra-fill { display: block; height: 100%; border-radius: 99px; background: #1e4d8c; }
  .tono-navy .barra:nth-of-type(1) .barra-fill { background: #0f2744; }
  .tono-navy .barra:nth-of-type(2) .barra-fill { background: #1a365d; }
  .tono-navy .barra:nth-of-type(3) .barra-fill { background: #1e4d8c; }
  .tono-navy .barra:nth-of-type(n + 4) .barra-fill { background: #2b6cb0; }
  .tono-teal .barra-fill { background: #0f766e; }
  .tono-teal .barra:nth-of-type(1) .barra-fill { background: #134e4a; }
  .tono-slate .barra-fill { background: #94a3b8; }
  .bloque-origen { margin: 4px 0 8px; break-inside: avoid; }
  .origen-titulo { margin: 8px 0 6px; font-size: 9pt; letter-spacing: 0.03em; }
  .origen-teal { color: #0f766e; }
  .origen-navy { color: #5b21b6; }
  .grafico.tono-navy.origen-mig { border-top-color: #5b21b6; }
  table.tbl { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 7pt; table-layout: fixed; }
  table.tbl th, table.tbl td {
    border: 1px solid #999; padding: 2px 4px; vertical-align: middle;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  table.tbl th { background: #1a365d; color: #fff; font-weight: 700; text-align: left; font-size: 6.5pt; }
  table.tbl tbody tr:nth-child(even) td { background: #f8fafc; }
  table.tbl td.ingreso, table.tbl th.ingreso { width: 12%; text-align: center; }
  table.tbl td.ingreso .num-ingreso {
    display: inline-block; background: #b45309; color: #fff; font-weight: 800;
    letter-spacing: 0.03em; padding: 1px 6px; border-radius: 2px; white-space: nowrap;
  }
  table.tbl td.ingreso .sin-ingreso { color: #64748b; font-weight: 600; }
  table.tbl td.est-vencido { color: #9b2c2c; font-weight: 700; }
  table.tbl td.est-anulado { color: #64748b; text-decoration: line-through; }
  table.tbl td.est-vigente { color: #166534; font-weight: 700; }
  table.tbl td.origen, table.tbl th.origen { width: 10%; text-align: center; }
  table.tbl td.usuario, table.tbl th.usuario { width: 9%; }
  .marca-origen {
    display: inline-block; font-weight: 800; font-size: 6.5pt; letter-spacing: 0.02em;
    padding: 1px 5px; border-radius: 2px; white-space: nowrap;
  }
  .marca-programa { background: #0f766e; color: #fff; }
  .marca-migracion { background: #5b21b6; color: #fff; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  .nota { margin: 0 0 8px; font-size: 8pt; color: #444; }
  footer.doc-footer { margin-top: 12px; font-size: 8pt; color: #555; text-align: center; }
  @media print {
    .grafico, .barra-fill, .num-ingreso, table.tbl th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }`;
}

export function buildInformeCertificadosHtml(opts: {
  titulo: string;
  filas: CertificadoInformeFila[];
  filtros: FiltrosInformeCertificados;
  empresa: ConfigRecibo | null;
  atPageCss?: string;
}): string {
  const atPage = opts.atPageCss?.trim() || DEFAULT_AT_PAGE;
  const vigentes = opts.filas.filter((f) => f.estado === 'vigente').length;
  const vencidos = opts.filas.filter((f) => f.estado === 'vencido').length;
  const anulados = opts.filas.filter((f) => f.estado === 'anulado').length;
  const conIngreso = opts.filas.filter((f) => f.ingresos.length).length;
  const dePrograma = opts.filas.filter((f) => f.origen === 'programa').length;
  const deMigracion = opts.filas.filter((f) => f.origen === 'migracion').length;
  const metaFilas: [string, string][] = [
    ['Búsqueda', opts.filtros.buscar || 'Todas'],
    ['Tipo', opts.filtros.tipo || 'Todos'],
    ['Estado', opts.filtros.estado || 'Todos'],
    ['Origen', opts.filtros.origen || 'Todos'],
    ['Empresa', opts.filtros.empresa || 'Todas'],
    ['Desde', opts.filtros.desde || '—'],
    ['Hasta', opts.filtros.hasta || '—'],
  ];
  const meta = metaFilas.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  const cuerpo = opts.filas
    .map((f) => {
      const ingreso = f.ingresos.length
        ? f.ingresos.map((n) => `<span class="num-ingreso">${esc(n)}</span>`).join(' ')
        : '<span class="sin-ingreso">Sin ingreso</span>';
      const estLabel = f.estado === 'anulado' ? 'Anulado' : f.estado === 'vencido' ? 'Vencido' : 'Vigente';
      const origen =
        f.origen === 'migracion'
          ? '<span class="marca-origen marca-migracion">Migración</span>'
          : '<span class="marca-origen marca-programa">Programa</span>';
      return `<tr>
        <td>${esc(f.codigo)}</td>
        <td title="${esc(f.alumno)}">${esc(f.alumno)}</td>
        <td>${esc(f.documento)}</td>
        <td title="${esc(f.tipo)}">${esc(f.tipo)}</td>
        <td title="${esc(f.curso)}">${esc(f.curso)}</td>
        <td>${esc(f.emision)}</td>
        <td class="est-${f.estado}">${esc(estLabel)}</td>
        <td class="origen">${origen}</td>
        <td class="usuario" title="${esc(f.elaboro)}">${esc(f.elaboro || '—')}</td>
        <td class="ingreso">${ingreso}</td>
      </tr>`;
    })
    .join('');
  const vacio = `<tr><td colspan="10">Sin certificados para los filtros elegidos</td></tr>`;
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
      <p>Cada certificado queda ligado al número de ingreso con el que se pagó. Ese número va resaltado.</p>
    </div>
    <table class="doc-meta">${meta}</table>
    <div class="stats">
      <div class="stat"><span>Certificados</span><strong>${esc(opts.filas.length)}</strong></div>
      <div class="stat"><span>Vigentes</span><strong>${esc(vigentes)}</strong></div>
      <div class="stat"><span>Vencidos</span><strong>${esc(vencidos)}</strong></div>
      <div class="stat"><span>Anulados</span><strong>${esc(anulados)}</strong></div>
      <div class="stat"><span>Con el programa</span><strong>${esc(dePrograma)}</strong></div>
      <div class="stat"><span>Migración</span><strong>${esc(deMigracion)}</strong></div>
      <div class="stat"><span>Con ingreso</span><strong>${esc(conIngreso)}</strong></div>
      <div class="stat"><span>Sin ingreso</span><strong>${esc(opts.filas.length - conIngreso)}</strong></div>
    </div>
    ${htmlGraficos(opts.filas.filter((f) => f.estado !== 'anulado'))}
    <p class="nota">Migración son los certificados importados del sistema anterior. Expedido con el programa son los emitidos en ARGO contra un programa. El número de ingreso, en naranja, es el recibo de caja de la liquidación. Si un pago cubrió varios servicios, el mismo recibo aparece en cada certificado. Los anulados no entran en los gráficos.</p>
    <div class="sec">Detalle (${opts.filas.length})</div>
    <table class="tbl">
      <thead><tr>
        <th>Código</th><th>Alumno</th><th>Documento</th><th>Tipo</th><th>Curso</th><th>Emisión</th><th>Estado</th><th class="origen">Origen</th><th class="usuario">Elaboró</th><th class="ingreso">N° ingreso</th>
      </tr></thead>
      <tbody>${cuerpo || vacio}</tbody>
    </table>
    <footer class="doc-footer"><p>${esc(opts.empresa?.mensajePie || 'Documento generado por ARGO')}</p></footer>
  </div>
  ${informePrintToolbarScript(opts.titulo)}
</body>
</html>`;
}

export function abrirInformeCertificados(html: string): boolean {
  const w = window.open('', '_blank', 'width=1100,height=780,scrollbars=yes');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
