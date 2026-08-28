import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  MAX_PUBLICIDAD_SLIDES,
  PortalPublicidadLanding,
  PortalPublicidadSlide,
} from '../../core/constants/portal-landing-defaults';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';

@Component({
  selector: 'argo-portal-home-publicidad-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-home-publicidad-editor.component.html',
  styleUrl: './portal-home-publicidad-editor.component.scss',
})
export class PortalHomePublicidadEditorComponent {
  private api = inject(AulaVirtualAdminService);

  @Input({ required: true }) publicidadInicio!: PortalPublicidadLanding;
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  readonly maxSlides = MAX_PUBLICIDAD_SLIDES;
  uploading = signal(false);

  totalSlides(): number {
    return this.publicidadInicio?.slides?.length || 0;
  }

  puedeAgregar(): boolean {
    return this.totalSlides() < MAX_PUBLICIDAD_SLIDES;
  }

  previewUrl(slide: PortalPublicidadSlide): string | null {
    const rel = slide.urlAbsoluta || slide.url;
    if (!rel) return null;
    if (/^https?:\/\//i.test(rel)) return rel;
    if (rel.startsWith('/uploads/')) return rel;
    if (rel.startsWith('/')) return rel;
    const base = environment.uploadsUrl.replace(/\/+$/, '');
    return `${base}/${rel.replace(/^\/+/, '')}`;
  }

  onArchivoSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.puedeAgregar()) return;

    this.uploading.set(true);
    this.api
      .subirImagenHomePublicidadPortal(file)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (res) => {
          this.syncFromConfig(res.config);
          this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen de publicidad agregada' });
        },
        error: (e) =>
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo subir la imagen',
            error: true,
          }),
      });
  }

  confirmarEliminar(slide: PortalPublicidadSlide) {
    if (!slide.url?.trim()) return;
    if (!confirm('¿Quitar esta imagen del carrusel del inicio?')) return;

    this.uploading.set(true);
    this.api
      .eliminarImagenHomePublicidadPortal(slide.url)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (res) => {
          this.syncFromConfig(res.config);
          this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen eliminada' });
        },
        error: (e) =>
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo eliminar',
            error: true,
          }),
      });
  }

  private syncFromConfig(config: PortalAulaConfig) {
    const pub = config.landing?.publicidadInicio;
    if (!pub) return;
    this.publicidadInicio.activo = pub.activo !== false;
    this.publicidadInicio.intervaloSegundos = pub.intervaloSegundos ?? 5;
    this.publicidadInicio.slides = (pub.slides || []).map((s) => ({ ...s }));
  }
}
