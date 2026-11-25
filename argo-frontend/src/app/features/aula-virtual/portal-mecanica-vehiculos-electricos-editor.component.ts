import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  LC_ZONAS,
  LcImagen,
  PortalLandingCursos,
} from '../../core/constants/landing-cursos-defaults';
import { AulaVirtualAdminService } from '../../core/services/aula-virtual-admin.service';
import { resolveUploadAssetUrl } from '../../core/utils/upload-asset-url.util';
import { removeAt } from './portal-landing-editor-helpers';

@Component({
  selector: 'argo-portal-mecanica-vehiculos-electricos-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-mecanica-vehiculos-electricos-editor.component.html',
  styleUrl: './portal-mecanica-vehiculos-electricos-editor.component.scss',
})
export class PortalMecanicaVehiculosElectricosEditorComponent {
  private api = inject(AulaVirtualAdminService);

  @Input({ required: true }) landing!: PortalLandingCursos;
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  readonly zonas = LC_ZONAS;

  nombreZona(zona: string): string {
    return this.zonas.find((z) => z.id === zona)?.label || 'Imagen';
  }
  uploadingId = signal<string | null>(null);

  previewUrl(img: LcImagen): string | null {
    return resolveUploadAssetUrl(img.urlAbsoluta || img.url);
  }

  addBloque(list: { titulo: string; texto: string }[]) {
    list.push({ titulo: '', texto: '' });
  }

  addDato() {
    this.landing.datos.push({ titulo: '', texto: '', precio: '' });
  }

  addModulo() {
    const n = String(this.landing.modulos.length + 1).padStart(2, '0');
    this.landing.modulos.push({ numero: n, titulo: '', texto: '' });
  }

  addParrafo() {
    this.landing.audienciaParrafos.push('');
  }

  addFaq() {
    this.landing.faq.push({ pregunta: '', respuesta: '' });
  }

  addImagen() {
    this.landing.imagenes.push({
      id: `img-${Date.now().toString(36)}`,
      etiqueta: 'Imagen nueva',
      zona: 'galeria',
      url: '',
      urlAbsoluta: '',
      alt: '',
    });
  }

  quitarDeLista<T>(list: T[], index: number) {
    removeAt(list, index);
  }

  onImagenSelected(ev: Event, img: LcImagen) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const esWebp = file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp');
    if (!esWebp) {
      this.avNotice.emit({ message: 'Solo se acepta WebP. Convierta la imagen y vuelva a cargarla.', error: true });
      return;
    }
    this.uploadingId.set(img.id);
    this.api
      .subirImagenMecanicaVehiculosElectricosPortal(file, img.id, {
        etiqueta: img.etiqueta,
        zona: img.zona,
        alt: img.alt,
      })
      .pipe(finalize(() => this.uploadingId.set(null)))
      .subscribe({
        next: (res) => {
          img.url = res.url;
          img.urlAbsoluta = res.urlAbsoluta || '';
          this.avNotice.emit({ message: res.message || 'Imagen actualizada' });
        },
        error: (e) => {
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo subir la imagen',
            error: true,
          });
        },
      });
  }

  quitarArchivo(img: LcImagen) {
    this.uploadingId.set(img.id);
    this.api
      .quitarImagenMecanicaVehiculosElectricosPortal(img.id, false)
      .pipe(finalize(() => this.uploadingId.set(null)))
      .subscribe({
        next: (res) => {
          img.url = '';
          img.urlAbsoluta = '';
          this.avNotice.emit({ message: res.message || 'Imagen quitada' });
        },
        error: (e) => {
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo quitar la imagen',
            error: true,
          });
        },
      });
  }

  eliminarImagen(index: number) {
    const img = this.landing.imagenes[index];
    if (!img) return;
    if (!confirm('¿Eliminar esta imagen de la landing?')) return;
    if (!img.url) {
      this.landing.imagenes.splice(index, 1);
      return;
    }
    this.uploadingId.set(img.id);
    this.api
      .quitarImagenMecanicaVehiculosElectricosPortal(img.id, true)
      .pipe(finalize(() => this.uploadingId.set(null)))
      .subscribe({
        next: (res) => {
          this.landing.imagenes.splice(index, 1);
          this.avNotice.emit({ message: res.message || 'Imagen eliminada' });
        },
        error: (e) => {
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo eliminar la imagen',
            error: true,
          });
        },
      });
  }
}
