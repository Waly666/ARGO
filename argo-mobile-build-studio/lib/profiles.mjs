import fs from 'node:fs';
import path from 'node:path';
import { MOBILE_APPS, UPLOADS_DIR } from './apps.mjs';
import { readCurrentFromApp } from './read-current.mjs';
import {
  clientProfilePath,
  emptyTemplate,
  getActiveClientId,
  migrateLegacyProfiles,
  withStructuralDefaults,
} from './clients.mjs';

const PROFILE_META_KEYS = new Set(['clientId']);

function sanitizePatch(patch) {
  if (!patch || typeof patch !== 'object') return {};
  const out = { ...patch };
  for (const key of PROFILE_META_KEYS) delete out[key];
  return out;
}

function readRawProfile(clientId, appId) {
  const p = clientProfilePath(clientId, appId);
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

export function loadProfile(appId, clientId = getActiveClientId()) {
  migrateLegacyProfiles();
  const raw = readRawProfile(clientId, appId);
  if (Object.keys(raw).length === 0) {
    return withStructuralDefaults(appId, emptyTemplate(appId));
  }
  return withStructuralDefaults(appId, raw);
}

/** Guarda solo lo enviado por el usuario; no reinyecta defaults de Servial. */
export function saveProfile(appId, profile, clientId = getActiveClientId()) {
  migrateLegacyProfiles();
  const p = clientProfilePath(clientId, appId);
  fs.mkdirSync(path.dirname(p), { recursive: true });

  const existing = readRawProfile(clientId, appId);
  const patch = sanitizePatch(profile);
  const merged = {
    ...existing,
    ...patch,
    uploads: {
      ...(existing.uploads ?? {}),
      ...(patch.uploads ?? {}),
    },
  };

  const toWrite = sanitizePatch(merged);
  fs.writeFileSync(p, `${JSON.stringify(toWrite, null, 2)}\n`, 'utf8');
  return withStructuralDefaults(appId, toWrite);
}

export function listProfiles(clientId = getActiveClientId()) {
  migrateLegacyProfiles();
  return Object.keys(MOBILE_APPS).map((id) => ({
    id,
    label: MOBILE_APPS[id].label,
    profile: loadProfile(id, clientId),
  }));
}

export function importProfileFromApp(appId, clientId = getActiveClientId()) {
  const fromApp = readCurrentFromApp(appId);
  return saveProfile(appId, fromApp, clientId);
}

export function uploadDir(clientId, appId) {
  const dir = path.join(UPLOADS_DIR, clientId, appId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function uploadPath(clientId, appId, filename) {
  return path.join(uploadDir(clientId, appId), filename);
}
