import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const fePath = path.join(root, 'argo-frontend/src/app/core/constants/mercancias-peligrosas-landing-defaults.ts');
const avPath = path.join(root, 'argo-aula-virtual/src/app/pages/mercancias-peligrosas/mercancias-peligrosas-content.ts');
const bePath = path.join(root, 'argo-backend/src/constants/aulaVirtualMercanciasPeligrosasDefaults.js');

const fe = fs.readFileSync(fePath, 'utf8');

// --- Portal content.ts ---
const startFe = fe.indexOf('export const MERCANCIAS_PELIGROSAS_GUION_VERSION');
const endFe = fe.indexOf('function mergeImagenes');
const migStart = fe.indexOf('function mercanciasPeligrosasNecesitaActualizarGuion');
const migBlock = fe.slice(migStart, endFe);
let constBlock = fe.slice(startFe, endFe).replaceAll('MERCANCIAS_PELIGROSAS_LANDING_DEFAULTS', 'MERCANCIAS_PELIGROSAS_LANDING');
// El portal no usa IMG() ni promptFotoHorizontal (solo existen en el ERP).
constBlock = constBlock.replace(
  /imagenes: \[[\s\S]*?\],\n  queSonTitulo:/,
  `imagenes: [
    { id: 'hero', etiqueta: 'Banner principal', url: '', alt: 'Curso de mercancías peligrosas en Villavicencio, Meta' },
    { id: 'que-son', etiqueta: 'Sección ¿Qué son?', url: '', alt: 'Capacitación en transporte de mercancías peligrosas en Colombia' },
    { id: 'normativa', etiqueta: 'Sección normativa', url: '', alt: 'Formación para conductores de mercancías peligrosas en SERVIAL' },
    { id: 'clasificacion', etiqueta: 'Sección clasificación', url: '', alt: 'Curso de mercancías peligrosas para empresas del Meta' },
    { id: 'seguridad', etiqueta: 'Sección seguridad', url: '', alt: 'Capacitación de mercancías peligrosas en los Llanos Orientales' },
  ],
  queSonTitulo:`,
);

let av = fs.readFileSync(avPath, 'utf8');
const avHeadEnd = av.indexOf('export const MERCANCIAS_PELIGROSAS_GUION_VERSION');
if (avHeadEnd < 0) {
  av = av.replace(
    'export interface PortalMercanciasPeligrosasLanding {',
    'export const MERCANCIAS_PELIGROSAS_GUION_VERSION = 1;\n\nexport interface PortalMercanciasPeligrosasLanding {\n  guionVersion?: number;',
  );
  av = av.replace(
    '  documentosGrupos: MpDocumentoGrupo[];\n}',
    `  documentosGrupos: MpDocumentoGrupo[];
  seguridadTitulo: string;
  faqTitulo: string;
  localTitulo: string;
  localTexto: string;
  localUbicacion: string;
  localTelefono: string;
  localAtencion: string;
  inscripcionesTitulo: string;
  inscripcionesTexto: string;
  inscripcionesCtaTexto: string;
  inscripcionesCtaUrl: string;
  inscripcionesWhatsappTexto: string;
  inscripcionesWhatsappUrl: string;
}`,
  );
}
const avConstStart = av.indexOf('export const MERCANCIAS_PELIGROSAS_GUION_VERSION');
const avMergeStart = av.indexOf('function mergeImagenes');
av = `${av.slice(0, avConstStart)}${constBlock}${migBlock}${av.slice(avMergeStart)}`;
if (!av.includes('seguridadTitulo: str(src.seguridadTitulo')) {
  av = av.replace(
    '    documentosGrupos: mergeDocumentosGrupos(src.documentosGrupos, d.documentosGrupos),\n  };',
    `    documentosGrupos: mergeDocumentosGrupos(src.documentosGrupos, d.documentosGrupos),
    seguridadTitulo: str(src.seguridadTitulo, d.seguridadTitulo),
    faqTitulo: str(src.faqTitulo, d.faqTitulo),
    localTitulo: str(src.localTitulo, d.localTitulo),
    localTexto: str(src.localTexto, d.localTexto),
    localUbicacion: str(src.localUbicacion, d.localUbicacion),
    localTelefono: str(src.localTelefono, d.localTelefono),
    localAtencion: str(src.localAtencion, d.localAtencion),
    inscripcionesTitulo: str(src.inscripcionesTitulo, d.inscripcionesTitulo),
    inscripcionesTexto: str(src.inscripcionesTexto, d.inscripcionesTexto),
    inscripcionesCtaTexto: str(src.inscripcionesCtaTexto, d.inscripcionesCtaTexto),
    inscripcionesCtaUrl: str(src.inscripcionesCtaUrl, d.inscripcionesCtaUrl),
    inscripcionesWhatsappTexto: str(src.inscripcionesWhatsappTexto, d.inscripcionesWhatsappTexto),
    inscripcionesWhatsappUrl: str(src.inscripcionesWhatsappUrl, d.inscripcionesWhatsappUrl),
  };`,
  );
}
if (!av.includes('if (mercanciasPeligrosasNecesitaActualizarGuion(src))')) {
  av = av.replace(
    'export function mergeMercanciasPeligrosasLanding(\n  raw?: Partial<PortalMercanciasPeligrosasLanding> | null,\n): PortalMercanciasPeligrosasLanding {\n  const d = MERCANCIAS_PELIGROSAS_LANDING;\n  const src = raw && typeof raw === \'object\' ? raw : {};\n  const str =',
    `export function mergeMercanciasPeligrosasLanding(
  raw?: Partial<PortalMercanciasPeligrosasLanding> | null,
): PortalMercanciasPeligrosasLanding {
  const d = MERCANCIAS_PELIGROSAS_LANDING;
  const src = raw && typeof raw === 'object' ? raw : {};
  if (mercanciasPeligrosasNecesitaActualizarGuion(src)) {
    return mergeMercanciasPeligrosasPreservandoUsuario(src, d);
  }
  const str =`,
  );
  av = av.replace('  return {\n    ...d,\n    kicker: str(src.kicker, d.kicker),', '  return {\n    ...d,\n    guionVersion: MERCANCIAS_PELIGROSAS_GUION_VERSION,\n    kicker: str(src.kicker, d.kicker),');
}
fs.writeFileSync(avPath, av);
console.log('Updated', path.basename(avPath));

