/** Prefijo de etiquetas QR solo para alumnos de jornadas (compatible con app móvil). */
export const JORNADA_QR_PREFIX = 'ARGOJOR';

/**
 * Payload compacto para impresoras de etiquetas.
 * Formato: ARGOJOR|1|{numDoc}|{nombre}
 */
export function buildJornadaAlumnoQrPayload(numDoc: string | number, nombre: string): string {
  const doc = String(numDoc ?? '').replace(/\D/g, '');
  const nom = String(nombre || '')
    .trim()
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
  return `${JORNADA_QR_PREFIX}|1|${doc}|${nom}`;
}

export type JornadaAlumnoEtiqueta = {
  numDoc: string | number;
  nombre: string;
  /** Nombre de la empresa (alumno o institución). */
  empresa?: string | null;
  /** Código del contrato de capacitación (va antes de la fecha de jornada). */
  codContrato?: string | null;
  /** Fecha de la jornada (texto ya formateado o ISO/YYYY-MM-DD). */
  fechaJornada?: string | null;
};

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Formato corto dd/mm/aaaa para etiqueta. */
export function fmtFechaEtiqueta(raw?: string | null): string {
  const t = String(raw || '').trim();
  if (!t) {
    const d = new Date();
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(t)) return t;
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return t;
}

export function etiquetaHtmlAlumno(opts: {
  qrDataUrl: string;
  numDoc: string;
  nombre: string;
  empresa?: string | null;
  codContrato?: string | null;
  fechaJornada?: string | null;
}): string {
  const nom = escapeHtml(opts.nombre || 'Alumno');
  const doc = escapeHtml(opts.numDoc);
  const empresa = escapeHtml(String(opts.empresa || '').trim() || '—');
  const codRaw = String(opts.codContrato || '').trim();
  const fecha = escapeHtml(fmtFechaEtiqueta(opts.fechaJornada));
  const lineaContrato = codRaw
    ? `<div class="contrato">
        <span class="contrato-lbl">Contrato</span>
        <strong class="contrato-cod">${escapeHtml(codRaw)}</strong>
      </div>`
    : '';
  return `
  <div class="label">
    <div class="qr"><img src="${opts.qrDataUrl}" alt="QR"/></div>
    <div class="meta">
      <div class="nombre">${nom}</div>
      <div class="doc">CC ${doc}</div>
      <div class="empresa">${empresa}</div>
      ${lineaContrato}
      <div class="fecha">Jornada ${fecha}</div>
    </div>
  </div>`;
}

export function paginaEtiquetasHtml(etiquetas: string[], atPageCss?: string): string {
  const pageRule = atPageCss || '@page { margin: 4mm; }';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Etiquetas QR — Jornadas</title>
  <style>
    ${pageRule}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; }
    .sheet {
      display: flex;
      flex-wrap: wrap;
      gap: 4mm;
      padding: 2mm;
      align-content: flex-start;
    }
    .label {
      width: 52mm;
      min-height: 30mm;
      padding: 1.6mm;
      border: 0.3mm dashed #94a3b8;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 1.6mm;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .qr { width: 20mm; height: 20mm; flex-shrink: 0; }
    .qr img { width: 100%; height: 100%; display: block; }
    .meta { flex: 1; overflow: hidden; min-width: 0; }
    .nombre {
      font-size: 7.5pt;
      font-weight: 700;
      line-height: 1.12;
      max-height: 2.3em;
      overflow: hidden;
    }
    .doc { font-size: 6.5pt; margin-top: 0.5mm; font-weight: 600; }
    .empresa {
      font-size: 5.8pt;
      margin-top: 0.7mm;
      font-weight: 700;
      color: #0f766e;
      line-height: 1.12;
      max-height: 2.2em;
      overflow: hidden;
    }
    .contrato {
      margin-top: 0.5mm;
      color: #1e3a8a;
      line-height: 1.12;
    }
    .contrato-lbl {
      display: block;
      font-size: 5.2pt;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      opacity: 0.9;
    }
    .contrato-cod {
      display: block;
      font-size: 6.2pt;
      font-weight: 700;
      word-break: break-all;
      overflow-wrap: anywhere;
      max-height: 2.4em;
      overflow: hidden;
    }
    .fecha {
      font-size: 5.8pt;
      margin-top: 0.4mm;
      font-weight: 700;
      color: #334155;
    }
    .no-print { margin: 12px; }
    @media print {
      .no-print { display: none !important; }
      .label { border-color: transparent; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <p><strong>Etiquetas QR de jornadas</strong> — use una impresora de etiquetas o «Imprimir» del navegador.</p>
    <p>El instructor escanea este QR en la app móvil para registrar al alumno sin digitar el documento.</p>
    <button type="button" onclick="window.print()">Imprimir etiquetas</button>
  </div>
  <div class="sheet">
    ${etiquetas.join('\n')}
  </div>
  <script>window.onload = function () { setTimeout(function () { window.print(); }, 300); };</script>
</body>
</html>`;
}
