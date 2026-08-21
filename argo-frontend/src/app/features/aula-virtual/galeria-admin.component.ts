import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import {
  mergePortalLanding,
  PortalGaleriaLanding,
} from '../../core/constants/portal-landing-defaults';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { PortalGaleriaFotosEditorComponent } from './portal-galeria-fotos-editor.component';

@Component({
  selector: 'app-galeria-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PortalGaleriaFotosEditorComponent],
  templateUrl: './galeria-admin.component.html',
  styleUrl: './galeria-admin.component.scss',
})
export class GaleriaAdminComponent implements OnInit {
  private api = inject(AulaVirtualAdminService);

  loading = signal(true);
  saving = signal(false);
  msg = signal('');
  err = signal(false);

  config = signal<PortalAulaConfig | null>(null);
  galeria = signal<PortalGaleriaLanding>(mergePortalLanding().galeria);

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.api
      .obtenerPortal()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (cfg) => {
          this.config.set(cfg);
          this.galeria.set(mergePortalLanding(cfg.landing).galeria);
        },
        error: (e) => this.flash(e?.error?.message || 'No se pudo cargar la galería', true),
      });
  }

  guardarTextos() {
    const cfg = this.config();
    if (!cfg) return;
    const landing = mergePortalLanding(cfg.landing);
    landing.galeria = { ...this.galeria() };

    this.saving.set(true);
    this.api
      .guardarPortal({ ...cfg, landing })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (res) => {
          this.onConfigActualizada(res.config);
          this.flash(res.message || 'Textos guardados', false);
        },
        error: (e) => this.flash(e?.error?.message || 'No se pudo guardar', true),
      });
  }

  onConfigActualizada(config: PortalAulaConfig) {
    this.config.set(config);
    this.galeria.set(mergePortalLanding(config.landing).galeria);
  }

  onAviso(ev: { message: string; error?: boolean }) {
    this.flash(ev.message, !!ev.error);
  }

  private flash(text: string, isErr: boolean) {
    this.msg.set(text);
    this.err.set(isErr);
  }
}
