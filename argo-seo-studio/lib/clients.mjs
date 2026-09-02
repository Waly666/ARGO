import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emptyProfile, profileEsFinstruvial } from './generate-seo.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROFILES_DIR = path.join(__dirname, '..', 'profiles');
export const CLIENTS_DIR = path.join(PROFILES_DIR, 'clients');
const ACTIVE_FILE = path.join(PROFILES_DIR, 'active.json');

function ensureDirs() {
  fs.mkdirSync(CLIENTS_DIR, { recursive: true });
}

function slugify(label) {
  return String(label)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function metaPath(clientId) {
  return path.join(CLIENTS_DIR, clientId, 'meta.json');
}

function profilePath(clientId) {
  return path.join(CLIENTS_DIR, clientId, 'seo-profile.json');
}

export function listClients() {
  ensureDirs();
  if (!fs.existsSync(CLIENTS_DIR)) return [];
  return fs
    .readdirSync(CLIENTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const id = e.name;
      const meta = fs.existsSync(metaPath(id))
        ? JSON.parse(fs.readFileSync(metaPath(id), 'utf8'))
        : { id, label: id };
      return { id, label: meta.label ?? id, createdAt: meta.createdAt ?? null };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export function getActiveClientId() {
  ensureDirs();
  const clients = listClients();
  if (fs.existsSync(ACTIVE_FILE)) {
    const { clientId } = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf8'));
    if (fs.existsSync(metaPath(clientId))) return clientId;
  }
  if (clients[0]) {
    setActiveClientId(clients[0].id);
    return clients[0].id;
  }
  const created = createClient('Cliente demo');
  return created.id;
}

export function setActiveClientId(clientId) {
  ensureDirs();
  if (!fs.existsSync(metaPath(clientId))) throw new Error(`Cliente no encontrado: ${clientId}`);
  fs.writeFileSync(ACTIVE_FILE, `${JSON.stringify({ clientId }, null, 2)}\n`, 'utf8');
  return clientId;
}

export function createClient(label, { copyFrom = null, clientId = null } = {}) {
  ensureDirs();
  const id = clientId ?? slugify(label);
  if (!id) throw new Error('Nombre de cliente inválido');
  if (fs.existsSync(path.join(CLIENTS_DIR, id))) throw new Error(`Ya existe el cliente "${id}"`);

  const dir = path.join(CLIENTS_DIR, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    metaPath(id),
    `${JSON.stringify({ id, label: label.trim(), createdAt: new Date().toISOString() }, null, 2)}\n`,
    'utf8',
  );

  let profile = emptyProfile();
  profile.marca = label.trim();
  if (/finstruvial/i.test(label)) {
    profile.incluirPortafolioFinstruvial = true;
    const sel = new Set(profile.serviciosSeleccionados ?? []);
    sel.add('finstruvial-portafolio');
    profile.serviciosSeleccionados = [...sel];
  }
  if (copyFrom && fs.existsSync(profilePath(copyFrom))) {
    profile = { ...profile, ...JSON.parse(fs.readFileSync(profilePath(copyFrom), 'utf8')) };
    profile.marca = label.trim();
  }
  fs.writeFileSync(profilePath(id), `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
  return { id, label: label.trim() };
}

function migrateProfile(merged) {
  if (!Array.isArray(merged.paginasPortafolio)) {
    merged.paginasPortafolio = [];
  }
  if (!Object.hasOwn(merged, 'incluirPortafolioFinstruvial')) {
    merged.incluirPortafolioFinstruvial =
      profileEsFinstruvial(merged) || (merged.serviciosSeleccionados ?? []).includes('finstruvial-portafolio');
  }
  return merged;
}

export function loadProfile(clientId = getActiveClientId()) {
  ensureDirs();
  const p = profilePath(clientId);
  if (!fs.existsSync(p)) return emptyProfile();
  try {
    return migrateProfile({ ...emptyProfile(), ...JSON.parse(fs.readFileSync(p, 'utf8')) });
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(profile, clientId = getActiveClientId()) {
  ensureDirs();
  const p = profilePath(clientId);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const merged = migrateProfile({ ...loadProfile(clientId), ...profile });
  fs.writeFileSync(p, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  return merged;
}
