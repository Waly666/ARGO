import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  TRABAJO_EN_ALTURAS_LANDING_DEFAULTS,
  mergeTrabajoEnAlturasLanding,
  PortalTrabajoEnAlturasLanding,
  TaImagen,
} from '../../core/constants/trabajo-en-alturas-landing-defaults';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { resolveUploadAssetUrl } from '../../core/utils/upload-asset-url.util';

@Component({
  selector: 'argo-portal-trabajo-en-alturas-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-trabajo-en-alturas-editor.component.html',
  styleUrl: './portal-trabajo-en-alturas-editor.component.scss',
})
export class PortalTrabajoEnAlturasEditorComponent {
  private api = inject(AulaVirtualAdminService);

  @Input({ required: true }) trabajoEnAlturas!: PortalTrabajoEnAlturasLanding;
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  uploadingId = signal<string | null>(null);

  restaurarDefaults() {
    if (!confirm('¿Restaurar todos los textos por defecto de trabajo en alturas? Las imágenes subidas se conservan.')) {
      return;
    }
    const imagenes = [...(this.trabajoEnAlturas.imagenes || [])];
    Object.assign(
      this.trabajoEnAlturas,
      mergeTrabajoEnAlturasLanding(TRABAJO_EN_ALTURAS_LANDING_DEFAULTS),
    );
    this.trabajoEnAlturas.imagenes = imagenes;
  }

  previewUrl(img: TaImagen): string | null {
    return resolveUploadAssetUrl(img.urlAbsoluta || img.url);
  }

  onImagenSelected(ev: Event, imagenId: string) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.uploadingId.set(imagenId);
    this.api
      .subirImagenTrabajoEnAlturasPortal(file, imagenId)
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
      .quitarImagenTrabajoEnAlturasPortal(imagenId)
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
    const idx = this.trabajoEnAlturas.imagenes.findIndex((i) => i.id === imagenId);
    if (idx < 0) return;
    this.trabajoEnAlturas.imagenes[idx] = {
      ...this.trabajoEnAlturas.imagenes[idx],
      url,
      urlAbsoluta: urlAbsoluta || '',
    };
  }
}
