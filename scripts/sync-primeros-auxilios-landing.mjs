import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const json = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts/primeros-auxilios-seo-landing.json'), 'utf8'),
);

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function imgConst(img) {
  return `  IMG(
    '${esc(img.id)}',
    '${esc(img.etiqueta)}',
    '${esc(img.alt)}',
    '${esc(img.promptImagen)}',
  )`;
}

const imagenesTs = json.imagenes.map(imgConst).join(',\n');
const { imagenes: _imagenes, ...rest } = json;
const restStr = JSON.stringify(rest, null, 2);

const block = `export const PRIMEROS_AUXILIOS_IMAGENES: PaImagen[] = [
${imagenesTs},
];

export const PRIMEROS_AUXILIOS_LANDING: PortalPrimerosAuxiliosLanding = ${restStr.replace(
  /\n\}$/,
  '',
)},
  imagenes: PRIMEROS_AUXILIOS_IMAGENES.map((img) => ({ ...img })),
};`;

const targets = [
  path.join(root, 'argo-frontend/src/app/core/constants/primeros-auxilios-landing-defaults.ts'),
  path.join(root, 'argo-aula-virtual/src/app/pages/primeros-auxilios/primeros-auxilios-content.ts'),
];

for (const file of targets) {
  let src = fs.readFileSync(file, 'utf8');
  const start = src.indexOf('export const PRIMEROS_AUXILIOS_IMAGENES');
  const end = src.indexOf('function str(v: unknown, fb: string)');
  if (start < 0 || end < 0) throw new Error(`markers not found in ${file}`);
  src = `${src.slice(0, start)}${block}\n\n${src.slice(end)}`;
  fs.writeFileSync(file, src);
  console.log('Updated', path.basename(file));
}
