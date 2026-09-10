import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'src/app/features/aula-virtual');

const spanRules = [
  ['<span>Etiqueta pequeña</span>', '<argo-portal-field-label tag="p" label="Etiqueta pequeña" />'],
  ['<span>Etiqueta (kicker)</span>', '<argo-portal-field-label tag="p" label="Etiqueta (kicker)" />'],
  ['<span>Etiqueta superior (kicker)</span>', '<argo-portal-field-label tag="p" label="Etiqueta superior (kicker)" />'],
  ['<span>Título (línea 1)</span>', '<argo-portal-field-label tag="H1" label="Título — línea 1" />'],
  ['<span>Título (línea 2)</span>', '<argo-portal-field-label tag="H1" label="Título — línea 2" />'],
  ['<span>Título — línea 1</span>', '<argo-portal-field-label tag="H1" label="Título — línea 1" />'],
  ['<span>Título — línea 2</span>', '<argo-portal-field-label tag="H1" label="Título — línea 2" />'],
  ['<span>Subtítulo</span>', '<argo-portal-field-label tag="p" label="Subtítulo" />'],
  ['<span>Texto principal del inicio</span>', '<argo-portal-field-label tag="p" label="Texto principal del inicio" />'],
  ['<span>Texto introductorio</span>', '<argo-portal-field-label tag="p" label="Texto introductorio" />'],
  ['<span>Intro</span>', '<argo-portal-field-label tag="p" label="Intro" />'],
  ['<span>Título de la sección (H2)</span>', '<argo-portal-field-label tag="H2" label="Título de la sección" />'],
  ['<span>Título de la sección FAQ (H2)</span>', '<argo-portal-field-label tag="H2" label="Título de la sección FAQ" />'],
  ['<span>Título bloque Villavicencio (H2)</span>', '<argo-portal-field-label tag="H2" label="Título bloque Villavicencio" />'],
  ['<span>Título inscripciones (H2)</span>', '<argo-portal-field-label tag="H2" label="Título inscripciones" />'],
  ['<span>Título de la sección</span>', '<argo-portal-field-label tag="H2" label="Título de la sección" />'],
  ['<span>Pregunta</span>', '<argo-portal-field-label tag="H3" label="Pregunta" />'],
  ['<span>Respuesta</span>', '<argo-portal-field-label tag="p" label="Respuesta" />'],
  ['<span>Definición</span>', '<argo-portal-field-label tag="p" label="Definición" />'],
  ['<span>Descripción</span>', '<argo-portal-field-label tag="p" label="Descripción" />'],
  ['<span>Detalle</span>', '<argo-portal-field-label tag="p" label="Detalle" />'],
  ['<span>Texto bloque Villavicencio</span>', '<argo-portal-field-label tag="p" label="Texto bloque Villavicencio" />'],
  ['<span>Texto inscripciones</span>', '<argo-portal-field-label tag="p" label="Texto inscripciones" />'],
  ['<span>Frase final de la página</span>', '<argo-portal-field-label tag="p" label="Frase final de la página" />'],
  ['<span>Aviso legal / disclaimer</span>', '<argo-portal-field-label tag="p" label="Aviso legal / disclaimer" />'],
  ['<span>Meta descripción</span>', '<argo-portal-field-label tag="p" label="Meta descripción" />'],
  ['<span>Palabras clave</span>', '<argo-portal-field-label tag="p" label="Palabras clave" />'],
];

const heroBlock = `    <div class="psb-grid3">
      <label class="psb-field psb-field--plain">
        <span>Etiqueta pequeña</span>
        <input type="text" class="psb-input" [(ngModel)]="`;
const heroReplacement = `    <argo-portal-landing-hero-basic-fields [hero]="`;

const tsImportSnippets = {
  legend: "import { PortalSeoLegendComponent } from './portal-seo-legend.component';",
  fieldLabel: "import { PortalFieldLabelComponent } from './portal-field-label.component';",
  heroBasic: "import { PortalLandingHeroBasicFieldsComponent } from './portal-landing-hero-basic-fields.component';",
};

function patchTs(filePath) {
  let ts = fs.readFileSync(filePath, 'utf8');
  const needsLegend = fs.readFileSync(filePath.replace('.ts', '.html'), 'utf8').includes('argo-portal-seo-legend');
  const needsField = fs.readFileSync(filePath.replace('.ts', '.html'), 'utf8').includes('argo-portal-field-label');
  const needsHero = fs.readFileSync(filePath.replace('.ts', '.html'), 'utf8').includes('argo-portal-landing-hero-basic-fields');

  for (const [key, snippet] of Object.entries(tsImportSnippets)) {
    if (ts.includes(snippet)) continue;
    if (key === 'legend' && !needsLegend) continue;
    if (key === 'fieldLabel' && !needsField) continue;
    if (key === 'heroBasic' && !needsHero) continue;
    ts = ts.replace(/(import .+\n)(@Component)/, `$1${snippet}\n$2`);
  }

  const importsMatch = ts.match(/imports:\s*\[([\s\S]*?)\]/);
  if (importsMatch) {
    let block = importsMatch[1];
    const add = [];
    if (needsLegend && !block.includes('PortalSeoLegendComponent')) add.push('PortalSeoLegendComponent');
    if (needsField && !block.includes('PortalFieldLabelComponent')) add.push('PortalFieldLabelComponent');
    if (needsHero && !block.includes('PortalLandingHeroBasicFieldsComponent')) {
      add.push('PortalLandingHeroBasicFieldsComponent');
    }
    if (add.length) {
      const insertion = add.join(', ') + (block.trim().endsWith(',') || !block.trim() ? '' : ',');
      ts = ts.replace(importsMatch[0], `imports: [${insertion}${block.trim() ? (block.endsWith(',') ? '\n' : ',\n') + block.trim() : ''}\n  ]`);
    }
  }

  fs.writeFileSync(filePath, ts);
}

