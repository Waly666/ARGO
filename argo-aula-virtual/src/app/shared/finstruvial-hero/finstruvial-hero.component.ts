import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { PortalIconComponent } from '../portal-icon/portal-icon.component';
import {
  FINSTRUVIAL_HERO_DEFAULTS,
  FinstruvialHeroHighlight,
  splitFinstruvialHeroTitle,
} from './finstruvial-hero.defaults';

@Component({
  selector: 'av-finstruvial-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, PortalIconComponent],
  templateUrl: './finstruvial-hero.component.html',
  styleUrl: './finstruvial-hero.component.scss',
})
export class FinstruvialHeroComponent {
  private host = inject(ElementRef<HTMLElement>);
  private platformId = inject(PLATFORM_ID);

  @Input() instBarLeft = '';
  @Input() instBarRight: string = FINSTRUVIAL_HERO_DEFAULTS.instBarRight;
  @Input() eyebrow: string = FINSTRUVIAL_HERO_DEFAULTS.eyebrow;
  @Input() h1: string = FINSTRUVIAL_HERO_DEFAULTS.h1;
  @Input() lead: string = FINSTRUVIAL_HERO_DEFAULTS.lead;
  @Input() ctaPrimary: string = FINSTRUVIAL_HERO_DEFAULTS.ctaPrimary;
  @Input() ctaPrimaryUrl: string = FINSTRUVIAL_HERO_DEFAULTS.ctaPrimaryUrl;
  @Input() ctaSecondary: string = FINSTRUVIAL_HERO_DEFAULTS.ctaSecondary;
  @Input() ctaSecondaryUrl: string = FINSTRUVIAL_HERO_DEFAULTS.ctaSecondaryUrl;
  @Input() ctaTertiary: string = FINSTRUVIAL_HERO_DEFAULTS.ctaTertiary;
  @Input() ctaTertiaryUrl: string = FINSTRUVIAL_HERO_DEFAULTS.ctaTertiaryUrl;
  /** Imagen ERP; si falta, usa el asset de plantilla. */
  @Input() bgImageUrl: string | null = null;
  @Input() bgImageAlt = 'Formación en tránsito, transporte y seguridad vial';
  /** Logo institucional flotante (esquina superior izquierda). */
  @Input() logoUrl: string | null = null;
  @Input() logoAlt = '';
  /** Tarjeta destacada bajo el título (sustituye el párrafo lead cuando está presente). */
  @Input() highlight: FinstruvialHeroHighlight | null = null;
  @Input() highlightRadar = false;

  readonly fallbackBg = FINSTRUVIAL_HERO_DEFAULTS.bgAsset;

  get titleLines() {
    return splitFinstruvialHeroTitle(this.h1);
  }

  get resolvedBg(): string {
    return this.bgImageUrl?.trim() || this.fallbackBg;
  }

  esExterna(url: string | undefined): boolean {
    return /^https?:\/\//i.test(String(url || '').trim());
  }

  ruta(url: string | undefined, fb: string): string {
    const u = String(url || fb).trim();
    if (!u || u === '/') return '/';
    return u.startsWith('/') ? u : `/${u}`;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(ev: MouseEvent) {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 960px)').matches) return;

    const el = this.host.nativeElement;
    const rect = el.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((ev.clientY - rect.top) / rect.height - 0.5) * 2;
    el.style.setProperty('--fvh-parallax-x', `${x * 8}px`);
    el.style.setProperty('--fvh-parallax-y', `${y * 6}px`);
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    const el = this.host.nativeElement;
    el.style.setProperty('--fvh-parallax-x', '0px');
    el.style.setProperty('--fvh-parallax-y', '0px');
  }
}