// --- Backend JS: inject guion + migration from JSON ---
const json = JSON.parse(fs.readFileSync(path.join(root, 'scripts/mercancias-peligrosas-seo-landing.json'), 'utf8'));
let be = fs.readFileSync(bePath, 'utf8');
if (!be.includes('MERCANCIAS_PELIGROSAS_GUION_VERSION')) {
  be = be.replace(
    'const MERCANCIAS_PELIGROSAS_DEFAULTS = {',
    `const MERCANCIAS_PELIGROSAS_GUION_VERSION = ${json.guionVersion};

const MERCANCIAS_PELIGROSAS_DEFAULTS = {
  guionVersion: MERCANCIAS_PELIGROSAS_GUION_VERSION,`,
  );
}
// Replace hero + key SEO fields via JSON merge into defaults object tail - append new fields before closing };
const newFields = `
  seguridadTitulo: ${JSON.stringify(json.seguridadTitulo)},
  faqTitulo: ${JSON.stringify(json.faqTitulo)},
  localTitulo: ${JSON.stringify(json.localTitulo)},
  localTexto: ${JSON.stringify(json.localTexto)},
  localUbicacion: ${JSON.stringify(json.localUbicacion)},
  localTelefono: ${JSON.stringify(json.localTelefono)},
  localAtencion: ${JSON.stringify(json.localAtencion)},
  inscripcionesTitulo: ${JSON.stringify(json.inscripcionesTitulo)},
  inscripcionesTexto: ${JSON.stringify(json.inscripcionesTexto)},
  inscripcionesCtaTexto: ${JSON.stringify(json.inscripcionesCtaTexto)},
  inscripcionesCtaUrl: ${JSON.stringify(json.inscripcionesCtaUrl)},
  inscripcionesWhatsappTexto: ${JSON.stringify(json.inscripcionesWhatsappTexto)},
  inscripcionesWhatsappUrl: ${JSON.stringify(json.inscripcionesWhatsappUrl)},`;
