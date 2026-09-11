import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import {
  finstruvialServicioDefaultRouteSegment,
  finstruvialServicioPublicRoute,
  finstruvialServicioRouteSegmentFrom,
  finstruvialServicioSlugFromRouteSegment,
} from '../../core/constants/finstruvial-servicios.constants';
import { finstruvialPortafolioActivo } from '../../core/constants/finstruvial-servicios-defaults';
import {
  finstruvialServicioHeroHighlight,
  finstruvialServicioHeroPillars,
  finstruvialServicioHeroPillarsLabel,
  finstruvialServicioHeroRibbon,
  finstruvialServicioHeroStats,
} from '../../core/finstruvial-servicio-hero.util';
import {
  finstruvialServicioHeroPhoto,
  finstruvialServicioImagenUrl,
  finstruvialServicioVideoUrl,
} from '../../core/finstruvial-servicios.util';
import { mergePortalLanding } from '../../core/portal-landing';
import { PortalSeoService } from '../../core/portal-seo.service';
import { PortalConfig, CursoVirtual } from '../../core/models';
import { PortalEnlacesRelacionadosComponent } from '../../shared/portal-enlaces-relacionados/portal-enlaces-relacionados.component';
import { PortalPromoBannerHeroComponent } from '../../shared/portal-promo-banner-hero/portal-promo-banner-hero.component';
import { CursoCardComponent } from '../../shared/curso-card/curso-card.component';
import { RevealOnScrollDirective } from '../../core/reveal-on-scroll.directive';
import { youtubeEmbedUrl } from '../../core/youtube-embed.util';
import { resolveUploadUrl } from '../../core/upload-url.util';
import {
  PortalFinstruvialServicioBloque,
  PortalFinstruvialServicioCatalogoOverride,
  PortalFinstruvialServicioImagen,
  PortalFinstruvialServicioMedio,
} from '../../core/constants/finstruvial-servicio-landing.types';

export interface ServicioCatalogoCardView {
  curso: CursoVirtual;
  titulo?: string;
  linkRoute?: string;
  btnLabel?: string;
}

@Component({
  selector: 'av-servicio-linea',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PortalPromoBannerHeroComponent,
    PortalEnlacesRelacionadosComponent,
    CursoCardComponent,
    RevealOnScrollDirective,
  ],
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
  slug = signal<ReturnType<typeof finstruvialServicioSlugFromRouteSegment>>(null);

  landing = computed(() => mergePortalLanding(this.config()?.landing, this.config()?.site?.tema));
  servicio = computed(() => {
    const s = this.slug();
    if (!s) return null;
    const cfg = this.landing().finstruvialServicios;
    if (!finstruvialPortafolioActivo(cfg)) return null;
    const p = cfg.paginas[s];
    return p?.activa !== false ? p : null;
  });

  heroPhoto = computed(() => {
    const s = this.servicio();
    return s ? finstruvialServicioHeroPhoto(s) : null;
  });

  heroPillars = computed(() => {
    const s = this.servicio();
    return s ? finstruvialServicioHeroPillars(s) : [];
  });

  heroPillarsLabel = computed(() => {
    const s = this.servicio();
    return s ? finstruvialServicioHeroPillarsLabel(s) : 'Fortalezas';
  });

  heroHighlight = computed(() => {
    const s = this.servicio();
    return s ? finstruvialServicioHeroHighlight(s) : null;
  });

  heroRibbon = computed(() => {
    const s = this.servicio();
    return s ? finstruvialServicioHeroRibbon(s) : [];
  });

  heroStats = computed(() => {
    const s = this.servicio();
    return s ? finstruvialServicioHeroStats(s) : [];
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
      s.slug === 'peridata' ||
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

  cursosCatalogoVista = computed((): ServicioCatalogoCardView[] => {
    const s = this.servicio();
    const overrides = s?.catalogoOverrides || [];
    return this.cursosCatalogo().map((curso) => {
      const match = this.catalogoOverridePara(curso.nombreProg, overrides);
      return {
        curso,
        titulo: match?.titulo,
        linkRoute: match?.url,
        btnLabel: match?.cta,
      };
    });
  });

  mostrarSeoGuion = computed(() => Number(this.servicio()?.guionVersion) >= 1);

  mostrarModulosPlataforma = computed(() => {
    const s = this.servicio();
    return !!(
      s?.modulosPlataformaTitulo.trim() &&
      (s.modulosPlataforma.length || this.guiasPlataforma().length)
    );
  });

  guiasPlataforma = computed(() => {
    const items = this.servicio()?.guiasPlataforma;
    if (!Array.isArray(items)) return [];
    return items.filter((g) => !!String(g.youtubeUrl || '').trim());
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
      this.actualizarSlugDesdeRuta(params.get('slug') || '');
      const c = this.config();
      if (c) {
        this.applySeo(c);
        this.redirigirSiInactivo();
        this.redirigirSiSlugCanonico();
      }
      this.cargarCatalogoCursos();
    });

    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.actualizarSlugDesdeRuta(this.route.snapshot.paramMap.get('slug') || '');
        this.applySeo(c);
        this.redirigirSiInactivo();
        this.redirigirSiSlugCanonico();
        this.cargarCatalogoCursos();
      },
      error: () => this.seo.applyServicioLinea(null, this.slug()),
    });
  }

  private actualizarSlugDesdeRuta(segment: string) {
    const paginas = this.landing().finstruvialServicios?.paginas;
    this.slug.set(finstruvialServicioSlugFromRouteSegment(segment, paginas));
  }

  private redirigirSiInactivo() {
    if (!this.servicio()) {
      const landing = this.landing();
      const destino = finstruvialPortafolioActivo(landing.finstruvialServicios) ? '/servicios' : '/';
      void this.router.navigateByUrl(destino);
    }
  }

  /** Si entró por slug legacy (p. ej. peridata), redirige a la URL canónica configurada en ERP. */
  private redirigirSiSlugCanonico() {
    const s = this.servicio();
    if (!s) return;
    const segment = (this.route.snapshot.paramMap.get('slug') || '').trim().toLowerCase();
    const canon = finstruvialServicioRouteSegmentFrom(s.slug, s.routeSegment).toLowerCase();
    const legacy = finstruvialServicioDefaultRouteSegment(s.slug).toLowerCase();
    if (segment !== legacy || canon === legacy) return;
    void this.router.navigateByUrl(finstruvialServicioPublicRoute(s.slug, s.routeSegment), { replaceUrl: true });
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

  private catalogoOverridePara(
    nombre: string,
    overrides: PortalFinstruvialServicioCatalogoOverride[],
  ): PortalFinstruvialServicioCatalogoOverride | null {
    const norm = String(nombre || '')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase();
    for (const item of overrides) {
      const patron = String(item.patron || '')
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase();
      if (patron && norm.includes(patron)) return item;
    }
    return null;
  }
}
