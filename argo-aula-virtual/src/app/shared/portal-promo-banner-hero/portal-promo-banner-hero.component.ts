import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

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
  imports: [CommonModule, PortalIconComponent],
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
  },
})
export class PortalPromoBannerHeroComponent {
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
