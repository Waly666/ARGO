import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { finstruvialPortafolioActivo, finstruvialServiciosActivos } from '../../core/constants/finstruvial-servicios-defaults';
import {
  finstruvialServicioPublicRoute,
  resolverUrlLineaServicio,
} from '../../core/constants/finstruvial-servicios.constants';
import { PortalServiciosHubTarjeta } from '../../core/constants/finstruvial-servicio-landing.types';
import { portalHeroImagenPublicUrl } from '../../core/portal-hero-imagen.util';
import { mergePortalLanding } from '../../core/portal-landing';
import { portafolioServiciosEsServial } from '../../core/portafolio-servicios.util';
import { PortalSeoService } from '../../core/portal-seo.service';
import { PortalConfig } from '../../core/models';
import { DEFAULT_CEA_NOMBRE } from '../../core/portal-brand-defaults';
import { resolveUploadUrl } from '../../core/upload-url.util';
import {
  finstruvialHubHeroHighlight,
  finstruvialHubHeroPillars,
  finstruvialHubHeroRibbon,
} from '../../core/finstruvial-servicio-hero.util';
import { PortalPromoBannerHeroComponent } from '../../shared/portal-promo-banner-hero/portal-promo-banner-hero.component';
import { PortalBreadcrumbsComponent } from '../../shared/portal-breadcrumbs/portal-breadcrumbs.component';
import { RevealOnScrollDirective } from '../../core/reveal-on-scroll.directive';

@Component({
  selector: 'av-servicios-hub',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PortalPromoBannerHeroComponent,
    PortalBreadcrumbsComponent,
    RevealOnScrollDirective,
  ],
  templateUrl: './servicios-hub.component.html',
  styleUrl: './servicios-hub.component.scss',
})
export class ServiciosHubComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);
  private router = inject(Router);

  config = signal<PortalConfig | null>(null);
  landing = computed(() => mergePortalLanding(this.config()?.landing, this.config()?.site?.tema));
  servicios = computed(() => this.landing().finstruvialServicios);
  hub = computed(() => this.servicios().hub);

  esServialHub = computed(() =>
    portafolioServiciosEsServial(this.config()?.site?.tema) || Number(this.hub().guionVersion) >= 1,
  );

  tarjetas = computed(() => {
    const paginas = this.servicios().paginas;
    const custom = this.hub().tarjetas?.filter((t) => t.titulo?.trim() && t.url?.trim());
    if (custom?.length) {
      return custom.map((t) => ({
        ...t,
        url: resolverUrlLineaServicio(t.url, paginas),
      }));
    }
    return finstruvialServiciosActivos(this.servicios()).map((p) => ({
      icon: p.hubIcon,
      titulo: p.menuLabel,
      lead: p.hubLead,
      url: finstruvialServicioPublicRoute(p.slug, p.routeSegment),
      cta: p.tarjetaCta || 'Conocer más',
      externo: false,
    }));
  });

  heroPhoto = computed(() =>
    portalHeroImagenPublicUrl({
      heroImagenUrl: this.hub().heroImagenUrl,
      heroImagenUrlAbsoluta: this.hub().heroImagenUrlAbsoluta,
      heroImagenAlt: this.hub().heroImagenAlt,
    }),
  );

  logoUrl = computed(() => {
    const cfg = this.config();
    return resolveUploadUrl(cfg?.urlLogoAbsoluta || cfg?.urlLogo);
  });

  nombreCea = computed(() => this.config()?.nombreCea?.trim() || DEFAULT_CEA_NOMBRE);

  formacionHighlights = [
    'Conducción y licencias',
    'Seguridad vial y transporte',
    'Prevención de riesgos',
    'Capacitación empresarial',
  ];

  hubHeroPillars = computed(() => finstruvialHubHeroPillars(this.formacionHighlights));

  hubHeroRibbon = computed(() => finstruvialHubHeroRibbon(this.tarjetas()));

  hubHeroHighlight = computed(() => finstruvialHubHeroHighlight(this.hub()));

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        const landing = mergePortalLanding(c?.landing, c?.site?.tema);
        if (!finstruvialPortafolioActivo(landing.finstruvialServicios)) {
          void this.router.navigateByUrl('/');
          return;
        }
        this.seo.applyServiciosHub(c);
      },
      error: () => this.seo.applyServiciosHub(null),
    });
  }

  enlaceExterno(item: PortalServiciosHubTarjeta): boolean {
    if (item.externo) return true;
    const url = item.url?.trim() || '';
    return /^https?:\/\//i.test(url);
  }

  imagenHub(url?: string, urlAbsoluta?: string): string | null {
    const raw = urlAbsoluta?.trim() || url?.trim();
    if (!raw) return null;
    return resolveUploadUrl(raw) || raw;
  }
}
