import fs from 'fs';

const srcPath =
  'src/app/pages/primeros-auxilios/primeros-auxilios.component.scss';
const outPath =
  'src/app/pages/manejo-defensivo/_md-card-styles.fragment.scss';

const lines = fs.readFileSync(srcPath, 'utf8').split(/\r?\n/);
let t = lines.slice(165, 739).join('\n');
t = t
  .replace(/\.Pa-/g, '.md-')
  .replace(/Pa-/g, 'md-')
  .replace(/--Pa-/g, '--md-')
  .replace(/paSurfaces\.pa-/g, 'mdSurfaces.md-');
t = t.replace(
  "@include mdSurfaces.md-surface-tones('.Pa-page')",
  "@include mdSurfaces.md-surface-tones('.md-page')",
);
const extra = `

.md-cta-box {
  @include mdSurfaces.md-interactive-card;
  margin-top: 1.15rem;
  padding: 1.25rem 1.3rem;

  h3 {
    margin: 0 0 0.45rem;
    color: var(--surface-accent, var(--md-accent));
  }

  p {
    margin: 0 0 0.85rem;
    color: var(--av-ink-muted, #475569);
  }
}

.md-check--grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
  @include mdSurfaces.md-compact-card-grid;
  margin-top: 1rem;

  li {
    @include mdSurfaces.md-interactive-card;
    @include mdSurfaces.md-compact-card-cell;
    margin: 0;
    padding: 0.85rem 1rem 0.85rem 2.35rem;
    font-weight: 600;
    line-height: 1.45;
    color: var(--av-primary-dark, #0f172a);
    @include mdSurfaces.md-compact-card-text;
    -webkit-line-clamp: 3;

    &::before {
      left: 0.85rem;
      top: 0.95rem;
      width: 1.15rem;
      height: 1.15rem;
      display: inline-grid;
      place-content: center;
      border-radius: 999px;
      font-size: 0.62rem;
      color: #fff;
      background: var(--surface-accent, var(--md-teal, #0d9488));
    }
  }
}
`;

const finalPath =
  'src/app/pages/manejo-defensivo/manejo-defensivo-card-styles.scss';
fs.writeFileSync(
  finalPath,
  "@use './manejo-defensivo-surfaces' as mdSurfaces;\n\n" + t + extra,
);
fs.writeFileSync(outPath, t);
