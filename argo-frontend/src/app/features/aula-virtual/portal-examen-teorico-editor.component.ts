import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  EXAMEN_TEORICO_LANDING_DEFAULTS,
  mergeExamenTeoricoLanding,
  PortalExamenTeoricoLanding,
} from '../../core/constants/examen-teorico-landing-defaults';
import { AulaVirtualAdminService } from '../../core/services/aula-virtual-admin.service';
import { resolveUploadAssetUrl } from '../../core/utils/upload-asset-url.util';

@Component({
  selector: 'argo-portal-examen-teorico-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-examen-teorico-editor.component.html',
  styleUrl: './portal-examen-teorico-editor.component.scss',
})
export class PortalExamenTeoricoEditorComponent {
  private svc = inject(AulaVirtualAdminService);

  @Input({ required: true }) examenTeorico!: PortalExamenTeoricoLanding;
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  uploadIndex = signal<number | null>(null);
  uploadNormIndex = signal<number | null>(null);
  readonly acentos = ['blue', 'teal', 'orange', 'green', 'purple'] as const;

  restaurarDefaults() {
    Object.assign(this.examenTeorico, mergeExamenTeoricoLanding(EXAMEN_TEORICO_LANDING_DEFAULTS));
  }

  addResolucion() {
    this.examenTeorico.resoluciones.push({ titulo: '', archivoUrl: '', nombreArchivo: '' });
  }

  removeResolucion(i: number) {
    this.examenTeorico.resoluciones.splice(i, 1);
  }

  archivoPreviewUrl(archivoUrl: string | undefined): string | null {
    return resolveUploadAssetUrl(archivoUrl);
  }

  onResolucionArchivo(ev: Event, index: number) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadIndex.set(index);
    this.svc
      .subirArchivoExamenTeoricoPortal(file, { tipo: 'resolucion', index })
      .pipe(
        finalize(() => {
          this.uploadIndex.set(null);
          input.value = '';
        }),
      )
      .subscribe({
        next: (res) => {
          const item = this.examenTeorico.resoluciones[index];
          if (item) {
            item.archivoUrl = res.archivoUrl;
            item.nombreArchivo = res.nombreArchivo;
          }
          this.avNotice.emit({
            message: res.message || 'Archivo cargado. Publique los cambios del sitio.',
          });
        },
        error: (e) => {
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo subir el archivo',
            error: true,
          });
        },
      });
  }

  quitarArchivoResolucion(index: number) {
    const item = this.examenTeorico.resoluciones[index];
    if (!item) return;
    item.archivoUrl = '';
    item.nombreArchivo = '';
    this.avNotice.emit({ message: 'Archivo quitado. Publique los cambios del sitio.' });
  }

  onNormogramaArchivo(ev: Event, index: number) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadNormIndex.set(index);
    this.svc
      .subirArchivoExamenTeoricoPortal(file, { tipo: 'normograma', index })
      .pipe(
        finalize(() => {
          this.uploadNormIndex.set(null);
          input.value = '';
        }),
      )
      .subscribe({
        next: (res) => {
          const item = this.examenTeorico.normograma.items[index];
          if (item) {
            item.archivoUrl = res.archivoUrl;
            item.nombreArchivo = res.nombreArchivo;
          }
          this.avNotice.emit({
            message: res.message || 'PDF de la norma cargado. Publique los cambios del sitio.',
          });
        },
        error: (e) => {
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo subir el archivo',
            error: true,
          });
        },
      });
  }

  quitarArchivoNormograma(index: number) {
    const item = this.examenTeorico.normograma.items[index];
    if (!item) return;
    item.archivoUrl = '';
    item.nombreArchivo = '';
    this.avNotice.emit({ message: 'PDF quitado. Publique los cambios del sitio.' });
  }
}
