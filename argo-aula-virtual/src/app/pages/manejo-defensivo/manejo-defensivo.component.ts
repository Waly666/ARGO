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
import { manejoDefensivoDefaultsForTema } from '../../core/constants/servial-seo-landing-defaults';
import {
  imagenManejoDefensivoPorId,
  MdImagen,
  MdModalidad,
  mergeManejoDefensivoLanding,
  urlCtaModalidadManejoDefensivo,
  urlInscripcionManejoDefensivo,
} from './manejo-defensivo-content';

@Component({
  selector: 'av-manejo-defensivo',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PortalBreadcrumbsComponent,
    PortalEnlacesRelacionadosComponent,
    PortalPromoBannerHeroComponent,
  ],
  templateUrl: './manejo-defensivo.component.html',
  styleUrl: './manejo-defensivo.component.scss',
})
export class ManejoDefensivoComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);

  config = signal<PortalConfig | null>(null);

  contenido = computed(() =>
    mergeManejoDefensivoLanding(
      mergePortalLanding(this.config()?.landing, this.config()?.site?.tema).manejoDefensivo,
      manejoDefensivoDefaultsForTema(this.config()?.site?.tema),
      this.config()?.site?.tema,
    ),
  );

  breadcrumbs = computed(() => [
    { label: 'Inicio', path: '/' },
    { label: 'Cursos', path: '/cursos' },
    { label: this.contenido().h1 || 'Curso de manejo defensivo' },
  ]);

  whatsappHref = computed(() => whatsappHrefFromPhone(this.config()?.telefono));

  urlInscripcion = computed(() => urlInscripcionManejoDefensivo(this.contenido()));

  nombreCea = computed(() => this.config()?.nombreCea?.trim() || DEFAULT_CEA_NOMBRE);

  logoUrl = computed(() => {
    const cfg = this.config();
    return resolveUploadUrl(cfg?.urlLogoAbsoluta || cfg?.urlLogo);
  });

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.seo.applyManejoDefensivo(c);
      },
      error: () => this.seo.applyManejoDefensivo(null),
    });
  }

  imagen(id: string): MdImagen | undefined {
    return imagenManejoDefensivoPorId(this.contenido(), id);
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

  urlCtaModo(modo: MdModalidad): string {
    return urlCtaModalidadManejoDefensivo(this.contenido(), modo.ctaUrl);
  }

  estrellas(n: number): string {
    const count = Math.min(5, Math.max(0, Number(n) || 0));
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  }
}
