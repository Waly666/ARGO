import fs from 'node:fs';
import path from 'node:path';
import { MOBILE_APPS, PROFILES_DIR } from './apps.mjs';

export const CLIENTS_DIR = path.join(PROFILES_DIR, 'clients');
const ACTIVE_FILE = path.join(PROFILES_DIR, 'active.json');
const LEGACY_APPS = ['aula', 'cajero', 'jornadas'];

function ensureDirs() {
  fs.mkdirSync(CLIENTS_DIR, { recursive: true });
}

function slugifyClientId(label) {
  return String(label)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function clientMetaPath(clientId) {
  return path.join(CLIENTS_DIR, clientId, 'meta.json');
}

export function clientProfilePath(clientId, appId) {
  return path.join(CLIENTS_DIR, clientId, `${appId}.json`);
}

export function migrateLegacyProfiles() {
  ensureDirs();
  const hasClients = fs.existsSync(CLIENTS_DIR) && fs.readdirSync(CLIENTS_DIR).length > 0;
  const legacyExists = LEGACY_APPS.some((appId) => fs.existsSync(path.join(PROFILES_DIR, `${appId}.json`)));

  if (hasClients || !legacyExists) {
    if (!fs.existsSync(ACTIVE_FILE) && hasClients) {
      const first = fs.readdirSync(CLIENTS_DIR).find((name) =>
        fs.existsSync(clientMetaPath(name)),
      );
      if (first) setActiveClientId(first);
    }
    return;
  }

  const clientId = 'servial';
  const clientDir = path.join(CLIENTS_DIR, clientId);
  fs.mkdirSync(clientDir, { recursive: true });

  fs.writeFileSync(
    clientMetaPath(clientId),
    `${JSON.stringify({ id: clientId, label: 'CEA Servial', createdAt: new Date().toISOString() }, null, 2)}\n`,
    'utf8',
  );

  for (const appId of LEGACY_APPS) {
    const legacy = path.join(PROFILES_DIR, `${appId}.json`);
    if (fs.existsSync(legacy)) {
      fs.copyFileSync(legacy, clientProfilePath(clientId, appId));
    }
    const legacyUploads = path.join(PROFILES_DIR, '..', 'uploads', appId);
    const targetUploads = path.join(PROFILES_DIR, '..', 'uploads', clientId, appId);
    if (fs.existsSync(legacyUploads) && !fs.existsSync(targetUploads)) {
      fs.mkdirSync(path.dirname(targetUploads), { recursive: true });
      fs.cpSync(legacyUploads, targetUploads, { recursive: true });
    }
  }

  setActiveClientId(clientId);
}

export function listClients() {
  ensureDirs();
  migrateLegacyProfiles();
  return fs
    .readdirSync(CLIENTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const id = entry.name;
      const metaPath = clientMetaPath(id);
      const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : { id, label: id };
      return { id, label: meta.label ?? id, createdAt: meta.createdAt ?? null };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export function getActiveClientId() {
  ensureDirs();
  migrateLegacyProfiles();
  if (!fs.existsSync(ACTIVE_FILE)) {
    const clients = listClients();
    if (clients[0]) {
      setActiveClientId(clients[0].id);
      return clients[0].id;
    }
    createClient('CEA Servial', { clientId: 'servial' });
    return 'servial';
  }
  const { clientId } = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf8'));
  return clientId;
}

export function setActiveClientId(clientId) {
  ensureDirs();
  if (!fs.existsSync(clientMetaPath(clientId))) {
    throw new Error(`Cliente no encontrado: ${clientId}`);
  }
  fs.writeFileSync(ACTIVE_FILE, `${JSON.stringify({ clientId }, null, 2)}\n`, 'utf8');
  return clientId;
}

export function createClient(label, { copyFrom = null, clientId = null } = {}) {
  ensureDirs();
  const id = clientId ?? slugifyClientId(label);
  if (!id) throw new Error('Nombre de cliente inválido');
  if (fs.existsSync(path.join(CLIENTS_DIR, id))) {
    throw new Error(`Ya existe el cliente "${id}"`);
  }

  const clientDir = path.join(CLIENTS_DIR, id);
  fs.mkdirSync(clientDir, { recursive: true });
  fs.writeFileSync(
    clientMetaPath(id),
    `${JSON.stringify({ id, label: label.trim(), createdAt: new Date().toISOString() }, null, 2)}\n`,
    'utf8',
  );

  for (const appId of Object.keys(MOBILE_APPS)) {
    const target = clientProfilePath(id, appId);
    if (copyFrom && fs.existsSync(clientProfilePath(copyFrom, appId))) {
      fs.copyFileSync(clientProfilePath(copyFrom, appId), target);
    } else {
      fs.writeFileSync(target, `${JSON.stringify(emptyTemplate(appId), null, 2)}\n`, 'utf8');
    }
  }

  return { id, label: label.trim() };
}

export function emptyTemplate(appId) {
  const app = MOBILE_APPS[appId];
  return {
    appName: '',
    slug: '',
    version: '1.0.0',
    versionCode: 1,
    androidPackage: '',
    scheme: '',
    apiBaseUrl: '',
    splashBackgroundColor: '#ffffff',
    primaryColor: '#3578F0',
    tituloApp: '',
    nombreEmpresaFallback: '',
    apkName: `${appId}.apk`,
    buildProfile: 'production',
    easProjectId: app.easProjectId,
    uploads: { logo: null, icon: null, adaptiveIcon: null },
  };
}

export function withStructuralDefaults(appId, profile) {
  const app = MOBILE_APPS[appId];
  return {
    ...emptyTemplate(appId),
    ...profile,
    easProjectId: profile.easProjectId ?? app.easProjectId,
    buildProfile: profile.buildProfile ?? 'production',
    uploads: {
      ...emptyTemplate(appId).uploads,
      ...(profile.uploads ?? {}),
    },
  };
}
