const $ = (sel, root = document) => root.querySelector(sel);

let state = {
  clients: [],
  activeClientId: null,
  catalog: { servicios: [], paginas: [] },
  profile: null,
  pack: null,
};

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2800);
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderClientBar() {
  const bar = $('#clientBar');
  const options = state.clients
    .map((c) => `<option value="${esc(c.id)}" ${c.id === state.activeClientId ? 'selected' : ''}>${esc(c.label)}</option>`)
    .join('');

  bar.innerHTML = `
    <select id="clientSelect" aria-label="Cliente activo">${options}</select>
    <div class="client-actions">
      <button type="button" class="btn btn-sm btn-ghost" id="btnNewClient">+ Nuevo</button>
      <button type="button" class="btn btn-sm btn-ghost" id="btnDupClient">Duplicar</button>
    </div>
  `;

  $('#clientSelect').addEventListener('change', async (e) => {
    try {
      const data = await api('/api/clients/active', {
        method: 'PUT',
        body: JSON.stringify({ clientId: e.target.value }),
      });
      state.activeClientId = data.activeClientId;
      state.profile = data.profile;
      renderForm();
      state.pack = null;
      renderResults();
    } catch (err) {
      toast(err.message);
    }
  });

  $('#btnNewClient').addEventListener('click', async () => {
    const label = prompt('Nombre del cliente (ej. Finstruvial, Servial):');
    if (!label?.trim()) return;
    try {
      const data = await api('/api/clients', {
        method: 'POST',
        body: JSON.stringify({ label: label.trim() }),
      });
      await loadClients();
      state.activeClientId = data.activeClientId;
      state.profile = data.profile;
      renderClientBar();
      renderForm();
      toast(`Cliente "${label}" creado`);
    } catch (err) {
      toast(err.message);
    }
  });

  $('#btnDupClient').addEventListener('click', async () => {
    const label = prompt('Nombre del nuevo cliente (copia del actual):');
    if (!label?.trim()) return;
    try {
      const data = await api('/api/clients', {
        method: 'POST',
        body: JSON.stringify({ label: label.trim(), copyFrom: state.activeClientId }),
      });
      await loadClients();
      state.activeClientId = data.activeClientId;
      state.profile = data.profile;
      renderClientBar();
      renderForm();
      toast(`Cliente duplicado`);
    } catch (err) {
      toast(err.message);
    }
  });
}

function finstruvialPaginasCatalog() {
  return (state.catalog.paginas ?? []).filter((p) => p.grupo === 'FINSTRUVIAL');
}

function portafolioPaginaActiva(profile, pageKey) {
  if (profile.incluirPortafolioFinstruvial === false) return false;
  const sel = profile.paginasPortafolio ?? [];
  if (!sel.length) return true;
  return sel.includes(pageKey);
}

