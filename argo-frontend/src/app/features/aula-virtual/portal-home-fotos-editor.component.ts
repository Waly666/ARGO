import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  MAX_FOTOS_INICIO,
  PortalFotosInicioLanding,
  PortalHomeFoto,
} from '../../core/constants/portal-landing-defaults';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';

@Component({
  selector: 'argo-portal-home-fotos-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-home-fotos-editor.component.html',
  styleUrl: './portal-home-fotos-editor.component.scss',
})
export class PortalHomeFotosEditorComponent {
  private api = inject(AulaVirtualAdminService);

  @Input({ required: true }) fotosInicio!: PortalFotosInicioLanding;
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  readonly maxFotos = MAX_FOTOS_INICIO;
  uploading = signal(false);

  totalFotos = computed(() => this.fotosInicio?.fotos?.length || 0);
  puedeAgregar = computed(() => this.totalFotos() < MAX_FOTOS_INICIO);

  previewUrl(foto: PortalHomeFoto): string {
    const rel = foto.urlAbsoluta || foto.url;
    if (!rel) return '';
    if (/^https?:\/\//i.test(rel)) return rel;
    if (rel.startsWith('/uploads/')) {
      const base = environment.apiUrl.replace(/\/api\/?$/, '');
      return `${base}${rel}`;
    }
    if (rel.startsWith('/')) return rel;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}/uploads/${rel}`;
  }

  onArchivoSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.puedeAgregar()) return;

    this.uploading.set(true);
    this.api
      .subirImagenHomeFotoPortal(file)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (res) => {
          this.syncFromConfig(res.config);
          this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Foto agregada al inicio' });
        },
        error: (e) =>
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo subir la imagen',
            error: true,
          }),
      });
  }

  confirmarEliminar(foto: PortalHomeFoto) {
    const etiqueta = foto.leyenda?.trim() || 'esta foto';
    if (!confirm(`¿Quitar ${etiqueta} del inicio del sitio?`)) return;

    this.uploading.set(true);
    this.api
      .eliminarImagenHomeFotoPortal(foto.url)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (res) => {
          this.syncFromConfig(res.config);
          this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Foto eliminada' });
        },
        error: (e) =>
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo eliminar',
            error: true,
          }),
      });
  }

  private syncFromConfig(config: PortalAulaConfig) {
    const src = config.landing?.fotosInicio;
    if (!src) return;
    this.fotosInicio.kicker = src.kicker;
    this.fotosInicio.titulo = src.titulo;
    this.fotosInicio.lead = src.lead;
    this.fotosInicio.fotos = src.fotos.map((f) => ({ ...f }));
  }
}
