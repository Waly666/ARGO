import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

import { PortalConfig } from './models';
import { loadPortalGoogleFonts } from './portal-fonts.util';
import { buildPortalThemeCssVars, isFinstruvialPortalTema, resolvePortalHeroEstilo } from './portal-theme-css.util';
import { resolveUploadUrl } from './upload-url.util';

@Injectable({ providedIn: 'root' })
export class PortalThemeService {
  private doc = inject(DOCUMENT);

  /** Plantilla azul profundo (Finstruvial) — exclusivo para estilos/efectos de esa plantilla. */
  readonly finstruvialPortal = signal(this.readFinstruvialDataset());

  apply(config: PortalConfig | null) {
    const tema = config?.site?.tema;
    const root = this.doc.documentElement;
    if (!tema) {
      this.finstruvialPortal.set(false);
      delete root.dataset['finstruvialPortal'];
      return;
    }

    const vars = buildPortalThemeCssVars(tema);
    for (const [key, val] of Object.entries(vars)) {
      if (val) root.style.setProperty(key, val);
    }
    const isFinstruvial = isFinstruvialPortalTema(tema);
    this.finstruvialPortal.set(isFinstruvial);
    if (isFinstruvial) {
      root.dataset['finstruvialPortal'] = '1';
    } else {
      delete root.dataset['finstruvialPortal'];
    }
    loadPortalGoogleFonts(this.doc, tema);
    root.dataset['heroEstilo'] = resolvePortalHeroEstilo(tema);

    const themeColor = vars['--av-bg'];
    if (themeColor) {
      this.doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
    }
  }

  private readFinstruvialDataset(): boolean {
    return this.doc.documentElement.dataset['finstruvialPortal'] === '1';
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