function renderForm() {
  const p = state.profile;
  const servicios = state.catalog.servicios ?? [];
  const finstruvialPages = finstruvialPaginasCatalog();
  const incluirPortafolio = p.incluirPortafolioFinstruvial !== false;

  const chips = servicios
    .map((s) => {
      const on = (p.serviciosSeleccionados ?? []).includes(s.id);
      return `
        <label class="service-chip ${on ? 'service-chip--on' : ''}">
          <input type="checkbox" data-servicio="${esc(s.id)}" ${on ? 'checked' : ''} />
          <span>
            <strong>${esc(s.label)}</strong>
            <small>${esc((s.keywords ?? []).slice(0, 3).join(' · '))}</small>
          </span>
        </label>
      `;
    })
    .join('');

  const portafolioChips = finstruvialPages
    .map((page) => {
      const on = incluirPortafolio && portafolioPaginaActiva(p, page.key);
      return `
        <label class="service-chip service-chip--compact ${on ? 'service-chip--on' : ''}">
          <input type="checkbox" data-pagina-portafolio="${esc(page.key)}" ${on ? 'checked' : ''} ${incluirPortafolio ? '' : 'disabled'} />
          <span>
            <strong>${esc(page.label)}</strong>
            <small>${esc(page.ruta)}</small>
          </span>
        </label>
      `;
    })
    .join('');

  const customRows = (p.serviciosCustom ?? [])
    .map(
      (row, i) => `
      <div class="custom-row" data-custom-row="${i}">
        <input type="text" placeholder="Nombre del servicio" value="${esc(row.nombre)}" data-custom-nombre />
        <input type="text" placeholder="Keywords (separadas por coma)" value="${esc(row.keywords)}" data-custom-kw />
        <button type="button" class="btn btn-sm btn-danger" data-remove-custom>✕</button>
      </div>
    `,
    )
    .join('');

  $('#formPanel').innerHTML = `
    <h3 class="section-title">Empresa y ubicación</h3>
    <div class="field-grid">
      <div class="field">
        <label for="marca">Marca corta</label>
        <input id="marca" type="text" value="${esc(p.marca)}" placeholder="Finstruvial" />
      </div>
      <div class="field">
        <label for="dominio">Dominio del portal</label>
        <input id="dominio" type="text" value="${esc(p.dominio)}" placeholder="finstruvial.edu.co" />
      </div>
      <div class="field" style="grid-column: 1 / -1">
        <label for="nombreCea">Nombre completo CEA / institución</label>
        <input id="nombreCea" type="text" value="${esc(p.nombreCea)}" placeholder="Centro de Enseñanza Automovilística Finstruvial" />
      </div>
      <div class="field">
        <label for="ciudad">Ciudad</label>
        <input id="ciudad" type="text" value="${esc(p.ciudad)}" />
      </div>
      <div class="field">
        <label for="region">Departamento / región</label>
        <input id="region" type="text" value="${esc(p.region)}" />
      </div>
      <div class="field">
        <label for="pais">País</label>
        <input id="pais" type="text" value="${esc(p.pais)}" />
      </div>
    </div>

    <h3 class="section-title">Servicios que más presta</h3>
    <p style="margin:0 0 0.75rem;font-size:0.84rem;color:#94a3b8;line-height:1.5">
      Marque los servicios principales. El generador creará títulos y descripciones por página del portal.
    </p>
    <div class="services-grid" id="servicesGrid">${chips}</div>

    <h3 class="section-title">Portafolio /servicios (FINSTRUVIAL)</h3>
    <p style="margin:0 0 0.75rem;font-size:0.84rem;color:#94a3b8;line-height:1.5">
      Páginas nuevas del portal: hub <code>/servicios</code> y cada línea de servicio. Active el bloque y elija las rutas a incluir en el pack SEO.
    </p>
    <label class="portafolio-master">
      <input type="checkbox" id="incluirPortafolio" ${incluirPortafolio ? 'checked' : ''} />
      <span><strong>Generar SEO del portafolio de servicios</strong> (recomendado para Finstruvial)</span>
    </label>
    <div class="services-grid services-grid--portafolio ${incluirPortafolio ? '' : 'services-grid--disabled'}" id="portafolioGrid">${portafolioChips}</div>

    <div class="custom-services">
      <h3 class="section-title">Servicios adicionales</h3>
      <div id="customRows">${customRows}</div>
      <button type="button" class="btn btn-sm btn-ghost" id="btnAddCustom">+ Añadir servicio personalizado</button>
    </div>

    <div class="field" style="margin-top:1rem">
      <label for="notas">Notas internas (no van al SEO)</label>
      <textarea id="notas" rows="2" placeholder="Ej. priorizar búsquedas de manejo defensivo empresas…">${esc(p.notas)}</textarea>
    </div>

    <div style="display:flex;gap:0.5rem;margin-top:0.5rem">
      <button type="button" class="btn btn-primary" id="btnSave">Guardar perfil</button>
      <button type="button" class="btn btn-ghost" id="btnGenerateInline">Generar SEO</button>
    </div>
  `;

  $('#servicesGrid').addEventListener('change', (e) => {
    const chip = e.target.closest('.service-chip');
    if (chip) chip.classList.toggle('service-chip--on', e.target.checked);
  });

  $('#incluirPortafolio')?.addEventListener('change', (e) => {
    const on = e.target.checked;
    $('#portafolioGrid')?.classList.toggle('services-grid--disabled', !on);
    $('#portafolioGrid')?.querySelectorAll('[data-pagina-portafolio]').forEach((input) => {
      input.disabled = !on;
      if (!on) input.checked = false;
      else if (!state.profile.paginasPortafolio?.length) input.checked = true;
    });
    $('#portafolioGrid')?.querySelectorAll('.service-chip').forEach((chip) => {
      chip.classList.toggle('service-chip--on', on && chip.querySelector('input')?.checked);
    });
  });

  $('#portafolioGrid')?.addEventListener('change', (e) => {
    const chip = e.target.closest('.service-chip');
    if (chip) chip.classList.toggle('service-chip--on', e.target.checked);
  });

  $('#btnAddCustom').addEventListener('click', () => {
    collectProfileFromForm();
    state.profile.serviciosCustom = [...(state.profile.serviciosCustom ?? []), { nombre: '', keywords: '' }];
    renderForm();
  });

  $('#customRows').addEventListener('click', (e) => {
    if (!e.target.matches('[data-remove-custom]')) return;
    collectProfileFromForm();
    const row = e.target.closest('[data-custom-row]');
    const idx = Number(row?.dataset.customRow);
    state.profile.serviciosCustom.splice(idx, 1);
    renderForm();
  });

  $('#btnSave').addEventListener('click', onSave);
  $('#btnGenerateInline').addEventListener('click', onGenerate);
}

