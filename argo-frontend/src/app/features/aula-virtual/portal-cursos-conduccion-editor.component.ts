import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  CURSOS_CONDUCCION_LANDING_DEFAULTS,
  mergeCursosConduccionLanding,
  PortalCursosConduccionLanding,
} from '../../core/constants/cursos-conduccion-landing-defaults';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'argo-portal-cursos-conduccion-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-cursos-conduccion-editor.component.html',
  styleUrl: './portal-cursos-conduccion-editor.component.scss',
})
export class PortalCursosConduccionEditorComponent {
  private svc = inject(AulaVirtualAdminService);

  @Input({ required: true }) cursosConduccion!: PortalCursosConduccionLanding;
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  uploadIndex = signal<number | null>(null);
  heroUploading = signal(false);

  restaurarDefaults() {
    Object.assign(this.cursosConduccion, mergeCursosConduccionLanding(CURSOS_CONDUCCION_LANDING_DEFAULTS));
  }

  addResolucion() {
    this.cursosConduccion.resoluciones.push({ titulo: '', archivoUrl: '', nombreArchivo: '' });
  }

  removeResolucion(i: number) {
    this.cursosConduccion.resoluciones.splice(i, 1);
  }

  addLicencia() {
    this.cursosConduccion.licencias.items.push({
      icon: '🚗',
      codigo: '',
      titulo: '',
      incluye: [''],
      licenciaLabel: '',
      valor: '',
      btnTexto: 'Solicitar ahora',
      btnUrl: '/registro',
      destacada: false,
    });
  }

  removeLicencia(i: number) {
    this.cursosConduccion.licencias.items.splice(i, 1);
  }

  addLicenciaIncluye(licIdx: number) {
    this.cursosConduccion.licencias.items[licIdx]?.incluye.push('');
  }

  removeLicenciaIncluye(licIdx: number, lineIdx: number) {
    this.cursosConduccion.licencias.items[licIdx]?.incluye.splice(lineIdx, 1);
  }

  addBeneficio() {
    this.cursosConduccion.invitacion.beneficios.push({ icon: '✦', titulo: '', texto: '' });
  }

  removeBeneficio(i: number) {
    this.cursosConduccion.invitacion.beneficios.splice(i, 1);
  }

  tieneImagenHero(): boolean {
    return !!this.cursosConduccion.hero?.imagenUrl?.trim();
  }

  heroPreviewUrl(): string | null {
    const rel = this.cursosConduccion.hero?.imagenUrl?.trim();
    if (!rel) return null;
    if (/^https?:\/\//i.test(rel)) return rel;
    if (rel.startsWith('/uploads/')) return rel;
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
      .subirImagenCursosConduccionPortal(file)
      .pipe(
        finalize(() => {
          this.heroUploading.set(false);
          input.value = '';
        }),
      )
      .subscribe({
        next: (res) => {
          const hero = res.config.landing?.cursosConduccion?.hero;
          if (hero) {
            this.cursosConduccion.hero = { ...this.cursosConduccion.hero, ...hero };
          }
          this.portalConfigUpdated.emit(res.config);
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

  quitarImagenHero() {
    this.heroUploading.set(true);
    this.svc
      .quitarImagenCursosConduccionPortal()
      .pipe(finalize(() => this.heroUploading.set(false)))
      .subscribe({
        next: (res) => {
          const hero = res.config.landing?.cursosConduccion?.hero;
          if (hero) {
            this.cursosConduccion.hero = { ...this.cursosConduccion.hero, ...hero };
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

  archivoPreviewUrl(archivoUrl: string | undefined): string | null {
    const rel = archivoUrl?.trim();
    if (!rel) return null;
    if (/^https?:\/\//i.test(rel)) return rel;
    if (rel.startsWith('/uploads/')) return rel;
    if (rel.startsWith('/')) return rel;
    const base = environment.uploadsUrl.replace(/\/+$/, '');
    return `${base}/${rel.replace(/^\/+/, '')}`;
  }

  onResolucionArchivo(ev: Event, index: number) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadIndex.set(index);
    this.svc
      .subirArchivoCursosConduccionPortal(file)
      .pipe(
        finalize(() => {
          this.uploadIndex.set(null);
          input.value = '';
        }),
      )
      .subscribe({
        next: (res) => {
          const item = this.cursosConduccion.resoluciones[index];
          if (item) {
            item.archivoUrl = res.archivoUrl;
            item.nombreArchivo = res.nombreArchivo;
          }
          this.avNotice.emit({
            message: res.message || 'Archivo cargado. Publique los cambios del sitio para que se vea en el portal.',
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
    const item = this.cursosConduccion.resoluciones[index];
    if (!item) return;
    item.archivoUrl = '';
    item.nombreArchivo = '';
    this.avNotice.emit({ message: 'Archivo quitado de esta resolución. Publique los cambios del sitio.' });
  }
}
