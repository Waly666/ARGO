import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  FINSTRUVIAL_SERVICIO_ROUTE,
  FINSTRUVIAL_SERVICIO_SLUGS,
  FinstruvialServicioSlug,
} from '../../core/constants/finstruvial-servicios.constants';
import {
  FINSTRUVIAL_SERVICIO_BUILDER_MENU,
} from '../../core/constants/finstruvial-servicios-editor-panels';
import {
  FINSTRUVIAL_SERVICIOS_DEFAULTS,
  finstruvialServiciosLista,
  mergeFinstruvialServicios,
} from '../../core/constants/finstruvial-servicios-defaults';
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

@Component({
  selector: 'argo-portal-finstruvial-servicios-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PortalPromoHeroFieldsEditorComponent,
    PortalFinstruvialEditorSeccionComponent,
    PortalFinstruvialMediosPanelComponent,
  ],
  templateUrl: './portal-finstruvial-servicios-editor.component.html',
  styleUrl: './portal-finstruvial-servicios-editor.component.scss',
})
export class PortalFinstruvialServiciosEditorComponent {
  private api = inject(AulaVirtualAdminService);

  @Input({ required: true }) finstruvialServicios!: PortalFinstruvialServiciosConfig;
  /** `hub` = portafolio /servicios; `linea` = una de las siete páginas. */
  @Input() modo: 'hub' | 'linea' = 'hub';
  /** Obligatorio cuando `modo` es `linea`. */
  @Input() lineaSlug: FinstruvialServicioSlug | null = null;
  /** URL pública del portal (para enlaces «Ver en sitio»). */
  @Input() portalUrl = '';
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  readonly slugs = FINSTRUVIAL_SERVICIO_SLUGS;
  readonly routes = FINSTRUVIAL_SERVICIO_ROUTE;
  readonly lineasMenu = FINSTRUVIAL_SERVICIO_BUILDER_MENU;
  readonly removeItem = removeAt;

  uploadingId = signal<string | null>(null);
  /** Colapsar/expandir bloques del formulario (por defecto todos abiertos). */
  private gruposAbiertos = signal<Record<string, boolean>>({});

  lineaActiva(): FinstruvialServicioSlug {
    if (this.modo === 'linea' && this.lineaSlug) {
      return this.lineaSlug;
    }
    return 'aulaVirtual';
  }

  lineas() {
    return finstruvialServiciosLista(this.finstruvialServicios);
  }

  paginaActiva(): PortalFinstruvialServicioLanding {
    const slug = this.lineaActiva();
    let p = this.finstruvialServicios?.paginas?.[slug];
    if (!p) {
      const merged = mergeFinstruvialServicios(this.finstruvialServicios).paginas[slug];
      if (!this.finstruvialServicios.paginas) {
        this.finstruvialServicios.paginas = mergeFinstruvialServicios().paginas;
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
    if (!Array.isArray(p.modulosPlataforma)) p.modulosPlataforma = [];
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
    return p;
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

  vistaPreviaPagina(): string {
    const base = (this.portalUrl || '').replace(/\/+$/, '');
    if (!base) return '';
    return `${base}${this.routes[this.lineaActiva()]}`;
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
      this.finstruvialServicios.paginas[slug] = mergeFinstruvialServicios().paginas[slug];
    }
    this.finstruvialServicios.paginas[slug].activa = activa;
  }

  restaurarHub() {
    if (!confirm('¿Restaurar textos del portafolio (/servicios)? Las imágenes subidas y la visibilidad se conservan.')) return;
    const hero = { ...this.finstruvialServicios.hub };
    const activa = this.finstruvialServicios.activa;
    this.finstruvialServicios.hub = {
      ...FINSTRUVIAL_SERVICIOS_DEFAULTS.hub,
      heroImagenUrl: hero.heroImagenUrl,
      heroImagenUrlAbsoluta: hero.heroImagenUrlAbsoluta,
    };
    this.finstruvialServicios.menuLabel = FINSTRUVIAL_SERVICIOS_DEFAULTS.menuLabel;
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
      ...mergeFinstruvialServicios().paginas[slug],
      imagenes,
      videos,
      heroImagenUrl: heroUrl,
      heroImagenUrlAbsoluta: heroAbs,
    };
  }

  previewUrl(url?: string, urlAbsoluta?: string): string | null {
    return resolveUploadAssetUrl(url, urlAbsoluta);
  }

  onHubImagen(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    (ev.target as HTMLInputElement).value = '';
    if (!file) return;
    this.uploadingId.set('hub');
    this.api
      .subirImagenFinstruvialServiciosHubPortal(file)
      .pipe(finalize(() => this.uploadingId.set(null)))
      .subscribe({
        next: (res) => {
          if (res.url) {
            this.finstruvialServicios.hub.heroImagenUrl = res.url;
            this.finstruvialServicios.hub.heroImagenUrlAbsoluta = res.urlAbsoluta || '';
          }
          if (res.config) this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen del portafolio actualizada' });
        },
        error: (e) =>
          this.avNotice.emit({ message: e?.error?.message || 'No se pudo subir la imagen', error: true }),
      });
  }

  quitarHubImagen() {
    if (!confirm('¿Quitar la imagen del portafolio?')) return;
    this.uploadingId.set('hub');
    this.api
      .quitarImagenFinstruvialServiciosHubPortal()
      .pipe(finalize(() => this.uploadingId.set(null)))
      .subscribe({
        next: (res) => {
          this.finstruvialServicios.hub.heroImagenUrl = '';
          this.finstruvialServicios.hub.heroImagenUrlAbsoluta = '';
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
}
