import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AulaApiService } from '../../core/aula-api.service';
import { mergePortalLanding } from '../../core/portal-landing';
import { PortalSeoService } from '../../core/portal-seo.service';
import { PortalConfig } from '../../core/models';
import { resolveUploadUrl } from '../../core/upload-url.util';
import { ContactoFormComponent } from '../../shared/contacto-form/contacto-form.component';
import { PortalIconComponent } from '../../shared/portal-icon/portal-icon.component';
import { PortalPromoBannerHeroComponent } from '../../shared/portal-promo-banner-hero/portal-promo-banner-hero.component';
import {
  PROMO_BANNER_RIBBON_DEFAULT,
} from '../../shared/portal-promo-banner-hero/portal-promo-banner-defaults';
import { FUNDACION_CONTACTO } from './fundacion-content';
import { whatsappHrefFromPhone } from '../../core/portal-whatsapp.util';

@Component({
  selector: 'av-fundacion',
  standalone: true,
  imports: [CommonModule, RouterLink, ContactoFormComponent, PortalIconComponent, PortalPromoBannerHeroComponent],
  templateUrl: './fundacion.component.html',
  styleUrl: './fundacion.component.scss',
})
export class FundacionComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);

  config = signal<PortalConfig | null>(null);

  readonly heroRibbon = PROMO_BANNER_RIBBON_DEFAULT;

  landing = computed(() => mergePortalLanding(this.config()?.landing));
  fund = computed(() => this.landing().fundacion);

  heroPilares = computed(() => this.fund().hero.pillars);

  nombreCea = computed(() => this.config()?.nombreCea?.trim() || 'Mi institución');

  heroTitulo = computed(() => this.fund().hero.titulo?.trim() || this.nombreCea());

  heroImagen = computed(() => {
    const hero = this.fund().hero;
    const url = hero.imagenUrl?.trim();
    if (!url) return '/images/fundacion-equipo.png';
    if (url.startsWith('/images/') || url.startsWith('/apk/')) return url;
    if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url;
    const resolved = resolveUploadUrl(hero.imagenUrlAbsoluta || url);
    if (resolved) return resolved;
    if (url.startsWith('/uploads/')) return url;
    return '/images/fundacion-equipo.png';
  });

  telefono = computed(() => this.config()?.telefono?.trim() || FUNDACION_CONTACTO.telefono);
  email = computed(() => this.config()?.email?.trim() || FUNDACION_CONTACTO.email);
  direccion = computed(() => {
    const c = this.config();
    const partes = [c?.direccion, c?.ciudad].filter(Boolean);
    return partes.length ? partes.join(', ') : FUNDACION_CONTACTO.direccion;
  });

  logoUrl = computed(() => {
    const cfg = this.config();
    return resolveUploadUrl(cfg?.urlLogoAbsoluta || cfg?.urlLogo);
  });

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.seo.applyFundacion(c);
      },
      error: () => this.seo.applyFundacion(null),
    });
  }

  whatsappHref() {
    return whatsappHrefFromPhone(this.telefono());
  }
}
