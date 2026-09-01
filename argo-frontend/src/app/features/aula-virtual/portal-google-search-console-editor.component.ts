import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';

@Component({
  selector: 'argo-portal-google-search-console-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portal-google-search-console-editor.component.html',
  styleUrl: './portal-google-search-console-editor.component.scss',
})
export class PortalGoogleSearchConsoleEditorComponent {
  private svc = inject(AulaVirtualAdminService);

  @Input() portalUrl = '';
  @Input() filename = '';
  @Input() publicUrl = '';
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  uploading = signal(false);
  removing = signal(false);

  verificationHref(): string | null {
    const rel = this.publicUrl?.trim() || (this.filename ? `/${this.filename}` : '');
    if (!rel) return null;
    const base = this.portalUrl?.replace(/\/+$/, '') || '';
    return `${base}${rel.startsWith('/') ? rel : `/${rel}`}`;
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.uploading.set(true);
    this.svc
      .subirGoogleSearchConsolePortal(file)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (res) => {
          this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({
            message:
              res.message ||
              'Archivo publicado. Abra el enlace en una ventana de incógnito y pulse Verificar en Google.',
          });
        },
        error: (e) =>
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo subir el archivo de verificación',
            error: true,
          }),
      });
  }

  quitar(): void {
    if (!this.filename) return;
    this.removing.set(true);
    this.svc
      .quitarGoogleSearchConsolePortal()
      .pipe(finalize(() => this.removing.set(false)))
      .subscribe({
        next: (res) => {
          this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Verificación eliminada del portal' });
        },
        error: (e) =>
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo eliminar la verificación',
            error: true,
          }),
      });
  }
}
