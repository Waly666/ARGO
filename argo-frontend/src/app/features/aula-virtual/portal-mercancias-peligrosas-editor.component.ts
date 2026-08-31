import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  MERCANCIAS_PELIGROSAS_LANDING_DEFAULTS,
  mergeMercanciasPeligrosasLanding,
  MpImagen,
  PortalMercanciasPeligrosasLanding,
} from '../../core/constants/mercancias-peligrosas-landing-defaults';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { resolveUploadAssetUrl } from '../../core/utils/upload-asset-url.util';

@Component({
  selector: 'argo-portal-mercancias-peligrosas-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-mercancias-peligrosas-editor.component.html',
  styleUrl: './portal-mercancias-peligrosas-editor.component.scss',
})
export class PortalMercanciasPeligrosasEditorComponent {
  private api = inject(AulaVirtualAdminService);

  @Input({ required: true }) mercanciasPeligrosas!: PortalMercanciasPeligrosasLanding;
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  uploadingId = signal<string | null>(null);

  restaurarDefaults() {
    if (!confirm('¿Restaurar todos los textos por defecto de mercancías peligrosas? Las imágenes subidas se conservan.')) {
      return;
    }
    const imagenes = [...(this.mercanciasPeligrosas.imagenes || [])];
    Object.assign(
      this.mercanciasPeligrosas,
      mergeMercanciasPeligrosasLanding(MERCANCIAS_PELIGROSAS_LANDING_DEFAULTS),
    );
    this.mercanciasPeligrosas.imagenes = imagenes;
  }

  previewUrl(img: MpImagen): string | null {
    return resolveUploadAssetUrl(img.urlAbsoluta || img.url);
  }

  onImagenSelected(ev: Event, imagenId: string) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.uploadingId.set(imagenId);
    this.api
      .subirImagenMercanciasPeligrosasPortal(file, imagenId)
      .pipe(finalize(() => this.uploadingId.set(null)))
      .subscribe({
        next: (res) => {
          this.syncImagen(imagenId, res.url, res.urlAbsoluta);
          if (res.config) this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen actualizada' });
        },
        error: (e) =>
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo subir la imagen',
            error: true,
          }),
      });
  }

  quitarImagen(imagenId: string) {
    if (!confirm('¿Quitar esta imagen de la página?')) return;
    this.uploadingId.set(imagenId);
    this.api
      .quitarImagenMercanciasPeligrosasPortal(imagenId)
      .pipe(finalize(() => this.uploadingId.set(null)))
      .subscribe({
        next: (res) => {
          this.syncImagen(imagenId, '', '');
          if (res.config) this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen eliminada' });
        },
        error: (e) =>
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo eliminar la imagen',
            error: true,
          }),
      });
  }

  private syncImagen(imagenId: string, url: string, urlAbsoluta?: string) {
    const idx = this.mercanciasPeligrosas.imagenes.findIndex((i) => i.id === imagenId);
    if (idx < 0) return;
    this.mercanciasPeligrosas.imagenes[idx] = {
      ...this.mercanciasPeligrosas.imagenes[idx],
      url,
      urlAbsoluta: urlAbsoluta || '',
    };
  }
}
