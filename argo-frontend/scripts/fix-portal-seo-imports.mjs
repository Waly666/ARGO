import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'src/app/features/aula-virtual');

for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
  const p = path.join(dir, f);
  const htmlPath = p.replace('.ts', '.html');
  if (!fs.existsSync(htmlPath)) continue;

  const html = fs.readFileSync(htmlPath, 'utf8');
  const needsLegend = html.includes('argo-portal-seo-legend');
  const needsField = html.includes('argo-portal-field-label');
  const needsHero = html.includes('argo-portal-landing-hero-basic-fields');
  if (!needsLegend && !needsField && !needsHero) continue;

  let t = fs.readFileSync(p, 'utf8');

  if (needsLegend && !t.includes("import { PortalSeoLegendComponent }")) {
    t = t.replace(/@Component\(\{/, "import { PortalSeoLegendComponent } from './portal-seo-legend.component';\n\n@Component({");
  }
  if (needsField && !t.includes("import { PortalFieldLabelComponent }")) {
    t = t.replace(/@Component\(\{/, "import { PortalFieldLabelComponent } from './portal-field-label.component';\n\n@Component({");
  }
  if (needsHero && !t.includes("import { PortalLandingHeroBasicFieldsComponent }")) {
    t = t.replace(
      /@Component\(\{/,
      "import { PortalLandingHeroBasicFieldsComponent } from './portal-landing-hero-basic-fields.component';\n\n@Component({",
    );
  }

  t = t.replace(/imports:\s*\[([\s\S]*?)\],/m, (_m, body) => {
    const items = body.split(',').map((s) => s.trim()).filter(Boolean);
    const set = new Set(items);
    if (needsLegend) set.add('PortalSeoLegendComponent');
    if (needsField) set.add('PortalFieldLabelComponent');
    if (needsHero) set.add('PortalLandingHeroBasicFieldsComponent');
    const ordered = [...set].sort((a, b) => {
      const pri = (x) => (x.startsWith('Portal') ? 0 : x === 'CommonModule' ? 1 : x === 'FormsModule' ? 2 : 3);
      return pri(a) - pri(b) || a.localeCompare(b);
    });
    return `imports: [\n    ${ordered.join(',\n    ')},\n  ],`;
  });

  fs.writeFileSync(p, t);
  console.log('fixed', f);
}
