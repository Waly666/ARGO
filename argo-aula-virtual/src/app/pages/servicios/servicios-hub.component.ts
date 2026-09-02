import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { finstruvialPortafolioActivo, finstruvialServiciosActivos } from '../../core/constants/finstruvial-servicios-defaults';
import { FINSTRUVIAL_SERVICIO_ROUTE } from '../../core/constants/finstruvial-servicios.constants';
import { finstruvialServicioHeroPhoto } from '../../core/finstruvial-servicios.util';
import { portalHeroImagenPublicUrl } from '../../core/portal-hero-imagen.util';
import { mergePortalLanding } from '../../core/portal-landing';
import { PortalSeoService } from '../../core/portal-seo.service';
import { PortalConfig } from '../../core/models';
import { PortalPromoBannerHeroComponent } from '../../shared/portal-promo-banner-hero/portal-promo-banner-hero.component';
import { RevealOnScrollDirective } from '../../core/reveal-on-scroll.directive';

@Component({
  selector: 'av-servicios-hub',
  standalone: true,
  imports: [CommonModule, RouterLink, PortalPromoBannerHeroComponent, RevealOnScrollDirective],
  templateUrl: './servicios-hub.component.html',
  styleUrl: './servicios-hub.component.scss',
})
export class ServiciosHubComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);
  private router = inject(Router);

  config = signal<PortalConfig | null>(null);
  landing = computed(() => mergePortalLanding(this.config()?.landing));
  servicios = computed(() => this.landing().finstruvialServicios);
  hub = computed(() => this.servicios().hub);
  tarjetas = computed(() =>
    finstruvialServiciosActivos(this.servicios()).map((p) => ({
      ...p,
      route: FINSTRUVIAL_SERVICIO_ROUTE[p.slug],
    })),
  );
  heroPhoto = computed(() =>
    portalHeroImagenPublicUrl({
      heroImagenUrl: this.hub().heroImagenUrl,
      heroImagenUrlAbsoluta: this.hub().heroImagenUrlAbsoluta,
      heroImagenAlt: this.hub().heroImagenAlt,
    }),
  );

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        const landing = mergePortalLanding(c?.landing);
        if (!finstruvialPortafolioActivo(landing.finstruvialServicios)) {
          void this.router.navigateByUrl('/');
          return;
        }
        this.seo.applyServiciosHub(c);
      },
      error: () => this.seo.applyServiciosHub(null),
    });
  }
}
