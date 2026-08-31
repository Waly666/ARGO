import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  TRABAJO_EN_ALTURAS_LANDING_DEFAULTS,
  mergeTrabajoEnAlturasLanding,
  PortalTrabajoEnAlturasLanding,
  TaArticuloNormativo,
  TaFaq,
  TaHomeItem,
  TaImagen,
  TaModulo,
  TaNavItem,
  TaOperacionSector,
} from '../../core/constants/trabajo-en-alturas-landing-defaults';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { resolveUploadAssetUrl } from '../../core/utils/upload-asset-url.util';
import {
  addNavItem,
  PORTAL_EDITOR_ACENTOS,
  removeAt,
} from './portal-landing-editor-helpers';
import { PortalEditorFaqListComponent } from './portal-editor-faq-list.component';
import { PortalEditorStringListComponent } from './portal-editor-string-list.component';
import { PortalPromoHeroFieldsEditorComponent } from './portal-promo-hero-fields-editor.component';

@Component({
  selector: 'argo-portal-trabajo-en-alturas-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalEditorStringListComponent, PortalEditorFaqListComponent, PortalPromoHeroFieldsEditorComponent],
  templateUrl: './portal-trabajo-en-alturas-editor.component.html',
  styleUrl: './portal-trabajo-en-alturas-editor.component.scss',
})
export class PortalTrabajoEnAlturasEditorComponent {
  private api = inject(AulaVirtualAdminService);

  @Input({ required: true }) trabajoEnAlturas!: PortalTrabajoEnAlturasLanding;
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  uploadingId = signal<string | null>(null);
  readonly acentos = PORTAL_EDITOR_ACENTOS;

  readonly removeItem = removeAt;
  readonly addNav = addNavItem;

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

  addHeroParrafo() {
    this.trabajoEnAlturas.heroParrafos.push('');
  }

  addHomeItem() {
    const n = this.trabajoEnAlturas.homeItems.length + 1;
    this.trabajoEnAlturas.homeItems.push({
      numero: n,
      icon: 'document',
      acento: 'purple',
      titulo: '',
      texto: '',
    } satisfies TaHomeItem);
  }

  addDestacado() {
    this.trabajoEnAlturas.normativaDestacados.push({ etiqueta: '', valor: '', detalle: '' });
  }

  addArticulo() {
    this.trabajoEnAlturas.normativaArticulos.push({ articulo: '', titulo: '', texto: '' } satisfies TaArticuloNormativo);
  }

  addTituloTexto(list: { titulo: string; texto: string }[]) {
    list.push({ titulo: '', texto: '' });
  }

  addSectorOp() {
    this.trabajoEnAlturas.sectorOperaciones.push({ titulo: '', texto: '' } satisfies TaOperacionSector);
  }

  addModulo() {
    const n = this.trabajoEnAlturas.modulos.length + 1;
    this.trabajoEnAlturas.modulos.push({
      numero: n,
      titulo: '',
      resumen: '',
      thumbUrl: '',
    } satisfies TaModulo);
  }

  addDocumento(grupoIndex: number) {
    const grupo = this.trabajoEnAlturas.documentosGrupos[grupoIndex];
    if (!grupo) return;
    grupo.documentos.push({ titulo: '', descripcion: '', archivoUrl: '', meta: 'PDF' });
  }

  addDocumentoGrupo() {
    this.trabajoEnAlturas.documentosGrupos.push({
      id: `grupo-${Date.now()}`,
      kicker: '',
      titulo: '',
      lead: '',
      documentos: [],
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
