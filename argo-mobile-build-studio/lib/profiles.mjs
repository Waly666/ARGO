import fs from 'node:fs';
import path from 'node:path';
import { MOBILE_APPS, PROFILES_DIR, profilePath } from './apps.mjs';
import { readCurrentFromApp } from './read-current.mjs';

function ensureProfilesDir() {
  fs.mkdirSync(PROFILES_DIR, { recursive: true });
}

export function defaultProfile(appId) {
  const app = MOBILE_APPS[appId];
  return {
    ...app.defaults,
    buildProfile: 'production',
    easProjectId: app.easProjectId,
    uploads: { logo: null, icon: null, adaptiveIcon: null },
  };
}

export function loadProfile(appId) {
  ensureProfilesDir();
  const p = profilePath(appId);
  if (!fs.existsSync(p)) {
    const fromApp = readCurrentFromApp(appId);
    const profile = { ...defaultProfile(appId), ...fromApp };
    saveProfile(appId, profile);
    return profile;
  }
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  return { ...defaultProfile(appId), ...raw };
}

export function saveProfile(appId, profile) {
  ensureProfilesDir();
  const merged = { ...defaultProfile(appId), ...profile };
  fs.writeFileSync(profilePath(appId), `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  return merged;
}

export function listProfiles() {
  return Object.keys(MOBILE_APPS).map((id) => ({
    id,
    label: MOBILE_APPS[id].label,
    profile: loadProfile(id),
  }));
}

export function uploadPath(appId, kind, filename) {
  const dir = path.join(PROFILES_DIR, '..', 'uploads', appId);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, filename);
}
