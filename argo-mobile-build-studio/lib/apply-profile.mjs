import fs from 'node:fs';
import path from 'node:path';
import { MOBILE_APPS, appRoot, UPLOADS_DIR } from './apps.mjs';
import { getActiveClientId } from './clients.mjs';
import { loadProfile } from './profiles.mjs';
import { assertProfile } from './validate-profile.mjs';

function replaceOrThrow(src, pattern, replacement, label) {
  if (!pattern.test(src)) {
    throw new Error(`No se encontró ${label} en el archivo`);
  }
  return src.replace(pattern, replacement);
}

function copyIfExists(from, to) {
  if (!from || !fs.existsSync(from)) return false;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  return true;
}

function resolveUpload(clientId, appId, kind, profile) {
  const rel = profile.uploads?.[kind];
  if (!rel) return null;
  const abs = path.join(UPLOADS_DIR, clientId, appId, rel);
  return fs.existsSync(abs) ? abs : null;
}

function patchBranding(root, relPath, profile) {
  const file = path.join(root, relPath);
  if (!fs.existsSync(file)) return;
  let src = fs.readFileSync(file, 'utf8');
  src = replaceOrThrow(
    src,
    /tituloApp:\s*['"][^'"]*['"]/,
    `tituloApp: '${profile.tituloApp.replace(/'/g, "\\'")}'`,
    'tituloApp',
  );
  const nombreKey = /nombreEmpresaFallback:/.test(src) ? 'nombreEmpresaFallback' : 'nombreEmpresa';
  src = replaceOrThrow(
    src,
    new RegExp(`${nombreKey}:\\s*['"][^'"]*['"]`),
    `${nombreKey}: '${profile.nombreEmpresaFallback.replace(/'/g, "\\'")}'`,
    nombreKey,
  );
  fs.writeFileSync(file, src, 'utf8');
}

function patchEasJson(root, apiBaseUrl) {
  const url = String(apiBaseUrl ?? '').trim();
  if (!url) {
    throw new Error('Servidor API por defecto es obligatorio para actualizar eas.json');
  }
  const file = path.join(root, 'eas.json');
  const eas = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const key of ['preview', 'production']) {
    if (!eas.build[key]) eas.build[key] = {};
    if (!eas.build[key].env) eas.build[key].env = {};
    eas.build[key].env.EXPO_PUBLIC_API_BASE_URL = url;
  }
  fs.writeFileSync(file, `${JSON.stringify(eas, null, 2)}\n`, 'utf8');
}

function patchAppConfigAula(root, profile) {
  const file = path.join(root, 'app.config.ts');
  let src = fs.readFileSync(file, 'utf8');
  const rep = [
    [/name:\s*['"][^'"]*['"]/, `name: '${profile.appName}'`],
    [/slug:\s*['"][^'"]*['"]/, `slug: '${profile.slug}'`],
    [/version:\s*['"][^'"]*['"]/, `version: '${profile.version}'`],
    [/versionCode:\s*\d+/, `versionCode: ${profile.versionCode ?? 1}`],
    [/package:\s*['"][^'"]*['"]/, `package: '${profile.androidPackage}'`],
    [/scheme:\s*['"][^'"]*['"]/, `scheme: '${profile.scheme}'`],
    [
      /apiBaseUrl:\s*process\.env\.EXPO_PUBLIC_API_BASE_URL\s*\?\?\s*['"][^'"]*['"]/,
      `apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '${profile.apiBaseUrl}'`,
    ],
    [/backgroundColor:\s*['"]#[^'"]*['"]/g, `backgroundColor: '${profile.splashBackgroundColor}'`],
  ];
  for (const [pattern, replacement] of rep) {
    src = src.replace(pattern, replacement);
  }
  fs.writeFileSync(file, src, 'utf8');
}

