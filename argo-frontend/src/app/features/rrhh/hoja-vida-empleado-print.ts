import type {
  DocEmpleadoDto,
  Empleado,
  EmpleadoAnotacionDto,
  EmpleadoEvaluacionDto,
} from '../../core/services/empleado.service';
import type { ConfigRecibo } from '../../core/services/config.service';

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function val(v: unknown): string {
  if (v == null || v === '') return '—';
  return esc(v);
}

function fmtFecha(v: unknown): string {
  if (v == null || v === '') return '—';
  const s = String(v).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return esc(s);
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function fmtMoney(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `$ ${Math.round(n).toLocaleString('es-CO')}`;
}

function nombreCompleto(e: Empleado): string {
  if (e.nombreCompleto?.trim()) return e.nombreCompleto.trim();
  return [e.primerNombre, e.segundoNombre, e.primerApellido, e.segundoApellido]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
    .join(' ');
}

function toneClass(p?: number | null): string {
  const n = Number(p);
  if (!Number.isFinite(n)) return 'mute';
  if (n >= 9) return 'excelente';
  if (n >= 7) return 'bueno';
  if (n >= 5) return 'medio';
  return 'bajo';
}

function barPct(p?: number | null): number {
  const n = Number(p);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100, Math.round((n / 10) * 100));
}

function promedioEvaluaciones(evals: EmpleadoEvaluacionDto[]): number | null {
  const vals = (evals || [])
    .map((e) => Number(e.puntaje))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!vals.length) return null;
  return Math.round((vals.reduce((s, n) => s + n, 0) / vals.length) * 10) / 10;
}

function dl(items: { label: string; value: string }[]): string {
  const cells = items
    .map(
      (it) => `
      <div class="kv">
        <dt>${esc(it.label)}</dt>
        <dd>${it.value}</dd>
      </div>`,
    )
    .join('');
  return `<dl class="kv-grid">${cells}</dl>`;
}

function encabezadoEmpresa(empresa: ConfigRecibo | null | undefined): string {
  const institucion = esc(empresa?.nombreEmpresa || 'ARGO');
  const lineas = [
    empresa?.nit ? `NIT ${esc(empresa.nit)}` : '',
    [empresa?.direccion, empresa?.ciudad, empresa?.departamento].filter(Boolean).map((x) => esc(String(x))).join(' · '),
    [empresa?.telefono ? `Tel. ${esc(empresa.telefono)}` : '', empresa?.email ? esc(empresa.email) : '']
      .filter(Boolean)
      .join(' · '),
  ]
    .filter(Boolean)
    .map((l) => `<p>${l}</p>`)
    .join('');

  const logoSrc = empresa?.urlLogoDataUrl || empresa?.urlLogo || '';
  const logoHtml = logoSrc
    ? `<img class="logo" src="${esc(logoSrc)}" alt="${institucion}" />`
    : `<div class="logo-ph">${institucion.slice(0, 2).toUpperCase()}</div>`;

  return `
    <header class="top">
      <div class="brand">
        ${logoHtml}
        <div class="brand-text">
          <h1>${institucion}</h1>
          ${lineas}
        </div>
      </div>
      <div class="doc-meta">
        <span class="doc-type">Recursos humanos</span>
        <strong>Hoja de vida</strong>
        <span class="doc-date">Generado ${esc(new Date().toLocaleString('es-CO'))}</span>
      </div>
    </header>`;
}

function labelCategoriaAnot(c?: string): string {
  const map: Record<string, string> = {
    reconocimiento: 'Reconocimiento',
    logro: 'Logro / resultado',
    felicitacion: 'Felicitación',
    llamado_atencion: 'Llamado de atención',
    falta: 'Falta / incumplimiento',
    queja: 'Queja / reclamo',
    otro: 'Otro',
  };
  return map[String(c || 'otro')] || String(c || 'Otro');
}

function seccion(titulo: string, body: string): string {
  return `
    <section class="sec">
      <h2><span>${esc(titulo)}</span></h2>
      ${body}
    </section>`;
}

