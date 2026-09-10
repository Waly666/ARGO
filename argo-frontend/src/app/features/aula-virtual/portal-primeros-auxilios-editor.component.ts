import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  PRIMEROS_AUXILIOS_LANDING,
  mergePrimerosAuxiliosLanding,
  PaImagen,
  PortalPrimerosAuxiliosLanding,
  promptFotoHorizontal,
} from '../../core/constants/primeros-auxilios-landing-defaults';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { resolveUploadAssetUrl } from '../../core/utils/upload-asset-url.util';
import { PORTAL_EDITOR_ACENTOS, removeAt } from './portal-landing-editor-helpers';
import { PortalEditorFaqListComponent } from './portal-editor-faq-list.component';
import { PortalEditorStringListComponent } from './portal-editor-string-list.component';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';

import { PortalSeoLegendComponent } from './portal-seo-legend.component';

import { PortalFieldLabelComponent } from './portal-field-label.component';

@Component({
  selector: 'argo-portal-primeros-auxilios-editor',
  standalone: true,
  imports: [
    PortalEditorFaqListComponent,
    PortalEditorStringListComponent,
    PortalFieldLabelComponent,
    PortalSeoLegendComponent,
    CommonModule,
    FormsModule,
    CatalogoEnumBuscarComponent,
  ],
  templateUrl: './portal-primeros-auxilios-editor.component.html',
  styleUrl: './portal-primeros-auxilios-editor.component.scss',
})
export class PortalPrimerosAuxiliosEditorComponent implements OnInit {
  private api = inject(AulaVirtualAdminService);

  @Input({ required: true }) primerosAuxilios!: PortalPrimerosAuxiliosLanding;
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  uploadingId = signal<string | null>(null);
  readonly acentos = PORTAL_EDITOR_ACENTOS;
  readonly removeItem = removeAt;
  opcionesCursos = signal<EnumBuscarOption[]>([]);
  copiadoPromptId = signal<string | null>(null);

  ngOnInit() {
    this.api.listarCursos().subscribe({
      next: (rows) => {
        this.opcionesCursos.set(
          (rows || []).map((c) => ({
            value: c.idPrograma,
            label: String(c.nombreProg || '').trim() || c.idPrograma,
            hint: c.publicadoPortal === false ? 'Aún no publicado en el portal' : undefined,
          })),
        );
      },
      error: () => {
        this.opcionesCursos.set([]);
      },
    });
  }

  onCursoPick(opt: EnumBuscarOption) {
    const id = String(opt.value || '').trim();
    this.primerosAuxilios.idProgramaVinculado = id;
    this.primerosAuxilios.nombreProgramaVinculado = opt.label;
    if (!id) return;
    const url = `/cursos/${id}`;
    this.primerosAuxilios.ctaInscribirseUrl = url;
    const virtual = this.primerosAuxilios.virtual;
    if (!virtual.ctaUrl?.trim() || virtual.ctaUrl === '/cursos' || virtual.ctaUrl.startsWith('/cursos/')) {
      virtual.ctaUrl = url;
    }
  }

  onCursoLimpiar() {
    this.primerosAuxilios.idProgramaVinculado = '';
    this.primerosAuxilios.nombreProgramaVinculado = '';
    this.primerosAuxilios.ctaInscribirseUrl = '/cursos';
    const virtual = this.primerosAuxilios.virtual;
    if (virtual.ctaUrl?.startsWith('/cursos/')) virtual.ctaUrl = '/cursos';
  }

  restaurarDefaults() {
    if (
      !confirm(
        '¿Restaurar los textos por defecto del curso de Primeros auxilios? Las imágenes subidas se conservan.',
      )
    ) {
      return;
    }
    const imagenes = [...(this.primerosAuxilios.imagenes || [])];
    const idProgramaVinculado = this.primerosAuxilios.idProgramaVinculado;
    const nombreProgramaVinculado = this.primerosAuxilios.nombreProgramaVinculado;
    Object.assign(this.primerosAuxilios, mergePrimerosAuxiliosLanding(PRIMEROS_AUXILIOS_LANDING));
    this.primerosAuxilios.imagenes = imagenes;
    this.primerosAuxilios.idProgramaVinculado = idProgramaVinculado;
    this.primerosAuxilios.nombreProgramaVinculado = nombreProgramaVinculado;
    if (idProgramaVinculado) {
      this.primerosAuxilios.ctaInscribirseUrl = `/cursos/${idProgramaVinculado}`;
    }
  }

  async copiarPrompt(img: PaImagen) {
    const text =
      (img.promptImagen || '').trim() || promptFotoHorizontal(img.alt || img.etiqueta || '');
    if (!text) {
      this.avNotice.emit({ message: 'No hay prompt para copiar', error: true });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      this.copiadoPromptId.set(img.id);
      this.avNotice.emit({ message: 'Prompt copiado' });
      window.setTimeout(() => {
        if (this.copiadoPromptId() === img.id) this.copiadoPromptId.set(null);
      }, 2000);
    } catch {
      this.avNotice.emit({
        message: 'No se pudo copiar. Seleccione el texto y use Ctrl+C.',
        error: true,
      });
    }
  }

  previewUrl(img: PaImagen): string | null {
    return resolveUploadAssetUrl(img.urlAbsoluta || img.url);
  }

  onImagenSelected(ev: Event, imagenId: string) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.uploadingId.set(imagenId);
    this.api
      .subirImagenPrimerosAuxiliosPortal(file, imagenId)
      .pipe(finalize(() => this.uploadingId.set(null)))
      .subscribe({
        next: (res) => {
          this.syncImagen(imagenId, res.url, res.urlAbsoluta);
          if (res.config) this.portalConfigUpdated.emit(res.config);
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

  quitarImagen(imagenId: string) {
    if (!confirm('¿Quitar esta imagen?')) return;
    this.uploadingId.set(imagenId);
    this.api
      .quitarImagenPrimerosAuxiliosPortal(imagenId)
      .pipe(finalize(() => this.uploadingId.set(null)))
      .subscribe({
        next: (res) => {
          this.syncImagen(imagenId, '', '');
          if (res.config) this.portalConfigUpdated.emit(res.config);
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

  addHomeItem() {
    const n = this.primerosAuxilios.homeItems.length + 1;
    this.primerosAuxilios.homeItems.push({
      numero: n,
      icon: 'shield-check',
      acento: 'teal',
      titulo: '',
      texto: '',
    });
  }

  addPilar() {
    this.primerosAuxilios.pilares.push({ icono: '', titulo: '', texto: '' });
  }

  addAprendizaje() {
    const n = String(this.primerosAuxilios.aprendizajes.length + 1).padStart(2, '0');
    this.primerosAuxilios.aprendizajes.push({ numero: n, titulo: '', texto: '' });
  }

  addMetodologiaPaso() {
    this.primerosAuxilios.metodologiaPasos.push({ titulo: '', texto: '' });
  }

  addAudiencia() {
    this.primerosAuxilios.audiencias.push({ icono: '', titulo: '' });
  }

  addTestimonio() {
    this.primerosAuxilios.testimonios.push({ texto: '', autor: '', estrellas: 5 });
  }

  private syncImagen(imagenId: string, url: string, urlAbsoluta?: string) {
    const idx = this.primerosAuxilios.imagenes.findIndex((i) => i.id === imagenId);
    if (idx < 0) return;
    this.primerosAuxilios.imagenes[idx] = {
      ...this.primerosAuxilios.imagenes[idx],
      url,
      urlAbsoluta: urlAbsoluta || '',
    };
  }
}
