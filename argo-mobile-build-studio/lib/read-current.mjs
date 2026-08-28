import fs from 'node:fs';
import path from 'node:path';
import { MOBILE_APPS, appRoot } from './apps.mjs';

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function pickString(text, pattern, group = 1) {
  const m = text.match(pattern);
  return m?.[group]?.trim() ?? null;
}

/** Lee valores actuales de app.config.ts, eas.json y appBranding.ts */
export function readCurrentFromApp(appId) {
  const app = MOBILE_APPS[appId];
  const root = appRoot(appId);
  const out = {};

  const eas = readJson(path.join(root, 'eas.json'));
  const api =
    eas?.build?.production?.env?.EXPO_PUBLIC_API_BASE_URL ??
    eas?.build?.preview?.env?.EXPO_PUBLIC_API_BASE_URL;
  if (api) out.apiBaseUrl = api;

  const buildProfile = readJson(path.join(root, 'build.profile.json'));
  if (buildProfile) return { ...out, ...buildProfile };

  const cfgPath = path.join(root, 'app.config.ts');
  if (fs.existsSync(cfgPath)) {
    const src = fs.readFileSync(cfgPath, 'utf8');
    out.appName = pickString(src, /name:\s*['"]([^'"]+)['"]/);
    out.slug = pickString(src, /slug:\s*['"]([^'"]+)['"]/);
    out.version = pickString(src, /version:\s*['"]([^'"]+)['"]/);
    const vc = pickString(src, /versionCode:\s*(\d+)/);
    if (vc) out.versionCode = Number(vc);
    out.androidPackage = pickString(src, /package:\s*['"]([^'"]+)['"]/);
    out.scheme = pickString(src, /scheme:\s*['"]([^'"]+)['"]/);
    const splashBg = pickString(src, /backgroundColor:\s*['"](#[^'"]+)['"]/);
    if (splashBg) out.splashBackgroundColor = splashBg;
    const apiFallback = pickString(src, /apiBaseUrl:\s*process\.env\.EXPO_PUBLIC_API_BASE_URL\s*\?\?\s*['"]([^'"]+)['"]/);
    if (apiFallback && !out.apiBaseUrl) out.apiBaseUrl = apiFallback;
  }

  const brandingPath = path.join(root, app.brandingFile);
  if (fs.existsSync(brandingPath)) {
    const src = fs.readFileSync(brandingPath, 'utf8');
    const titulo = pickString(src, /tituloApp:\s*['"]([^'"]+)['"]/);
    const nombre = pickString(src, /nombreEmpresa(?:Fallback)?:\s*['"]([^'"]+)['"]/);
    if (titulo) out.tituloApp = titulo;
    if (nombre) out.nombreEmpresaFallback = nombre;
  }

  return out;
}
