import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { mergePortalLanding, PortalGaleriaFoto } from '../../core/portal-landing';
import { PortalSeoService } from '../../core/portal-seo.service';
import { PortalConfig } from '../../core/models';
import { resolveUploadUrl } from '../../core/upload-url.util';

const POR_PAGINA = 24;

@Component({
  selector: 'av-galeria',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './galeria.component.html',
  styleUrl: './galeria.component.scss',
})
export class GaleriaComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);

  config = signal<PortalConfig | null>(null);
  pagina = signal(1);
  lightboxIndex = signal<number | null>(null);

  landing = computed(() => mergePortalLanding(this.config()?.landing));
  galeria = computed(() => this.landing().galeria);
  todasFotos = computed(() => this.galeria().fotos || []);
  fotosVisibles = computed(() => this.todasFotos().slice(0, this.pagina() * POR_PAGINA));
  hayMas = computed(() => this.fotosVisibles().length < this.todasFotos().length);
  lightboxFoto = computed(() => {
    const idx = this.lightboxIndex();
    if (idx == null) return null;
    return this.todasFotos()[idx] ?? null;
  });

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.seo.applyGaleria(c);
      },
      error: () => this.seo.applyGaleria(null),
    });
  }

  mediaUrl(foto: PortalGaleriaFoto): string | null {
    const rel = foto.urlAbsoluta || foto.url;
    if (!rel) return null;
    if (/^https?:\/\//i.test(rel)) return rel;
    return resolveUploadUrl(rel) || (rel.startsWith('/uploads/') ? rel : null);
  }

  abrirLightbox(index: number) {
    this.lightboxIndex.set(index);
    document.body.style.overflow = 'hidden';
  }

  cerrarLightbox() {
    this.lightboxIndex.set(null);
    document.body.style.overflow = '';
  }

  anterior() {
    const idx = this.lightboxIndex();
    if (idx == null) return;
    const total = this.todasFotos().length;
    this.lightboxIndex.set((idx - 1 + total) % total);
  }

  siguiente() {
    const idx = this.lightboxIndex();
    if (idx == null) return;
    const total = this.todasFotos().length;
    this.lightboxIndex.set((idx + 1) % total);
  }

  cargarMas() {
    this.pagina.update((p) => p + 1);
  }

  onLightboxKey(ev: KeyboardEvent) {
    if (ev.key === 'Escape') this.cerrarLightbox();
    if (ev.key === 'ArrowLeft') this.anterior();
    if (ev.key === 'ArrowRight') this.siguiente();
  }
}
