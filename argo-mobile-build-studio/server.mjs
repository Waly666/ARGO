import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { MOBILE_APPS } from './lib/apps.mjs';
import { applyProfile, applyAllProfiles } from './lib/apply-profile.mjs';
import {
  createClient,
  getActiveClientId,
  listClients,
  setActiveClientId,
} from './lib/clients.mjs';
import { loadProfile, saveProfile, listProfiles, uploadDir } from './lib/profiles.mjs';
import { runBuild, runBuildAll } from './lib/run-build.mjs';
import { readCurrentFromApp } from './lib/read-current.mjs';
import { assertProfile } from './lib/validate-profile.mjs';

function profilePayload(body) {
  if (!body || typeof body !== 'object') return {};
  const { clientId: _clientId, ...profile } = body;
  return profile;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.STUDIO_PORT || 3847);
const HOST = '127.0.0.1';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function resolveClientId(req) {
  if (req.body?.clientId) return String(req.body.clientId);
  if (req.query?.clientId) return String(req.query.clientId);
  return getActiveClientId();
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const clientId = resolveClientId(req);
      const dir = uploadDir(clientId, req.params.appId);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.png';
      cb(null, `${req.params.kind}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const buildLogs = new Map();
let buildSeq = 0;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, tool: 'argo-mobile-build-studio' });
});

app.get('/api/clients', (_req, res) => {
  res.json({ activeClientId: getActiveClientId(), clients: listClients() });
});

app.post('/api/clients', (req, res) => {
  try {
    const label = String(req.body?.label ?? '').trim();
    if (!label) return res.status(400).json({ error: 'Nombre del cliente requerido' });
    const created = createClient(label, {
      clientId: req.body?.clientId ? String(req.body.clientId).trim() : null,
      copyFrom: req.body?.copyFrom ? String(req.body.copyFrom).trim() : null,
    });
    setActiveClientId(created.id);
    res.json({ ...created, activeClientId: created.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/clients/active', (req, res) => {
  try {
    const clientId = setActiveClientId(String(req.body?.clientId ?? ''));
    res.json({ activeClientId: clientId, profiles: listProfiles(clientId) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/apps', (_req, res) => {
  res.json(
    Object.values(MOBILE_APPS).map((a) => ({
      id: a.id,
      label: a.label,
      dir: a.dir,
      easProjectId: a.easProjectId,
      assets: a.assets,
    })),
  );
});

app.get('/api/profiles', (req, res) => {
  const clientId = resolveClientId(req);
  res.json({ clientId, profiles: listProfiles(clientId) });
});

app.get('/api/profiles/:appId', (req, res) => {
  const { appId } = req.params;
  if (!MOBILE_APPS[appId]) return res.status(404).json({ error: 'App no encontrada' });
  const clientId = resolveClientId(req);
  res.json(loadProfile(appId, clientId));
});

app.get('/api/profiles/:appId/current', (req, res) => {
  const { appId } = req.params;
  if (!MOBILE_APPS[appId]) return res.status(404).json({ error: 'App no encontrada' });
  res.json(readCurrentFromApp(appId));
});

app.put('/api/profiles/:appId', (req, res) => {
  const { appId } = req.params;
  if (!MOBILE_APPS[appId]) return res.status(404).json({ error: 'App no encontrada' });
  const clientId = resolveClientId(req);
  const patch = profilePayload(req.body);
  const saved = saveProfile(appId, patch, clientId);
  res.json(saved);
});

app.post('/api/profiles/:appId/apply', (req, res) => {
  const { appId } = req.params;
  if (!MOBILE_APPS[appId]) return res.status(404).json({ error: 'App no encontrada' });
  const clientId = resolveClientId(req);
  try {
    const patch = profilePayload(req.body);
    const profile = saveProfile(appId, patch, clientId);
    assertProfile(profile);
    const result = applyProfile(appId, profile, clientId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/apply-all', (req, res) => {
  const clientId = resolveClientId(req);
  try {
    res.json(applyAllProfiles(clientId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload/:appId/:kind', upload.single('file'), (req, res) => {
  const { appId, kind } = req.params;
  if (!MOBILE_APPS[appId]) return res.status(404).json({ error: 'App no encontrada' });
  if (!['logo', 'icon', 'adaptiveIcon'].includes(kind)) {
    return res.status(400).json({ error: 'kind debe ser logo, icon o adaptiveIcon' });
  }
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });
  const clientId = resolveClientId(req);
  const profile = loadProfile(appId, clientId);
  profile.uploads = profile.uploads ?? {};
  profile.uploads[kind] = req.file.filename;
  const saved = saveProfile(appId, profile, clientId);
  res.json({ ok: true, filename: req.file.filename, profile: saved });
});

app.post('/api/build/:appId', async (req, res) => {
  const { appId } = req.params;
  if (!MOBILE_APPS[appId]) return res.status(404).json({ error: 'App no encontrada' });
  const clientId = resolveClientId(req);
  const buildProfile = req.body?.buildProfile ?? loadProfile(appId, clientId).buildProfile ?? 'production';
  const jobId = String(++buildSeq);
  buildLogs.set(jobId, { status: 'running', lines: [] });

  res.json({ jobId, status: 'started', clientId });

  const onLog = (text) => {
    const job = buildLogs.get(jobId);
    if (job) job.lines.push(text);
  };

  try {
    const patch = profilePayload(req.body);
    const profile = saveProfile(appId, patch, clientId);
    assertProfile(profile);
    const result = await runBuild(appId, { buildProfile, onLog, clientId, profile });
    buildLogs.set(jobId, {
      status: 'done',
      lines: buildLogs.get(jobId)?.lines ?? [],
      result,
      profile,
      clientId,
    });
  } catch (err) {
    buildLogs.set(jobId, {
      status: 'error',
      lines: buildLogs.get(jobId)?.lines ?? [],
      error: err.message,
      clientId,
    });
  }
});

app.post('/api/build-all', async (req, res) => {
  const clientId = resolveClientId(req);
  const buildProfile = req.body?.buildProfile ?? 'production';
  const jobId = String(++buildSeq);
  buildLogs.set(jobId, { status: 'running', lines: [] });
  res.json({ jobId, status: 'started', clientId });

  const onLog = (text) => {
    const job = buildLogs.get(jobId);
    if (job) job.lines.push(text);
  };

  try {
    if (req.body?.profiles) {
      for (const [id, p] of Object.entries(req.body.profiles)) {
        saveProfile(id, p, clientId);
      }
    }
    const results = await runBuildAll({ buildProfile, onLog, continueOnError: true, clientId });
    const profiles = Object.fromEntries(
      Object.keys(MOBILE_APPS).map((id) => [id, loadProfile(id, clientId)]),
    );
    buildLogs.set(jobId, {
      status: 'done',
      lines: buildLogs.get(jobId)?.lines ?? [],
      results,
      profiles,
      clientId,
    });
  } catch (err) {
    buildLogs.set(jobId, {
      status: 'error',
      lines: buildLogs.get(jobId)?.lines ?? [],
      error: err.message,
      clientId,
    });
  }
});

app.get('/api/build-log/:jobId', (req, res) => {
  const job = buildLogs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job no encontrado' });
  res.json(job);
});

app.listen(PORT, HOST, () => {
  console.log(`\n  ARGO Mobile Build Studio`);
  console.log(`  http://${HOST}:${PORT}`);
  console.log(`  Solo desarrollo local — no desplegar a producción.\n`);
});
