import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  PortalGaleriaFoto,
  PortalGaleriaLanding,
} from '../../core/constants/portal-landing-defaults';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { resolveUploadAssetUrl } from '../../core/utils/upload-asset-url.util';

const MAX_POR_LOTE = 30;

@Component({
  selector: 'argo-portal-galeria-fotos-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-galeria-fotos-editor.component.html',
  styleUrl: './portal-galeria-fotos-editor.component.scss',
})
export class PortalGaleriaFotosEditorComponent {
  private api = inject(AulaVirtualAdminService);

  @Input({ required: true }) galeria!: PortalGaleriaLanding;
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  uploading = signal(false);
  uploadProgress = signal('');
  busqueda = signal('');

  fotosFiltradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const fotos = this.galeria?.fotos || [];
    if (!q) return fotos;
    return fotos.filter((f) => f.leyenda.toLowerCase().includes(q) || f.url.toLowerCase().includes(q));
  });

  totalFotos = computed(() => this.galeria?.fotos?.length || 0);

  etiquetaSubida = computed(() => {
    if (this.uploadProgress()) return this.uploadProgress();
    return this.uploading() ? 'Subiendo…' : '+ Agregar archivos';
  });

  async onArchivosSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) return;

    const lotes: File[][] = [];
    for (let i = 0; i < files.length; i += MAX_POR_LOTE) {
      lotes.push(files.slice(i, i + MAX_POR_LOTE));
    }

    this.uploading.set(true);
    let lastConfig: PortalAulaConfig | null = null;
    let totalSubidos = 0;

    try {
      for (let i = 0; i < lotes.length; i++) {
        const lote = lotes[i];
        this.uploadProgress.set(
          lotes.length > 1 ? `Subiendo lote ${i + 1} de ${lotes.length} (${lote.length} archivos)…` : 'Subiendo…',
        );
        const res = await firstValueFrom(this.api.subirImagenesGaleriaPortal(lote));
        lastConfig = res.config;
        totalSubidos += lote.length;
      }
      if (lastConfig) {
        this.portalConfigUpdated.emit(lastConfig);
      }
      this.avNotice.emit({
        message:
          lotes.length > 1
            ? `${totalSubidos} archivo(s) subidos en ${lotes.length} lotes`
            : resumenSubida(totalSubidos),
      });
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.avNotice.emit({
        message:
          lastConfig && totalSubidos > 0
            ? `Se subieron ${totalSubidos} archivo(s), pero falló el resto: ${err?.error?.message || 'error desconocido'}`
            : err?.error?.message || 'No se pudieron subir los archivos',
        error: true,
      });
      if (lastConfig) {
        this.portalConfigUpdated.emit(lastConfig);
      }
    } finally {
      this.uploading.set(false);
      this.uploadProgress.set('');
    }
  }

  confirmarEliminar(foto: PortalGaleriaFoto) {
    const etiqueta = foto.leyenda?.trim() || foto.url.split('/').pop() || 'este archivo';
    if (!confirm(`¿Eliminar «${etiqueta}» del servidor y de la galería?`)) return;

    this.api.eliminarFotoGaleriaPortal(foto.url).subscribe({
      next: (res) => {
        this.portalConfigUpdated.emit(res.config);
        this.avNotice.emit({ message: res.message || 'Archivo eliminado' });
      },
      error: (e) =>
        this.avNotice.emit({
          message: e?.error?.message || 'No se pudo eliminar',
          error: true,
        }),
    });
  }

  previewUrl(foto: PortalGaleriaFoto): string {
    const rel = foto.urlAbsoluta || foto.url;
    if (!rel) return '';
    if (/^https?:\/\//i.test(rel)) return rel;
    const resolved = resolveUploadAssetUrl(rel);
    if (resolved) return resolved;
    const base = environment.uploadsUrl.replace(/\/+$/, '');
    const path = rel.replace(/^\/+/, '').replace(/^uploads\//, '');
    return `${base}/${path}`;
  }
}

function resumenSubida(n: number): string {
  return `${n} archivo${n === 1 ? '' : 's'} agregado${n === 1 ? '' : 's'} a la galería`;
}
