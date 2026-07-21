import type { InformeDesempenoRes } from '../../core/services/empleado.service';

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildInformeDesempenoHtml(opts: {
  titulo: string;
  subtitulo?: string;
  data: InformeDesempenoRes;
}): string {
  const { titulo, subtitulo, data } = opts;
  const rows = (data.porEmpleado || [])
    .map((r) => {
      const detalle = (r.evaluaciones || [])
        .map((e) => {
          const comps = (e.competencias || [])
            .map((c) => `${esc(c.nombre)}: ${esc(c.puntaje)}`)
            .join(' · ');
          return `<tr class="det"><td></td><td colspan="2">${esc(e.fecha)} · ${esc(e.periodo || '—')}</td><td class="num">${esc(e.puntaje)}</td><td colspan="2">${comps || esc(e.observaciones || e.tipo || '')}</td></tr>`;
        })
        .join('');
      return `<tr>
        <td class="mono">${esc(r.numeroDocumento)}</td>
        <td>${esc(r.nombreCompleto)}</td>
        <td>${esc(r.cargoNombre || '—')}</td>
        <td class="num">${esc(r.numEvaluaciones)}</td>
        <td class="num"><strong>${esc(r.promedio)}</strong></td>
        <td class="num">${esc(r.ultimaPuntaje ?? '—')} <span class="muted">(${esc(r.ultimaFecha || '—')})</span></td>
      </tr>${detalle}`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>${esc(titulo)}</title>
  <style>
    @page { size: letter portrait; margin: 12mm 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12mm 10mm; font-family: 'Segoe UI', Arial, sans-serif; color: #111; }
    h1 { font-size: 13pt; margin: 0 0 4px; text-transform: uppercase; }
    .sub { color: #444; font-size: 9pt; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
    th, td { border: 1px solid #bbb; padding: 4px 5px; text-align: left; vertical-align: top; }
    th { background: #e8eef4; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .mono { font-family: ui-monospace, Consolas, monospace; }
    .muted { color: #666; font-size: 8pt; }
    tr.det td { background: #f8fafc; font-size: 8pt; color: #334155; }
    .actions { margin-bottom: 10px; }
    @media print { .actions { display: none; } }
  </style>
</head>
<body>
  <div class="actions"><button type="button" onclick="window.print()">Imprimir / Guardar PDF</button></div>
  <h1>${esc(titulo)}</h1>
  ${subtitulo ? `<p class="sub">${esc(subtitulo)}</p>` : ''}
  <table>
    <thead>
      <tr>
        <th>Documento</th>
        <th>Nombre</th>
        <th>Cargo</th>
        <th class="num"># Eval.</th>
        <th class="num">Promedio</th>
        <th class="num">Última</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="6">Sin datos</td></tr>'}
    </tbody>
  </table>
  <script>window.onload = function(){ window.print(); };</script>
</body>
</html>`;
}

export function abrirInformeDesempenoPdf(html: string): boolean {
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