if (!be.includes('seguridadTitulo:')) {
  be = be.replace('  documentosGrupos: JSON.parse(JSON.stringify(MERCANCIAS_PELIGROSAS_DOCUMENTOS_GRUPOS)),\n};', `  documentosGrupos: JSON.parse(JSON.stringify(MERCANCIAS_PELIGROSAS_DOCUMENTOS_GRUPOS)),${newFields}\n};`);
}
if (!be.includes('function mercanciasPeligrosasNecesitaActualizarGuion')) {
  const migJs = `
function mercanciasPeligrosasNecesitaActualizarGuion(src) {
  const v = Number(src.guionVersion) || 0;
  if (v < MERCANCIAS_PELIGROSAS_GUION_VERSION) return true;
  const titulo = String(src.titulo || '').trim();
  if (titulo === 'Mercancías peligrosas') return true;
  return String(src.queSonTitulo || '').trim() === '¿Qué son las mercancías peligrosas?';
}

function mergeMercanciasPeligrosasPreservandoUsuario(src, d) {
  const enlaceCursoUrl = String(src.enlaceCursoUrl ?? '').trim();
  return {
    ...JSON.parse(JSON.stringify(d)),
    guionVersion: MERCANCIAS_PELIGROSAS_GUION_VERSION,
    enlaceCursoUrl,
    imagenes: mergeImagenes(src.imagenes, d.imagenes),
  };
}
`;
  be = be.replace('function mergeMercanciasPeligrosasLanding(', `${migJs}\nfunction mergeMercanciasPeligrosasLanding(`);
  be = be.replace(
    'function mergeMercanciasPeligrosasLanding(\n  raw,\n) {\n  const d = MERCANCIAS_PELIGROSAS_DEFAULTS;\n  const src = raw && typeof raw === \'object\' ? raw : {};\n  const str = (v, fb) => String(v ?? fb).trim() || fb;',
    `function mergeMercanciasPeligrosasLanding(raw) {
  const d = MERCANCIAS_PELIGROSAS_DEFAULTS;
  const src = raw && typeof raw === 'object' ? raw : {};
  if (mercanciasPeligrosasNecesitaActualizarGuion(src)) {
    return mergeMercanciasPeligrosasPreservandoUsuario(src, d);
  }
  const str = (v, fb) => String(v ?? fb).trim() || fb;`,
  );
  be = be.replace('  return {\n    ...d,\n    kicker: str(src.kicker, d.kicker),', '  return {\n    ...d,\n    guionVersion: MERCANCIAS_PELIGROSAS_GUION_VERSION,\n    kicker: str(src.kicker, d.kicker),');
  be = be.replace(
    '    documentosGrupos: mergeDocumentosGrupos(src.documentosGrupos, d.documentosGrupos),\n  };\n}',
    `    documentosGrupos: mergeDocumentosGrupos(src.documentosGrupos, d.documentosGrupos),
    seguridadTitulo: str(src.seguridadTitulo, d.seguridadTitulo),
    faqTitulo: str(src.faqTitulo, d.faqTitulo),
    localTitulo: str(src.localTitulo, d.localTitulo),
    localTexto: str(src.localTexto, d.localTexto),
    localUbicacion: str(src.localUbicacion, d.localUbicacion),
    localTelefono: str(src.localTelefono, d.localTelefono),
    localAtencion: str(src.localAtencion, d.localAtencion),
    inscripcionesTitulo: str(src.inscripcionesTitulo, d.inscripcionesTitulo),
    inscripcionesTexto: str(src.inscripcionesTexto, d.inscripcionesTexto),
    inscripcionesCtaTexto: str(src.inscripcionesCtaTexto, d.inscripcionesCtaTexto),
    inscripcionesCtaUrl: str(src.inscripcionesCtaUrl, d.inscripcionesCtaUrl),
    inscripcionesWhatsappTexto: str(src.inscripcionesWhatsappTexto, d.inscripcionesWhatsappTexto),
    inscripcionesWhatsappUrl: str(src.inscripcionesWhatsappUrl, d.inscripcionesWhatsappUrl),
  };
}

module.exports = { MERCANCIAS_PELIGROSAS_DEFAULTS, mergeMercanciasPeligrosasLanding, mercanciasPeligrosasNecesitaActualizarGuion };`,
  );
  be = be.replace(
    '\nmodule.exports = { MERCANCIAS_PELIGROSAS_DEFAULTS, mergeMercanciasPeligrosasLanding };',
    '',
  );
}
// Patch key string fields in backend defaults from JSON
for (const key of [
  'kicker', 'titulo', 'tituloLinea2', 'subtitulo', 'heroLead', 'ctaNormativaTexto', 'ctaClasificacionTexto',
  'ctaFaqTexto', 'ctaInicioTexto', 'enlaceCursoEtiqueta', 'queSonTitulo', 'queSonDefinicion', 'normativaTitulo',
  'clasificacionTitulo', 'documentacionTitulo', 'documentacionLead', 'responsabilidadesTitulo', 'capacitacionTitulo',
  'capacitacionTexto', 'internacionalTitulo', 'internacionalTexto', 'modosTitulo', 'seguridadTitulo', 'faqTitulo',
  'localTitulo', 'localTexto', 'localUbicacion', 'localTelefono', 'localAtencion', 'inscripcionesTitulo',
  'inscripcionesTexto', 'inscripcionesCtaTexto', 'inscripcionesCtaUrl', 'inscripcionesWhatsappTexto', 'inscripcionesWhatsappUrl',
]) {
  if (typeof json[key] === 'string') {
    const re = new RegExp(`  ${key}: '[^']*',\\n|  ${key}:\\n    '[^']*',\\n`);
    const repl = `  ${key}: ${JSON.stringify(json[key])},\n`;
    if (re.test(be)) be = be.replace(re, repl);
  }
}
if (Array.isArray(json.heroParrafos)) {
  be = be.replace(/  heroParrafos: \[[\s\S]*?\],\n/, `  heroParrafos: ${JSON.stringify(json.heroParrafos, null, 2).replace(/\n/g, '\n  ')},\n`);
}
if (Array.isArray(json.faq)) {
  be = be.replace(/  faq: \[[\s\S]*?\],\n  glosario:/, `  faq: ${JSON.stringify(json.faq, null, 2).replace(/\n/g, '\n  ')},\n  glosario:`);
}
for (const [id, alt] of Object.entries(json.imagenesAlt || {})) {
  be = be.replace(new RegExp(`id: '${id}',[\\s\\S]*?alt: '[^']*'`), (m) => m.replace(/alt: '[^']*'/, `alt: ${JSON.stringify(alt)}`));
}
fs.writeFileSync(bePath, be);
console.log('Updated', path.basename(bePath));
