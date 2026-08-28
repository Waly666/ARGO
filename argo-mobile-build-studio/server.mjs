import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { MOBILE_APPS, UPLOADS_DIR } from './lib/apps.mjs';
import { applyProfile, applyAllProfiles } from './lib/apply-profile.mjs';
import { loadProfile, saveProfile, listProfiles } from './lib/profiles.mjs';
import { runBuild, runBuildAll } from './lib/run-build.mjs';
import { readCurrentFromApp } from './lib/read-current.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.STUDIO_PORT || 3847);
const HOST = '127.0.0.1';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const dir = path.join(UPLOADS_DIR, req.params.appId);
      fs.mkdirSync(dir, { recursive: true });
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

app.get('/api/profiles', (_req, res) => {
  res.json(listProfiles());
});

app.get('/api/profiles/:appId', (req, res) => {
  const { appId } = req.params;
  if (!MOBILE_APPS[appId]) return res.status(404).json({ error: 'App no encontrada' });
  res.json(loadProfile(appId));
});

app.get('/api/profiles/:appId/current', (req, res) => {
  const { appId } = req.params;
  if (!MOBILE_APPS[appId]) return res.status(404).json({ error: 'App no encontrada' });
  res.json(readCurrentFromApp(appId));
});

app.put('/api/profiles/:appId', (req, res) => {
  const { appId } = req.params;
  if (!MOBILE_APPS[appId]) return res.status(404).json({ error: 'App no encontrada' });
  const saved = saveProfile(appId, req.body);
  res.json(saved);
});

app.post('/api/profiles/:appId/apply', (req, res) => {
  const { appId } = req.params;
  if (!MOBILE_APPS[appId]) return res.status(404).json({ error: 'App no encontrada' });
  try {
    const profile = saveProfile(appId, req.body ?? loadProfile(appId));
    const result = applyProfile(appId, profile);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/apply-all', (_req, res) => {
  try {
    res.json(applyAllProfiles());
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
  const profile = loadProfile(appId);
  profile.uploads = profile.uploads ?? {};
  profile.uploads[kind] = req.file.filename;
  saveProfile(appId, profile);
  res.json({ ok: true, filename: req.file.filename, profile });
});

app.post('/api/build/:appId', async (req, res) => {
  const { appId } = req.params;
  if (!MOBILE_APPS[appId]) return res.status(404).json({ error: 'App no encontrada' });
  const buildProfile = req.body?.buildProfile ?? loadProfile(appId).buildProfile ?? 'production';
  const jobId = String(++buildSeq);
  buildLogs.set(jobId, { status: 'running', lines: [] });

  res.json({ jobId, status: 'started' });

  const onLog = (text) => {
    const job = buildLogs.get(jobId);
    if (job) job.lines.push(text);
  };

  try {
    if (req.body) saveProfile(appId, req.body);
    const result = await runBuild(appId, { buildProfile, onLog });
    buildLogs.set(jobId, { status: 'done', lines: buildLogs.get(jobId)?.lines ?? [], result });
  } catch (err) {
    buildLogs.set(jobId, {
      status: 'error',
      lines: buildLogs.get(jobId)?.lines ?? [],
      error: err.message,
    });
  }
});

app.post('/api/build-all', async (req, res) => {
  const buildProfile = req.body?.buildProfile ?? 'production';
  const jobId = String(++buildSeq);
  buildLogs.set(jobId, { status: 'running', lines: [] });
  res.json({ jobId, status: 'started' });

  const onLog = (text) => {
    const job = buildLogs.get(jobId);
    if (job) job.lines.push(text);
  };

  try {
    if (req.body?.profiles) {
      for (const [id, p] of Object.entries(req.body.profiles)) {
        saveProfile(id, p);
      }
    }
    const results = await runBuildAll({ buildProfile, onLog, continueOnError: true });
    buildLogs.set(jobId, { status: 'done', lines: buildLogs.get(jobId)?.lines ?? [], results });
  } catch (err) {
    buildLogs.set(jobId, {
      status: 'error',
      lines: buildLogs.get(jobId)?.lines ?? [],
      error: err.message,
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
