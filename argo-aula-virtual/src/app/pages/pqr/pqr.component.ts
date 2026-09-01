import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { pqrHeroLead } from '../../core/constants/pqr-landing-defaults';
import { mergePortalLanding } from '../../core/portal-landing';
import { PortalConfig } from '../../core/models';
import { PortalSeoService } from '../../core/portal-seo.service';
import { portalHeroImagenPublicUrl, portalHeroImagenStoredAlt } from '../../core/portal-hero-imagen.util';
import { PqrFormComponent } from '../../shared/pqr-form/pqr-form.component';
import { PortalIconComponent } from '../../shared/portal-icon/portal-icon.component';
import { PortalPromoBannerHeroComponent } from '../../shared/portal-promo-banner-hero/portal-promo-banner-hero.component';
import { PromoBannerRibbonItem } from '../../shared/portal-promo-banner-hero/portal-promo-banner-defaults';

@Component({
  selector: 'av-pqr',
  standalone: true,
  imports: [CommonModule, RouterLink, PqrFormComponent, PortalIconComponent, PortalPromoBannerHeroComponent],
  templateUrl: './pqr.component.html',
  styleUrl: './pqr.component.scss',
})
export class PqrComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);

  config = signal<PortalConfig | null>(null);

  landing = computed(() => mergePortalLanding(this.config()?.landing));
  pqr = computed(() => this.landing().pqr);
  nombreCea = computed(() => this.config()?.nombreCea?.trim() || 'Aula Virtual');
  heroLead = computed(() => pqrHeroLead(this.pqr().hero.lead, this.nombreCea()));
  heroPhoto = computed(() => portalHeroImagenPublicUrl(this.pqr().hero));
  heroPhotoAlt = computed(() => portalHeroImagenStoredAlt(this.pqr().hero, 'PQR'));

  readonly heroRibbon: PromoBannerRibbonItem[] = [
    { icon: 'check-badge', label: 'Respuesta oportuna' },
    { icon: 'document', label: 'Canal oficial' },
    { icon: 'shield-check', label: 'Seguimiento' },
    { icon: 'heart', label: 'Transparencia' },
  ];

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.seo.applyPqr(c);
      },
      error: () => this.seo.applyPqr(null),
    });
  }
}
