import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { PortalGaleriaLanding } from '../../core/constants/portal-landing-defaults';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'argo-portal-galeria-hero-imagen-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-galeria-hero-imagen-editor.component.html',
  styleUrl: './portal-galeria-hero-imagen-editor.component.scss',
})
export class PortalGaleriaHeroImagenEditorComponent {
  private svc = inject(AulaVirtualAdminService);

  @Input({ required: true }) galeria!: PortalGaleriaLanding;
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  heroUploading = signal(false);

  tieneImagenHero(): boolean {
    return !!this.galeria.heroImagenUrl?.trim();
  }

  heroPreviewUrl(): string | null {
    const rel = this.galeria.heroImagenUrl?.trim();
    if (!rel) return null;
    if (/^https?:\/\//i.test(rel)) return rel;
    if (rel.startsWith('/')) return rel;
    const base = environment.uploadsUrl.replace(/\/+$/, '');
    return `${base}/${rel.replace(/^\/+/, '')}`;
  }

  onHeroImagen(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.heroUploading.set(true);
    this.svc
      .subirImagenGaleriaHeroPortal(file)
      .pipe(
        finalize(() => {
          this.heroUploading.set(false);
          input.value = '';
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.config.landing?.galeria) {
            Object.assign(this.galeria, res.config.landing.galeria);
          }
          this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen del héroe de galería actualizada' });
        },
        error: (e) => {
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo subir la imagen',
            error: true,
          });
        },
      });
  }

  quitarImagenHero() {
    this.heroUploading.set(true);
    this.svc
      .quitarImagenGaleriaHeroPortal()
      .pipe(finalize(() => this.heroUploading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.config.landing?.galeria) {
            Object.assign(this.galeria, res.config.landing.galeria);
          }
          this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({
            message: res.message || 'Imagen del héroe eliminada; se usará la primera foto de la galería',
          });
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
