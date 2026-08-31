import { CommonModule, isPlatformBrowser } from '@angular/common';
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
  mergeTrabajoEnAlturasLanding,
  PortalTrabajoEnAlturasLanding,
  TaImagen,
} from './trabajo-en-alturas-content';

@Component({
  selector: 'av-trabajo-en-alturas',
  standalone: true,
  imports: [CommonModule, RouterLink, RevealOnScrollDirective, PortalIconComponent],
  templateUrl: './trabajo-en-alturas.component.html',
  styleUrl: './trabajo-en-alturas.component.scss',
})
export class TrabajoEnAlturasComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);
  private platformId = inject(PLATFORM_ID);

  config = signal<PortalConfig | null>(null);
  navAbierto = signal(false);

  readonly staticHero = '/images/trabajo-en-alturas/clase1-sector-transportador.jpg';
  readonly staticIntro = '/images/trabajo-en-alturas/clase2-objetivo-general.jpg';
  readonly staticNormativa = '/images/trabajo-en-alturas/clase3-normograma.jpg';
  readonly staticEpi = '/images/trabajo-en-alturas/clase10-arnes.jpg';

  contenido = computed(() =>
    mergeTrabajoEnAlturasLanding(
      mergePortalLanding(this.config()?.landing).trabajoEnAlturas,
    ),
  );

  totalDocumentos = computed(() =>
    this.contenido().documentosGrupos.reduce((sum, g) => sum + (g.documentos?.length || 0), 0),
  );

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.seo.applyTrabajoEnAlturas(c);
      },
      error: () => this.seo.applyTrabajoEnAlturas(null),
    });
  }

  imagenUrl(img: TaImagen | undefined, fallback?: string): string | null {
    if (img) {
      const url = img.urlAbsoluta?.trim() || img.url?.trim();
      if (url) return resolveUploadUrl(url) || url;
    }
    return fallback || null;
  }

  imagenPorId(c: PortalTrabajoEnAlturasLanding, id: string): TaImagen | undefined {
    return c.imagenes.find((i) => i.id === id);
  }

  documentoUrl(doc: { archivoUrl?: string }): string | null {
    const url = doc.archivoUrl?.trim();
    if (!url) return null;
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
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggleNav() {
    this.navAbierto.update((v) => !v);
  }
}