function collectProfileFromForm() {
  const serviciosSeleccionados = [...document.querySelectorAll('[data-servicio]:checked')].map((el) => el.dataset.servicio);
  const serviciosCustom = [...document.querySelectorAll('[data-custom-row]')].map((row) => ({
    nombre: row.querySelector('[data-custom-nombre]')?.value ?? '',
    keywords: row.querySelector('[data-custom-kw]')?.value ?? '',
  }));

  const incluirPortafolioFinstruvial = $('#incluirPortafolio')?.checked !== false;
  let paginasPortafolio = [];
  if (incluirPortafolioFinstruvial) {
    const allKeys = finstruvialPaginasCatalog().map((page) => page.key);
    const checked = [...document.querySelectorAll('[data-pagina-portafolio]:checked')].map(
      (el) => el.dataset.paginaPortafolio,
    );
    if (checked.length > 0 && checked.length < allKeys.length) {
      paginasPortafolio = checked;
    }
  }

  state.profile = {
    ...state.profile,
    marca: $('#marca')?.value ?? '',
    nombreCea: $('#nombreCea')?.value ?? '',
    ciudad: $('#ciudad')?.value ?? '',
    region: $('#region')?.value ?? '',
    pais: $('#pais')?.value ?? '',
    dominio: $('#dominio')?.value ?? '',
    notas: $('#notas')?.value ?? '',
    serviciosSeleccionados,
    serviciosCustom,
    incluirPortafolioFinstruvial,
    paginasPortafolio,
  };
}

async function onSave() {
  try {
    collectProfileFromForm();
    const data = await api('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ profile: state.profile }),
    });
    state.profile = data.profile;
    toast('Perfil guardado');
  } catch (err) {
    toast(err.message);
  }
}

async function onGenerate() {
  try {
    collectProfileFromForm();
    const data = await api('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ profile: state.profile }),
    });
    state.profile = data.profile;
    state.pack = data;
    renderResults();
    const fin = (data.paginas ?? []).filter((page) => page.grupo === 'FINSTRUVIAL').length;
    toast(`SEO generado — ${data.paginas?.length ?? 0} páginas (${fin} del portafolio /servicios)`);
  } catch (err) {
    toast(err.message);
  }
}

function renderResults() {
  const empty = $('#resultsEmpty');
  const body = $('#resultsBody');
  if (!state.pack) {
    empty.classList.remove('hidden');
    body.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  body.classList.remove('hidden');

  const pack = state.pack;
  const pagesHtml = (pack.paginas ?? [])
    .map((page) => {
      const seo = page.seo ?? {};
      return `
        <article class="page-card">
          <div class="page-card__head">
            <h4>${esc(page.label)}</h4>
            <span class="page-card__path">${esc(page.ruta)}</span>
            ${page.grupo === 'FINSTRUVIAL' ? '<span class="page-card__tag">Portafolio</span>' : ''}
          </div>
          <div class="seo-block">
            <label>Título</label>
            <p>${esc(seo.titulo)}</p>
          </div>
          <div class="seo-block">
            <label>Descripción</label>
            <p>${esc(seo.descripcion)}</p>
          </div>
          <div class="seo-block">
            <label>Keywords</label>
            <p>${esc(seo.keywords)}</p>
          </div>
        </article>
      `;
    })
    .join('');

  const blogIdeas = (pack.ideasBlog ?? [])
    .map((b) => `<li><strong>${esc(b.titulo)}</strong> — ${esc(b.keywords)}</li>`)
    .join('');

  const exportJson = JSON.stringify(pack.exportErp, null, 2);

  body.innerHTML = `
    <h3 class="section-title">Pack SEO generado</h3>
    <div class="results-meta">
      <span class="stat-pill">${esc(pack.cliente?.marca)}</span>
      <span class="stat-pill">${pack.paginas?.length ?? 0} páginas</span>
      <span class="stat-pill">${esc(pack.cliente?.ubicacion)}</span>
    </div>
    ${pagesHtml}
    <div class="export-box">
      <h4>Exportar al ERP (site.seo + landing)</h4>
      <p style="margin:0 0 0.65rem;font-size:0.82rem;color:#94a3b8;line-height:1.45">
        Copie este JSON y en el ERP use <strong>SEO (Google) → Importar pack JSON</strong>,
        o descargue el archivo para guardarlo.
      </p>
      <div class="export-actions">
        <button type="button" class="btn btn-sm" id="btnCopyExport">Copiar JSON ERP</button>
        <button type="button" class="btn btn-sm btn-ghost" id="btnDownloadExport">Descargar .json</button>
      </div>
      <pre class="export-pre" id="exportPre">${esc(exportJson)}</pre>
    </div>
    ${
      blogIdeas
        ? `<div class="blog-ideas"><h3 class="section-title">Ideas de blog</h3><ul>${blogIdeas}</ul></div>`
        : ''
    }
  `;

  $('#btnCopyExport').addEventListener('click', async () => {
    await navigator.clipboard.writeText(exportJson);
    toast('JSON copiado al portapapeles');
  });

  $('#btnDownloadExport').addEventListener('click', () => {
    const blob = new Blob([exportJson], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `seo-${state.activeClientId}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Archivo descargado');
  });
}

async function loadClients() {
  const data = await api('/api/clients');
  state.clients = data.clients;
  state.activeClientId = data.activeClientId;
}

async function loadCatalog() {
  state.catalog = await api('/api/catalog');
}

async function loadProfile() {
  const data = await api('/api/profile');
  state.profile = data.profile;
}

async function init() {
  try {
    await loadCatalog();
    await loadClients();
    await loadProfile();
    renderClientBar();
    renderForm();
    renderResults();
    $('#btnGenerate').addEventListener('click', onGenerate);
  } catch (err) {
    toast(err.message);
  }
}

init();
