import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SERVICIOS_CATALOGO, PORTAL_PAGES } from './lib/catalog.mjs';
import {
  createClient,
  getActiveClientId,
  listClients,
  loadProfile,
  saveProfile,
  setActiveClientId,
} from './lib/clients.mjs';
import { generateSeoPack } from './lib/generate-seo.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.SEO_STUDIO_PORT || 3848);
const HOST = '127.0.0.1';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function resolveClientId(req) {
  if (req.body?.clientId) return String(req.body.clientId);
  if (req.query?.clientId) return String(req.query.clientId);
  return getActiveClientId();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, tool: 'argo-seo-studio' });
});

app.get('/api/catalog', (_req, res) => {
  res.json({ servicios: SERVICIOS_CATALOGO, paginas: PORTAL_PAGES });
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
    res.json({ ...created, activeClientId: created.id, profile: loadProfile(created.id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/clients/active', (req, res) => {
  try {
    const clientId = setActiveClientId(String(req.body?.clientId ?? ''));
    res.json({ activeClientId: clientId, profile: loadProfile(clientId) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/profile', (req, res) => {
  const clientId = resolveClientId(req);
  res.json({ clientId, profile: loadProfile(clientId) });
});

app.put('/api/profile', (req, res) => {
  const clientId = resolveClientId(req);
  try {
    const saved = saveProfile(req.body?.profile ?? req.body, clientId);
    res.json({ clientId, profile: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/generate', (req, res) => {
  const clientId = resolveClientId(req);
  try {
    const profile = req.body?.profile ? saveProfile(req.body.profile, clientId) : loadProfile(clientId);
    const pack = generateSeoPack(profile);
    res.json({ clientId, profile, ...pack });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`\n  ARGO SEO Studio`);
  console.log(`  http://${HOST}:${PORT}`);
  console.log(`  Generador de SEO para portales aula virtual — solo desarrollo local.\n`);
});
