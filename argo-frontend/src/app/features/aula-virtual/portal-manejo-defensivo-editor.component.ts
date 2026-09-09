import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  MANEJO_DEFENSIVO_LANDING,
  mergeManejoDefensivoLanding,
  MdImagen,
  PortalManejoDefensivoLanding,
  promptFotoHorizontal,
} from '../../core/constants/manejo-defensivo-landing-defaults';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { resolveUploadAssetUrl } from '../../core/utils/upload-asset-url.util';
import { PORTAL_EDITOR_ACENTOS, removeAt } from './portal-landing-editor-helpers';
import { PortalEnlaceRelacionado } from '../../core/portal-enlace-relacionado.util';
import { PortalEditorEnlacesRelacionadosComponent } from './portal-editor-enlaces-relacionados.component';
import { PortalEditorFaqListComponent } from './portal-editor-faq-list.component';
import { PortalEditorStringListComponent } from './portal-editor-string-list.component';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';

@Component({
  selector: 'argo-portal-manejo-defensivo-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PortalEditorStringListComponent,
    PortalEditorFaqListComponent,
    PortalEditorEnlacesRelacionadosComponent,
    CatalogoEnumBuscarComponent,
  ],
  templateUrl: './portal-manejo-defensivo-editor.component.html',
  styleUrl: './portal-manejo-defensivo-editor.component.scss',
})
export class PortalManejoDefensivoEditorComponent implements OnInit {
  private api = inject(AulaVirtualAdminService);

  @Input({ required: true }) manejoDefensivo!: PortalManejoDefensivoLanding;
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  uploadingId = signal<string | null>(null);
  readonly acentos = PORTAL_EDITOR_ACENTOS;
  readonly removeItem = removeAt;
  opcionesCursos = signal<EnumBuscarOption[]>([]);
  copiadoPromptId = signal<string | null>(null);

  enlacesRelacionadosEdit(): PortalEnlaceRelacionado[] {
    if (!this.manejoDefensivo.enlacesRelacionados) {
      this.manejoDefensivo.enlacesRelacionados = [];
    }
    if (!this.manejoDefensivo.enlacesRelacionadosTitulo) {
      this.manejoDefensivo.enlacesRelacionadosTitulo = 'Formación relacionada en SERVIAL';
    }
    return this.manejoDefensivo.enlacesRelacionados;
  }

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
    this.manejoDefensivo.idProgramaVinculado = id;
    this.manejoDefensivo.nombreProgramaVinculado = opt.label;
    if (!id) return;
    const url = `/cursos/${id}`;
    this.manejoDefensivo.ctaInscribirseUrl = url;
    const virtual = this.manejoDefensivo.virtual;
    if (!virtual.ctaUrl?.trim() || virtual.ctaUrl === '/cursos' || virtual.ctaUrl.startsWith('/cursos/')) {
      virtual.ctaUrl = url;
    }
  }

  onCursoLimpiar() {
    this.manejoDefensivo.idProgramaVinculado = '';
    this.manejoDefensivo.nombreProgramaVinculado = '';
    this.manejoDefensivo.ctaInscribirseUrl = '/cursos';
    const virtual = this.manejoDefensivo.virtual;
    if (virtual.ctaUrl?.startsWith('/cursos/')) virtual.ctaUrl = '/cursos';
  }

  restaurarDefaults() {
    if (
      !confirm(
        '¿Restaurar los textos por defecto del curso de manejo defensivo? Las imágenes subidas se conservan.',
      )
    ) {
      return;
    }
    const imagenes = [...(this.manejoDefensivo.imagenes || [])];
    const idProgramaVinculado = this.manejoDefensivo.idProgramaVinculado;
    const nombreProgramaVinculado = this.manejoDefensivo.nombreProgramaVinculado;
    Object.assign(this.manejoDefensivo, mergeManejoDefensivoLanding(MANEJO_DEFENSIVO_LANDING));
    this.manejoDefensivo.imagenes = imagenes;
    this.manejoDefensivo.idProgramaVinculado = idProgramaVinculado;
    this.manejoDefensivo.nombreProgramaVinculado = nombreProgramaVinculado;
    if (idProgramaVinculado) {
      this.manejoDefensivo.ctaInscribirseUrl = `/cursos/${idProgramaVinculado}`;
    }
  }

  async copiarPrompt(img: MdImagen) {
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

  previewUrl(img: MdImagen): string | null {
    return resolveUploadAssetUrl(img.urlAbsoluta || img.url);
  }

  onImagenSelected(ev: Event, imagenId: string) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.uploadingId.set(imagenId);
    this.api
      .subirImagenManejoDefensivoPortal(file, imagenId)
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
      .quitarImagenManejoDefensivoPortal(imagenId)
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
    const n = this.manejoDefensivo.homeItems.length + 1;
    this.manejoDefensivo.homeItems.push({
      numero: n,
      icon: 'shield-check',
      acento: 'teal',
      titulo: '',
      texto: '',
    });
  }

  addPilar() {
    this.manejoDefensivo.pilares.push({ icono: '', titulo: '', texto: '' });
  }

  addAprendizaje() {
    const n = String(this.manejoDefensivo.aprendizajes.length + 1).padStart(2, '0');
    this.manejoDefensivo.aprendizajes.push({ numero: n, titulo: '', texto: '' });
  }

  addMetodologiaPaso() {
    this.manejoDefensivo.metodologiaPasos.push({ titulo: '', texto: '' });
  }

  addAudiencia() {
    this.manejoDefensivo.audiencias.push({ icono: '', titulo: '' });
  }

  addTestimonio() {
    this.manejoDefensivo.testimonios.push({ texto: '', autor: '', estrellas: 5 });
  }

  private syncImagen(imagenId: string, url: string, urlAbsoluta?: string) {
    const idx = this.manejoDefensivo.imagenes.findIndex((i) => i.id === imagenId);
    if (idx < 0) return;
    this.manejoDefensivo.imagenes[idx] = {
      ...this.manejoDefensivo.imagenes[idx],
      url,
      urlAbsoluta: urlAbsoluta || '',
    };
  }
}
