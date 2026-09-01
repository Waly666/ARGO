const $ = (sel) => document.querySelector(sel);

const APP_META = {
  aula: {
    icon: '🎓',
    accent: '#3d5cff',
    tagline: 'Portal de alumnos y cursos virtuales',
    desc: 'Matrículas, puntajes, certificados y reproductor de lecciones.',
  },
  cajero: {
    icon: '💳',
    accent: '#3578f0',
    tagline: 'Caja y administración en punto de venta',
    desc: 'Recaudo, inscripciones y operaciones del cajero ARGO.',
  },
  jornadas: {
    icon: '🏕️',
    accent: '#0d9488',
    tagline: 'Capacitación en campo (carpa)',
    desc: 'Asistencia, evidencia fotográfica y jornadas presenciales.',
  },
};

const state = {
  apps: [],
  clients: [],
  clientId: null,
  profiles: {},
  profilesByClient: {},
  active: 'aula',
  jobPoll: null,
  busy: false,
  clientBarBound: false,
};

let toastTimer = null;

function setAccent(appId) {
  const accent = APP_META[appId]?.accent ?? '#3d5cff';
  document.documentElement.style.setProperty('--accent', accent);
}

function toast(msg, type = 'ok') {
  const el = $('#toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

function setTerminalStatus(status, dotClass = '') {
  $('#terminalStatus').textContent = status;
  const dot = $('#terminalDot');
  dot.className = 'terminal-dot' + (dotClass ? ` ${dotClass}` : '');
}

function log(text, replace = false) {
  const el = $('#log');
  if (replace) el.textContent = text;
  else el.textContent += text;
  el.scrollTop = el.scrollHeight;
}

function setBusy(busy) {
  state.busy = busy;
  document.querySelectorAll('.btn').forEach((b) => {
    if (busy) b.setAttribute('disabled', 'disabled');
    else b.removeAttribute('disabled');
  });
}

async function api(path, opts = {}, { clientId = state.clientId } = {}) {
  const url = new URL(path, window.location.origin);
  if (clientId && !url.searchParams.has('clientId')) {
    url.searchParams.set('clientId', clientId);
  }
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function apiBody(body) {
  return JSON.stringify({ ...body, clientId: state.clientId });
}

function syncProfilesView() {
  state.profiles = { ...(state.profilesByClient[state.clientId] ?? {}) };
}

function cacheCurrentClientProfiles() {
  if (!state.clientId) return;
  persistActiveForm();
  state.profilesByClient[state.clientId] = JSON.parse(JSON.stringify(state.profiles));
}

function loadProfilesForClient(clientId, profilesList) {
  const bucket = {};
  for (const item of profilesList) bucket[item.id] = item.profile;
  state.profilesByClient[clientId] = bucket;
  state.clientId = clientId;
  syncProfilesView();
}

async function saveCurrentClientToServer() {
  if (!state.clientId) return;
  cacheCurrentClientProfiles();
  const bucket = state.profilesByClient[state.clientId] ?? {};
  for (const appId of Object.keys(bucket)) {
    await api(`/api/profiles/${appId}`, {
      method: 'PUT',
      body: apiBody(bucket[appId]),
    }, { clientId: state.clientId });
  }
}

async function switchClient(nextId) {
  if (!nextId || nextId === state.clientId) return;
  setBusy(true);
  try {
    await saveCurrentClientToServer();
    state.clientId = nextId;
    const data = await api('/api/clients/active', {
      method: 'PUT',
      body: JSON.stringify({ clientId: nextId }),
    }, { clientId: nextId });
    loadProfilesForClient(data.activeClientId, data.profiles);
    renderAll({ refreshClientBar: true });
    const label = state.clients.find((c) => c.id === state.clientId)?.label ?? state.clientId;
    toast(`Cliente activo: ${label}`);
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    setBusy(false);
  }
}

function validateProfileLocal(profile) {
  const missing = [];
  const need = [
    ['appName', 'Nombre en el teléfono'],
    ['slug', 'Slug EAS'],
    ['androidPackage', 'Package Android'],
    ['scheme', 'Deep link scheme'],
    ['apiBaseUrl', 'Servidor API por defecto'],
    ['tituloApp', 'Título interno'],
    ['nombreEmpresaFallback', 'Nombre empresa'],
  ];
  for (const [key, label] of need) {
    if (!String(profile?.[key] ?? '').trim()) missing.push(label);
  }
  const api = String(profile?.apiBaseUrl ?? '').trim();
  if (api && !/^https?:\/\/.+/i.test(api)) {
    missing.push('Servidor API (http:// o https://)');
  }
  return missing;
}

function bodyFromActiveForm() {
  const appId = state.active;
  return readForm(appId, fieldsFor(appId));
}

function readForm(appId, fields) {
  const body = { ...(state.profiles[appId] ?? {}) };
  const form = $('#form');
  if (!form) return body;
  fields.forEach((f) => {
    const el = form.querySelector(`[name="${f.key}"]`);
    if (!el) return;
    const raw = f.type === 'number' ? Number(el.value) : el.value;
    body[f.key] = typeof raw === 'string' ? raw.trim() : raw;
  });
  return body;
}

function persistActiveForm() {
  const appId = state.active;
  const form = $('#form');
  if (!form) return;
  state.profiles[appId] = readForm(appId, fieldsFor(appId));
}

function renderClientBar({ refresh = false } = {}) {
  const host = $('#clientBar');
  if (!host) return;

  if (!host.querySelector('#clientSelect')) {
    host.innerHTML = `
      <span class="client-chip">Cliente activo</span>
      <select id="clientSelect" aria-label="Seleccionar cliente"></select>
      <div class="client-bar-actions">
        <button type="button" class="btn btn-outline btn-sm" id="btnNewClient">+ Nuevo</button>
        <button type="button" class="btn btn-outline btn-sm" id="btnDupClient">Duplicar</button>
      </div>
    `;
  }

  const select = $('#clientSelect');
  if (refresh || select.options.length !== state.clients.length) {
    select.innerHTML = state.clients
      .map(
        (c) =>
          `<option value="${escapeHtml(c.id)}" ${c.id === state.clientId ? 'selected' : ''}>${escapeHtml(c.label)}</option>`,
      )
      .join('');
  } else {
    select.value = state.clientId ?? '';
  }

  if (!state.clientBarBound) {
    state.clientBarBound = true;
    select.addEventListener('change', (e) => switchClient(e.target.value));
    $('#btnNewClient').addEventListener('click', async () => {
      const label = prompt('Nombre del nuevo cliente (ej. CEA Acme Bogotá):');
      if (!label?.trim()) return;
      setBusy(true);
      try {
        await saveCurrentClientToServer();
        const created = await api('/api/clients', {
          method: 'POST',
          body: JSON.stringify({ label: label.trim() }),
        });
        await reloadClients();
        await switchClient(created.activeClientId ?? created.id);
        toast(`Cliente "${created.label}" creado`);
      } catch (err) {
        toast(err.message, 'err');
      } finally {
        setBusy(false);
      }
    });
    $('#btnDupClient').addEventListener('click', async () => {
      const current = state.clients.find((c) => c.id === state.clientId);
      const label = prompt('Nombre del cliente duplicado:', `${current?.label ?? 'Cliente'} copia`);
      if (!label?.trim()) return;
      setBusy(true);
      try {
        await saveCurrentClientToServer();
        const created = await api('/api/clients', {
          method: 'POST',
          body: JSON.stringify({ label: label.trim(), copyFrom: state.clientId }),
        }, { clientId: state.clientId });
        await reloadClients();
        await switchClient(created.activeClientId ?? created.id);
        toast(`Cliente duplicado: ${created.label}`);
      } catch (err) {
        toast(err.message, 'err');
      } finally {
        setBusy(false);
      }
    });
  }
}

async function reloadClients() {
  const data = await api('/api/clients');
  state.clients = data.clients;
  state.clientId = data.activeClientId;
}

async function reloadProfiles() {
  const data = await api('/api/profiles', {}, { clientId: state.clientId });
  loadProfilesForClient(data.clientId, data.profiles);
}

function fieldsFor(appId) {
  const isAula = appId === 'aula';
  return [
    { key: 'appName', label: 'Nombre en el teléfono', hint: 'Texto bajo el icono en Android', full: true },
    { key: 'slug', label: 'Slug EAS', hint: 'Identificador del proyecto en Expo' },
    { key: 'version', label: 'Versión', hint: 'Semver visible para el usuario' },
    { key: 'versionCode', label: 'versionCode', hint: 'Entero incremental en Play Store', type: 'number' },
    { key: 'androidPackage', label: 'Package Android', hint: 'ej. co.servial.aula', full: true },
    { key: 'scheme', label: 'Deep link scheme', hint: 'Para enlaces profundos' },
    { key: 'apiBaseUrl', label: 'Servidor API por defecto', hint: 'URL embebida en el APK', full: true },
    {
      key: 'splashBackgroundColor',
      label: 'Color splash',
      hint: 'Pantalla de carga',
      type: 'color',
    },
    ...(isAula
      ? []
      : [{ key: 'primaryColor', label: 'Color primario UI', hint: 'Cabeceras y acentos', type: 'color' }]),
    { key: 'tituloApp', label: 'Título interno', hint: 'Branding sin conexión' },
    { key: 'nombreEmpresaFallback', label: 'Nombre empresa', hint: 'Fallback offline', full: true },
    { key: 'apkName', label: 'Nombre del APK', hint: 'Referencia al descargar' },
    {
      key: 'buildProfile',
      label: 'Perfil EAS',
      hint: 'Tipo de build en la nube',
      type: 'select',
      options: [
        { value: 'production', label: 'production — APK definitivo' },
        { value: 'preview', label: 'preview — distribución interna' },
      ],
    },
  ];
}

function renderTabs() {
  const tabs = $('#tabs');
  tabs.innerHTML = state.apps
    .map((a) => {
      const meta = APP_META[a.id] ?? { icon: '📱', tagline: a.label };
      return `
        <button
          type="button"
          class="app-tab ${a.id === state.active ? 'active' : ''}"
          data-tab="${a.id}"
          style="--tab-accent: ${meta.accent}"
        >
          <span class="app-tab-icon">${meta.icon}</span>
          <span class="app-tab-text">
            <strong>${a.label}</strong>
            <span>${meta.tagline}</span>
          </span>
        </button>`;
    })
    .join('');

  tabs.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      persistActiveForm();
      state.active = btn.dataset.tab;
      setAccent(state.active);
      renderAll();
    });
  });
}

