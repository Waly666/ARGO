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

/** URL absoluta de foto/cédula almacenada en el servidor. */
export function urlArchivoAlumno(path?: string | null): string | null {
  if (!path?.trim()) return null;
  if (path.startsWith('http')) return path;
  const origin = getServerPublicOrigin();
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
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

function rewriteLocalOrigins(html: string): string {
  const origin = getServerPublicOrigin();
  let out = html;
  for (const bad of LOCAL_ORIGINS) {
    out = out.split(bad).join(origin);
  }
  return out;
}

function isCertificadoHtml(html: string, htmlPath?: string): boolean {
  if (/certificados\/[^/]+\/html/i.test(htmlPath || '')) return true;
  return html.includes('class="bg-fondo"') || html.includes("class='bg-fondo'");
}

function certificadoEsHorizontal(html: string): boolean {
  return /@page\s*\{[^}]*size:\s*297mm\s+210mm/i.test(html);
}

/** Convierte unidades cqh (container query) a vw para WebView móvil. */
function fixCqhUnits(html: string, horizontal: boolean): string {
  const heightFactor = horizontal ? 210 / 297 : 297 / 210;
  return html.replace(/(\d+(?:\.\d+)?)\s*cqh/gi, (_, num) => {
    const n = parseFloat(num);
    const vw = (n * heightFactor) / 100;
    return `${vw.toFixed(4)}vw`;
  });
}

/** cqw → vw: la hoja ocupa 100vw en pantalla móvil. */
function fixCqwUnits(html: string): string {
  return html.replace(/(\d+(?:\.\d+)?)\s*cqw/gi, (_, num) => {
    return `${parseFloat(num).toFixed(4)}vw`;
  });
}

function certificadoMobileCss(horizontal: boolean): string {
  const aspectRatio = horizontal ? '297 / 210' : '210 / 297';
  return `
<style id="argo-mobile-cert">
  @media screen {
    html, body {
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow-x: hidden;
      background: #ececec;
    }
    .no-print { display: none !important; }
    .sheet {
      width: 100vw !important;
      max-width: 100vw !important;
      height: auto !important;
      aspect-ratio: ${aspectRatio} !important;
      margin: 0 auto;
    }
    .bg-fondo, .content {
      width: 100% !important;
      height: 100% !important;
    }
    .bg-fondo { object-fit: fill !important; }
  }
</style>`;
}

/** Ajusta HTML de documentos para visualización e impresión desde el celular. */
export function rewriteDocumentHtmlForMobile(html: string, htmlPath?: string): string {
  let out = rewriteLocalOrigins(html);
  out = injectViewport(out);

  if (!isCertificadoHtml(out, htmlPath)) return out;

  const horizontal = certificadoEsHorizontal(out);
  out = fixCqhUnits(out, horizontal);
  out = fixCqwUnits(out);
  return injectBeforeHeadClose(out, certificadoMobileCss(horizontal));
}
