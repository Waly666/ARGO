import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { mergePortalLanding, PORTAL_LANDING_DEFAULTS } from '../../core/constants/portal-landing-defaults';
import { PortalLandingEditorComponent } from './portal-landing-editor.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'argo-aula-virtual-sitio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PortalLandingEditorComponent],
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
    heroTitulo: '',
    heroSubtitulo: '',
    acercaDeHtml: '',
    landing: mergePortalLanding(PORTAL_LANDING_DEFAULTS),
  };

  saving = signal(false);
  msg = signal<string | null>(null);
  err = signal(false);

  ngOnInit(): void {
    this.svc.obtenerPortal().subscribe({
      next: (p) => {
        Object.assign(this.portalForm, p);
        this.portalForm.landing = mergePortalLanding(p.landing);
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
        this.saving.set(false);
        this.toast(res.message || 'Sitio guardado');
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
