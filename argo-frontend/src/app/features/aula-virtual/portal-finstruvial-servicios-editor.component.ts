import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  FINSTRUVIAL_SERVICIO_SLUGS,
  FinstruvialServicioSlug,
  finstruvialServicioRouteSegmentFrom,
} from '../../core/constants/finstruvial-servicios.constants';
import {
  FINSTRUVIAL_SERVICIO_BUILDER_MENU,
} from '../../core/constants/finstruvial-servicios-editor-panels';
import {
  finstruvialServiciosLista,
} from '../../core/constants/finstruvial-servicios-defaults';
import {
  mergePortafolioServicios,
  portafolioServiciosDefaultsForTema,
  portafolioServiciosEsServial,
} from '../../core/utils/portafolio-servicios.util';
import type { PortalFinstruvialLineSlugChange } from '../../core/utils/portal-slug-propagate.util';
import type { PortalTemaLike } from '../../core/utils/portal-theme-css-base.util';
import {
  FinstruvialEditorGrupo,
  finstruvialEditorIndice,
  finstruvialEditorMetaGrupo,
  finstruvialEditorTieneGrupo,
} from '../../core/constants/finstruvial-servicios-editor-ui';
import {
  PortalFinstruvialServicioBloque,
  PortalFinstruvialServicioItem,
  PortalFinstruvialServicioLanding,
  PortalFinstruvialServicioMedio,
  PortalFinstruvialServiciosConfig,
  PortalServiciosHubTarjeta,
} from '../../core/constants/finstruvial-servicio-landing.types';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { resolveUploadAssetUrl } from '../../core/utils/upload-asset-url.util';
import { removeAt } from './portal-landing-editor-helpers';
import { PortalPromoHeroFieldsEditorComponent } from './portal-promo-hero-fields-editor.component';
import { PortalFinstruvialEditorSeccionComponent } from './portal-finstruvial-editor-seccion.component';
import type { FinstruvialEditorSeccion } from '../../core/constants/finstruvial-servicios-editor-sections';
import { finstruvialEditorTieneSeccion } from '../../core/constants/finstruvial-servicios-editor-sections';
import {
  PortalFinstruvialMedioTipoUi,
  PortalFinstruvialMediosPanelComponent,
} from './portal-finstruvial-medios-panel.component';
import { PortalEditorFaqListComponent } from './portal-editor-faq-list.component';
import { PortalEditorImagenPromptComponent } from './portal-editor-imagen-prompt.component';

import { PortalSeoLegendComponent } from './portal-seo-legend.component';

import { PortalFieldLabelComponent } from './portal-field-label.component';

@Component({
  selector: 'argo-portal-finstruvial-servicios-editor',
  standalone: true,
  imports: [
    PortalEditorFaqListComponent,
    PortalEditorImagenPromptComponent,
    PortalFieldLabelComponent,
    PortalFinstruvialEditorSeccionComponent,
    PortalFinstruvialMediosPanelComponent,
    PortalPromoHeroFieldsEditorComponent,
    PortalSeoLegendComponent,
    CommonModule,
    FormsModule,
  ],
  templateUrl: './portal-finstruvial-servicios-editor.component.html',
  styleUrl: './portal-finstruvial-servicios-editor.component.scss',
})
export class PortalFinstruvialServiciosEditorComponent implements OnInit {
  private api = inject(AulaVirtualAdminService);

  @Input({ required: true }) finstruvialServicios!: PortalFinstruvialServiciosConfig;
  @Input() portalTema: PortalTemaLike | null | undefined = null;
  /** `hub` = portafolio /servicios; `linea` = una de las siete páginas. */
  @Input() modo: 'hub' | 'linea' = 'hub';
  /** Obligatorio cuando `modo` es `linea`. */
  @Input() lineaSlug: FinstruvialServicioSlug | null = null;
  /** URL pública del portal (para enlaces «Ver en sitio»). */
  @Input() portalUrl = '';
  /** Prefijo del portafolio (p. ej. /servicios o slug personalizado del ERP). */
  @Input() serviciosHubRoute = '/servicios';
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();
  @Output() lineSlugChange = new EventEmitter<PortalFinstruvialLineSlugChange>();

  private routeSegmentAlEnfocar = '';

  readonly slugs = FINSTRUVIAL_SERVICIO_SLUGS;
  readonly lineasMenu = FINSTRUVIAL_SERVICIO_BUILDER_MENU;
  readonly removeItem = removeAt;

  uploadingId = signal<string | null>(null);
  /** Colapsar/expandir bloques del formulario (por defecto todos abiertos). */
  private gruposAbiertos = signal<Record<string, boolean>>({});

