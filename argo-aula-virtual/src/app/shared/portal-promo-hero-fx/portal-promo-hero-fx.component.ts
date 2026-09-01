import { Component, computed, input } from '@angular/core';

import { PromoBannerTheme } from '../portal-promo-banner-hero/portal-promo-banner-defaults';

const THEME_ACCENT_RGB: Record<PromoBannerTheme, string> = {
  gold: '245, 196, 0',
  green: '74, 222, 128',
  violet: '167, 139, 250',
  blue: '96, 165, 250',
};

@Component({
  selector: 'av-portal-promo-hero-fx',
  standalone: true,
  templateUrl: './portal-promo-hero-fx.component.html',
  styleUrl: './portal-promo-hero-fx.component.scss',
})
export class PortalPromoHeroFxComponent {
  theme = input<PromoBannerTheme>('gold');
  accentRgbOverride = input<string | null>(null, { alias: 'accentRgb' });

  accentRgb = computed(
    () => this.accentRgbOverride()?.trim() || THEME_ACCENT_RGB[this.theme()] || THEME_ACCENT_RGB.gold,
  );
}
