import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { PortalPopupConfig } from '../../core/constants/portal-landing-defaults';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'argo-portal-popup-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-popup-editor.component.html',
  styleUrl: './portal-popup-editor.component.scss',
})
export class PortalPopupEditorComponent {
  private svc = inject(AulaVirtualAdminService);

  @Input({ required: true }) popup!: PortalPopupConfig;
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  imagenUploading = signal(false);

  popupPreviewUrl(): string | null {
    const rel = this.popup.imagenUrl?.trim();
    if (!rel) return null;
    if (/^https?:\/\//i.test(rel)) return rel;
    if (rel.startsWith('/uploads/')) return rel;
    if (rel.startsWith('/')) return rel;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}/uploads/${rel}`;
  }

  onImagenSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.imagenUploading.set(true);
    this.svc
      .subirImagenPopupPortal(file)
      .pipe(finalize(() => this.imagenUploading.set(false)))
      .subscribe({
        next: (res) => {
          this.portalConfigUpdated.emit(res.config);
          if (res.config.landing?.popup) {
            Object.assign(this.popup, res.config.landing.popup);
          }
          this.avNotice.emit({ message: res.message || 'Imagen del popup actualizada' });
        },
        error: (e) => this.avNotice.emit({ message: e?.error?.message || 'No se pudo subir la imagen', error: true }),
      });
  }

  quitarImagen(): void {
    this.imagenUploading.set(true);
    this.svc
      .quitarImagenPopupPortal()
      .pipe(finalize(() => this.imagenUploading.set(false)))
      .subscribe({
        next: (res) => {
          this.portalConfigUpdated.emit(res.config);
          if (res.config.landing?.popup) {
            Object.assign(this.popup, res.config.landing.popup);
          }
          this.avNotice.emit({ message: res.message || 'Imagen del popup eliminada' });
        },
        error: (e) => this.avNotice.emit({ message: e?.error?.message || 'No se pudo quitar la imagen', error: true }),
      });
  }
}
