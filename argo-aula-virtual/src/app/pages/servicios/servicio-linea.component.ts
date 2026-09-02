import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import {
  finstruvialServicioSlugFromRouteSegment,
} from '../../core/constants/finstruvial-servicios.constants';
import { mergeFinstruvialServicioLanding, finstruvialPortafolioActivo } from '../../core/constants/finstruvial-servicios-defaults';
import {
  finstruvialServicioHeroPhoto,
  finstruvialServicioImagenUrl,
  finstruvialServicioVideoUrl,
} from '../../core/finstruvial-servicios.util';
import { mergePortalLanding } from '../../core/portal-landing';
import { PortalSeoService } from '../../core/portal-seo.service';
import { PortalConfig, CursoVirtual } from '../../core/models';
import { PortalPromoBannerHeroComponent } from '../../shared/portal-promo-banner-hero/portal-promo-banner-hero.component';
import { CursoCardComponent } from '../../shared/curso-card/curso-card.component';
import { RevealOnScrollDirective } from '../../core/reveal-on-scroll.directive';
import { youtubeEmbedUrl } from '../../core/youtube-embed.util';
import { resolveUploadUrl } from '../../core/upload-url.util';
import { PortalFinstruvialServicioBloque, PortalFinstruvialServicioImagen, PortalFinstruvialServicioMedio } from '../../core/constants/finstruvial-servicio-landing.types';

