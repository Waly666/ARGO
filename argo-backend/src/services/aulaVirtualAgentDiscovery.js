const { obtenerConfigAula } = require('./aulaVirtualPortal');
const { siteBaseUrl } = require('./aulaVirtualSitemap');

function hostFromBase(base) {
  try {
    return new URL(base).hostname.replace(/^www\./, '');
  } catch {
    return 'localhost';
  }
}

function portalPages(base) {
  return [
    { key: 'home', path: '/', label: 'Inicio', queries: ['inicio portal', 'capacitación en línea'] },
    {
      key: 'cursos',
      path: '/cursos',
      label: 'Cursos virtuales',
      queries: ['catálogo de cursos', 'cursos en línea', 'matricular curso virtual'],
    },
    {
      key: 'certificados',
      path: '/consulta-certificados',
      label: 'Consulta de certificados',
      queries: ['consultar certificado', 'validar certificado de curso'],
    },
    {
      key: 'conduccion',
      path: '/cursos-conduccion',
      label: 'Cursos de conducción',
      queries: ['licencia de conducción', 'curso de conducción', 'CEA conducción'],
    },
  ];
}

async function portalDisplayName() {
  const aula = await obtenerConfigAula();
  const name = String(aula?.nombreEmpresa || '').trim();
  return name || 'Portal ARGO Aula Virtual';
}

/** Markdown llms.txt (Lighthouse: # título, enlace markdown, ≥50 caracteres). */
async function generarLlmsTxt(req) {
  const base = siteBaseUrl(req);
  if (!base) {
    return '# Portal\n\n[Inicio](/)\n';
  }
  const title = await portalDisplayName();
  const pages = portalPages(base);
  const links = pages.map((p) => `- [${p.label}](${base}${p.path})`).join('\n');
  return [
    `# ${title}`,
    '',
    'Resumen del sitio público: cursos, programas de capacitación y trámites en línea.',
    '',
    links,
    '',
    `- [Mapa del sitio (XML)](${base}/sitemap.xml)`,
    `- [Manifest ARD](${base}/.well-known/ard.json)`,
    '',
  ].join('\n');
}

/** Manifiesto ARD v0.91 — descubrimiento de recursos web del portal (sin MCP). */
async function generarArdManifest(req) {
  const base = siteBaseUrl(req);
  const host = hostFromBase(base || 'https://example.com');
  const title = await portalDisplayName();
  const pages = portalPages(base || 'https://example.com');

  const entries = pages.map((p) => ({
    identifier: `urn:air:${host}:web:${p.key}`,
    displayName: `${title} — ${p.label}`,
    type: 'text/html',
    url: `${base}${p.path}`,
    representativeQueries: p.queries,
  }));

  return {
    specVersion: '0.91',
    displayName: title,
    entries,
  };
}

async function generarArdJson(req) {
  return JSON.stringify(await generarArdManifest(req), null, 2);
}

module.exports = {
  generarLlmsTxt,
  generarArdManifest,
  generarArdJson,
};
