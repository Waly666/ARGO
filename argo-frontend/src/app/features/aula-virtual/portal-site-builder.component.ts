import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import {
  mergePortalSiteDefaults,
  ordenSeccionesHomePortal,
  PORTAL_FUENTES,
  PORTAL_HOME_SECCIONES_LABELS,
  PORTAL_PAGINA_META,
  PortalHomeConfig,
  PortalSiteConfig,
} from '../../core/constants/portal-site-defaults';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { mergePortalLanding, PORTAL_CONSULTA_ASISTENTE_TEXTO_DEFAULT } from '../../core/constants/portal-landing-defaults';
import { mergeExamenTeoricoLanding, PortalExamenTeoricoLanding } from '../../core/constants/examen-teorico-landing-defaults';
import { PORTAL_ASISTENTE_PAGINAS } from '../../core/utils/portal-asistente.util';
import { PortalPaginaKey } from '../../core/constants/portal-site-defaults';
import { PortalLandingEditorComponent } from './portal-landing-editor.component';
import { PortalFundacionEditorComponent } from './portal-fundacion-editor.component';
import { PortalCursosConduccionEditorComponent } from './portal-cursos-conduccion-editor.component';
import { PortalExamenTeoricoEditorComponent } from './portal-examen-teorico-editor.component';
import { PortalGaleriaFotosEditorComponent } from './portal-galeria-fotos-editor.component';
import { PortalHomeFotosEditorComponent } from './portal-home-fotos-editor.component';
import { PortalAcercaHeroEditorComponent } from './portal-acerca-hero-editor.component';
import { PortalPopupEditorComponent } from './portal-popup-editor.component';
import { PortalAppMobileEditorComponent } from './portal-app-mobile-editor.component';
import { PortalSitePreviewComponent } from './portal-site-preview.component';
import { buildPortalThemeCssVars } from '../../core/utils/portal-theme-css.util';
import { loadPortalGoogleFonts } from '../../core/utils/portal-fonts.util';
import { environment } from '../../../environments/environment';
import { resolveUploadAssetUrl } from '../../core/utils/upload-asset-url.util';
import { AuthService } from '../../core/services/auth.service';

export type BuilderPanel =
  | 'panel'
  | 'paginas'
  | 'apariencia'
  | 'inicio'
  | 'contenido'
  | 'fotosInicio'
  | 'institucional'
  | 'blog'
  | 'galeria'
  | 'popup'
  | 'appMobile'
  | 'asistente'
  | 'consultaCertificados'
  | 'cursosConduccion'
  | 'examenTeorico'
  | 'empresa'
  | 'marca';

interface MenuItem {
  id: BuilderPanel;
  icon: string;
  label: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

interface PanelInfo {
  title: string;
  help: string;
}

interface GuiaPaso {
  num: number;
  titulo: string;
  texto: string;
  panel: BuilderPanel;
  listo: () => boolean;
}

@Component({
  selector: 'argo-portal-site-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    PortalLandingEditorComponent,
    PortalFundacionEditorComponent,
    PortalCursosConduccionEditorComponent,
    PortalExamenTeoricoEditorComponent,
    PortalGaleriaFotosEditorComponent,
    PortalHomeFotosEditorComponent,
    PortalAcercaHeroEditorComponent,
    PortalPopupEditorComponent,
    PortalAppMobileEditorComponent,
    PortalSitePreviewComponent,
  ],
  templateUrl: './portal-site-builder.component.html',
  styleUrl: './portal-site-builder.component.scss',
})
export class PortalSiteBuilderComponent {
  private svc = inject(AulaVirtualAdminService);
  private auth = inject(AuthService);
  private doc = inject(DOCUMENT);

  readonly esAdmin = this.auth.isAdmin;

  @Input({ required: true }) portalForm!: PortalAulaConfig;
  @Input({ required: true }) portalUrl!: string;
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  heroUploading = signal(false);
  asistenteVideoUploading = signal(false);

  readonly paginaMeta = PORTAL_PAGINA_META;
  readonly fuentes = PORTAL_FUENTES;