  readonly hubSecciones = [
    { id: 'fsv-hub-seccion-banner', paso: 1, titulo: 'Banner' },
    { id: 'fsv-hub-seccion-formacion', paso: 2, titulo: 'Formación' },
    { id: 'fsv-hub-seccion-grilla', paso: 3, titulo: 'Grilla' },
    { id: 'fsv-hub-seccion-ubicacion', paso: 4, titulo: 'Ubicación' },
    { id: 'fsv-hub-seccion-faq', paso: 5, titulo: 'FAQ' },
  ] as const;

  ngOnInit(): void {
    if (this.modo === 'hub') {
      this.ensureHubHeroAnimadoFields();
      this.ensureHubFaqFields();
      this.ensureHubTarjetas();
    }
  }

  scrollToHubSeccion(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  lineaActiva(): FinstruvialServicioSlug {
    if (this.modo === 'linea' && this.lineaSlug) {
      return this.lineaSlug;
    }
    return 'aulaVirtual';
  }

  private portafolioDefaults() {
    return portafolioServiciosDefaultsForTema(this.portalTema);
  }

  private mergePortafolio(raw?: Partial<PortalFinstruvialServiciosConfig> | null) {
    return mergePortafolioServicios(raw ?? this.finstruvialServicios, this.portalTema);
  }

  /** El hub Servial usa un banner propio (sin cinta, radar ni tarjeta destacada Finstruvial). */
  esHubServial(): boolean {
    return this.modo === 'hub' && portafolioServiciosEsServial(this.portalTema);
  }

  lineas() {
    return finstruvialServiciosLista(this.finstruvialServicios);
  }

  paginaActiva(): PortalFinstruvialServicioLanding {
    const slug = this.lineaActiva();
    let p = this.finstruvialServicios?.paginas?.[slug];
    if (!p) {
      const merged = this.mergePortafolio(this.finstruvialServicios).paginas[slug];
      if (!this.finstruvialServicios.paginas) {
        this.finstruvialServicios.paginas = this.mergePortafolio().paginas;
      }
      this.finstruvialServicios.paginas[slug] = merged;
      p = merged;
    }
    if (!Array.isArray(p.imagenes)) p.imagenes = [];
    if (!Array.isArray(p.introMedios)) p.introMedios = [];
    if (!Array.isArray(p.productoParrafos)) p.productoParrafos = [];
    if (!Array.isArray(p.bloques)) p.bloques = [];
    if (!Array.isArray(p.productoMedios)) p.productoMedios = [];
    if (!Array.isArray(p.videos)) p.videos = [];
    if (!p.routeSegment?.trim()) {
      p.routeSegment = finstruvialServicioRouteSegmentFrom(slug, p.routeSegment);
    }
    if (!Array.isArray(p.modulosPlataforma)) p.modulosPlataforma = [];
    if (!Array.isArray(p.guiasPlataforma)) p.guiasPlataforma = [];
    if (!Array.isArray(p.pilaresEducativos)) p.pilaresEducativos = [];
    if (!Array.isArray(p.rutaAprendizaje)) p.rutaAprendizaje = [];
    if (!Array.isArray(p.publicos)) p.publicos = [];
    if (!Array.isArray(p.ecosistemaItems)) p.ecosistemaItems = [];
    if (!Array.isArray(p.gamificacionItems)) p.gamificacionItems = [];
    if (!Array.isArray(p.productoEtiquetas)) p.productoEtiquetas = [];
    if (!Array.isArray(p.resultadoIconos)) p.resultadoIconos = [];
    if (this.lineaActiva() === 'herramientasEducativasTecnologicas') {
      this.ensureImagenSlot('producto', 'ENCIVIRTRANS — captura o foto', p);
      this.ensureImagenSlot('seccion', 'Imagen de presentación', p);
      if (!p.productoImagenId?.trim()) p.productoImagenId = 'producto';
    }
    if (this.lineaActiva() === 'planeacionGestionVial') {
      this.ensureImagenSlot('seccion', 'Imagen de presentación', p);
    }
    if (this.lineaActiva() === 'inventariosViales') {
      this.ensureImagenSlot('producto', 'INFRAVIAL — captura o foto', p);
      this.ensureImagenSlot('seccion', 'Imagen de presentación', p);
      for (const [id, etiqueta] of [
        ['captura-mapas', 'Mapa del inventario'],
        ['captura-senales', 'Señalización y semáforos'],
        ['captura-sinc', 'SINC y categorización'],
        ['captura-movil', 'App móvil de campo'],
        ['captura-dashboard', 'Dashboard e indicadores'],
        ['captura-estadisticas', 'Estadísticas y gráficos'],
        ['captura-categorizacion', 'Categorización vial'],
        ['captura-reportes', 'Reportes y análisis'],
        ['captura-conteos', 'Conteos vehiculares'],
      ] as const) {
        this.ensureImagenSlot(id, etiqueta, p);
      }
      if (!p.productoImagenId?.trim()) p.productoImagenId = 'producto';
    }
    if (this.lineaActiva() === 'aulaVirtual') p.usarCatalogoCursos = true;
    this.ensureHeroAnimadoFields(p);
    return p;
  }

  private ensureHeroAnimadoFields(p: PortalFinstruvialServicioLanding): void {
    if (!Array.isArray(p.pillars)) p.pillars = [];
    if (!Array.isArray(p.stats)) p.stats = [];
    if (!Array.isArray(p.ribbon)) p.ribbon = [];
    if (p.pillarsLabel == null) p.pillarsLabel = '';
    if (p.highlightIcon == null) p.highlightIcon = '';
    if (p.highlightTitle == null) p.highlightTitle = '';
    if (p.highlightSubtitle == null) p.highlightSubtitle = '';
    if (p.ribbonLabel == null) p.ribbonLabel = '';
    if (p.heroHighlightRadar == null) p.heroHighlightRadar = true;
  }

  ensureHubFaqFields(): void {
    const hub = this.finstruvialServicios?.hub;
    if (!hub) return;
    if (!Array.isArray(hub.faq)) hub.faq = [];
    if (hub.faqTitulo == null) hub.faqTitulo = '';
  }

  ensureHubTarjetas(): void {
    const hub = this.finstruvialServicios?.hub;
    if (!hub) return;
    if (!Array.isArray(hub.tarjetas)) hub.tarjetas = [];
  }

  addHubTarjeta(): void {
    this.ensureHubTarjetas();
    this.finstruvialServicios.hub.tarjetas.push({
      icon: '🎓',
      titulo: '',
      lead: '',
      url: '',
      cta: 'Conocer más',
      externo: false,
    });
  }

  removeHubTarjeta(index: number): void {
    removeAt(this.finstruvialServicios.hub.tarjetas, index);
  }

  setHubTarjetaExterna(tarjeta: PortalServiciosHubTarjeta, externo: boolean): void {
    tarjeta.externo = externo;
  }

  ensureHubHeroAnimadoFields(): void {
    const hub = this.finstruvialServicios?.hub;
    if (!hub) return;
    if (!Array.isArray(hub.pillars)) hub.pillars = [];
    if (!Array.isArray(hub.stats)) hub.stats = hub.heroStats?.length ? [...hub.heroStats] : [];
    if (!Array.isArray(hub.ribbon)) hub.ribbon = [];
    if (hub.pillarsLabel == null) hub.pillarsLabel = '';
    if (hub.highlightIcon == null) hub.highlightIcon = '';
    if (hub.highlightTitle == null) hub.highlightTitle = '';
    if (hub.highlightSubtitle == null) hub.highlightSubtitle = '';
    if (hub.ribbonLabel == null) hub.ribbonLabel = '';
    if (hub.heroHighlightRadar == null) hub.heroHighlightRadar = true;
  }

  mostrarSeccion(seccion: FinstruvialEditorSeccion): boolean {
    return finstruvialEditorTieneSeccion(this.lineaActiva(), seccion);
  }

  indicePagina() {
    return finstruvialEditorIndice(this.lineaActiva());
  }

  grupoVisible(grupo: FinstruvialEditorGrupo): boolean {
    return finstruvialEditorTieneGrupo(this.lineaActiva(), grupo);
  }

  metaGrupo(grupo: FinstruvialEditorGrupo) {
    return finstruvialEditorMetaGrupo(this.lineaActiva(), grupo);
  }

  grupoAbierto(grupo: FinstruvialEditorGrupo): boolean {
    const key = `${this.lineaActiva()}:${grupo}`;
    return this.gruposAbiertos()[key] !== false;
  }

  toggleGrupo(grupo: FinstruvialEditorGrupo) {
    const key = `${this.lineaActiva()}:${grupo}`;
    const abierto = this.grupoAbierto(grupo);
    this.gruposAbiertos.update((m) => ({ ...m, [key]: !abierto }));
  }

  irAGrupo(grupo: FinstruvialEditorGrupo) {
    const key = `${this.lineaActiva()}:${grupo}`;
    this.gruposAbiertos.update((m) => ({ ...m, [key]: true }));
    queueMicrotask(() => document.getElementById(`fsv-grupo-${grupo}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  rutaPublicaLinea(slug: FinstruvialServicioSlug = this.lineaActiva()): string {
    const p = this.finstruvialServicios?.paginas?.[slug];
    const hub = (this.serviciosHubRoute || '/servicios').replace(/\/+$/, '');
    const seg = finstruvialServicioRouteSegmentFrom(slug, p?.routeSegment);
    return `${hub}/${seg}`;
  }

  vistaPreviaPagina(): string {
    const base = (this.portalUrl || '').replace(/\/+$/, '');
    if (!base) return '';
    return `${base}${this.rutaPublicaLinea()}`;
  }

  onRouteSegmentFocus(): void {
    const p = this.paginaActiva();
    this.routeSegmentAlEnfocar = finstruvialServicioRouteSegmentFrom(p.slug, p.routeSegment);
  }

  normalizarRouteSegmentActiva(): void {
    const change = this.commitPendingRouteSegment();
    if (change) this.lineSlugChange.emit(change);
  }

  /** Normaliza el segmento de ruta si se publica sin blur del campo. */
  commitPendingRouteSegment(): PortalFinstruvialLineSlugChange | null {
    const p = this.paginaActiva();
    const anterior = finstruvialServicioRouteSegmentFrom(
      p.slug,
      this.routeSegmentAlEnfocar || p.routeSegment,
    );
    p.routeSegment = finstruvialServicioRouteSegmentFrom(p.slug, p.routeSegment);
    const nuevo = finstruvialServicioRouteSegmentFrom(p.slug, p.routeSegment);
    this.routeSegmentAlEnfocar = nuevo;
    if (nuevo !== anterior) {
      return {
        lineaSlug: p.slug,
        hubPrefix: this.serviciosHubRoute || '/servicios',
        fromSegment: anterior,
        toSegment: nuevo,
      };
    }
    return null;
  }

  routeSegmentDuplicado(): boolean {
    const p = this.paginaActiva();
    const seg = finstruvialServicioRouteSegmentFrom(p.slug, p.routeSegment);
    const paginas = this.finstruvialServicios?.paginas;
    if (!paginas) return false;
    return FINSTRUVIAL_SERVICIO_SLUGS.some((slug) => {
      if (slug === p.slug || paginas[slug]?.activa === false) return false;
      return finstruvialServicioRouteSegmentFrom(slug, paginas[slug]?.routeSegment) === seg;
    });
  }

  portafolioVisible(): boolean {
    return this.finstruvialServicios.activa !== false;
  }

  setPortafolioVisible(activa: boolean): void {
    this.finstruvialServicios.activa = activa;
  }

  lineaVisible(slug: FinstruvialServicioSlug): boolean {
    return this.finstruvialServicios.paginas[slug]?.activa !== false;
  }

  setLineaVisible(slug: FinstruvialServicioSlug, activa: boolean): void {
    if (!this.finstruvialServicios.paginas[slug]) {
      this.finstruvialServicios.paginas[slug] = this.mergePortafolio().paginas[slug];
    }
    this.finstruvialServicios.paginas[slug].activa = activa;
  }

  restaurarHub() {
    if (!confirm('¿Restaurar textos del portafolio (/servicios)? Las imágenes subidas y la visibilidad se conservan.')) return;
    const hero = { ...this.finstruvialServicios.hub };
    const activa = this.finstruvialServicios.activa;
    const defaults = this.portafolioDefaults();
    this.finstruvialServicios.hub = {
      ...defaults.hub,
      heroImagenUrl: hero.heroImagenUrl,
      heroImagenUrlAbsoluta: hero.heroImagenUrlAbsoluta,
      formacionImagenUrl: hero.formacionImagenUrl,
      formacionImagenUrlAbsoluta: hero.formacionImagenUrlAbsoluta,
      formacionImagen2Url: hero.formacionImagen2Url,
      formacionImagen2UrlAbsoluta: hero.formacionImagen2UrlAbsoluta,
    };
    this.finstruvialServicios.menuLabel = defaults.menuLabel;
    this.finstruvialServicios.activa = activa;
  }

  restaurarLinea() {
    const slug = this.lineaActiva();
    if (!confirm(`¿Restaurar textos de «${this.paginaActiva().menuLabel}»? Las imágenes subidas se conservan.`)) {
      return;
    }
    const imagenes = [...(this.finstruvialServicios.paginas[slug].imagenes || [])];
    const videos = [...(this.finstruvialServicios.paginas[slug].videos || [])];
    const heroUrl = this.finstruvialServicios.paginas[slug].heroImagenUrl;
    const heroAbs = this.finstruvialServicios.paginas[slug].heroImagenUrlAbsoluta;
    this.finstruvialServicios.paginas[slug] = {
      ...this.mergePortafolio().paginas[slug],
      imagenes,
      videos,
      heroImagenUrl: heroUrl,
      heroImagenUrlAbsoluta: heroAbs,
    };
  }

  previewUrl(url?: string, urlAbsoluta?: string): string | null {
    return resolveUploadAssetUrl(url, urlAbsoluta);
  }

  onHubImagen(ev: Event, slot: 'hero' | 'formacion' | 'formacion2' = 'hero') {
    const file = (ev.target as HTMLInputElement).files?.[0];
    (ev.target as HTMLInputElement).value = '';
    if (!file) return;
    const uploadKey = `hub:${slot}`;
    this.uploadingId.set(uploadKey);
    this.api
      .subirImagenFinstruvialServiciosHubPortal(file, slot)
      .pipe(finalize(() => this.uploadingId.set(null)))
      .subscribe({
        next: (res) => {
          if (res.url) {
            if (slot === 'hero') {
              this.finstruvialServicios.hub.heroImagenUrl = res.url;
              this.finstruvialServicios.hub.heroImagenUrlAbsoluta = res.urlAbsoluta || '';
            } else if (slot === 'formacion') {
              this.finstruvialServicios.hub.formacionImagenUrl = res.url;
              this.finstruvialServicios.hub.formacionImagenUrlAbsoluta = res.urlAbsoluta || '';
            } else {
              this.finstruvialServicios.hub.formacionImagen2Url = res.url;
              this.finstruvialServicios.hub.formacionImagen2UrlAbsoluta = res.urlAbsoluta || '';
            }
          }
          if (res.config) this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen actualizada' });
        },
        error: (e) =>
          this.avNotice.emit({ message: e?.error?.message || 'No se pudo subir la imagen', error: true }),
      });
  }

  quitarHubImagen(slot: 'hero' | 'formacion' | 'formacion2' = 'hero') {
    const labels: Record<'hero' | 'formacion' | 'formacion2', string> = {
      hero: 'la imagen del portafolio',
      formacion: 'la imagen de formación 1',
      formacion2: 'la imagen de formación 2',
    };
    if (!confirm(`¿Quitar ${labels[slot]}?`)) return;
    const uploadKey = `hub:${slot}`;
    this.uploadingId.set(uploadKey);
    this.api
      .quitarImagenFinstruvialServiciosHubPortal(slot)
      .pipe(finalize(() => this.uploadingId.set(null)))
      .subscribe({
        next: (res) => {
          if (slot === 'hero') {
            this.finstruvialServicios.hub.heroImagenUrl = '';
            this.finstruvialServicios.hub.heroImagenUrlAbsoluta = '';
          } else if (slot === 'formacion') {
            this.finstruvialServicios.hub.formacionImagenUrl = '';
            this.finstruvialServicios.hub.formacionImagenUrlAbsoluta = '';
          } else {
            this.finstruvialServicios.hub.formacionImagen2Url = '';
            this.finstruvialServicios.hub.formacionImagen2UrlAbsoluta = '';
          }
          if (res.config) this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen eliminada' });
        },
        error: (e) =>
          this.avNotice.emit({ message: e?.error?.message || 'No se pudo eliminar la imagen', error: true }),
      });
  }

  onLineaImagen(ev: Event, imagenId: string) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    (ev.target as HTMLInputElement).value = '';
    if (!file) return;
    const slug = this.lineaActiva();
    const key = `${slug}:${imagenId}`;
    this.uploadingId.set(key);
    this.api
      .subirImagenFinstruvialServicioPortal(file, slug, imagenId)
      .pipe(finalize(() => this.uploadingId.set(null)))
      .subscribe({
        next: (res) => {
          this.syncLineaImagen(slug, imagenId, res.url, res.urlAbsoluta);
          if (res.config) this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen actualizada' });
        },
        error: (e) =>
          this.avNotice.emit({ message: e?.error?.message || 'No se pudo subir la imagen', error: true }),
      });
  }

  quitarLineaImagen(imagenId: string) {
    if (!confirm('¿Quitar esta imagen?')) return;
    const slug = this.lineaActiva();
    const key = `${slug}:${imagenId}`;
    this.uploadingId.set(key);
    this.api
      .quitarImagenFinstruvialServicioPortal(slug, imagenId)
      .pipe(finalize(() => this.uploadingId.set(null)))
      .subscribe({
        next: (res) => {
          this.syncLineaImagen(slug, imagenId, '', '');
          if (res.config) this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen eliminada' });
        },
        error: (e) =>
          this.avNotice.emit({ message: e?.error?.message || 'No se pudo eliminar la imagen', error: true }),
      });
  }

  addHeroParrafo() {
    this.paginaActiva().heroParrafos.push('');
  }

  addIntroParrafo() {
    this.paginaActiva().introParrafos.push('');
  }

  addProductoParrafo() {
    this.paginaActiva().productoParrafos.push('');
  }

  addBloque() {
    this.paginaActiva().bloques.push({ icon: '📌', titulo: '', texto: '' } satisfies PortalFinstruvialServicioBloque);
  }

  addMetodologiaPaso() {
    this.paginaActiva().metodologiaPasos.push('');
  }

  addListaItem() {
    this.paginaActiva().listaServicios.push({ titulo: '', texto: '' } satisfies PortalFinstruvialServicioItem);
  }

  addExperienciaItem() {
    this.paginaActiva().experienciaItems.push({ icon: '📌', titulo: '', texto: '' } satisfies PortalFinstruvialServicioBloque);
  }

  addPilarEducativo() {
    this.paginaActiva().pilaresEducativos.push({ icon: '📌', titulo: '', texto: '' } satisfies PortalFinstruvialServicioBloque);
  }

  addRutaPaso() {
    this.paginaActiva().rutaAprendizaje.push('');
  }

  addPublico() {
    this.paginaActiva().publicos.push('');
  }

  addEcosistemaItem() {
    this.paginaActiva().ecosistemaItems.push({ icon: '📌', titulo: '', texto: '' } satisfies PortalFinstruvialServicioBloque);
  }

  addGamificacionItem() {
    this.paginaActiva().gamificacionItems.push('');
  }

  addProductoEtiqueta() {
    this.paginaActiva().productoEtiquetas.push('');
  }

  addResultadoIcono() {
    this.paginaActiva().resultadoIconos.push({ icon: '📌', titulo: '', texto: '' } satisfies PortalFinstruvialServicioBloque);
  }

  addModuloPlataforma() {
    const imagenId = this.nuevoImagenIdModulo();
    this.ensureImagenSlot(imagenId, 'Captura módulo');
    this.paginaActiva().modulosPlataforma.push({
      icon: '📌',
      titulo: '',
      texto: '',
      imagenId,
    } satisfies PortalFinstruvialServicioBloque);
  }

  addGuiaPlataforma() {
    this.paginaActiva().guiasPlataforma.push({
      icon: '📌',
      titulo: '',
      texto: '',
      youtubeUrl: '',
    } satisfies PortalFinstruvialServicioBloque);
  }

  nuevoImagenIdModulo(): string {
    const p = this.paginaActiva();
    let n = 1;
    while (p.imagenes.some((img) => img.id === `modulo-extra-${n}`)) n += 1;
    return `modulo-extra-${n}`;
  }

  onLineaVideo(ev: Event, videoId: string) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    (ev.target as HTMLInputElement).value = '';
    if (!file) return;
    const slug = this.lineaActiva();
    const key = `${slug}:video:${videoId}`;
    this.uploadingId.set(key);
    this.api
      .subirVideoFinstruvialServicioPortal(file, slug, videoId)
      .pipe(finalize(() => this.uploadingId.set(null)))
      .subscribe({
        next: (res) => {
          this.syncLineaVideo(slug, videoId, res.url, res.urlAbsoluta);
          if (res.config) this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Video actualizado' });
        },
        error: (e) =>
          this.avNotice.emit({ message: e?.error?.message || 'No se pudo subir el video', error: true }),
      });
  }

  quitarLineaVideo(videoId: string) {
    if (!confirm('¿Quitar este video?')) return;
    const slug = this.lineaActiva();
    const key = `${slug}:video:${videoId}`;
    this.uploadingId.set(key);
    this.api
      .quitarVideoFinstruvialServicioPortal(slug, videoId)
      .pipe(finalize(() => this.uploadingId.set(null)))
      .subscribe({
        next: (res) => {
          this.syncLineaVideo(slug, videoId, '', '');
          if (res.config) this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Video eliminado' });
        },
        error: (e) =>
          this.avNotice.emit({ message: e?.error?.message || 'No se pudo eliminar el video', error: true }),
      });
  }

  tieneVideoSlot(b: PortalFinstruvialServicioBloque): boolean {
    return b.youtubeUrl !== undefined || b.videoId !== undefined;
  }

  addMedio(target: 'intro' | 'producto', tipo: PortalFinstruvialMedioTipoUi) {
    const p = this.paginaActiva();
    const medios = target === 'intro' ? p.introMedios : p.productoMedios;
    if (tipo === 'imagen') {
      const imagenId = this.nuevoImagenId();
      this.ensureImagenSlot(imagenId, 'Medio editorial');
      medios.push({ tipo: 'imagen', imagenId, caption: '' });
      return;
    }
    if (tipo === 'youtube') {
      medios.push({ tipo: 'video', videoOrigen: 'youtube', youtubeUrl: '', caption: '' });
      return;
    }
    const videoId = this.nuevoVideoId();
    this.ensureVideoSlot(videoId, 'Medio editorial');
    medios.push({ tipo: 'video', videoOrigen: 'archivo', videoId, caption: '' });
  }

  medioTipoActual(medio: PortalFinstruvialServicioMedio): PortalFinstruvialMedioTipoUi {
    if (medio.tipo === 'imagen') return 'imagen';
    return medio.videoOrigen === 'archivo' || medio.videoId ? 'archivo' : 'youtube';
  }

  setMedioTipo(medio: PortalFinstruvialServicioMedio, tipo: PortalFinstruvialMedioTipoUi) {
    if (tipo === 'imagen') {
      medio.tipo = 'imagen';
      if (!medio.imagenId?.trim()) {
        const imagenId = this.nuevoImagenId();
        this.ensureImagenSlot(imagenId, 'Medio editorial');
        medio.imagenId = imagenId;
      }
      delete medio.videoOrigen;
      delete medio.videoId;
      delete medio.youtubeUrl;
      return;
    }
    medio.tipo = 'video';
    delete medio.imagenId;
    if (tipo === 'youtube') {
      medio.videoOrigen = 'youtube';
      medio.youtubeUrl = medio.youtubeUrl || '';
      delete medio.videoId;
      return;
    }
    medio.videoOrigen = 'archivo';
    if (!medio.videoId?.trim()) {
      const videoId = this.nuevoVideoId();
      this.ensureVideoSlot(videoId, 'Medio editorial');
      medio.videoId = videoId;
    }
    delete medio.youtubeUrl;
  }

  videoSubido(videoId: string): boolean {
    const v = this.paginaActiva().videos.find((x) => x.id === videoId);
    return !!(v?.url?.trim() || v?.urlAbsoluta?.trim());
  }

  imagenSubida(imagenId: string): boolean {
    const p = this.paginaActiva();
    if (imagenId === 'hero') {
      return !!(p.heroImagenUrl?.trim() || p.heroImagenUrlAbsoluta?.trim());
    }
    const img = p.imagenes.find((x) => x.id === imagenId);
    return !!(img?.url?.trim() || img?.urlAbsoluta?.trim());
  }

  imagenEtiqueta(imagenId: string): string {
    const p = this.paginaActiva();
    if (imagenId === 'hero') return p.heroImagenAlt || 'Imagen del banner';
    return p.imagenes.find((x) => x.id === imagenId)?.etiqueta || 'Imagen';
  }

  imagenUrl(imagenId: string): string | null {
    const p = this.paginaActiva();
    if (imagenId === 'hero') {
      return this.previewUrl(p.heroImagenUrl, p.heroImagenUrlAbsoluta);
    }
    const img = p.imagenes.find((x) => x.id === imagenId);
    return img ? this.previewUrl(img.url, img.urlAbsoluta) : null;
  }

  tarjetasSoloIcono(): boolean {
    const slug = this.lineaActiva();
    return slug === 'peridata' || slug === 'herramientasEducativasTecnologicas';
  }

  tarjetasConFoto(): boolean {
    return this.lineaActiva() === 'capacitacionSensibilizacion';
  }

  estudiosModo(): boolean {
    return this.lineaActiva() === 'estudiosDiagnosticosTecnicos';
  }

  herramientasModo(): boolean {
    return this.lineaActiva() === 'herramientasEducativasTecnologicas';
  }

  inventariosModo(): boolean {
    return this.lineaActiva() === 'inventariosViales';
  }

  productoShowcaseModo(): boolean {
    return this.herramientasModo() || this.inventariosModo();
  }

  productoShowcaseNombre(): string {
    return this.paginaActiva().productoNombre?.trim() || 'producto';
  }

  estudiosDestacadosIndices(): number[] {
    return [0, 1, 2];
  }

  presentacionSplitEnEditor(): boolean {
    const slug = this.lineaActiva();
    return (
      slug === 'aulaVirtual' ||
      slug === 'peridata' ||
      slug === 'capacitacionSensibilizacion' ||
      slug === 'estudiosDiagnosticosTecnicos' ||
      slug === 'herramientasEducativasTecnologicas' ||
      slug === 'inventariosViales' ||
      slug === 'planeacionGestionVial'
    );
  }

  imagenSeccionSlot() {
    this.ensureImagenSlot('seccion', 'Imagen de presentación');
    return this.paginaActiva().imagenes.find((i) => i.id === 'seccion')!;
  }

  imagenPresentacionUrl(): string | null {
    return this.imagenUrl('seccion');
  }

  imagenProductoSlot() {
    const id = this.paginaActiva().productoImagenId?.trim() || 'producto';
    const etiqueta =
      this.inventariosModo()
        ? 'INFRAVIAL — captura o foto'
        : 'ENCIVIRTRANS — captura o foto';
    this.ensureImagenSlot(id, etiqueta);
    return this.paginaActiva().imagenes.find((i) => i.id === id)!;
  }

  imagenProductoUrl(): string | null {
    const id = this.paginaActiva().productoImagenId?.trim() || 'producto';
    return this.imagenUrl(id);
  }

  imagenIdBloque(index: number): string {
    const id = `foto${index + 1}`;
    const bloques = this.paginaActiva().bloques;
    const bloque = bloques[index];
    if (!bloque) return id;
    if (!bloque.imagenId?.trim()) {
      bloque.imagenId = id;
    }
    this.ensureImagenSlot(bloque.imagenId, `Línea de formación ${index + 1}`);
    return bloque.imagenId;
  }

  bloqueVideoModo(b: PortalFinstruvialServicioBloque): 'none' | 'youtube' | 'archivo' {
    if (!this.tieneVideoSlot(b)) return 'none';
    return b.videoOrigen === 'archivo' || b.videoId ? 'archivo' : 'youtube';
  }

  setBloqueVideoModo(b: PortalFinstruvialServicioBloque, modo: 'none' | 'youtube' | 'archivo') {
    if (modo === 'none') {
      this.quitarVideoBloquePorBloque(b);
      return;
    }
    if (modo === 'youtube') {
      b.videoOrigen = 'youtube';
      b.youtubeUrl = b.youtubeUrl || '';
      delete b.videoId;
      return;
    }
    b.videoOrigen = 'archivo';
    if (!b.videoId?.trim()) {
      const videoId = this.nuevoVideoId();
      this.ensureVideoSlot(videoId, 'Video bloque');
      b.videoId = videoId;
    }
    delete b.youtubeUrl;
  }

  private quitarVideoBloquePorBloque(bloque: PortalFinstruvialServicioBloque) {
    delete bloque.youtubeUrl;
    delete bloque.videoId;
    delete bloque.videoOrigen;
  }

  nuevoVideoId(): string {
    const p = this.paginaActiva();
    let n = 1;
    while (p.videos.some((v) => v.id === `video${n}`)) n += 1;
    return `video${n}`;
  }

  ensureVideoSlot(id: string, etiqueta: string) {
    const p = this.paginaActiva();
    if (!p.videos.some((v) => v.id === id)) {
      p.videos.push({ id, etiqueta, url: '', alt: etiqueta });
    }
  }

  videoUploadKey(videoId: string): string {
    return `${this.lineaActiva()}:video:${videoId}`;
  }

  nuevoImagenId(): string {
    const p = this.paginaActiva();
    let n = 1;
    while (p.imagenes.some((img) => img.id === `medio${n}`)) n += 1;
    return `medio${n}`;
  }

  ensureImagenSlot(id: string, etiqueta: string, pagina?: PortalFinstruvialServicioLanding) {
    const p = pagina ?? this.paginaActiva();
    if (!Array.isArray(p.imagenes)) p.imagenes = [];
    if (!p.imagenes.some((img) => img.id === id)) {
      p.imagenes.push({ id, etiqueta, url: '', alt: etiqueta });
    }
  }

  imagenIdsDisponibles(): string[] {
    return this.paginaActiva().imagenes.map((img) => img.id);
  }

  private syncLineaVideo(slug: FinstruvialServicioSlug, videoId: string, url: string, urlAbsoluta?: string) {
    const pagina = this.finstruvialServicios.paginas[slug];
    const idx = pagina.videos.findIndex((v) => v.id === videoId);
    if (idx < 0) return;
    pagina.videos[idx] = { ...pagina.videos[idx], url, urlAbsoluta: urlAbsoluta || '' };
  }

  private syncLineaImagen(slug: FinstruvialServicioSlug, imagenId: string, url: string, urlAbsoluta?: string) {
    const pagina = this.finstruvialServicios.paginas[slug];
    if (imagenId === 'hero') {
      pagina.heroImagenUrl = url;
      pagina.heroImagenUrlAbsoluta = urlAbsoluta || '';
      return;
    }
    const idx = pagina.imagenes.findIndex((i) => i.id === imagenId);
    if (idx < 0) return;
    pagina.imagenes[idx] = { ...pagina.imagenes[idx], url, urlAbsoluta: urlAbsoluta || '' };
  }

  onHubHeroStatsChange(value: string): void {
    this.finstruvialServicios.hub.heroStats = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  onHubSeoTextoParrafosChange(value: string): void {
    this.finstruvialServicios.hub.seoTextoParrafos = value
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
}
