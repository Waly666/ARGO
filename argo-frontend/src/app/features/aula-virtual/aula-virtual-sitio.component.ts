import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { mergePortalLanding, PORTAL_LANDING_DEFAULTS } from '../../core/constants/portal-landing-defaults';
import { mergePortalSiteDefaults } from '../../core/constants/portal-site-defaults';
import { PortalSiteBuilderComponent } from './portal-site-builder.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'argo-aula-virtual-sitio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PortalSiteBuilderComponent],
  templateUrl: './aula-virtual-sitio.component.html',
  styleUrl: './aula-virtual-sitio.component.scss',
})
export class AulaVirtualSitioComponent implements OnInit {
  private svc = inject(AulaVirtualAdminService);

  readonly portalUrl = environment.production
    ? 'https://finstruvial.edu.co/'
    : 'http://localhost:4202/';

  portalForm: PortalAulaConfig = {
    nombreEmpresa: '',
    nit: '',
    direccion: '',
    ciudad: '',
    telefono: '',
    email: '',
    emailContacto: '',
    heroTitulo: '',
    heroSubtitulo: '',
    acercaDeHtml: '',
    landing: mergePortalLanding(PORTAL_LANDING_DEFAULTS),
    site: mergePortalSiteDefaults(),
  };

  saving = signal(false);
  msg = signal<string | null>(null);
  err = signal(false);

  ngOnInit(): void {
    this.svc.obtenerPortal().subscribe({
      next: (p) => {
        Object.assign(this.portalForm, p);
        this.portalForm.landing = mergePortalLanding(p.landing);
        this.portalForm.site = mergePortalSiteDefaults(p.site);
      },
      error: () => this.toast('No se pudo cargar la configuración del sitio', true),
    });
  }

  guardar() {
    this.saving.set(true);
    this.svc.guardarPortal(this.portalForm).subscribe({
      next: (res) => {
        Object.assign(this.portalForm, res.config);
        this.portalForm.landing = mergePortalLanding(res.config.landing);
        this.portalForm.site = mergePortalSiteDefaults(res.config.site);
        this.saving.set(false);
        this.toast(res.message || 'Sitio publicado');
      },
      error: (e) => {
        this.saving.set(false);
        this.toast(e?.error?.message || 'Error al guardar', true);
      },
    });
  }

  private toast(text: string, isError = false) {
    this.msg.set(text);
    this.err.set(isError);
    setTimeout(() => this.msg.set(null), 4000);
  }
}