export function buildHojaVidaEmpleadoHtml(opts: {
  empleado: Empleado;
  documentos?: DocEmpleadoDto[];
  evaluaciones?: EmpleadoEvaluacionDto[];
  anotaciones?: EmpleadoAnotacionDto[];
  empresa?: ConfigRecibo | null;
  fotoUrl?: string | null;
}): string {
  const e = opts.empleado;
  const docs = opts.documentos || [];
  const evals = [...(opts.evaluaciones || [])].sort((a, b) =>
    String(b.fecha || '').localeCompare(String(a.fecha || '')),
  );
  const anots = [...(opts.anotaciones || [])].sort((a, b) =>
    String(b.fecha || '').localeCompare(String(a.fecha || '')),
  );
  const anotPos = anots.filter((a) => a.tipo === 'positivo').length;
  const anotNeg = anots.filter((a) => a.tipo === 'negativo').length;
  const nombre = nombreCompleto(e);
  const prom = promedioEvaluaciones(evals);
  const foto = opts.fotoUrl
    ? `<img class="photo" src="${esc(opts.fotoUrl)}" alt="${esc(nombre)}" />`
    : `<div class="photo photo-ph">${esc(
        [e.primerNombre, e.primerApellido]
          .map((x) => String(x || '').charAt(0))
          .join('')
          .toUpperCase() || '?',
      )}</div>`;

  const hero = `
    <div class="hero">
      ${foto}
      <div class="hero-main">
        <p class="hero-kicker">Ficha de personal · ID ${val(e.idEmpleado)}</p>
        <h2 class="hero-name">${esc(nombre)}</h2>
        <p class="hero-role">${val(e.cargoNombre || 'Sin cargo asignado')}</p>
        <div class="chips">
          <span class="chip estado-${esc(String(e.estado || 'activo').toLowerCase())}">${val(e.estado || 'activo')}</span>
          <span class="chip">${val(e.tipoDocumento)} ${val(e.numeroDocumento)}</span>
          ${e.sedeNombre ? `<span class="chip">${esc(e.sedeNombre)}</span>` : ''}
          ${e.departamentoNombre ? `<span class="chip">${esc(e.departamentoNombre)}</span>` : ''}
          ${anots.length ? `<span class="chip">Anotaciones +${anotPos} / −${anotNeg}</span>` : ''}
        </div>
      </div>
      <div class="hero-stats">
        <div class="stat">
          <span>Ingreso</span>
          <strong>${fmtFecha(e.fechaIngreso)}</strong>
        </div>
        <div class="stat">
          <span>Evaluaciones</span>
          <strong>${evals.length}</strong>
        </div>
        <div class="stat">
          <span>Promedio</span>
          <strong class="${toneClass(prom)}">${prom != null ? esc(prom) : '—'}</strong>
        </div>
      </div>
    </div>`;

  const personal = seccion(
    '1. Datos personales',
    dl([
      { label: 'Documento', value: `${val(e.tipoDocumento)} ${val(e.numeroDocumento)}` },
      { label: 'Fecha nacimiento', value: fmtFecha(e.fechaNacimiento) },
      { label: 'Sexo', value: val(e.sexo) },
      { label: 'Estado civil', value: val(e.estadoCivil) },
      { label: 'Celular', value: val(e.celular) },
      { label: 'Teléfono', value: val(e.telefono) },
      { label: 'Correo personal', value: val(e.correoPersonal) },
      { label: 'Correo corporativo', value: val(e.correoCorporativo) },
      { label: 'Dirección', value: val(e.direccion) },
      { label: 'Ciudad / Depto.', value: [e.ciudad, e.departamento].filter(Boolean).map((x) => esc(String(x))).join(', ') || '—' },
    ]),
  );

  const laboral = seccion(
    '2. Información laboral',
    dl([
      { label: 'Cargo', value: val(e.cargoNombre) },
      { label: 'Departamento', value: val(e.departamentoNombre) },
      { label: 'Sede', value: val(e.sedeNombre) },
      { label: 'Tipo contrato', value: val(e.tipoContrato) },
      { label: 'Fecha ingreso', value: fmtFecha(e.fechaIngreso) },
      { label: 'Fecha retiro', value: fmtFecha(e.fechaRetiro) },
      { label: 'Salario', value: fmtMoney(e.salario) },
      { label: 'Estado', value: val(e.estado) },
      { label: 'Usuario sistema', value: val(e.usuarioLogin) },
      { label: 'Rol', value: val(e.usuarioRol) },
    ]),
  );

  const formacion = seccion(
    '3. Formación académica',
    dl([
      { label: 'Nivel educativo', value: val(e.nivelEducativo) },
      { label: 'Título profesional', value: val(e.tituloProfesional) },
      { label: 'Especialización', value: val(e.especializacion) },
      { label: 'Maestría', value: val(e.maestria) },
      { label: 'Doctorado', value: val(e.doctorado) },
    ]),
  );

  const seguridad = seccion(
    '4. Seguridad social',
    dl([
      { label: 'EPS', value: val(e.epsNombre) },
      { label: 'AFP', value: val(e.afpNombre) },
      { label: 'ARL', value: val(e.arlNombre) },
      { label: 'Caja compensación', value: val(e.cajaNombre) },
    ]),
  );

  const docsBody = docs.length
    ? `<table class="tbl">
        <thead>
          <tr>
            <th>Documento</th>
            <th>Número</th>
            <th>Expedición</th>
            <th>Vencimiento</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${docs
            .map((d) => {
              const st = d.vencido ? 'Vencido' : d.vencePronto ? 'Por vencer' : d.urlArchivo ? 'Cargado' : 'Sin archivo';
              return `<tr>
                <td>${val(d.documento)}</td>
                <td class="mono">${val(d.numero)}</td>
                <td>${fmtFecha(d.fechaExp)}</td>
                <td>${fmtFecha(d.fechaVence)}</td>
                <td><span class="pill ${d.vencido ? 'bad' : d.vencePronto ? 'warn' : 'ok'}">${esc(st)}</span></td>
              </tr>`;
            })
            .join('')}
        </tbody>
      </table>`
    : `<p class="empty">Sin documentos registrados.</p>`;

  const documentos = seccion('5. Documentos', docsBody);

  const evalBody = evals.length
    ? `<div class="eval-list">
        ${evals
          .map((ev) => {
            const comps = (ev.competencias || [])
              .filter((c) => c.puntaje != null && Number(c.puntaje) > 0)
              .map(
                (c) => `
                <div class="comp">
                  <div class="comp-top">
                    <span>${esc(c.nombre || c.codigo || 'Competencia')}</span>
                    <strong class="${toneClass(c.puntaje)}">${esc(c.puntaje)}</strong>
                  </div>
                  <div class="bar"><i style="width:${barPct(c.puntaje)}%"></i></div>
                </div>`,
              )
              .join('');
            return `
              <article class="eval-card">
                <header>
                  <div>
                    <strong>${fmtFecha(ev.fecha)}</strong>
                    <span class="muted">${val(ev.periodo || ev.tipo || 'Desempeño')}</span>
                  </div>
                  <div class="score ${toneClass(ev.puntaje)}">${val(ev.puntaje)}<small>/10</small></div>
                </header>
                ${ev.evaluadoPorNombre ? `<p class="muted">Evaluado por: ${esc(ev.evaluadoPorNombre)}</p>` : ''}
                ${ev.observaciones ? `<p class="obs">${esc(ev.observaciones)}</p>` : ''}
                ${comps ? `<div class="comps">${comps}</div>` : ''}
              </article>`;
          })
          .join('')}
      </div>`
    : `<p class="empty">Sin evaluaciones de desempeño registradas.</p>`;

  const evaluaciones = seccion('6. Historial de evaluaciones', evalBody);

  const anotBody = anots.length
    ? `<div class="anot-list">
        ${anots
          .map((a) => {
            const neg = a.tipo === 'negativo';
            return `
              <article class="anot-card ${neg ? 'neg' : 'pos'}">
                <header>
                  <div>
                    <strong>${fmtFecha(a.fecha)}</strong>
                    <span class="muted">${esc(labelCategoriaAnot(a.categoria))}</span>
                  </div>
                  <span class="anot-badge ${neg ? 'neg' : 'pos'}">${neg ? 'Negativa' : 'Positiva'}</span>
                </header>
                ${a.titulo ? `<h4>${esc(a.titulo)}</h4>` : ''}
                <p class="obs">${esc(a.descripcion)}</p>
                ${
                  a.registradoPorNombre || a.registradoPor
                    ? `<p class="muted">Registró: ${esc(a.registradoPorNombre || a.registradoPor)}</p>`
                    : ''
                }
              </article>`;
          })
          .join('')}
      </div>`
    : `<p class="empty">Sin anotaciones / eventualidades registradas.</p>`;

  const anotaciones = seccion('7. Anotaciones y eventualidades', anotBody);

  const firmas = `
    <div class="firmas">
      <div>
        <div class="linea"></div>
        <p>Firma del empleado</p>
        <p class="muted">${esc(nombre)}</p>
      </div>
      <div>
        <div class="linea"></div>
        <p>Firma RRHH / Jefatura</p>
        <p class="muted">${esc(opts.empresa?.nombreEmpresa || 'ARGO')}</p>
      </div>
    </div>
    <footer class="foot">
      Documento interno de recursos humanos · Generado desde ARGO
    </footer>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Hoja de vida — ${esc(nombre)}</title>
  <style>
    @page { size: letter portrait; margin: 12mm 11mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      font-family: 'Segoe UI', system-ui, Arial, sans-serif;
      color: #0f172a;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .toolbar {
      position: sticky; top: 0; z-index: 5;
      display: flex; gap: 10px; align-items: center;
      padding: 10px 14px; background: #0f2744; color: #fff;
    }
    .toolbar button {
      border: 0; border-radius: 6px; padding: 8px 14px;
      background: #38bdf8; color: #0f172a; font-weight: 700; cursor: pointer;
    }
    .toolbar span { font-size: 10pt; opacity: .9; }
    .doc { max-width: 210mm; margin: 0 auto; }
    .top {
      display: flex; justify-content: space-between; gap: 16px;
      align-items: flex-start; padding-bottom: 12px;
      border-bottom: 3px solid #0f2744; margin-bottom: 14px;
    }
    .brand { display: flex; gap: 12px; align-items: flex-start; min-width: 0; }
    .logo { max-height: 64px; max-width: 160px; object-fit: contain; }
    .logo-ph {
      width: 56px; height: 56px; border-radius: 10px;
      background: linear-gradient(145deg, #0f2744, #1e4976);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 14px; letter-spacing: .04em;
    }
    .brand-text h1 {
      margin: 0 0 4px; font-size: 15pt; color: #0f2744;
      font-family: Georgia, 'Times New Roman', serif; font-weight: 700;
    }
    .brand-text p { margin: 0; font-size: 8.5pt; color: #475569; line-height: 1.35; }
    .doc-meta { text-align: right; flex-shrink: 0; }
    .doc-type {
      display: block; font-size: 8pt; text-transform: uppercase;
      letter-spacing: .12em; color: #64748b; margin-bottom: 2px;
    }
    .doc-meta strong {
      display: block; font-size: 13pt; color: #0f2744; text-transform: uppercase;
      letter-spacing: .04em;
    }
    .doc-date { display: block; margin-top: 4px; font-size: 8pt; color: #64748b; }

    .hero {
      display: grid;
      grid-template-columns: 92px 1fr auto;
      gap: 14px; align-items: center;
      padding: 14px; margin-bottom: 16px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0f2744 0%, #1e4976 55%, #0e7490 100%);
      color: #f8fafc;
    }
    .photo {
      width: 92px; height: 110px; object-fit: cover;
      border-radius: 8px; border: 2px solid rgba(255,255,255,.35);
      background: #1e293b;
    }
    .photo-ph {
      display: flex; align-items: center; justify-content: center;
      font-size: 22pt; font-weight: 800; color: #94a3b8;
    }
    .hero-kicker {
      margin: 0 0 2px; font-size: 8pt; text-transform: uppercase;
      letter-spacing: .1em; opacity: .75;
    }
    .hero-name { margin: 0 0 2px; font-size: 16pt; font-weight: 800; line-height: 1.15; }
    .hero-role { margin: 0 0 8px; font-size: 10.5pt; opacity: .92; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      font-size: 8pt; padding: 3px 8px; border-radius: 999px;
      background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22);
    }
    .estado-activo { background: rgba(34,197,94,.25); border-color: rgba(134,239,172,.45); }
    .estado-retirado, .estado-suspendido { background: rgba(248,113,113,.25); border-color: rgba(252,165,165,.45); }
    .hero-stats { display: flex; flex-direction: column; gap: 8px; min-width: 110px; }
    .stat {
      background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.18);
      border-radius: 8px; padding: 7px 10px; text-align: right;
    }
    .stat span { display: block; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .06em; opacity: .75; }
    .stat strong { font-size: 12pt; }

    .sec { margin: 0 0 14px; break-inside: avoid; }
    .sec h2 {
      margin: 0 0 8px; font-size: 9.5pt; font-weight: 800;
      text-transform: uppercase; letter-spacing: .08em; color: #0f2744;
      border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;
    }
    .sec h2 span {
      display: inline-block; padding-bottom: 4px;
      border-bottom: 2px solid #0e7490; margin-bottom: -1px;
    }
    .kv-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 14px; margin: 0;
    }
    .kv {
      display: grid; grid-template-columns: 118px 1fr; gap: 6px;
      padding: 5px 0; border-bottom: 1px dotted #e2e8f0;
    }
    .kv dt { margin: 0; font-size: 8pt; color: #64748b; font-weight: 600; }
    .kv dd { margin: 0; font-size: 9pt; color: #0f172a; word-break: break-word; }

    .tbl { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
    .tbl th, .tbl td { border: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; vertical-align: top; }
    .tbl th { background: #e8eef6; color: #0f2744; font-size: 8pt; text-transform: uppercase; letter-spacing: .04em; }
    .mono { font-family: ui-monospace, Consolas, monospace; }
    .pill {
      display: inline-block; padding: 1px 7px; border-radius: 999px;
      font-size: 7.5pt; font-weight: 700;
    }
    .pill.ok { background: #dcfce7; color: #166534; }
    .pill.warn { background: #fef3c7; color: #92400e; }
    .pill.bad { background: #fee2e2; color: #991b1b; }
    .empty { margin: 0; color: #64748b; font-size: 9pt; font-style: italic; }

    .eval-list { display: flex; flex-direction: column; gap: 10px; }
    .eval-card {
      border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 12px;
      background: #f8fafc; break-inside: avoid;
    }
    .eval-card header {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;
      margin-bottom: 4px;
    }
    .eval-card header strong { display: block; font-size: 10pt; color: #0f2744; }
    .score {
      font-size: 16pt; font-weight: 800; line-height: 1;
      padding: 4px 8px; border-radius: 8px; background: #fff; border: 1px solid #e2e8f0;
    }
    .score small { font-size: 8pt; font-weight: 600; color: #64748b; }
    .excelente { color: #047857; }
    .bueno { color: #0369a1; }
    .medio { color: #b45309; }
    .bajo { color: #b91c1c; }
    .mute { color: #64748b; }
    .muted { color: #64748b; font-size: 8pt; margin: 2px 0 6px; }
    .obs { margin: 4px 0 8px; font-size: 8.5pt; color: #334155; }
    .comps { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; }
    .comp-top { display: flex; justify-content: space-between; gap: 8px; font-size: 8pt; margin-bottom: 2px; }
    .bar {
      height: 5px; border-radius: 999px; background: #e2e8f0; overflow: hidden;
    }
    .bar i {
      display: block; height: 100%; border-radius: inherit;
      background: linear-gradient(90deg, #0e7490, #38bdf8);
    }

    .anot-list { display: flex; flex-direction: column; gap: 8px; }
    .anot-card {
      border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 12px;
      background: #f8fafc; break-inside: avoid; border-left: 4px solid #0284c7;
    }
    .anot-card.neg { border-left-color: #ef4444; }
    .anot-card header {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;
      margin-bottom: 4px;
    }
    .anot-card h4 { margin: 0 0 4px; font-size: 10pt; color: #0f2744; }
    .anot-badge {
      font-size: 7.5pt; font-weight: 700; padding: 2px 7px; border-radius: 999px;
      text-transform: uppercase; letter-spacing: .04em;
    }
    .anot-badge.pos { background: #e0f2fe; color: #075985; }
    .anot-badge.neg { background: #fee2e2; color: #991b1b; }

    .firmas {
      display: grid; grid-template-columns: 1fr 1fr; gap: 40px;
      margin-top: 28px; padding-top: 8px;
    }
    .firmas .linea {
      height: 1px; background: #94a3b8; margin: 40px 0 8px;
    }
    .firmas p { margin: 0; font-size: 9pt; text-align: center; }
    .foot {
      margin-top: 18px; padding-top: 8px; border-top: 1px solid #e2e8f0;
      text-align: center; font-size: 7.5pt; color: #94a3b8;
    }

    @media print {
      .toolbar { display: none !important; }
      body { padding: 0 !important; background: #fff !important; }
      .doc { box-shadow: none; padding: 0; }
    }
    @media screen {
      body { padding: 56px 16px 28px; background: #e2e8f0 !important; }
      .doc {
        background: #fff; padding: 14mm 12mm;
        box-shadow: 0 8px 30px rgba(15, 39, 68, .18);
        border-radius: 4px;
      }
    }
    @media (max-width: 720px) {
      .hero { grid-template-columns: 1fr; }
      .kv-grid, .comps { grid-template-columns: 1fr; }
      .hero-stats { flex-direction: row; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button type="button" onclick="window.print()">Imprimir / Guardar PDF</button>
    <span>Hoja de vida · ${esc(nombre)}</span>
  </div>
  <div class="doc">
    ${encabezadoEmpresa(opts.empresa)}
    ${hero}
    ${personal}
    ${laboral}
    ${formacion}
    ${seguridad}
    ${documentos}
    ${evaluaciones}
    ${anotaciones}
    ${firmas}
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
</body>
</html>`;
}

export function abrirHojaVidaEmpleadoPdf(html: string): boolean {
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
