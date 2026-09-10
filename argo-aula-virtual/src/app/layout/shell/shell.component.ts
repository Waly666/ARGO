import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, ElementRef, inject, OnInit, AfterViewInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AulaApiService } from '../../core/aula-api.service';
import { CardWaveService } from '../../core/card-wave.service';
import { resolveUploadUrl } from '../../core/upload-url.util';
import { PortalConfigService } from '../../core/portal-config.service';
import {
  etiquetaPagina,
  paginaActiva,
  paginaEnMenuServicios,
  clavePaginaPorRuta,
  rutaPagina,
  type PortalPaginaKey,
} from '../../core/portal-site';
import { PortalAuthService } from '../../core/portal-auth.service';
import { mergePortalLanding } from '../../core/portal-landing';
import { asistenteVistaParaPagina } from '../../core/portal-asistente.util';
import { PortalThemeService } from '../../core/portal-theme.service';
import {
  finstruvialServicioPublicRoute,
} from '../../core/constants/finstruvial-servicios.constants';
import { finstruvialPortafolioActivo, finstruvialServiciosActivos } from '../../core/constants/finstruvial-servicios-defaults';
import { PortalPopupComponent } from '../../shared/portal-popup/portal-popup.component';
import { PortalIconComponent } from '../../shared/portal-icon/portal-icon.component';
import { ConsultaCertificadosAsistenteComponent } from '../../pages/consulta-certificados/consulta-certificados-asistente.component';

import { whatsappHrefFromPhone } from '../../core/portal-whatsapp.util';
import { DEFAULT_CEA_NOMBRE } from '../../core/portal-brand-defaults';
import { resolverTextoJuntoLogo } from '../../core/portal-marca.util';

const FOOTER_ABOUT_DEFAULT =
  'promueve la seguridad vial mediante capacitación, estudios técnicos, campañas preventivas y asesoría a empresas, fomentando una movilidad segura y responsable.';

const FOOTER_SERVICIO_HREF: Record<string, string> = {
  capacitación: '/cursos',
  pesv: '/fundacion',
  'campañas de seguridad vial': '/fundacion',
  'carreras técnicas': '/#carreras-tecnicas',
  'estudios de tránsito': '/fundacion',
  'planes de movilidad sostenible y segura': '/fundacion',
  conducción: '/cursos',
  licencia: '/cursos',
};

export interface FooterEnlace {
  label: string;
  route: string;
  fragment?: string;
}

export interface FooterServicioEnlace {
  label: string;
  href?: string;
  route?: string;
  fragment?: string;
  external: boolean;
}

export type ShellNavEntry =
  | { kind: 'link'; key: PortalPaginaKey; route: string; label: string }
  | {
      kind: 'submenu';
      key: 'servicios';
      label: string;
      hubRoute: string;
      children: { route: string; label: string }[];
    };

