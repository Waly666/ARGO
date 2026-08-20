import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { PortalPopupConfig } from '../../core/portal-landing';
import { resolveUploadUrl } from '../../core/upload-url.util';

const STORAGE_KEY = 'av-portal-popup-dismissed';

@Component({
  selector: 'av-portal-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portal-popup.component.html',
  styleUrl: './portal-popup.component.scss',
})
export class PortalPopupComponent implements OnChanges {
  private router = inject(Router);
  private doc = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);

  @Input({ required: true }) config!: PortalPopupConfig | null | undefined;
  /** Incrementar al recargar config del portal para reevaluar frecuencia «cada recarga». */
  @Input() openTick = 0;

  visible = signal(false);

  private autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] || changes['openTick']) {
      this.evaluate();
    }
  }

  imagenSrc(): string {
    const p = this.config;
    if (!p) return '';
    return resolveUploadUrl(p.imagenUrlAbsoluta || p.imagenUrl) || '';
  }

  cerrar(recordar = true): void {
    const p = this.config;
    if (recordar && p?.frecuencia === 'primera_vez') {
      try {
        localStorage.setItem(STORAGE_KEY, p.imagenUrl || '1');
      } catch {
        /* ignore */
      }
    }
    this.visible.set(false);
    this.clearTimer();
    this.doc.body.classList.remove('av-popup-open');
  }

  onBackdropClick(): void {
    if (this.config?.mostrarBotonCerrar !== false) {
      this.cerrar(true);
    }
  }

  private evaluate(): void {
    this.clearTimer();
    this.doc.body.classList.remove('av-popup-open');

    const p = this.config;
    const src = this.imagenSrc();
    if (!p?.activo || !src || !this.esRutaPublica()) {
      this.visible.set(false);
      return;
    }

    if (p.frecuencia === 'primera_vez' && this.yaVisto(p)) {
      this.visible.set(false);
      return;
    }

    this.visible.set(true);
    this.doc.body.classList.add('av-popup-open');

    if (p.duracionSegundos > 0) {
      this.autoCloseTimer = setTimeout(() => this.cerrar(true), p.duracionSegundos * 1000);
    }
  }

  private esRutaPublica(): boolean {
    const url = this.router.url.split('?')[0];
    return !url.startsWith('/aula') && !url.startsWith('/login');
  }

  private yaVisto(p: PortalPopupConfig): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === (p.imagenUrl || '1');
    } catch {
      return false;
    }
  }

  private clearTimer(): void {
    if (this.autoCloseTimer != null) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }
}