function renderHeader() {
  const appId = state.active;
  const app = state.apps.find((a) => a.id === appId);
  const profile = state.profiles[appId];
  const meta = APP_META[appId];

  const client = state.clients.find((c) => c.id === state.clientId);

  $('#pageHeader').innerHTML = `
    <div>
      <h2>${meta?.icon ?? ''} ${app?.label ?? 'App'}</h2>
      <p>${meta?.desc ?? ''}</p>
    </div>
    <div class="header-chips">
      <span class="chip chip-accent"><strong>${escapeHtml(client?.label ?? state.clientId ?? '—')}</strong></span>
      <span class="chip chip-accent"><strong>v${profile?.version ?? '—'}</strong> · build ${profile?.versionCode ?? '—'}</span>
      <span class="chip"><strong>Dir</strong> ${app?.dir ?? ''}</span>
    </div>
  `;
}

function renderSummary() {
  const appId = state.active;
  const profile = state.profiles[appId];
  const p = profile ?? {};

  $('#summary').innerHTML = `
    <div class="summary-card">
      <h4>Vista previa del perfil</h4>
      <div class="summary-row"><span>App</span><span>${escapeHtml(p.appName ?? '—')}</span></div>
      <div class="summary-row"><span>Package</span><span class="mono">${escapeHtml(p.androidPackage ?? '—')}</span></div>
      <div class="summary-row"><span>API</span><span class="mono">${escapeHtml(p.apiBaseUrl ?? '—')}</span></div>
      <div class="summary-row">
        <span>Splash</span>
        <span><span class="color-swatch" style="background:${p.splashBackgroundColor ?? '#fff'}"></span>${escapeHtml(p.splashBackgroundColor ?? '—')}</span>
      </div>
      <div class="summary-row"><span>Empresa</span><span>${escapeHtml(p.nombreEmpresaFallback ?? '—')}</span></div>
      <div class="summary-row"><span>APK</span><span class="mono">${escapeHtml(p.apkName ?? '—')}</span></div>
    </div>
    <div class="summary-card tip-card">
      <h4>Nota</h4>
      <p>El logo y nombre en <em>runtime</em> siguen viniendo del servidor. Aquí configuras lo embebido en el binario: icono, splash, API por defecto y fallbacks offline.</p>
    </div>
  `;
}

