import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

import { PortalConfig } from './models';
import { resolveUploadUrl } from './upload-url.util';

@Injectable({ providedIn: 'root' })
export class PortalThemeService {
  private doc = inject(DOCUMENT);

  apply(config: PortalConfig | null) {
    const tema = config?.site?.tema;
    const root = this.doc.documentElement;
    if (!tema) return;

    const vars: Record<string, string> = {
      '--av-primary': tema.colorPrimario,
      '--av-primary-dark': tema.colorPrimarioOscuro,
      '--av-accent': tema.colorAcento,
      '--av-bg': tema.colorFondo,
      '--av-surface': tema.colorSuperficie,
      '--av-text': tema.colorTexto,
      '--av-dim': tema.colorTextoSecundario,
    };

    for (const [key, val] of Object.entries(vars)) {
      if (val) root.style.setProperty(key, val);
    }

    const fuente = tema.fuente?.trim();
    if (fuente) {
      root.style.setProperty('--av-font-sans', `'${fuente}', 'Segoe UI', system-ui, sans-serif`);
      root.style.setProperty('--av-font-display', `'${fuente}', 'Segoe UI', system-ui, sans-serif`);
    }
  }

  heroImageUrl(config: PortalConfig | null): string | null {
    const t = config?.site?.tema;
    const abs = t?.urlHeroAbsoluta?.trim();
    if (abs) return abs;
    const resolved = resolveUploadUrl(t?.urlHero);
    if (resolved) return resolved;
    const rel = t?.urlHero?.trim();
    if (rel && (rel.startsWith('http') || rel.startsWith('/'))) return rel;
    return null;
  }
}
