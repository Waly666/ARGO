import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';

import { PortalThemeService } from '../../core/portal-theme.service';
import { PortalPromoHeroFxComponent } from '../portal-promo-hero-fx/portal-promo-hero-fx.component';
import { PortalIconComponent } from '../portal-icon/portal-icon.component';
import {
  PromoBannerHighlight,
  PromoBannerPillar,
  PromoBannerRibbonItem,
  PromoBannerTheme,
} from './portal-promo-banner-defaults';

@Component({
  selector: 'av-portal-promo-banner-hero',
  standalone: true,
  imports: [CommonModule, PortalIconComponent, PortalPromoHeroFxComponent],
  templateUrl: './portal-promo-banner-hero.component.html',
  styleUrl: './portal-promo-banner-hero.component.scss',
  host: {
    class: 'av-portal-promo-banner-hero',
    '[class.ppbh--gold]': 'theme() === "gold"',
    '[class.ppbh--green]': 'theme() === "green"',
    '[class.ppbh--violet]': 'theme() === "violet"',
    '[class.ppbh--blue]': 'theme() === "blue"',
    '[class.ppbh--page]': 'size() === "page" || size() === "page-tall"',
    '[class.ppbh--page-tall]': 'size() === "page-tall"',
    '[class.ppbh--home]': 'size() === "home"',
    '[class.ppbh--no-photo]': '!photoVisible()',
    '[class.ppbh--fx-on]': 'heroEffectsEnabled()',
  },
})
export class PortalPromoBannerHeroComponent {
  private portalTheme = inject(PortalThemeService);

  /**
   * Radar y brillos del hero. Por defecto (null) solo en Plantilla azul profundo (Finstruvial).
   * Otros clientes no se ven afectados al desplegar.
   */
  showHeroEffects = input<boolean | null>(null);

  heroEffectsEnabled = computed(() => {
    const explicit = this.showHeroEffects();
    return explicit !== null ? explicit : this.portalTheme.finstruvialPortal();
  });
  /** Sin URL no se muestra hueco ni placeholder (evita caja vacía en heroes split). */
  photoVisible = computed(() => this.showPhoto() && !!this.photoUrl()?.trim());
  /** Si es false, no se muestra imagen ni placeholder (solo texto). */
  showPhoto = input(true);
  photoUrl = input<string | null>(null);
  photoAlt = input('');
  logoUrl = input<string | null>(null);
  logoAlt = input('');
  kicker = input('');
  showVirtualBadge = input(true);
  virtualBadgeLabel = input('VIRTUAL');
  titleLine = input('');
  titleAccent = input('');
  lead = input('');
  pillars = input<PromoBannerPillar[]>([]);
  highlight = input<PromoBannerHighlight | null>(null);
  ribbon = input<PromoBannerRibbonItem[]>([]);
  showRibbon = input(false);
  theme = input<PromoBannerTheme>('gold');
  /** `page` compacto; `page-tall` más alto; `home` portada. */
  size = input<'page' | 'page-tall' | 'home'>('page');
  titleId = input('ppbh-title');
  pillarsLabel = input('Fortalezas');
  ribbonLabel = input('Ventajas');
  sectionId = input<string | null>(null);
}
