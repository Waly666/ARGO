import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../..');
export const STUDIO_ROOT = path.resolve(__dirname, '..');
export const PROFILES_DIR = path.join(STUDIO_ROOT, 'profiles');
export const UPLOADS_DIR = path.join(STUDIO_ROOT, 'uploads');

/** Metadatos fijos de cada app móvil (rutas relativas al repo). */
export const MOBILE_APPS = {
  aula: {
    id: 'aula',
    label: 'Aula Virtual',
    dir: 'argo-mobile-aula',
    easProjectId: '572bdf10-65ce-47c7-acfb-33aa5a3b3ea1',
    assets: {
      logo: 'assets/branding/logo.png',
      icon: 'assets/icon.png',
      adaptiveIcon: 'assets/adaptive-icon.png',
    },
    brandingFile: 'src/config/appBranding.ts',
    defaults: {
      appName: 'Aula Virtual Servial',
      slug: 'finstruvial-aula',
      version: '1.0.0',
      versionCode: 10,
      androidPackage: 'co.servial.aula',
      scheme: 'servialaula',
      apiBaseUrl: 'https://app.servial.edu.co/api',
      splashBackgroundColor: '#f8fafc',
      tituloApp: 'AULA VIRTUAL',
      nombreEmpresaFallback: 'CEA SERVIAL COLOMBIA',
      apkName: 'aula-virtual.apk',
    },
  },
  cajero: {
    id: 'cajero',
    label: 'ARGO Cajero',
    dir: 'argo-mobile-cajero',
    easProjectId: 'cff70a8f-b9ea-4d75-ac50-c9b7cd8a99c6',
    assets: {
      logo: 'assets/branding/logo.png',
      icon: 'assets/branding/icon-app.png',
    },
    brandingFile: 'src/config/appBranding.ts',
    defaults: {
      appName: 'ARGO Cajero',
      slug: 'argo-cajero',
      version: '0.1.3',
      versionCode: 5,
      androidPackage: 'co.argo.cajero',
      scheme: 'argocajero',
      apiBaseUrl: 'https://app.servial.edu.co/api',
      splashBackgroundColor: '#FFFFFF',
      primaryColor: '#3578F0',
      tituloApp: 'ARGO CAJERO',
      nombreEmpresaFallback: 'CEA SERVIAL COLOMBIA',
      apkName: 'argo-cajero.apk',
    },
  },
  jornadas: {
    id: 'jornadas',
    label: 'ARGO Jornadas',
    dir: 'argo-mobile-jornadas',
    easProjectId: 'b6d9895e-f0c7-4abc-a781-6046c5d33d9a',
    assets: {
      logo: 'assets/branding/logo.png',
      icon: 'assets/branding/icon-app.png',
    },
    brandingFile: 'src/config/appBranding.ts',
    defaults: {
      appName: 'ARGO Jornadas',
      slug: 'argo-jornadas',
      version: '0.1.0',
      versionCode: 1,
      androidPackage: 'co.argo.jornadas',
      scheme: 'argojornadas',
      apiBaseUrl: 'https://app.finstruvial.edu.co/api',
      splashBackgroundColor: '#0d9488',
      primaryColor: '#0d9488',
      tituloApp: 'ARGO Jornadas',
      nombreEmpresaFallback: 'Capacitación en campo',
      apkName: 'argo-jornadas.apk',
    },
  },
};

export function appRoot(appId) {
  const app = MOBILE_APPS[appId];
  if (!app) throw new Error(`App desconocida: ${appId}`);
  return path.join(REPO_ROOT, app.dir);
}

export function profilePath(appId) {
  return path.join(PROFILES_DIR, `${appId}.json`);
}
