import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { mergePortalLanding } from '../../core/portal-landing';
import {
  acercaHeroHighlight,
  acercaParrafosFromLegacy,
} from '../../core/constants/acerca-landing-defaults';
import { PortalSeoService } from '../../core/portal-seo.service';
import { PortalConfig } from '../../core/models';
import { resolveUploadUrl } from '../../core/upload-url.util';
import { ContactoFormComponent } from '../../shared/contacto-form/contacto-form.component';
import { PortalIconComponent } from '../../shared/portal-icon/portal-icon.component';
import { PortalPromoBannerHeroComponent } from '../../shared/portal-promo-banner-hero/portal-promo-banner-hero.component';
import { DEFAULT_CEA_NOMBRE } from '../../core/portal-brand-defaults';
import { whatsappHrefFromPhone } from '../../core/portal-whatsapp.util';

@Component({
  selector: 'av-acerca',
  standalone: true,
  imports: [CommonModule, RouterLink, ContactoFormComponent, PortalIconComponent, PortalPromoBannerHeroComponent],
  templateUrl: './acerca.component.html',
  styleUrl: './acerca.component.scss',
})
export class AcercaComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);

  config = signal<PortalConfig | null>(null);

  landing = computed(() => mergePortalLanding(this.config()?.landing));

  acerca = computed(() => this.landing().acerca);

  heroPilares = computed(() => this.acerca().hero.pillars);

  heroHighlight = computed(() => acercaHeroHighlight(this.acerca().hero));

  heroTitleAccent = computed(
    () => this.acerca().hero.tituloAcento?.trim() || this.nombreCea(),
  );

  acercaParrafos = computed(() =>
    acercaParrafosFromLegacy(
      this.acerca(),
      this.config()?.acercaDeHtml,
      this.config()?.landing?.acerca,
    ),
  );

  valoresItems = computed(() => this.acerca().valores.items);

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.seo.applyAcerca(c);
      },
      error: () => this.seo.applyAcerca(null),
    });
  }

  whatsappHref(): string | null {
    return whatsappHrefFromPhone(this.config()?.telefono);
  }

  nombreCea() {
    return this.config()?.nombreCea || DEFAULT_CEA_NOMBRE;
  }

  logoUrl = computed(() => {
    const cfg = this.config();
    return resolveUploadUrl(cfg?.urlLogoAbsoluta || cfg?.urlLogo);
  });

  heroImagenUrl = computed(() => {
    const hero = this.acerca().hero;
    const url = hero.imagenUrl?.trim();
    if (!url) return null;
    if (url.startsWith('/images/') || url.startsWith('/apk/')) return url;
    if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url;
    const resolved = resolveUploadUrl(hero.imagenUrlAbsoluta || url);
    if (resolved) return resolved;
    if (url.startsWith('/uploads/')) return url;
    return null;
  });

  heroImagenAlt = computed(() => {
    const alt = this.acerca().hero.imagenAlt?.trim();
    if (alt) return alt;
    return `Equipo o instalaciones de ${this.nombreCea()}`;
  });

  heroImagenCaption = computed(() => this.acerca().hero.imagenCaption?.trim() || '');

  enlaceEsExterno(url: string | undefined): boolean {
    return /^https?:\/\//i.test(String(url || '').trim());
  }

  enlaceRuta(url: string | undefined): string {
    const u = String(url || '/').trim();
    if (!u || u === '/') return '/';
    return u.startsWith('/') ? u : `/${u}`;
  }
}
