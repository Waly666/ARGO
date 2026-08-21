import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  ACERCA_LANDING_DEFAULTS,
  mergeAcercaLanding,
  PortalAcercaLanding,
} from '../../core/constants/acerca-landing-defaults';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'argo-portal-acerca-hero-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-acerca-hero-editor.component.html',
  styleUrl: './portal-acerca-hero-editor.component.scss',
})
export class PortalAcercaHeroEditorComponent {
  private svc = inject(AulaVirtualAdminService);

  @Input({ required: true }) acerca!: PortalAcercaLanding;
  @Input() nombreEmpresa = '';
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  heroUploading = signal(false);

  restaurarDefaults() {
    Object.assign(this.acerca, mergeAcercaLanding(ACERCA_LANDING_DEFAULTS));
  }

  tieneImagenAcerca(): boolean {
    return !!this.acerca.hero.imagenUrl?.trim();
  }

  acercaHeroPreviewUrl(): string | null {
    const rel = this.acerca.hero.imagenUrl?.trim();
    if (!rel) return null;
    if (/^https?:\/\//i.test(rel)) return rel;
    if (rel.startsWith('/uploads/')) return rel;
    if (rel.startsWith('/')) return rel;
    const base = environment.uploadsUrl.replace(/\/+$/, '');
    return `${base}/${rel.replace(/^\/+/, '')}`;
  }

  onAcercaHeroImagen(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.heroUploading.set(true);
    this.svc
      .subirImagenAcercaPortal(file)
      .pipe(
        finalize(() => {
          this.heroUploading.set(false);
          input.value = '';
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.config.landing?.acerca?.hero) {
            this.acerca.hero = {
              ...this.acerca.hero,
              ...res.config.landing.acerca.hero,
            };
          }
          this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen de «Acerca de» actualizada' });
        },
        error: (e) => {
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo subir la imagen',
            error: true,
          });
        },
      });
  }

  quitarImagenAcerca() {
    this.heroUploading.set(true);
    this.svc
      .quitarImagenAcercaPortal()
      .pipe(finalize(() => this.heroUploading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.config.landing?.acerca?.hero) {
            this.acerca.hero = {
              ...this.acerca.hero,
              ...res.config.landing.acerca.hero,
            };
          }
          this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen eliminada' });
        },
        error: (e) => {
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo quitar la imagen',
            error: true,
          });
        },
      });
  }
}
