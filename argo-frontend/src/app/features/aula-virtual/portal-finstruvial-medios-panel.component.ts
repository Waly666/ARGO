import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PortalFinstruvialServicioMedio } from '../../core/constants/finstruvial-servicio-landing.types';

export type PortalFinstruvialMedioTipoUi = 'imagen' | 'youtube' | 'archivo';

export interface PortalFinstruvialMediosEditorApi {
  lineaActiva(): string;
  uploadingId(): string | null;
  previewUrl(url?: string, urlAbsoluta?: string): string | null;
  videoUploadKey(videoId: string): string;
  onLineaImagen(ev: Event, imagenId: string): void;
  onLineaVideo(ev: Event, videoId: string): void;
  quitarLineaVideo(videoId: string): void;
  removeItem<T>(arr: T[], index: number): void;
  addMedio(target: 'intro' | 'producto', tipo: PortalFinstruvialMedioTipoUi): void;
  setMedioTipo(medio: PortalFinstruvialServicioMedio, tipo: PortalFinstruvialMedioTipoUi): void;
  medioTipoActual(medio: PortalFinstruvialServicioMedio): PortalFinstruvialMedioTipoUi;
  videoSubido(videoId: string): boolean;
  imagenSubida(imagenId: string): boolean;
  imagenEtiqueta(imagenId: string): string;
  imagenUrl(imagenId: string): string | null;
}

@Component({
  selector: 'argo-portal-finstruvial-medios-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-finstruvial-medios-panel.component.html',
  styleUrl: './portal-finstruvial-medios-panel.component.scss',
})
export class PortalFinstruvialMediosPanelComponent {
  @Input({ required: true }) editor!: PortalFinstruvialMediosEditorApi;
  @Input({ required: true }) medios!: PortalFinstruvialServicioMedio[];
  @Input({ required: true }) target!: 'intro' | 'producto';
  @Input() titulo = 'Galería multimedia';
  @Input() descripcion = 'Fotos o videos que aparecen debajo del texto, en el orden que los añada.';
  @Input() vacioHint = 'Todavía no hay medios. Use los botones de abajo para añadir una imagen o un video.';

  readonly tipos: { id: PortalFinstruvialMedioTipoUi; icono: string; etiqueta: string }[] = [
    { id: 'imagen', icono: '📷', etiqueta: 'Imagen' },
    { id: 'youtube', icono: '▶️', etiqueta: 'YouTube' },
    { id: 'archivo', icono: '📁', etiqueta: 'Archivo MP4' },
  ];

  tipoActual(medio: PortalFinstruvialServicioMedio): PortalFinstruvialMedioTipoUi {
    return this.editor.medioTipoActual(medio);
  }

  cambiarTipo(medio: PortalFinstruvialServicioMedio, tipo: PortalFinstruvialMedioTipoUi) {
    this.editor.setMedioTipo(medio, tipo);
  }

  quitar(index: number) {
    this.editor.removeItem(this.medios, index);
  }

  anadir(tipo: PortalFinstruvialMedioTipoUi) {
    this.editor.addMedio(this.target, tipo);
  }

  subiendoImagen(imagenId: string): boolean {
    return this.editor.uploadingId() === `${this.editor.lineaActiva()}:${imagenId}`;
  }

  subiendoVideo(videoId: string): boolean {
    return this.editor.uploadingId() === this.editor.videoUploadKey(videoId);
  }
}
