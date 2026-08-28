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
  profiles: {},
  active: 'aula',
  jobPoll: null,
  busy: false,
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

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
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

  $('#pageHeader').innerHTML = `
    <div>
      <h2>${meta?.icon ?? ''} ${app?.label ?? 'App'}</h2>
      <p>${meta?.desc ?? ''}</p>
    </div>
    <div class="header-chips">
      <span class="chip chip-accent"><strong>v${profile?.version ?? '—'}</strong> · build ${profile?.versionCode ?? '—'}</span>
      <span class="chip"><strong>Perfil</strong> ${profile?.buildProfile ?? 'production'}</span>
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
}

function updateSummaryLive() {
  const appId = state.active;
  const body = readForm(appId, fieldsFor(appId), false);
  state.profiles[appId] = { ...state.profiles[appId], ...body };
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
        const res = await fetch(`/api/upload/${appId}/${kind}`, { method: 'POST', body: fd });
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
      log(`\n↻ Valores sincronizados desde ${appId}\n`);
      toast('Valores leídos del proyecto');
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  $('#btnSave').onclick = async () => {
    setBusy(true);
    try {
      const body = readForm(appId, fields);
      state.profiles[appId] = await api(`/api/profiles/${appId}`, { method: 'PUT', body: JSON.stringify(body) });
      renderAll();
      toast('Perfil guardado');
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  $('#btnApply').onclick = async () => {
    setBusy(true);
    try {
      const body = readForm(appId, fields);
      const result = await api(`/api/profiles/${appId}/apply`, { method: 'POST', body: JSON.stringify(body) });
      state.profiles[appId] = result.profile;
      log(`\n✓ ${result.message}\n  Assets: ${result.copiedAssets.join(', ') || '(sin cambios)'}\n`);
      toast('Perfil aplicado al código');
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  $('#btnBuild').onclick = async () => {
    const btn = $('#btnBuild');
    btn.classList.add('loading');
    btn.querySelector('.btn-icon').textContent = '⟳';
    setBusy(true);
    setTerminalStatus('Compilando…', 'running');
    try {
      const body = readForm(appId, fields);
      const { jobId } = await api(`/api/build/${appId}`, { method: 'POST', body: JSON.stringify(body) });
      pollJob(jobId);
      toast('Build iniciado en EAS');
    } catch (err) {
      setTerminalStatus('Error', 'error');
      toast(err.message, 'err');
      setBusy(false);
      btn.classList.remove('loading');
      btn.querySelector('.btn-icon').textContent = '▶';
    }
  };
}

function readForm(appId, fields, fromDom = true) {
  const body = { ...state.profiles[appId] };
  if (!fromDom) {
    const form = $('#form');
    if (!form) return body;
  }
  const form = $('#form');
  fields.forEach((f) => {
    const el = form.elements.namedItem(f.key);
    if (!el) return;
    body[f.key] = f.type === 'number' ? Number(el.value) : el.value;
  });
  return body;
}

function renderAll() {
  renderTabs();
  renderHeader();
  renderPanel();
  renderSummary();
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

async function pollJob(jobId) {
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
        setTerminalStatus('Build completado', 'done');
        log(`\n✓ Build finalizado correctamente\n`);
        toast('Build completado');
      }
    } catch {
      /* seguir polling */
    }
  }, 2000);
}

async function init() {
  state.apps = await api('/api/apps');
  const list = await api('/api/profiles');
  for (const item of list) state.profiles[item.id] = item.profile;
  state.active = state.apps[0]?.id ?? 'aula';
  setAccent(state.active);
  renderAll();

  $('#btnClearLog').onclick = () => {
    $('#log').textContent = '';
    setTerminalStatus('En espera');
    $('#terminalDot').className = 'terminal-dot';
  };

  $('#btnApplyAll').onclick = async () => {
    setBusy(true);
    try {
      const results = await api('/api/apply-all', { method: 'POST' });
      log(`\n✓ Perfil aplicado en ${results.length} apps\n`);
      toast(`Aplicado en ${results.length} aplicaciones`);
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
      for (const a of state.apps) {
        await api(`/api/profiles/${a.id}`, {
          method: 'PUT',
          body: JSON.stringify(state.profiles[a.id]),
        });
      }
      const { jobId } = await api('/api/build-all', {
        method: 'POST',
        body: JSON.stringify({ buildProfile: 'production' }),
      });
      pollJob(jobId);
      toast('Build ×3 iniciado');
    } catch (err) {
      setTerminalStatus('Error', 'error');
      toast(err.message, 'err');
      setBusy(false);
    }
  };
}

init().catch((err) => toast(err.message, 'err'));