function patchHtml(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const base = path.basename(filePath);

  if (!html.includes('argo-portal-seo-legend') && html.includes('ple-toolbar')) {
    html = html.replace(
      /(<div class="ple-toolbar">[\s\S]*?<\/div>\s*\n)/,
      `$1\n  <argo-portal-seo-legend />\n\n`,
    );
  }

  for (const [from, to] of spanRules) {
    html = html.split(from).join(to);
  }

  // Generic section titles in psb-field (not already tagged)
  html = html.replace(
    /<span>Título<\/span>(\s*<input[^>]+class="psb-input"[^>]+ngModel\]="[^"]+\.titulo")/g,
    '<argo-portal-field-label tag="H2" label="Título" />$1',
  );
  html = html.replace(
    /<span>Título<\/span>(\s*<input[^>]+class="psb-input"[^>]+ngModel\]="[^"]+\.tituloLinea")/g,
    '<argo-portal-field-label tag="H1" label="Título — línea 1" />$1',
  );
  html = html.replace(
    /<span>Título<\/span>(\s*<input[^>]+class="psb-input"[^>]+ngModel\]="[^"]+\.tituloAcento")/g,
    '<argo-portal-field-label tag="H1" label="Título — línea 2" />$1',
  );
  html = html.replace(
    /<span>Título<\/span>(\s*<input[^>]+class="psb-input"[^>]+ngModel\]="[^"]+\.tituloLinea2")/g,
    '<argo-portal-field-label tag="H1" label="Título — línea 2" />$1',
  );
  html = html.replace(
    /<span>Título<\/span>(\s*<input[^>]+class="psb-input"[^>]+ngModel\]="[^"]+\[i\]\.titulo")/g,
    '<argo-portal-field-label tag="H3" label="Título" />$1',
  );
  html = html.replace(
    /<span>Título tarjeta<\/span>/g,
    '<argo-portal-field-label tag="H3" label="Título tarjeta" />',
  );

  const heroModels = [
    'mercanciasPeligrosas',
    'trabajoEnAlturas',
    'manejoDefensivo',
    'primerosAuxilios',
    'examenTeorico',
  ];
  for (const model of heroModels) {
    const re = new RegExp(
      `    <div class="psb-grid3">\\s*<label class="psb-field psb-field--plain">\\s*<span>Etiqueta pequeña</span>[\\s\\S]*?\\s*<textarea class="psb-input" rows="2" \\[\\(ngModel\\)\\]="${model}\\.heroLead"><\\/textarea>\\s*<\\/label>`,
      'm',
    );
    if (re.test(html)) {
      html = html.replace(re, `    <argo-portal-landing-hero-basic-fields [hero]="${model}" />`);
    }
  }

  if (html !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, html);
    console.log('patched', base);
  }
  patchTs(filePath.replace('.html', '.ts'));
}

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('-editor.component.html'))
  .map((f) => path.join(dir, f));

for (const file of files) patchHtml(file);

// site builder
const siteBuilderHtml = path.join(dir, 'portal-site-builder.component.html');
let sb = fs.readFileSync(siteBuilderHtml, 'utf8');
if (!sb.includes('argo-portal-seo-legend')) {
  sb = sb.replace(
    '    @if (panelInfo(); as info) {',
    '    @if (panel() !== \'panel\') {\n      <argo-portal-seo-legend />\n    }\n\n    @if (panelInfo(); as info) {',
  );
}
for (const [from, to] of spanRules) sb = sb.split(from).join(to);
sb = sb.replace(
  /<span class="psb-seo-tag">H1<\/span>/g,
  '<argo-portal-seo-tag tag="H1" />',
);
sb = sb.replace(
  /<span class="psb-seo-tag">p<\/span>/g,
  '<argo-portal-seo-tag tag="p" />',
);
sb = sb.replace(
  /<span>Frase principal del banner<\/span>/g,
  'Frase principal del banner',
);
fs.writeFileSync(siteBuilderHtml, sb);

const siteBuilderTs = path.join(dir, 'portal-site-builder.component.ts');
let sbt = fs.readFileSync(siteBuilderTs, 'utf8');
if (!sbt.includes('PortalSeoLegendComponent')) {
  sbt = sbt.replace(
    "import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';",
    "import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';\nimport { PortalSeoLegendComponent } from './portal-seo-legend.component';\nimport { PortalSeoTagComponent } from './portal-seo-tag.component';\nimport { PortalFieldLabelComponent } from './portal-field-label.component';",
  );
  sbt = sbt.replace(
    'PortalSitePreviewComponent,',
    'PortalSitePreviewComponent,\n    PortalSeoLegendComponent,\n    PortalSeoTagComponent,\n    PortalFieldLabelComponent,',
  );
  fs.writeFileSync(siteBuilderTs, sbt);
}

console.log('done');
