import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { mergePortalLanding } from '../../core/portal-landing';
import { PortalSeoService } from '../../core/portal-seo.service';
import { portalHeroImagenPublicUrl, portalHeroImagenStoredAlt } from '../../core/portal-hero-imagen.util';
import { PortalConfig } from '../../core/models';
import { resolveUploadUrl } from '../../core/upload-url.util';
import { PortalIconComponent } from '../../shared/portal-icon/portal-icon.component';
import { PortalPromoBannerHeroComponent } from '../../shared/portal-promo-banner-hero/portal-promo-banner-hero.component';
import {
  PromoBannerHighlight,
  PromoBannerRibbonItem,
} from '../../shared/portal-promo-banner-hero/portal-promo-banner-defaults';
import {
  mergeExamenTeoricoLanding,
  PortalExamenTeoricoNorma,
  PortalExamenTeoricoResolucion,
} from '../home/examen-teorico-content';

@Component({
  selector: 'av-examen-teorico',
  standalone: true,
  imports: [CommonModule, RouterLink, PortalIconComponent, PortalPromoBannerHeroComponent],
  templateUrl: './examen-teorico.component.html',
  styleUrl: './examen-teorico.component.scss',
})
export class ExamenTeoricoComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);

  config = signal<PortalConfig | null>(null);

  contenido = computed(() =>
    mergeExamenTeoricoLanding(mergePortalLanding(this.config()?.landing).examenTeorico),
  );
  heroPhoto = computed(() => portalHeroImagenPublicUrl(this.contenido()));
  heroPhotoAlt = computed(() => portalHeroImagenStoredAlt(this.contenido(), this.contenido().titulo));

  readonly heroRibbon: PromoBannerRibbonItem[] = [
    { icon: 'document', label: 'Normativa vigente' },
    { icon: 'check-badge', label: 'Fuente oficial' },
    { icon: 'car', label: 'Licencia de conducción' },
    { icon: 'shield-check', label: 'Información verificada' },
  ];

  heroHighlight = computed((): PromoBannerHighlight => {
    const c = this.contenido();
    return {
      icon: 'check-badge',
      title: c.fechaDestacada,
      subtitle: `${c.fechaBannerPrefijo} ${c.fechaBannerSufijo}`.trim(),
    };
  });

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.seo.applyExamenTeorico(c);
      },
      error: () => this.seo.applyExamenTeorico(null),
    });
  }

  resolucionUrl(res: PortalExamenTeoricoResolucion): string | null {
    const url = res.archivoUrlAbsoluta?.trim() || res.archivoUrl?.trim();
    if (!url) return null;
    return resolveUploadUrl(url) || url;
  }

  normaUrl(norma: PortalExamenTeoricoNorma): string | null {
    const url = norma.archivoUrlAbsoluta?.trim() || norma.archivoUrl?.trim();
    if (!url) return null;
    return resolveUploadUrl(url) || url;
  }

  normaNombre(norma: PortalExamenTeoricoNorma): string {
    return norma.nombreArchivo?.trim() || norma.norma?.trim() || 'norma';
  }

  resolucionNombre(res: PortalExamenTeoricoResolucion): string {
    return res.nombreArchivo?.trim() || 'documento';
  }

  enlaceEsExterno(url: string | undefined): boolean {
    return /^https?:\/\//i.test(String(url || '').trim());
  }

  enlaceRuta(url: string | undefined): string {
    const u = String(url || '/').trim();
    if (!u || u === '/') return '/';
    return u.startsWith('/') ? u : `/${u}`;
  }
}