function fieldHtml(f, profile) {
  const val = profile[f.key] ?? '';
  const hint = f.hint ? `<span class="field-hint">${f.hint}</span>` : '';

  if (f.type === 'select') {
    return `
      <div class="field ${f.full ? 'full' : ''}">
        <label>${f.label} ${hint}
          <select name="${f.key}">
            ${f.options
              .map((o) => `<option value="${o.value}" ${o.value === val ? 'selected' : ''}>${o.label}</option>`)
              .join('')}
          </select>
        </label>
      </div>`;
  }

  if (f.type === 'color') {
    const hex = String(val || '#ffffff');
    return `
      <div class="field ${f.full ? 'full' : ''}">
        <label>${f.label} ${hint}
          <div class="input-color-wrap">
            <input type="color" name="${f.key}_picker" value="${escapeHtml(hex)}" data-color-for="${f.key}" />
            <input name="${f.key}" type="text" value="${escapeHtml(hex)}" data-color-text="${f.key}" placeholder="#000000" />
          </div>
        </label>
      </div>`;
  }

  return `
    <div class="field ${f.full ? 'full' : ''}">
      <label>${f.label} ${hint}
        <input name="${f.key}" type="${f.type || 'text'}" value="${escapeHtml(String(val))}" />
      </label>
    </div>`;
}