function patchAppConfigCajeroJornadas(root, profile, isJornadas) {
  const file = path.join(root, 'app.config.ts');
  let src = fs.readFileSync(file, 'utf8');
  const primary = profile.primaryColor ?? profile.splashBackgroundColor;
  const rep = [
    [/name:\s*['"][^'"]*['"]/, `name: '${profile.appName}'`],
    [/slug:\s*['"][^'"]*['"]/, `slug: '${profile.slug}'`],
    [/version:\s*['"][^'"]*['"]/, `version: '${profile.version}'`],
    [/package:\s*['"][^'"]*['"]/, `package: '${profile.androidPackage}'`],
    [/scheme:\s*['"][^'"]*['"]/, `scheme: '${profile.scheme}'`],
    [
      /apiBaseUrl:\s*process\.env\.EXPO_PUBLIC_API_BASE_URL\s*\?\?\s*['"][^'"]*['"]/,
      `apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '${profile.apiBaseUrl}'`,
    ],
  ];
  for (const [pattern, replacement] of rep) {
    src = src.replace(pattern, replacement);
  }
  if (isJornadas) {
    src = src.replace(/const VERDE = '[^']*';/, `const VERDE = '${primary}';`);
  } else {
    src = src.replace(/const AZUL = '[^']*';/, `const AZUL = '${primary}';`);
  }
  fs.writeFileSync(file, src, 'utf8');
}

function writeBuildProfileJson(root, profile, app) {
  const payload = {
    appName: profile.appName,
    slug: profile.slug,
    version: profile.version,
    versionCode: profile.versionCode,
    androidPackage: profile.androidPackage,
    scheme: profile.scheme,
    apiBaseUrl: profile.apiBaseUrl,
    splashBackgroundColor: profile.splashBackgroundColor,
    primaryColor: profile.primaryColor ?? profile.splashBackgroundColor,
    tituloApp: profile.tituloApp,
    nombreEmpresaFallback: profile.nombreEmpresaFallback,
    easProjectId: app.easProjectId,
    apkName: profile.apkName,
    appliedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(root, 'build.profile.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

/** Aplica perfil a una app: JSON local, eas.json, branding, assets y app.config.ts */
export function applyProfile(appId, profileInput, clientId = getActiveClientId()) {
  const app = MOBILE_APPS[appId];
  const profile = profileInput ?? loadProfile(appId, clientId);
  assertProfile(profile);
  const root = appRoot(appId);
  const copied = [];

  writeBuildProfileJson(root, profile, app);
  patchEasJson(root, profile.apiBaseUrl);
  patchBranding(root, app.brandingFile, profile);

  if (appId === 'aula') {
    patchAppConfigAula(root, profile);
    if (copyIfExists(resolveUpload(clientId, appId, 'logo', profile), path.join(root, app.assets.logo))) {
      copied.push(app.assets.logo);
    }
    if (copyIfExists(resolveUpload(clientId, appId, 'icon', profile), path.join(root, app.assets.icon))) {
      copied.push(app.assets.icon);
    }
    if (
      copyIfExists(
        resolveUpload(clientId, appId, 'adaptiveIcon', profile),
        path.join(root, app.assets.adaptiveIcon),
      )
    ) {
      copied.push(app.assets.adaptiveIcon);
    }
  } else {
    patchAppConfigCajeroJornadas(root, profile, appId === 'jornadas');
    if (copyIfExists(resolveUpload(clientId, appId, 'logo', profile), path.join(root, app.assets.logo))) {
      copied.push(app.assets.logo);
    }
    if (copyIfExists(resolveUpload(clientId, appId, 'icon', profile), path.join(root, app.assets.icon))) {
      copied.push(app.assets.icon);
      // icon-app suele ser el mismo para splash/adaptive en cajero/jornadas
      const iconDest = path.join(root, app.assets.icon);
      const splashTargets = ['assets/branding/splash-full.png'];
      for (const rel of splashTargets) {
        const t = path.join(root, rel);
        if (fs.existsSync(path.dirname(t))) {
          fs.copyFileSync(iconDest, t);
          copied.push(rel);
        }
      }
    }
  }

  return {
    appId,
    label: app.label,
    root,
    profile,
    copiedAssets: copied,
    message: `Perfil aplicado en ${app.dir}`,
  };
}

export function applyAllProfiles(clientId = getActiveClientId(), getProfile = (id) => loadProfile(id, clientId)) {
  return Object.keys(MOBILE_APPS).map((id) => applyProfile(id, getProfile(id), clientId));
}
