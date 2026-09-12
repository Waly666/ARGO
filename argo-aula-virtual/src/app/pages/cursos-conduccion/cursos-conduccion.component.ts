import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { mergePortalLanding } from '../../core/portal-landing';
import { PortalSeoService } from '../../core/portal-seo.service';
import { PortalConfig } from '../../core/models';
import { resolveUploadUrl } from '../../core/upload-url.util';
import { PortalEnlacesRelacionadosComponent } from '../../shared/portal-enlaces-relacionados/portal-enlaces-relacionados.component';
import { PortalIconComponent } from '../../shared/portal-icon/portal-icon.component';
import { PortalPromoBannerHeroComponent } from '../../shared/portal-promo-banner-hero/portal-promo-banner-hero.component';
import {
  PromoBannerHighlight,
  PromoBannerRibbonItem,
} from '../../shared/portal-promo-banner-hero/portal-promo-banner-defaults';
import {
  mergeCursosConduccionLanding,
  PortalCursosConduccionLicenciaItem,
  PortalCursosConduccionResolucion,
  PortalCursosConduccionSeccionImagenes,
} from './cursos-conduccion-content';
import { CursosConduccionPublicidadSliderComponent } from './cursos-conduccion-publicidad-slider.component';

@Component({
  selector: 'av-cursos-conduccion',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PortalIconComponent,
    PortalEnlacesRelacionadosComponent,
    CursosConduccionPublicidadSliderComponent,
    PortalPromoBannerHeroComponent,
  ],
  templateUrl: './cursos-conduccion.component.html',
  styleUrl: './cursos-conduccion.component.scss',
})
export class CursosConduccionComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);

  config = signal<PortalConfig | null>(null);

  readonly heroRibbon: PromoBannerRibbonItem[] = [
    { icon: 'car', label: 'Licencias de conducción' },
    { icon: 'certificate', label: 'Resoluciones vigentes' },
    { icon: 'document', label: 'Material actualizado' },
    { icon: 'shield-check', label: 'Formación certificada' },
  ];

  contenido = computed(() =>
    mergeCursosConduccionLanding(mergePortalLanding(this.config()?.landing).cursosConduccion),
  );

  heroPilares = computed(() => this.contenido().hero.pillars);

  heroHighlight = computed((): PromoBannerHighlight | null => {
    const hero = this.contenido().hero;
    if (!hero.highlightTitle?.trim()) return null;
    return {
      icon: hero.highlightIcon?.trim() || 'car',
      title: hero.highlightTitle.trim(),
      subtitle: hero.highlightSubtitle?.trim() || '',
    };
  });

  heroHighlightRadar = computed(() => {
    const hero = this.contenido().hero;
    return !!this.heroHighlight() && hero.highlightRadar !== false;
  });

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

  private resolveImagenUrl(rel?: string, abs?: string, fallback = ''): string {
    const url = String(rel || '').trim();
    if (!url) return fallback;
    if (url.startsWith('/images/') || url.startsWith('/apk/')) return url;
    if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url;
    const resolved = resolveUploadUrl(abs || url);
    if (resolved) return resolved;
    if (url.startsWith('/uploads/')) return url;
    return fallback;
  }

  seccionImagen(slot: keyof PortalCursosConduccionSeccionImagenes): string | null {
    const img = this.contenido().seccionImagenes?.[slot];
    if (!img?.url?.trim()) return null;
    const resolved = this.resolveImagenUrl(img.url, img.urlAbsoluta);
    return resolved || null;
  }

  seccionImagenAlt(slot: keyof PortalCursosConduccionSeccionImagenes): string {
    return this.contenido().seccionImagenes?.[slot]?.alt?.trim() || 'Formación en conducción SERVIAL';
  }

  metodologiaImagen(index: number): string | null {
    const slots: (keyof PortalCursosConduccionSeccionImagenes)[] = [
      'metodologiaTeorica',
      'metodologiaPractica',
      'metodologiaTaller',
    ];
    return this.seccionImagen(slots[index] || 'metodologiaTeorica');
  }

  metodologiaImagenAlt(index: number): string {
    const slots: (keyof PortalCursosConduccionSeccionImagenes)[] = [
      'metodologiaTeorica',
      'metodologiaPractica',
      'metodologiaTaller',
    ];
    return this.seccionImagenAlt(slots[index] || 'metodologiaTeorica');
  }

  licenciaImagen(lic: PortalCursosConduccionLicenciaItem): string | null {
    const url = lic.imagenUrl?.trim();
    if (!url) return null;
    const resolved = this.resolveImagenUrl(url, lic.imagenUrlAbsoluta);
    return resolved || null;
  }
}
