/**
 * Barra unificada Imprimir / PDF / Cerrar para informes HTML imprimibles.
 * Espejo de argo-backend/src/services/informePrintToolbar.js
 */

function escAttr(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sanitizePdfName(name?: string | null): string {
  const raw = String(name || 'informe-argo').trim() || 'informe-argo';
  return raw.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(0, 80) || 'informe-argo';
}

/** CSS de la barra (incluir en <style> del documento). */
export function informePrintToolbarCss(): string {
  return `
    .no-print.toolbar {
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin: 0 0 14px;
      padding: 10px 12px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      box-sizing: border-box;
      width: 100%;
      max-width: 100%;
    }
    .no-print.toolbar button {
      border: 0;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      color: #fff;
      background: #0f766e;
      font-family: "Segoe UI", system-ui, sans-serif;
    }
    .no-print.toolbar button.sec {
      background: #1d4ed8;
    }
    .no-print.toolbar button.ghost {
      background: #475569;
    }
    .no-print.toolbar .hint-tool {
      flex: 1 1 12rem;
      margin: 0;
      font-size: 11px;
      color: #475569;
      font-family: "Segoe UI", system-ui, sans-serif;
      line-height: 1.35;
    }
    @media print {
      .no-print { display: none !important; }
    }
  `;
}

export type InformePrintToolbarOpts = {
  label?: string;
  pdfName?: string;
  showHint?: boolean;
};

/** HTML de la barra. Colocar al inicio de <body>. */
export function informePrintToolbarHtml(opts: InformePrintToolbarOpts = {}): string {
  const label = opts.label || 'Acciones del informe';
  const showHint = opts.showHint !== false;
  const hint = showHint
    ? `<p class="hint-tool">Para PDF: pulse «PDF» y en el diálogo elija destino «Guardar como PDF».</p>`
    : '';
  return `<div class="no-print toolbar" role="toolbar" aria-label="${escAttr(label)}">
    <button type="button" onclick="window.print()">🖨 Imprimir</button>
    <button type="button" class="sec" id="argo-btn-pdf" title="En el diálogo elija «Guardar como PDF»">⬇ PDF</button>
    <button type="button" class="ghost" onclick="window.close()">Cerrar</button>
    ${hint}
  </div>`;
}

/** Script para el botón PDF. Colocar antes de </body>. */
export function informePrintToolbarScript(pdfName = 'informe-argo'): string {
  const name = JSON.stringify(sanitizePdfName(pdfName));
  return `<script>
(function () {
  var btn = document.getElementById('argo-btn-pdf');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var prev = document.title;
    document.title = ${name};
    window.print();
    setTimeout(function () { document.title = prev; }, 800);
  });
})();
</script>`;
}

export function informePrintToolbar(opts: InformePrintToolbarOpts = {}): {
  css: string;
  html: string;
  script: string;
} {
  return {
    css: informePrintToolbarCss(),
    html: informePrintToolbarHtml(opts),
    script: informePrintToolbarScript(opts.pdfName),
  };
}
