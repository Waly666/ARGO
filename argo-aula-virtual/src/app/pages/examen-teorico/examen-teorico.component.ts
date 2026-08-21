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
  mergeExamenTeoricoLanding,
  PortalExamenTeoricoNorma,
  PortalExamenTeoricoResolucion,
} from '../home/examen-teorico-content';

@Component({
  selector: 'av-examen-teorico',
  standalone: true,
  imports: [CommonModule, RouterLink, PortalIconComponent],
  templateUrl: './examen-teorico.component.html',
  styleUrl: './examen-teorico.component.scss',
})
export class ExamenTeoricoComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);

  config = signal<PortalConfig | null>(null);

  contenido = computed(() =>
    mergeExamenTeoricoLanding(mergePortalLanding(this.config()?.landing).examenTeorico),
  );

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.seo.applyExamenTeorico(c);
      },
      error: () => this.seo.applyExamenTeorico(null),
    });
  }

  resolucionUrl(res: PortalExamenTeoricoResolucion): string | null {
    const url = res.archivoUrlAbsoluta?.trim() || res.archivoUrl?.trim();
    if (!url) return null;
    return resolveUploadUrl(url) || url;
  }

  normaUrl(norma: PortalExamenTeoricoNorma): string | null {
    const url = norma.archivoUrlAbsoluta?.trim() || norma.archivoUrl?.trim();
    if (!url) return null;
    return resolveUploadUrl(url) || url;
  }

  normaNombre(norma: PortalExamenTeoricoNorma): string {
    return norma.nombreArchivo?.trim() || norma.norma?.trim() || 'norma';
  }

  resolucionNombre(res: PortalExamenTeoricoResolucion): string {
    return res.nombreArchivo?.trim() || 'documento';
  }

  enlaceEsExterno(url: string | undefined): boolean {
    return /^https?:\/\//i.test(String(url || '').trim());
  }

  enlaceRuta(url: string | undefined): string {
    const u = String(url || '/').trim();
    if (!u || u === '/') return '/';
    return u.startsWith('/') ? u : `/${u}`;
  }
}
