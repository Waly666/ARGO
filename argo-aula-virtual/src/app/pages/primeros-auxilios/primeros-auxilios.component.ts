import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { DEFAULT_CEA_NOMBRE } from '../../core/portal-brand-defaults';
import { mergePortalLanding } from '../../core/portal-landing';
import { PortalSeoService } from '../../core/portal-seo.service';
import { PortalConfig } from '../../core/models';
import { resolveUploadUrl } from '../../core/upload-url.util';
import { whatsappHrefFromPhone } from '../../core/portal-whatsapp.util';
import { PortalEnlacesRelacionadosComponent } from '../../shared/portal-enlaces-relacionados/portal-enlaces-relacionados.component';
import { PortalBreadcrumbsComponent } from '../../shared/portal-breadcrumbs/portal-breadcrumbs.component';
import { PortalPromoBannerHeroComponent } from '../../shared/portal-promo-banner-hero/portal-promo-banner-hero.component';
import {
  imagenPrimerosAuxiliosPorId,
  PaImagen,
  PaModalidad,
  mergePrimerosAuxiliosLanding,
  urlCtaModalidadPrimerosAuxilios,
  urlInscripcionPrimerosAuxilios,
} from './primeros-auxilios-content';

@Component({
  selector: 'av-primeros-auxilios',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PortalBreadcrumbsComponent,
    PortalEnlacesRelacionadosComponent,
    PortalPromoBannerHeroComponent,
  ],
  templateUrl: './primeros-auxilios.component.html',
  styleUrl: './primeros-auxilios.component.scss',
})
export class PrimerosAuxiliosComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);

  config = signal<PortalConfig | null>(null);

  contenido = computed(() =>
    mergePrimerosAuxiliosLanding(mergePortalLanding(this.config()?.landing, this.config()?.site?.tema).primerosAuxilios),
  );

  breadcrumbs = computed(() => [
    { label: 'Inicio', path: '/' },
    { label: 'Cursos', path: '/cursos' },
    { label: this.contenido().h1 || 'Curso de Primeros auxilios' },
  ]);

  whatsappHref = computed(() => whatsappHrefFromPhone(this.config()?.telefono));

  urlInscripcion = computed(() => urlInscripcionPrimerosAuxilios(this.contenido()));

  nombreCea = computed(() => this.config()?.nombreCea?.trim() || DEFAULT_CEA_NOMBRE);

  logoUrl = computed(() => {
    const cfg = this.config();
    return resolveUploadUrl(cfg?.urlLogoAbsoluta || cfg?.urlLogo);
  });

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.seo.applyPrimerosAuxilios(c);
      },
      error: () => this.seo.applyPrimerosAuxilios(null),
    });
  }

  imagen(id: string): PaImagen | undefined {
    return imagenPrimerosAuxiliosPorId(this.contenido(), id);
  }

  imagenUrl(id: string): string | null {
    const img = this.imagen(id);
    const url = img?.urlAbsoluta?.trim() || img?.url?.trim();
    if (!url) return null;
    return resolveUploadUrl(url) || url;
  }

  isExternal(url: string | null | undefined): boolean {
    return /^https?:\/\//i.test(String(url || '').trim());
  }

  internalPath(url: string | null | undefined): string {
    const raw = String(url || '').trim();
    if (!raw) return '/cursos';
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  urlCtaModo(modo: PaModalidad): string {
    return urlCtaModalidadPrimerosAuxilios(this.contenido(), modo.ctaUrl);
  }

  estrellas(n: number): string {
    const count = Math.min(5, Math.max(0, Number(n) || 0));
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  }
}