@Component({
  selector: 'av-servicio-linea',
  standalone: true,
  imports: [CommonModule, RouterLink, PortalPromoBannerHeroComponent, CursoCardComponent, RevealOnScrollDirective],
  templateUrl: './servicio-linea.component.html',
  styleUrl: './servicio-linea.component.scss',
})
export class ServicioLineaComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  config = signal<PortalConfig | null>(null);
  cursosCatalogo = signal<CursoVirtual[]>([]);
  slug = signal(finstruvialServicioSlugFromRouteSegment(this.route.snapshot.paramMap.get('slug') || ''));

  landing = computed(() => mergePortalLanding(this.config()?.landing));
  servicio = computed(() => {
    const s = this.slug();
    if (!s) return null;
    const cfg = this.landing().finstruvialServicios;
    if (!finstruvialPortafolioActivo(cfg)) return null;
    const p = mergeFinstruvialServicioLanding(s, cfg.paginas[s]);
    return p.activa !== false ? p : null;
  });

  heroPhoto = computed(() => {
    const s = this.servicio();
    return s ? finstruvialServicioHeroPhoto(s) : null;
  });

  /** Imagen de presentación (solo `seccion`; independiente del banner hero). */
  presentacionImagen = computed(() => {
    const s = this.servicio();
    if (!s) return null;
    return this.imagenUrl(s.imagenes, 'seccion');
  });

  presentacionImagenAlt = computed(() => {
    const s = this.servicio();
    if (!s) return '';
    const seccion = s.imagenes.find((i) => i.id === 'seccion');
    if (seccion?.alt?.trim()) return seccion.alt;
    if (s.introTitulo.trim()) return s.introTitulo;
    return s.menuLabel;
  });

  mostrarPresentacionSplit = computed(() => {
    const s = this.servicio();
    if (!s) return false;
    const tieneTextoIntro = !!(s.introTitulo.trim() || s.introLead.trim() || s.introParrafos.length);
    if (!tieneTextoIntro) return false;
    const layoutSplit =
      s.estilo === 'academy' ||
      s.estilo === 'tech' ||
      s.slug === 'capacitacionSensibilizacion' ||
      s.slug === 'estudiosDiagnosticosTecnicos' ||
      s.slug === 'herramientasEducativasTecnologicas' ||
      s.slug === 'inventariosViales' ||
      s.slug === 'planeacionGestionVial';
    if (!layoutSplit) return false;
    if (
      s.slug === 'aulaVirtual' ||
      s.slug === 'peridata' ||
      s.slug === 'herramientasEducativasTecnologicas' ||
      s.slug === 'inventariosViales' ||
      s.slug === 'planeacionGestionVial' ||
      s.slug === 'capacitacionSensibilizacion' ||
      s.slug === 'estudiosDiagnosticosTecnicos'
    ) {
      return true;
    }
    return !!this.presentacionImagen();
  });

  presentacionImagenDerecha = computed(() => {
    const s = this.servicio();
    return (
      s?.estilo === 'tech' ||
      s?.slug === 'capacitacionSensibilizacion' ||
      s?.slug === 'estudiosDiagnosticosTecnicos' ||
      s?.slug === 'herramientasEducativasTecnologicas' ||
      s?.slug === 'inventariosViales' ||
      s?.slug === 'planeacionGestionVial'
    );
  });

  mostrarIntro = computed(() => {
    const s = this.servicio();
    if (!s) return false;
    return !!(
      s.introTitulo.trim() ||
      s.introLead.trim() ||
      s.introParrafos.length ||
      s.introMedios.length
    );
  });

  mostrarProductoMedia = computed(() => {
    const s = this.servicio();
    return !!(s && this.productoMediosVisibles(s).length);
  });

  productoMediosVisibles(s = this.servicio()): PortalFinstruvialServicioMedio[] {
    if (!s?.productoMedios.length) return [];
    if (s.slug !== 'herramientasEducativasTecnologicas' && s.slug !== 'inventariosViales') return s.productoMedios;
    const slotId = (s.productoImagenId?.trim() || 'producto');
    return s.productoMedios.filter((m) => m.tipo !== 'imagen' || m.imagenId?.trim() !== slotId);
  }

  logoUrl = computed(() =>
    resolveUploadUrl(this.config()?.urlLogoAbsoluta || this.config()?.urlLogo),
  );

  mostrarCatalogoCursos = computed(() => {
    const s = this.servicio();
    if (!s?.bloquesTitulo.trim()) return false;
    // Aula Virtual: mismos cursos y portadas que /cursos (catálogo del ERP).
    return s.slug === 'aulaVirtual' || s.usarCatalogoCursos === true;
  });

  mostrarModulosPlataforma = computed(() => {
    const s = this.servicio();
    return !!(s?.modulosPlataforma.length && s.modulosPlataformaTitulo.trim());
  });

  videoEmbed(url: string | undefined) {
    const embed = youtubeEmbedUrl(String(url || '').trim());
    return embed ? this.sanitizer.bypassSecurityTrustResourceUrl(embed) : null;
  }

  imagenUrl(imagenes: PortalFinstruvialServicioImagen[], id: string): string | null {
    return finstruvialServicioImagenUrl(imagenes, id);
  }

  videoUrl(videos: PortalFinstruvialServicioImagen[] | undefined, id: string | undefined): string | null {
    if (!id?.trim()) return null;
    return finstruvialServicioVideoUrl(videos, id);
  }

  medioVideoEsArchivo(medio: PortalFinstruvialServicioMedio): boolean {
    return medio.videoOrigen === 'archivo' || (!!medio.videoId?.trim() && medio.videoOrigen !== 'youtube');
  }

  bloqueVideoEsArchivo(b: PortalFinstruvialServicioBloque): boolean {
    return b.videoOrigen === 'archivo' || (!!b.videoId?.trim() && b.videoOrigen !== 'youtube');
  }

  tieneSlotVideo(url: string | undefined): boolean {
    return url !== undefined;
  }

  bloqueTieneVideo(b: PortalFinstruvialServicioBloque): boolean {
    return this.tieneSlotVideo(b.youtubeUrl) || !!b.videoId?.trim();
  }

  bloqueTieneMedia(b: PortalFinstruvialServicioBloque): boolean {
    return !!(b.imagenId?.trim() || this.bloqueTieneVideo(b));
  }

  /** Tarjetas con icono (sin foto lateral). PERIDATA siempre en este modo. */
  bloquesModoTarjetas(slug: string, bloques: PortalFinstruvialServicioBloque[]): boolean {
    if (slug === 'capacitacionSensibilizacion' || slug === 'estudiosDiagnosticosTecnicos') return false;
    if (slug === 'herramientasEducativasTecnologicas') return false;
    if (slug === 'peridata') return true;
    return bloques.length > 0 && bloques.every((b) => !this.bloqueTieneMedia(b));
  }

  /** Grilla de 3 tarjetas con foto arriba (Capacitación y Sensibilización). */
  bloquesModoFotoTarjetas(slug: string): boolean {
    return slug === 'capacitacionSensibilizacion';
  }

  /** Destacados con foto + grilla de iconos (Estudios y Diagnósticos Técnicos). */
  bloquesModoEstudios(slug: string): boolean {
    return slug === 'estudiosDiagnosticosTecnicos';
  }

  /** Grilla de competencias del simulador (Herramientas Educativas). */
  bloquesModoSimuladores(slug: string): boolean {
    return slug === 'herramientasEducativasTecnologicas';
  }

  mostrarProductoShowcase(): boolean {
    const s = this.servicio();
    return !!(
      (s?.slug === 'herramientasEducativasTecnologicas' || s?.slug === 'inventariosViales') &&
      s.productoNombre.trim()
    );
  }

  productoImagenSlotId(): string {
    const id = this.servicio()?.productoImagenId?.trim();
    return id || 'producto';
  }

  bloquesEstudiosDestacados(bloques: PortalFinstruvialServicioBloque[]): PortalFinstruvialServicioBloque[] {
    return bloques.slice(0, 3);
  }

  bloquesEstudiosLista(bloques: PortalFinstruvialServicioBloque[]): PortalFinstruvialServicioBloque[] {
    return bloques.slice(3);
  }

  featureAlterna(index: number): boolean {
    return index % 2 === 1;
  }

  etiquetaVideo(videos: PortalFinstruvialServicioImagen[] | undefined, id: string | undefined): string {
    if (!id?.trim()) return 'Video';
    return videos?.find((v) => v.id === id)?.etiqueta || 'Video';
  }

  etiquetaImagen(imagenes: PortalFinstruvialServicioImagen[], id: string): string {
    return imagenes.find((img) => img.id === id)?.etiqueta || 'Foto';
  }

  medioCaption(medio: PortalFinstruvialServicioMedio, fallback: string): string {
    return medio.caption?.trim() || fallback;
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.slug.set(finstruvialServicioSlugFromRouteSegment(params.get('slug') || ''));
      const c = this.config();
      if (c) {
        this.applySeo(c);
        this.redirigirSiInactivo();
      }
      this.cargarCatalogoCursos();
    });

    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.applySeo(c);
        this.redirigirSiInactivo();
        this.cargarCatalogoCursos();
      },
      error: () => this.seo.applyServicioLinea(null, this.slug()),
    });
  }

  private redirigirSiInactivo() {
    if (!this.servicio()) {
      const landing = this.landing();
      const destino = finstruvialPortafolioActivo(landing.finstruvialServicios) ? '/servicios' : '/';
      void this.router.navigateByUrl(destino);
    }
  }

  private cargarCatalogoCursos() {
    const slug = this.slug();
    const s = this.servicio();
    const usarCatalogo = slug === 'aulaVirtual' || s?.usarCatalogoCursos === true;
    if (!usarCatalogo) {
      this.cursosCatalogo.set([]);
      return;
    }
    this.api.cursos().subscribe({ next: (rows) => this.cursosCatalogo.set(rows) });
  }

  private applySeo(c: PortalConfig | null) {
    this.seo.applyServicioLinea(c, this.slug());
  }

  enlaceEsExterno(url: string): boolean {
    return /^https?:\/\//i.test(String(url || '').trim());
  }

  enlaceRuta(url: string): string | null {
    const u = String(url || '').trim();
    if (!u || this.enlaceEsExterno(u)) return null;
    return u.startsWith('/') ? u : `/${u}`;
  }

  enlaceHref(url: string): string | null {
    const u = String(url || '').trim();
    return this.enlaceEsExterno(u) ? u : null;
  }
}
