import { getApiBaseUrl } from '../config/apiBase';

const LOCAL_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://127.0.0.1:3000',
  'https://127.0.0.1:3000',
  'http://10.0.2.2:3000',
  'https://10.0.2.2:3000',
];

export function getServerPublicOrigin(): string {
  return getApiBaseUrl().replace(/\/api\/?$/i, '');
}

function injectViewport(html: string): string {
  if (/name=["']viewport["']/i.test(html)) return html;
  return html.replace(
    /<head([^>]*)>/i,
    `<head$1>\n  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=4"/>`,
  );
}

function injectBeforeHeadClose(html: string, snippet: string): string {
  if (html.includes('</head>')) {
    return html.replace('</head>', `${snippet}\n</head>`);
  }
  return `${html}${snippet}`;
}

function injectBaseHref(html: string): string {
  const origin = getServerPublicOrigin().replace(/\/$/, '');
  if (/<base\s/i.test(html)) return html;
  return html.replace(/<head([^>]*)>/i, `<head$1>\n  <base href="${origin}/"/>`);
}

/** localhost / 127.0.0.1 → IP del servidor configurada en la app. */
function rewriteLocalOrigins(html: string): string {
  const origin = getServerPublicOrigin().replace(/\/$/, '');
  let out = html;
  for (const bad of LOCAL_ORIGINS) {
    out = out.split(bad).join(origin);
  }
  return out;
}

/**
 * Fuerza imágenes/archivos de /uploads al mismo host que la API de la app.
 * Evita fondos rotos cuando el HTML trae localhost o un PUBLIC_URL inalcanzable desde el celular.
 */
function rewriteUploadsToAppServer(html: string): string {
  const origin = getServerPublicOrigin().replace(/\/$/, '');
  return html
    .replace(/(src|href)=(["'])https?:\/\/[^"'/]+\/uploads\//gi, `$1=$2${origin}/uploads/`)
    .replace(/(src|href)=(["'])\/uploads\//gi, `$1=$2${origin}/uploads/`)
    .replace(/(src|href)=(["'])uploads\//gi, `$1=$2${origin}/uploads/`)
    .replace(/url\(\s*(['"]?)https?:\/\/[^)'"/]+\/uploads\//gi, `url($1${origin}/uploads/`)
    .replace(/url\(\s*(['"]?)\/uploads\//gi, `url($1${origin}/uploads/`)
    .replace(/url\(\s*(['"]?)uploads\//gi, `url($1${origin}/uploads/`);
}

export function isCertificadoHtml(html: string, htmlPath?: string): boolean {
  if (/certificados[^"']*\/html/i.test(htmlPath || '')) return true;
  return html.includes('class="bg-fondo"') || html.includes("class='bg-fondo'");
}

export function certificadoEsHorizontal(html: string): boolean {
  return /@page\s*\{[^}]*size:\s*297mm\s+210mm/i.test(html);
}

export function fixCqhUnits(html: string, horizontal: boolean): string {
  const pageW = horizontal ? 297 : 210;
  const pageH = horizontal ? 210 : 297;
  const sheetHeightVw = (pageH / pageW) * 100;
  return html.replace(/(\d+(?:\.\d+)?)\s*cqh/gi, (_, num) => {
    const n = parseFloat(num);
    return `${((n / 100) * sheetHeightVw).toFixed(4)}vw`;
  });
}

export function fixCqwUnits(html: string): string {
  return html.replace(/(\d+(?:\.\d+)?)\s*cqw/gi, (_, num) => {
    return `${parseFloat(num).toFixed(4)}vw`;
  });
}

function stripDuplicateMmUnits(html: string): string {
  return html
    .replace(/font-size:\s*[\d.]+mm\s*(?:!important)?;\s*(?=font-size:)/gi, '')
    .replace(/width:\s*[\d.]+mm\s*(?:!important)?;\s*(?=width:)/gi, '');
}

export function certificadoMobileCss(horizontal: boolean): string {
  const pageW = horizontal ? 297 : 210;
  const pageH = horizontal ? 210 : 297;
  const sheetHeightVw = (pageH / pageW) * 100;
  return `
<style id="argo-mobile-cert">
  @media screen {
    html, body {
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow-x: hidden !important;
      background: #525659 !important;
      -webkit-text-size-adjust: 100% !important;
      text-size-adjust: 100% !important;
    }
    .no-print { display: none !important; }
    .sheet {
      position: relative !important;
      display: block !important;
      width: 100vw !important;
      max-width: 100vw !important;
      height: ${sheetHeightVw.toFixed(4)}vw !important;
      min-height: ${sheetHeightVw.toFixed(4)}vw !important;
      margin: 0 auto !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
      container-type: size !important;
      background: #fff !important;
    }
    .bg-fondo {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100% !important;
      height: 100% !important;
      object-fit: fill !important;
      z-index: 1 !important;
      pointer-events: none !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    .content {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100% !important;
      height: 100% !important;
      container-type: size !important;
      z-index: 2 !important;
    }
    .dato, .cert-id, .qr-wrap {
      box-sizing: border-box !important;
    }
    .qr-wrap img {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
    }
  }
</style>`;
}

/** Ajusta HTML de certificados para WebView móvil (fondo + proporción). */
export function rewriteDocumentHtmlForMobile(html: string, htmlPath?: string): string {
  let out = rewriteLocalOrigins(html);
  out = rewriteUploadsToAppServer(out);
  out = injectBaseHref(out);
  out = injectViewport(out);

  if (!isCertificadoHtml(out, htmlPath)) return out;

  const horizontal = certificadoEsHorizontal(out);
  out = fixCqhUnits(out, horizontal);
  out = fixCqwUnits(out);
  out = stripDuplicateMmUnits(out);
  out = injectBeforeHeadClose(out, certificadoMobileCss(horizontal));
  return injectBeforeHeadClose(
    out,
    `<style id="argo-print-cert">
  @media print {
    html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
    .no-print { display: none !important; }
    .sheet { margin: 0 !important; box-shadow: none !important; }
    .bg-fondo {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  }
</style>`,
  );
}