function renderPanel() {
  const appId = state.active;
  const profile = state.profiles[appId];
  const fields = fieldsFor(appId);

  $('#panel').innerHTML = `
    <form id="form">
      <div class="panel-section">
        <div class="section-head">
          <span class="section-icon">⚙️</span>
          <div>
            <h3>Identidad y servidor</h3>
            <p>Valores que se escriben en app.config.ts, eas.json y branding</p>
          </div>
        </div>
        <div class="grid">
          ${fields.map((f) => fieldHtml(f, profile)).join('')}
        </div>
      </div>

      <div class="panel-section">
        <div class="section-head">
          <span class="section-icon">🖼️</span>
          <div>
            <h3>Recursos gráficos</h3>
            <p>Se copian a assets/ al aplicar el perfil</p>
          </div>
        </div>
        <div class="uploads">
          ${uploadCard('logo', 'Logo / splash', profile.uploads?.logo, 'PNG transparente, ~512px')}
          ${uploadCard('icon', 'Icono de la app', profile.uploads?.icon, '1024×1024 recomendado')}
          ${
            appId === 'aula'
              ? uploadCard('adaptiveIcon', 'Adaptive icon', profile.uploads?.adaptiveIcon, 'Solo Android Aula')
              : ''
          }
        </div>
      </div>

      <div class="action-bar">
        <button type="button" class="btn btn-secondary" id="btnReload">
          <span class="btn-icon">↻</span> Leer del proyecto
        </button>
        <button type="button" class="btn btn-secondary" id="btnSave">
          <span class="btn-icon">💾</span> Guardar perfil
        </button>
        <span class="spacer"></span>
        <button type="button" class="btn btn-secondary" id="btnApply">
          <span class="btn-icon">✎</span> Aplicar al código
        </button>
        <button type="button" class="btn btn-primary" id="btnBuild">
          <span class="btn-icon">▶</span> Aplicar + Build EAS
        </button>
      </div>
    </form>
  `;

  bindColorInputs();
  bindUploads(appId);
  bindActions(appId, fields);
}

