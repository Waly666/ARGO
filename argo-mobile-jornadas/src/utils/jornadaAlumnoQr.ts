/** Prefijo de etiquetas QR solo para alumnos de jornadas de capacitación. */
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

export type JornadaAlumnoQrData = {
  numDoc: string;
  nombre: string;
};

function numDocOk(digits: string): boolean {
  return /^\d{6,14}$/.test(digits);
}

/** Interpreta un QR de jornada (o un documento numérico puro). */
export function parseJornadaAlumnoQr(raw: string): JornadaAlumnoQrData | null {
  const t = String(raw || '').trim();
  if (!t) return null;

  if (numDocOk(t)) {
    return { numDoc: t, nombre: '' };
  }

  if (t.startsWith('{')) {
    try {
      const j = JSON.parse(t) as {
        t?: string;
        tipo?: string;
        d?: string;
        numDoc?: string;
        n?: string;
        nombre?: string;
      };
      const tipo = String(j.t || j.tipo || '').toLowerCase();
      if (tipo && tipo !== 'jor' && tipo !== 'jornada') return null;
      const numDoc = String(j.d || j.numDoc || '').replace(/\D/g, '');
      if (!numDocOk(numDoc)) return null;
      return { numDoc, nombre: String(j.n || j.nombre || '').trim() };
    } catch {
      return null;
    }
  }

  const parts = t.split('|');
  if (parts[0] !== JORNADA_QR_PREFIX) return null;
  if (parts[1] !== '1') return null;
  const numDoc = String(parts[2] || '').replace(/\D/g, '');
  if (!numDocOk(numDoc)) return null;
  const nombre = parts.slice(3).join('|').trim();
  return { numDoc, nombre };
}

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
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    @page { margin: 2mm; size: 52mm 32mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; }
    .label {
      width: 52mm;
      min-height: 30mm;
      padding: 2mm;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 2mm;
    }
    .qr { width: 22mm; height: 22mm; }
    .qr img { width: 100%; height: 100%; }
    .meta { flex: 1; overflow: hidden; min-width: 0; }
    .nombre {
      font-size: 8.5pt;
      font-weight: 700;
      line-height: 1.15;
      max-height: 2.3em;
      overflow: hidden;
    }
    .doc { font-size: 7.5pt; margin-top: 0.8mm; font-weight: 600; }
    .empresa {
      font-size: 6.5pt;
      margin-top: 1mm;
      font-weight: 700;
      color: #0f766e;
      line-height: 1.15;
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
    .fecha { font-size: 6.5pt; margin-top: 0.5mm; font-weight: 700; color: #334155; }
  </style>
</head>
<body>
  <div class="label">
    <div class="qr"><img src="${opts.qrDataUrl}" alt="QR"/></div>
    <div class="meta">
      <div class="nombre">${nom}</div>
      <div class="doc">CC ${doc}</div>
      <div class="empresa">${empresa}</div>
      ${lineaContrato}
      <div class="fecha">Jornada ${fecha}</div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
