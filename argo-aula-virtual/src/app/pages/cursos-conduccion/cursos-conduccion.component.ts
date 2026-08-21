import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { mergePortalLanding } from '../../core/portal-landing';
import { PortalSeoService } from '../../core/portal-seo.service';
import { PortalConfig } from '../../core/models';
import { resolveUploadUrl } from '../../core/upload-url.util';
import { PortalIconComponent } from '../../shared/portal-icon/portal-icon.component';
import {
  mergeCursosConduccionLanding,
  PortalCursosConduccionResolucion,
} from './cursos-conduccion-content';

@Component({
  selector: 'av-cursos-conduccion',
  standalone: true,
  imports: [CommonModule, RouterLink, PortalIconComponent],
  templateUrl: './cursos-conduccion.component.html',
  styleUrl: './cursos-conduccion.component.scss',
})
export class CursosConduccionComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);

  config = signal<PortalConfig | null>(null);

  contenido = computed(() =>
    mergeCursosConduccionLanding(mergePortalLanding(this.config()?.landing).cursosConduccion),
  );

  invitacion = computed(() => this.contenido().invitacion);

  heroImagen = computed(() => {
    const hero = this.contenido().hero;
    const url = hero.imagenUrl?.trim();
    if (!url) return '/images/hero-estudiante.png';
    if (url.startsWith('/images/') || url.startsWith('/apk/')) return url;
    if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url;
    const resolved = resolveUploadUrl(hero.imagenUrlAbsoluta || url);
    if (resolved) return resolved;
    if (url.startsWith('/uploads/')) return url;
    return '/images/hero-estudiante.png';
  });

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.seo.applyCursosConduccion(c);
      },
      error: () => this.seo.applyCursosConduccion(null),
    });
  }

  resolucionUrl(res: PortalCursosConduccionResolucion): string | null {
    const url = res.archivoUrlAbsoluta?.trim() || res.archivoUrl?.trim();
    if (!url) return null;
    return resolveUploadUrl(url) || url;
  }

  resolucionNombre(res: PortalCursosConduccionResolucion): string {
    return res.nombreArchivo?.trim() || 'resolución';
  }

  licenciaEsExterna(url: string | undefined): boolean {
    return /^https?:\/\//i.test(String(url || '').trim());
  }

  licenciaRuta(url: string | undefined): string {
    const u = String(url || '/registro').trim();
    if (!u || u === '/') return '/';
    return u.startsWith('/') ? u : `/${u}`;
  }
}
