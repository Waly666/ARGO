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

function rewriteLocalOrigins(html: string): string {
  const origin = getServerPublicOrigin();
  let out = html;
  for (const bad of LOCAL_ORIGINS) {
    out = out.split(bad).join(origin);
  }
  return out;
}

export function rewriteDocumentHtmlForMobile(html: string, _htmlPath?: string): string {
  let out = injectViewport(html);
  out = rewriteLocalOrigins(out);
  return out;
}