  readonly menuGroups: MenuGroup[] = [
    {
      title: 'Empieza aquí',
      items: [
        { id: 'panel', icon: '✨', label: 'Guía rápida' },
        { id: 'empresa', icon: '🏢', label: 'Nombre y contacto' },
      ],
    },
    {
      title: 'Menú del sitio',
      items: [{ id: 'paginas', icon: '📋', label: 'Páginas visibles' }],
    },
    {
      title: 'Página principal',
      items: [
        { id: 'inicio', icon: '🏠', label: 'Bloques del inicio' },
        { id: 'fotosInicio', icon: '🖼️', label: 'Fotos del inicio' },
        { id: 'contenido', icon: '✏️', label: 'Textos del inicio' },
        { id: 'appMobile', icon: '📲', label: 'App móvil Android' },
      ],
    },
    {
      title: 'Más páginas',
      items: [
        { id: 'institucional', icon: '🏛️', label: 'Quiénes somos' },
        { id: 'cursosConduccion', icon: '🚗', label: 'Cursos conducción' },
        { id: 'examenTeorico', icon: '📋', label: 'Examen teórico' },
        { id: 'galeria', icon: '📷', label: 'Galería' },
        { id: 'blog', icon: '📰', label: 'Blog' },
        { id: 'asistente', icon: '🤖', label: 'Asistente' },
        { id: 'consultaCertificados', icon: '📜', label: 'Consulta certificados' },
      ],
    },
    {
      title: 'Diseño',
      items: [
        { id: 'apariencia', icon: '🎨', label: 'Colores y estilo' },
        { id: 'popup', icon: '💬', label: 'Popup de bienvenida' },
        { id: 'marca', icon: '©', label: 'Pie de página' },
      ],
    },
  ];

  panel = signal<BuilderPanel>('panel');
  previewVisible = signal(true);
  aparienciaAvanzada = signal(false);
  /** Fuerza refresco de la lista de bloques del inicio tras reordenar o activar/desactivar. */
  private homeSeccionesTick = signal(0);

  get landing() {
    if (!this.portalForm.landing) {
      this.portalForm.landing = mergePortalLanding();
    } else     if (!this.portalForm.landing.blog) {
      this.portalForm.landing.blog = { ...mergePortalLanding().blog };
    }
    if (!this.portalForm.landing.galeria) {
      this.portalForm.landing.galeria = mergePortalLanding().galeria;
    }
    if (!this.portalForm.landing.fotosInicio) {
      this.portalForm.landing.fotosInicio = mergePortalLanding().fotosInicio;
    }
    if (!this.portalForm.landing.popup) {
      this.portalForm.landing.popup = { ...mergePortalLanding().popup };
    }
    if (!this.portalForm.landing.consultaCertificados) {
      this.portalForm.landing.consultaCertificados = { ...mergePortalLanding().consultaCertificados };
    }
    if (!this.portalForm.landing.asistente) {
      this.portalForm.landing.asistente = { ...mergePortalLanding().asistente };
    }
    if (!this.portalForm.landing.cursosConduccion) {
      this.portalForm.landing.cursosConduccion = { ...mergePortalLanding().cursosConduccion };
    }
    if (!this.portalForm.landing.cursosConduccion.invitacion) {
      this.portalForm.landing.cursosConduccion.invitacion = {
        ...mergePortalLanding().cursosConduccion.invitacion,
        beneficios: [...mergePortalLanding().cursosConduccion.invitacion.beneficios],
      };
    }
    if (!this.portalForm.landing.cursosConduccion.hero) {
      this.portalForm.landing.cursosConduccion.hero = { ...mergePortalLanding().cursosConduccion.hero };
    }
    if (!this.portalForm.landing.cursosConduccion.licencias) {
      this.portalForm.landing.cursosConduccion.licencias = {
        ...mergePortalLanding().cursosConduccion.licencias,
        items: mergePortalLanding().cursosConduccion.licencias.items.map((item) => ({
          ...item,
          incluye: [...item.incluye],
        })),
      };
    }
    if (!this.portalForm.landing.acerca) {
      this.portalForm.landing.acerca = mergePortalLanding().acerca;
    }
    this.ensureExamenTeoricoLanding();
    return this.portalForm.landing;
  }

