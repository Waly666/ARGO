import { CommonModule, isPlatformBrowser, NgClass } from '@angular/common';
import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { mergePortalLanding } from '../../core/portal-landing';
import { PortalSeoService } from '../../core/portal-seo.service';
import { PortalConfig } from '../../core/models';
import { resolveUploadUrl } from '../../core/upload-url.util';
import { RevealOnScrollDirective } from '../../core/reveal-on-scroll.directive';
import { PortalIconComponent } from '../../shared/portal-icon/portal-icon.component';
import {
  mergeMercanciasPeligrosasLanding,
  MpImagen,
  PortalMercanciasPeligrosasLanding,
} from './mercancias-peligrosas-content';

@Component({
  selector: 'av-mercancias-peligrosas',
  standalone: true,
  imports: [CommonModule, RouterLink, NgClass, RevealOnScrollDirective, PortalIconComponent],
  templateUrl: './mercancias-peligrosas.component.html',
  styleUrl: './mercancias-peligrosas.component.scss',
})
export class MercanciasPeligrosasComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);
  private platformId = inject(PLATFORM_ID);

  config = signal<PortalConfig | null>(null);
  navAbierto = signal(false);

  contenido = computed(() =>
    mergeMercanciasPeligrosasLanding(
      mergePortalLanding(this.config()?.landing).mercanciasPeligrosas,
    ),
  );

  totalDocumentos = computed(() =>
    this.contenido().documentosGrupos.reduce((sum, g) => sum + (g.documentos?.length || 0), 0),
  );

  claseAcento(numero: number): string {
    const acentos = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'];
    return acentos[Math.max(0, Math.min(8, numero - 1))] || 'c1';
  }

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.seo.applyMercanciasPeligrosas(c);
      },
      error: () => this.seo.applyMercanciasPeligrosas(null),
    });
  }

  imagenUrl(img: MpImagen | undefined): string | null {
    if (!img) return null;
    const url = img.urlAbsoluta?.trim() || img.url?.trim();
    if (!url) return null;
    return resolveUploadUrl(url) || url;
  }

  imagenPorId(c: PortalMercanciasPeligrosasLanding, id: string): MpImagen | undefined {
    return c.imagenes.find((i) => i.id === id);
  }

  documentoUrl(doc: { archivoUrl?: string; externo?: boolean }): string | null {
    const url = doc.archivoUrl?.trim();
    if (!url) return null;
    if (doc.externo || /^https?:\/\//i.test(url)) return url;
    return resolveUploadUrl(url) || url;
  }

  enlaceCursoHref(): string | null {
    const raw = this.contenido().enlaceCursoUrl?.trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  enlaceCursoExterno(): boolean {
    const url = this.contenido().enlaceCursoUrl?.trim() || '';
    return /^https?:\/\//i.test(url);
  }

  tieneEnlaceCurso(): boolean {
    return !!this.enlaceCursoHref();
  }

  scrollTo(id: string) {
    this.navAbierto.set(false);
    if (!isPlatformBrowser(this.platformId)) return;
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggleNav() {
    this.navAbierto.update((v) => !v);
  }
}