function uploadCard(kind, title, filename, hint) {
  const has = Boolean(filename);
  return `
    <div class="upload-card ${has ? 'has-file' : ''}">
      <div class="upload-top">
        <span class="upload-icon">${kind === 'icon' ? '◆' : kind === 'adaptiveIcon' ? '◇' : '◻'}</span>
        <p>${title}</p>
      </div>
      <input type="file" accept="image/*" data-upload="${kind}" />
      <p class="hint">${has ? `✓ ${filename}` : hint}</p>
    </div>`;
}

function bindColorInputs() {
  document.querySelectorAll('[data-color-for]').forEach((picker) => {
    const key = picker.dataset.colorFor;
    const text = document.querySelector(`[data-color-text="${key}"]`);
    picker.addEventListener('input', () => {
      if (text) text.value = picker.value;
      updateSummaryLive();
    });
    text?.addEventListener('input', () => {
      if (/^#[0-9a-fA-F]{6}$/.test(text.value)) picker.value = text.value;
      updateSummaryLive();
    });
  });

  $('#form')?.addEventListener('input', updateSummaryLive);
  $('#form')?.addEventListener('change', updateSummaryLive);
}

function updateSummaryLive() {
  const appId = state.active;
  state.profiles[appId] = readForm(appId, fieldsFor(appId));
  renderSummary();
  renderHeader();
}

function bindUploads(appId) {
  document.querySelectorAll('[data-upload]').forEach((input) => {
    input.addEventListener('change', async () => {
      const kind = input.dataset.upload;
      const file = input.files?.[0];
      if (!file) return;
      setBusy(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(
          `/api/upload/${appId}/${kind}?clientId=${encodeURIComponent(state.clientId)}`,
          { method: 'POST', body: fd },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al subir');
        state.profiles[appId] = data.profile;
        renderAll();
        toast(`Imagen ${kind} cargada correctamente`);
      } catch (err) {
        toast(err.message, 'err');
      } finally {
        setBusy(false);
      }
    });
  });
}

function bindActions(appId, fields) {
  $('#btnReload').onclick = async () => {
    setBusy(true);
    try {
      const current = await api(`/api/profiles/${appId}/current`);
      state.profiles[appId] = { ...state.profiles[appId], ...current };
      renderAll();
      log(`\n↻ Valores sincronizados desde código fuente (${appId})\n`);
      toast('Valores leídos del proyecto (no guardados aún)');
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  $('#btnSave').onclick = async () => {
    const activeId = state.active;
    setBusy(true);
    try {
      const body = bodyFromActiveForm();
      state.profiles[activeId] = await api(`/api/profiles/${activeId}`, {
        method: 'PUT',
        body: apiBody(body),
      }, { clientId: state.clientId });
      cacheCurrentClientProfiles();
      renderAll();
      toast(`Perfil guardado — ${state.clients.find((c) => c.id === state.clientId)?.label ?? state.clientId}`);
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  $('#btnApply').onclick = async () => {
    const activeId = state.active;
    setBusy(true);
    try {
      const body = bodyFromActiveForm();
      const missing = validateProfileLocal(body);
      if (missing.length) {
        throw new Error(`Completa: ${missing.join(', ')}`);
      }
      cacheCurrentClientProfiles();
      const result = await api(`/api/profiles/${activeId}/apply`, {
        method: 'POST',
        body: apiBody(body),
      }, { clientId: state.clientId });
      state.profiles[activeId] = result.profile;
      renderAll();
      log(`\n✓ ${result.message}\n  Cliente: ${state.clientId}\n  API: ${body.apiBaseUrl}\n  Assets: ${result.copiedAssets.join(', ') || '(sin cambios)'}\n`);
      toast(`Aplicado — ${state.clients.find((c) => c.id === state.clientId)?.label ?? state.clientId}`);
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  $('#btnBuild').onclick = async () => {
    const activeId = state.active;
    const btn = $('#btnBuild');
    btn.classList.add('loading');
    btn.querySelector('.btn-icon').textContent = '⟳';
    setBusy(true);
    setTerminalStatus('Compilando…', 'running');
    try {
      const body = bodyFromActiveForm();
      const missing = validateProfileLocal(body);
      if (missing.length) {
        throw new Error(`Completa antes del build: ${missing.join(', ')}`);
      }
      state.profiles[activeId] = body;
      cacheCurrentClientProfiles();
      await api(`/api/profiles/${activeId}`, { method: 'PUT', body: apiBody(body) }, { clientId: state.clientId });
      const { jobId } = await api(`/api/build/${activeId}`, {
        method: 'POST',
        body: apiBody(body),
      }, { clientId: state.clientId });
      pollJob(jobId, activeId);
      toast('Perfil guardado — build iniciado en EAS');
    } catch (err) {
      setTerminalStatus('Error', 'error');
      toast(err.message, 'err');
      setBusy(false);
      btn.classList.remove('loading');
      btn.querySelector('.btn-icon').textContent = '▶';
    }
  };
}

function renderAll({ persistForm = false, refreshClientBar = false } = {}) {
  if (persistForm) persistActiveForm();
  renderClientBar({ refresh: refreshClientBar });
  renderTabs();
  renderHeader();
  renderPanel();
  renderSummary();
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

async function pollJob(jobId, appId) {
  if (state.jobPoll) clearInterval(state.jobPoll);
  log(`\n— Build job #${jobId} —\n`, true);
  setTerminalStatus(`Job #${jobId}`, 'running');

  state.jobPoll = setInterval(async () => {
    try {
      const job = await api(`/api/build-log/${jobId}`);
      $('#log').textContent = job.lines.join('') || 'Esperando salida de EAS…';
      if (job.status === 'running') return;

      clearInterval(state.jobPoll);
      state.jobPoll = null;
      setBusy(false);

      const buildBtn = $('#btnBuild');
      buildBtn?.classList.remove('loading');
      buildBtn?.querySelector('.btn-icon') && (buildBtn.querySelector('.btn-icon').textContent = '▶');

      if (job.status === 'error') {
        setTerminalStatus('Error en build', 'error');
        log(`\n✗ ${job.error}\n`);
        toast('El build falló — revisa la consola', 'err');
      } else {
        if (job.profiles) {
          for (const [id, profile] of Object.entries(job.profiles)) {
            state.profiles[id] = profile;
          }
          renderAll();
        } else if (job.profile && appId) {
          state.profiles[appId] = job.profile;
          renderAll();
        }
        setTerminalStatus('Build completado', 'done');
        log(`\n✓ Build finalizado correctamente\n`);
        toast('Build completado — perfil guardado');
      }
    } catch {
      /* seguir polling */
    }
  }, 2000);
}

async function init() {
  state.apps = await api('/api/apps', {}, { clientId: null });
  await reloadClients();
  await reloadProfiles();
  state.active = state.apps[0]?.id ?? 'aula';
  setAccent(state.active);
  renderAll({ refreshClientBar: true });

  $('#btnClearLog').onclick = () => {
    $('#log').textContent = '';
    setTerminalStatus('En espera');
    $('#terminalDot').className = 'terminal-dot';
  };

  $('#btnApplyAll').onclick = async () => {
    setBusy(true);
    try {
      await saveCurrentClientToServer();
      const results = await api('/api/apply-all', {
        method: 'POST',
        body: JSON.stringify({ clientId: state.clientId }),
      }, { clientId: state.clientId });
      log(`\n✓ Perfil aplicado (${state.clientId}) en ${results.length} apps\n`);
      toast(`Aplicado — ${state.clients.find((c) => c.id === state.clientId)?.label ?? state.clientId}`);
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  $('#btnBuildAll').onclick = async () => {
    setBusy(true);
    setTerminalStatus('Build múltiple…', 'running');
    log('\n— Iniciando build de las 3 apps —\n', true);
    try {
      await saveCurrentClientToServer();
      const profiles = { ...(state.profilesByClient[state.clientId] ?? {}) };
      const { jobId } = await api('/api/build-all', {
        method: 'POST',
        body: JSON.stringify({ buildProfile: 'production', profiles, clientId: state.clientId }),
      }, { clientId: state.clientId });
      pollJob(jobId);
      toast('Perfiles guardados — build ×3 iniciado');
    } catch (err) {
      setTerminalStatus('Error', 'error');
      toast(err.message, 'err');
      setBusy(false);
    }
  };
}

init().catch((err) => toast(err.message, 'err'));