  /** Inicializa examen teórico / normograma sin reemplazar el objeto en cada render (conserva PDFs subidos). */
  ensureExamenTeoricoLanding(): PortalExamenTeoricoLanding {
    if (!this.portalForm.landing) {
      this.portalForm.landing = mergePortalLanding();
    }
    if (!this.portalForm.landing.examenTeorico) {
      this.portalForm.landing.examenTeorico = mergePortalLanding().examenTeorico;
    } else if (!this.portalForm.landing.examenTeorico.normograma?.items?.length) {
      this.portalForm.landing.examenTeorico = mergeExamenTeoricoLanding(this.portalForm.landing.examenTeorico);
    }
    return this.portalForm.landing.examenTeorico;
  }

  get consultaCertificados() {
    return this.landing.consultaCertificados;
  }

  get asistente() {
    return this.landing.asistente;
  }

  readonly asistentePaginas = PORTAL_ASISTENTE_PAGINAS;

  get popup() {
    return this.landing.popup;
  }

  get acerca() {
    return this.landing.acerca;
  }

  get site(): PortalSiteConfig {
    if (!this.portalForm.site) {
      this.portalForm.site = mergePortalSiteDefaults();
    }
    if (this.portalForm.site.tema.fuenteTitulos === undefined) {
      this.portalForm.site.tema.fuenteTitulos = '';
    }
    return this.portalForm.site;
  }

  panelInfo(): PanelInfo {
    const map: Record<BuilderPanel, PanelInfo> = {
      panel: {
        title: 'Guía rápida',
        help: 'Siga estos pasos en orden. A la derecha ve cómo quedará su sitio antes de publicar.',
      },
      empresa: {
        title: 'Nombre y contacto de su empresa',
        help: 'Escriba aquí el nombre que debe verse en el menú, el encabezado y el pie del sitio. También teléfono, dirección y correo.',
      },
      paginas: {
        title: 'Páginas del menú',
        help: 'Active o desactive páginas y cambie cómo se llaman en el menú superior (por ejemplo «CEA» → «Institucional»).',
      },
      inicio: {
        title: 'Bloques de la página principal',
        help: 'Encienda o apague secciones del inicio y use las flechas para cambiar el orden. Mire la vista previa a la derecha.',
      },
      contenido: {
        title: 'Textos de la página principal',
        help: 'Edite frases, preguntas frecuentes, testimonios y demás textos que aparecen en el inicio del sitio.',
      },
      appMobile: {
        title: 'App móvil Android',
        help:
          'Suba el archivo APK al servidor y configure el botón de descarga que aparece en la sección «App Mobile» del inicio del portal.',
      },
      fotosInicio: {
        title: 'Fotos destacadas del inicio',
        help: 'Hasta 2 fotos aparte del hero. Si no hay ninguna, el bloque no se muestra en el sitio.',
      },
      institucional: {
        title: 'Página «Quiénes somos»',
        help: 'Misión, visión, quiénes somos y servicios del CEA. Ideal si renombró «CEA» por «Institucional» o «Nosotros».',
      },
      cursosConduccion: {
        title: 'Cursos conducción',
        help: 'Página con categorías de licencia (A2, B1, C1…) y resoluciones del Mintransporte descargables en PDF.',
      },
      examenTeorico: {
        title: 'Examen teórico (normatividad)',
        help:
          'Página oculta del menú (/examen-teorico) con información del examen teórico, normograma con PDF por norma y resoluciones descargables. El botón del inicio lleva a esta página.',
      },
      blog: {
        title: 'Página Blog',
        help: 'Encabezado y textos de la página /blog. Los artículos se publican en Aula virtual → Blog del portal.',
      },
      galeria: {
        title: 'Página Galería',
        help: 'Encabezado de /galeria. Las fotos y videos las gestiona solo el administrador en Aula virtual → Galería.',
      },
      apariencia: {
        title: 'Colores y estilo',
        help: 'Elija los colores de su marca. No necesita saber diseño: pruebe y mire el resultado en la vista previa.',
      },
      popup: {
        title: 'Popup de bienvenida',
        help: 'Ventana emergente al entrar al portal: imagen, botones, duración y frecuencia de visualización.',
      },
      consultaCertificados: {
        title: 'Consulta de certificados',
        help: 'Opciones de la página pública /consulta-certificados: descarga PDF y marca de agua.',
      },
      asistente: {
        title: 'Asistente virtual',
        help:
          'Active el asistente con avatar en cada página del portal y escriba el mensaje que leerá en voz alta.',
      },
      marca: {
        title: 'Pie de página',
        help: 'Texto de derechos de autor al final del sitio. Puede ocultar referencias de quien desarrolló el sistema.',
      },
    };
    return map[this.panel()];
  }