@Component({
  selector: 'av-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, PortalPopupComponent, ConsultaCertificadosAsistenteComponent, PortalIconComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit, AfterViewInit {
  private api = inject(AulaApiService);
  private portalConfig = inject(PortalConfigService);
  private router = inject(Router);
  private cardWaves = inject(CardWaveService);
  private destroyRef = inject(DestroyRef);
  private host = inject(ElementRef<HTMLElement>);
  private menuToggle = viewChild<ElementRef<HTMLButtonElement>>('menuToggle');
  private portalTheme = inject(PortalThemeService);
  auth = inject(PortalAuthService);

  config = this.portalConfig.config;
  portalReady = this.portalConfig.ready;
  menuAbierto = signal(false);
  serviciosSubmenuAbierto = signal(false);
  popupOpenTick = signal(0);
  rutaActual = signal('/');

  popupConfig = computed(() => this.landing().popup);

  asistenteConfig = computed(() => {
    const landing = this.landing();
    const key = clavePaginaPorRuta(this.rutaActual());
    return asistenteVistaParaPagina(landing.asistente, key);
  });

  logoUrl = computed(() => resolveUploadUrl(this.config()?.urlLogoAbsoluta || this.config()?.urlLogo));

  landing = computed(() => mergePortalLanding(this.config()?.landing, this.config()?.site?.tema));

  footerServicios = computed(() => this.landing().footerServicios);

  navItems = computed(() => {
    const cfg = this.config();
    const nav = this.landing().nav;
    const items: { key: PortalPaginaKey; route: string; label: string }[] = [
      { key: 'home', route: '/', label: etiquetaPagina(cfg, 'home', nav.home) },
      { key: 'tienda', route: '/tienda', label: etiquetaPagina(cfg, 'tienda', nav.tienda) },
      { key: 'cursos', route: '/cursos', label: etiquetaPagina(cfg, 'cursos', nav.cursos) },
      { key: 'aula', route: '/aula', label: etiquetaPagina(cfg, 'aula', nav.aula) },
      { key: 'fundacion', route: '/fundacion', label: etiquetaPagina(cfg, 'fundacion', nav.fundacion) },
      {
        key: 'consultaCertificados',
        route: '/consulta-certificados',
        label: etiquetaPagina(cfg, 'consultaCertificados', nav.consultaCertificados),
      },
      {
        key: 'cursosConduccion',
        route: '/cursos-conduccion',
        label: etiquetaPagina(cfg, 'cursosConduccion', nav.cursosConduccion),
      },
      { key: 'galeria', route: '/galeria', label: etiquetaPagina(cfg, 'galeria', nav.galeria) },
      { key: 'blog', route: '/blog', label: etiquetaPagina(cfg, 'blog', nav.blog) },
      { key: 'acerca', route: '/acerca', label: etiquetaPagina(cfg, 'acerca', nav.acerca) },
    ];
    const servicios = this.landing().finstruvialServicios;
    const submenuServicios =
      paginaActiva(cfg, 'servicios') && finstruvialPortafolioActivo(servicios);
    return items.filter((i) => {
      if (!paginaActiva(cfg, i.key)) return false;
      if (submenuServicios && paginaEnMenuServicios(cfg, i.key)) return false;
      return true;
    });
  });

  navEntries = computed((): ShellNavEntry[] => {
    const items = this.navItems();
    const cfg = this.config();
    const nav = this.landing().nav;
    const servicios = this.landing().finstruvialServicios;
    if (!paginaActiva(cfg, 'servicios') || !finstruvialPortafolioActivo(servicios)) {
      return items.map((item) => ({ kind: 'link' as const, ...item }));
    }
    const submenu: ShellNavEntry = {
      kind: 'submenu',
      key: 'servicios',
      label: servicios.menuLabel || 'Nuestros servicios',
      hubRoute: '/servicios',
      children: [
        ...finstruvialServiciosActivos(servicios).map((p) => ({
          route: finstruvialServicioPublicRoute(p.slug, p.routeSegment),
          label: p.menuLabel,
        })),
        ...this.enlacesMenuServicios(cfg, nav),
      ],
    };
    const entries: ShellNavEntry[] = [];
    for (const item of items) {
      entries.push({ kind: 'link', ...item });
      if (item.key === 'fundacion') {
        entries.push(submenu);
      }
    }
    if (!entries.some((e) => e.kind === 'submenu')) {
      entries.splice(Math.min(2, entries.length), 0, submenu);
    }
    return entries;
  });

  footerEnlaces = computed((): FooterEnlace[] => {
    const cfg = this.config();
    const nav = this.landing().nav;
    const paginas: { key: PortalPaginaKey; route: string }[] = [
      { key: 'cursos', route: '/cursos' },
      { key: 'tienda', route: '/tienda' },
      { key: 'aula', route: '/aula' },
      { key: 'fundacion', route: '/fundacion' },
      { key: 'galeria', route: '/galeria' },
      { key: 'blog', route: '/blog' },
      { key: 'acerca', route: '/acerca' },
    ];
    const pages = paginas
      .filter((p) => paginaActiva(cfg, p.key))
      .map((p) => ({
        label: etiquetaPagina(cfg, p.key, nav[p.key as keyof typeof nav] as string),
        route: p.route,
      }));
    const serviciosEnlace: FooterEnlace[] =
      paginaActiva(cfg, 'servicios') && finstruvialPortafolioActivo(this.landing().finstruvialServicios)
        ? [
            {
              label: this.landing().finstruvialServicios.menuLabel || 'Servicios',
              route: '/servicios',
            },
          ]
        : [{ label: 'Servicios', route: '/', fragment: 'servicios-empresa' }];
    const extras: FooterEnlace[] = [];
    if (paginaActiva(cfg, 'manejoDefensivo')) {
      extras.push({
        label: etiquetaPagina(cfg, 'manejoDefensivo', 'Manejo defensivo'),
        route: '/curso-manejo-defensivo',
      });
    }
    if (paginaActiva(cfg, 'primerosAuxilios')) {
      extras.push({
        label: etiquetaPagina(cfg, 'primerosAuxilios', 'Primeros auxilios'),
        route: '/curso-primeros-auxilios',
      });
    }
    return [
      ...pages,
      ...serviciosEnlace,
      ...extras,
      { label: 'Cómo funciona', route: '/', fragment: 'como-funciona' },
      { label: 'Preguntas frecuentes', route: '/', fragment: 'preguntas-frecuentes' },
      { label: 'Contacto', route: '/acerca', fragment: 'contacto' },
    ];
  });

  footerServiciosLinks = computed((): FooterServicioEnlace[] => {
    if (finstruvialPortafolioActivo(this.landing().finstruvialServicios)) {
      const servicios = this.landing().finstruvialServicios;
      const cfg = this.config();
      const nav = this.landing().nav;
      return [
        ...finstruvialServiciosActivos(servicios).map((p) => ({
          label: p.menuLabel,
          route: finstruvialServicioPublicRoute(p.slug, p.routeSegment),
          external: false,
        })),
        ...this.enlacesMenuServicios(cfg, nav).map((e) => ({
          label: e.label,
          route: e.route,
          external: false,
        })),
      ];
    }
    const labels = Array.isArray(this.footerServicios()) ? this.footerServicios() : [];
    return labels.map((label) => {
      const href = FOOTER_SERVICIO_HREF[label.trim().toLowerCase()] || '/#servicios-empresa';
      if (href.startsWith('http')) {
        return { label, href, external: true };
      }
      if (href.includes('#')) {
        const [route, fragment] = href.split('#');
        return { label, route: route || '/', fragment, external: false };
      }
      return { label, route: href, external: false };
    });
  });

  sitioInstitucionalUrl = '/';

  nombreCea = computed(() => this.config()?.nombreCea || DEFAULT_CEA_NOMBRE);

  paginaActivaConsulta = computed(() => paginaActiva(this.config(), 'consultaCertificados'));
  paginaActivaJornadas = computed(() => paginaActiva(this.config(), 'jornadasCapacitacion'));
  paginaActivaEvaluacionJornadas = computed(() => paginaActiva(this.config(), 'evaluacionJornadas'));
  paginaActivaPqr = computed(() => paginaActiva(this.config(), 'pqr'));
  paginaActivaManejoDefensivo = computed(() => paginaActiva(this.config(), 'manejoDefensivo'));
  paginaActivaPrimerosAuxilios = computed(() => paginaActiva(this.config(), 'primerosAuxilios'));
  paginaActivaServicios = computed(() => paginaActiva(this.config(), 'servicios'));

  etiquetaConsultaCertificados = computed(() =>
    etiquetaPagina(this.config(), 'consultaCertificados', this.landing().nav.consultaCertificados),
  );

  etiquetaJornadas = computed(() =>
    etiquetaPagina(this.config(), 'jornadasCapacitacion', 'Jornadas de capacitación'),
  );

  etiquetaEvaluacionJornadas = computed(() =>
    etiquetaPagina(this.config(), 'evaluacionJornadas', 'Evaluación de satisfacción'),
  );

  etiquetaPqr = computed(() => etiquetaPagina(this.config(), 'pqr', 'PQR'));

  /** Texto junto al logo en el header (marca corta). */
  brandMarca = computed(() =>
    resolverTextoJuntoLogo(
      this.config()?.site?.marca?.textoJuntoLogo,
      this.config()?.nombreCea,
    ),
  );

  whatsappHref = computed(() => whatsappHrefFromPhone(this.config()?.telefono));

  direccionCompleta = computed(() => {
    const c = this.config();
    return [c?.direccion, c?.ciudad].filter(Boolean).join(' ').trim() || '';
  });

  footerAbout = computed(() => {
    const custom = this.config()?.acercaDeHtml?.trim();
    if (custom) {
      const first = custom.split('\n').map((l) => l.trim()).find(Boolean);
      if (first) return first;
    }
    return `${this.nombreCea()} ${FOOTER_ABOUT_DEFAULT}`;
  });

  toggleMenu() {
    const abrir = !this.menuAbierto();
    this.menuAbierto.set(abrir);
    if (abrir && this.serviciosSubmenuActivo()) {
      this.serviciosSubmenuAbierto.set(true);
    }
    if (!abrir) {
      this.serviciosSubmenuAbierto.set(false);
      this.devolverFocoMenu();
    }
  }

  cerrarMenu() {
    this.serviciosSubmenuAbierto.set(false);
    if (!this.menuAbierto()) return;
    this.menuAbierto.set(false);
    this.devolverFocoMenu();
  }

  cerrarServiciosSubmenu() {
    this.serviciosSubmenuAbierto.set(false);
  }

  toggleServiciosSubmenu(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.serviciosSubmenuAbierto.update((v) => !v);
  }

  serviciosSubmenuActivo(): boolean {
    const url = this.rutaActual().split('?')[0].split('#')[0];
    if (url === '/servicios' || url.startsWith('/servicios/')) return true;
    const cfg = this.config();
    return this.enlacesMenuServicios(cfg, this.landing().nav).some((e) => e.route === url);
  }

  private enlacesMenuServicios(
    cfg: ReturnType<typeof this.config>,
    nav: ReturnType<typeof this.landing>['nav'],
  ): { route: string; label: string }[] {
    const extras: PortalPaginaKey[] = ['cursosConduccion'];
    return extras
      .filter((key) => paginaActiva(cfg, key) && paginaEnMenuServicios(cfg, key))
      .map((key) => ({
        route: rutaPagina(key),
        label: etiquetaPagina(cfg, key, nav[key as keyof typeof nav] as string),
      }));
  }

  private devolverFocoMenu() {
    queueMicrotask(() => this.menuToggle()?.nativeElement.focus());
  }

  ngOnInit() {
    this.rutaActual.set(this.router.url);
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.cerrarServiciosSubmenu();
      this.cerrarMenu();
      if (e instanceof NavigationEnd) this.rutaActual.set(e.urlAfterRedirects || e.url);
    });

    this.api.config().subscribe({
      next: () => this.popupOpenTick.update((n) => n + 1),
    });
  }

  ngAfterViewInit(): void {
    this.cardWaves.bind(this.host.nativeElement);

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        setTimeout(() => this.cardWaves.refresh(), 0);
      });

    this.destroyRef.onDestroy(() => this.cardWaves.unbind());
  }

  whatsappTelefono = computed(() => this.config()?.telefono?.trim() || '');

  telHref() {
    return this.whatsappHref();
  }

  telDisplay() {
    const tel = this.config()?.telefono?.trim() || '';
    const digits = tel.replace(/\D/g, '');
    if (!digits) return tel;
    const withCountry = digits.startsWith('57') ? digits : `57${digits}`;
    if (withCountry.length === 12) {
      return `+${withCountry.slice(0, 2)} ${withCountry.slice(2, 5)} ${withCountry.slice(5, 8)} ${withCountry.slice(8)}`;
    }
    return tel.startsWith('+') ? tel : `+${withCountry}`;
  }

  logout() {
    this.auth.logout();
  }
}