  pasosGuia(): GuiaPaso[] {
    return [
      {
        num: 1,
        titulo: 'Ponga el nombre de su empresa',
        texto: 'Es lo primero. Así deja de aparecer el nombre de ejemplo en el sitio.',
        panel: 'empresa',
        listo: () => !!this.portalForm.nombreEmpresa?.trim(),
      },
      {
        num: 2,
        titulo: 'Elija qué páginas mostrar',
        texto: 'Decida qué enlaces verán sus visitantes en el menú.',
        panel: 'paginas',
        listo: () => true,
      },
      {
        num: 3,
        titulo: 'Ajuste colores (opcional)',
        texto: 'Use los colores de su marca si lo desea.',
        panel: 'apariencia',
        listo: () => true,
      },
      {
        num: 4,
        titulo: 'Ordene el inicio',
        texto: 'Active solo los bloques que necesita y ordénelos.',
        panel: 'inicio',
        listo: () => true,
      },
      {
        num: 5,
        titulo: 'Publique los cambios',
        texto: 'Hasta que no pulse el botón azul de abajo, los visitantes no verán sus cambios.',
        panel: 'panel',
        listo: () => false,
      },
    ];
  }

  pasosCompletados(): number {
    return this.pasosGuia().filter((p) => p.listo()).length;
  }

  seccionesInicio(): { id: string; label: string; activa: boolean }[] {
    this.homeSeccionesTick();
    const s = this.site;
    const labels = { ...PORTAL_HOME_SECCIONES_LABELS, ...s.homeSeccionesLabels };
    return ordenSeccionesHomePortal(s).map((id) => ({
      id,
      label: labels[id] || id,
      activa: s.home.secciones[id] !== false,
    }));
  }

  setPanel(id: BuilderPanel) {
    this.panel.set(id);
  }

  togglePreview() {
    this.previewVisible.update((v) => !v);
  }

  togglePagina(key: string, activa: boolean) {
    const p = this.site.paginas[key as keyof typeof this.site.paginas];
    if (p) p.activa = activa;
  }

  toggleSeccion(id: string, activa: boolean) {
    this.patchHome({
      secciones: { ...this.site.home.secciones, [id]: activa },
    });
  }

  moverSeccion(id: string, dir: -1 | 1) {
    const orden = [...ordenSeccionesHomePortal(this.site)];
    const i = orden.indexOf(id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= orden.length) return;
    [orden[i], orden[j]] = [orden[j], orden[i]];
    this.patchHome({ orden });
  }

  private patchHome(partial: Partial<PortalHomeConfig>) {
    const site = this.site;
    site.home = { ...site.home, ...partial };
    this.homeSeccionesTick.update((n) => n + 1);
  }

  paginasActivas(): number {
    return this.paginaMeta.filter((p) => this.site.paginas[p.key]?.activa !== false).length;
  }

  seccionesActivas(): number {
    return this.seccionesInicio().filter((s) => s.activa).length;
  }

  paginaSiempreVisible(key: string): boolean {
    return key === 'home' || key === 'aula';
  }

  themePreviewVars(): Record<string, string> {
    return buildPortalThemeCssVars(this.site.tema);
  }

  onFuentesChange() {
    if (this.site.tema.fuenteTitulos === undefined) {
      this.site.tema.fuenteTitulos = '';
    }
    loadPortalGoogleFonts(this.doc, this.site.tema);
  }

  tieneImagenHero(): boolean {
    return !!this.site.tema?.urlHero?.trim();
  }

  heroPreviewUrl(): string | null {
    return resolveUploadAssetUrl(this.site.tema?.urlHero, this.site.tema?.urlHeroAbsoluta);
  }

  onHeroImagen(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.heroUploading.set(true);
    this.svc
      .subirImagenHeroPortal(file)
      .pipe(
        finalize(() => {
          this.heroUploading.set(false);
          input.value = '';
        }),
      )
      .subscribe({
        next: (res) => {
          this.applyPortalConfig(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen del banner actualizada' });
        },
        error: (e) => {
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo subir la imagen del banner',
            error: true,
          });
        },
      });
  }

  quitarImagenHero() {
    this.heroUploading.set(true);
    this.svc
      .quitarImagenHeroPortal()
      .pipe(finalize(() => this.heroUploading.set(false)))
      .subscribe({
        next: (res) => {
          this.applyPortalConfig(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen del banner eliminada' });
        },
        error: (e) => {
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo quitar la imagen del banner',
            error: true,
          });
        },
      });
  }

  applyPortalConfig(config: PortalAulaConfig) {
    Object.assign(this.portalForm, config);
    this.portalForm.landing = mergePortalLanding(config.landing);
    this.portalForm.site = mergePortalSiteDefaults(config.site);
    if (this.portalForm.site.tema.fuenteTitulos === undefined) {
      this.portalForm.site.tema.fuenteTitulos = '';
    }
    loadPortalGoogleFonts(this.doc, this.portalForm.site.tema);
  }

  asistenteVideoPreviewUrl(): string | null {
    const asistente = this.asistente;
    const abs = asistente.videoUrlAbsoluta?.trim();
    if (abs) {
      if (/^https?:\/\//i.test(abs)) return abs;
      if (abs.startsWith('/uploads/')) {
        const base = environment.uploadsUrl.replace(/\/+$/, '');
        return `${base}/${abs.replace(/^\/uploads\//, '')}`;
      }
      return abs;
    }
    const rel = asistente.videoUrl?.trim();
    if (!rel) return null;
    if (/^https?:\/\//i.test(rel)) return rel;
    if (rel.includes('aula-virtual-consulta-asistente/')) {
      const base = environment.uploadsUrl.replace(/\/+$/, '');
      return `${base}/${rel.replace(/^\/+/, '')}`;
    }
    const portal = this.portalUrl.replace(/\/?$/, '');
    return `${portal}/${rel.replace(/^\/+/, '')}`;
  }

  tieneVideoAsistentePersonalizado(): boolean {
    const rel = this.asistente.videoUrl?.trim() || '';
    return rel.includes('aula-virtual-consulta-asistente/');
  }

  asistentePagina(key: PortalPaginaKey) {
    if (!this.asistente.paginas[key]) {
      this.asistente.paginas[key] = { activo: false, texto: '' };
    }
    return this.asistente.paginas[key];
  }

  restaurarTextoAsistentePagina(key: PortalPaginaKey) {
    this.asistentePagina(key).texto =
      key === 'consultaCertificados' ? PORTAL_CONSULTA_ASISTENTE_TEXTO_DEFAULT : '';
  }

  onAsistenteVideo(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.asistenteVideoUploading.set(true);
    this.svc
      .subirVideoAsistenteCertificadosPortal(file)
      .pipe(
        finalize(() => {
          this.asistenteVideoUploading.set(false);
          input.value = '';
        }),
      )
      .subscribe({
        next: (res) => {
          this.applyPortalConfig(res.config);
          this.avNotice.emit({ message: res.message || 'Video del asistente actualizado' });
        },
        error: (e) => {
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo subir el video del asistente',
            error: true,
          });
        },
      });
  }

  quitarAsistenteVideo() {
    this.asistenteVideoUploading.set(true);
    this.svc
      .quitarVideoAsistenteCertificadosPortal()
      .pipe(finalize(() => this.asistenteVideoUploading.set(false)))
      .subscribe({
        next: (res) => {
          this.applyPortalConfig(res.config);
          this.avNotice.emit({ message: res.message || 'Video del asistente restaurado al predeterminado' });
        },
        error: (e) => {
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo quitar el video personalizado',
            error: true,
          });
        },
      });
  }
}
