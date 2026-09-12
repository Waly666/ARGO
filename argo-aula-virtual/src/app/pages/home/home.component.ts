import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostBinding,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { AnimateTitleDirective } from '../../core/animate-title.directive';
import { RevealOnScrollDirective } from '../../core/reveal-on-scroll.directive';
import { CursoVirtual, PortalConfig } from '../../core/models';
import { CursoCardComponent } from '../../shared/curso-card/curso-card.component';
import { PortalPromoBannerHeroComponent } from '../../shared/portal-promo-banner-hero/portal-promo-banner-hero.component';
import { HeroParticleMeshComponent } from '../../shared/hero-particle-mesh/hero-particle-mesh.component';
import { FinstruvialHeroComponent } from '../../shared/finstruvial-hero/finstruvial-hero.component';
import {
  FINSTRUVIAL_HERO_DEFAULTS,
  FINSTRUVIAL_HERO_HIGHLIGHT_DEFAULTS,
  splitFinstruvialHeroLeadToHighlight,
} from '../../shared/finstruvial-hero/finstruvial-hero.defaults';
import { PortalIconComponent } from '../../shared/portal-icon/portal-icon.component';
import { portalSectionIcon } from '../../shared/portal-icon/portal-icon.registry';
import { resolveUploadUrl } from '../../core/upload-url.util';
import { mergePortalLanding } from '../../core/portal-landing';
import {
  applyNombreCeaHeroText,
  promoHeroHighlightFromExtras,
} from '../../core/constants/portal-promo-hero-fields.util';
import { SERVIAL_HERO_HIGHLIGHT_DEFAULTS } from '../../core/constants/servial-landing-defaults';
import { portalLogoCertificacionPublicUrl } from '../../core/portal-hero-imagen.util';
import { homeCursoCtaEsExterna, homeCursoCtaUrl } from '../../core/portal-page-route.util';
import { ordenSeccionesHome, seccionHomeVisible } from '../../core/portal-site';
import { CursosConduccionPublicidadSliderComponent } from '../cursos-conduccion/cursos-conduccion-publicidad-slider.component';
import { PortalSeoService } from '../../core/portal-seo.service';
import { PortalThemeService } from '../../core/portal-theme.service';
import { resolvePortalHeroEstilo, isFinstruvialPortalTema, isEducartePortalTema } from '../../core/portal-theme-css.util';
import { DEFAULT_CEA_NOMBRE, DEFAULT_APK_NOMBRE, DEFAULT_APK_URL } from '../../core/portal-brand-defaults';
import {
  contactHrefAbreNuevaPestana,
  contactHrefEsExterno,
  contactHrefFromInput,
  whatsappHrefFromPhone,
} from '../../core/portal-whatsapp.util';
import { HERO_DEFAULT } from './home-content';

@Component({
  selector: 'av-home',
  standalone: true,
  imports: [CommonModule, RouterLink, RevealOnScrollDirective, AnimateTitleDirective, CursoCardComponent, PortalIconComponent, CursosConduccionPublicidadSliderComponent, PortalPromoBannerHeroComponent, HeroParticleMeshComponent, FinstruvialHeroComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('heroH1') heroH1?: ElementRef<HTMLElement>;
  @ViewChild('heroH1Servial') heroH1Servial?: ElementRef<HTMLElement>;
  @ViewChild('heroH1Accent') heroH1Accent?: ElementRef<HTMLElement>;

  @HostBinding('class.home--servial-mesh')
  get servialMeshHome(): boolean {
    return this.heroEstilo() === 'servial-mesh';
  }

  @HostBinding('class.home--finstruvial')
  get finstruvialHome(): boolean {
    return isFinstruvialPortalTema(this.config()?.site?.tema);
  }

  @HostBinding('class.home--educarte')
  get educarteHome(): boolean {
    return isEducartePortalTema(this.config()?.site?.tema);
  }

  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);
  private theme = inject(PortalThemeService);
  private typeTimer?: ReturnType<typeof setInterval>;
  private typeRun = 0;

  config = signal<PortalConfig | null>(null);
  cursos = signal<CursoVirtual[]>([]);
  tabPilar = signal<'capacitacion' | 'campanas'>('capacitacion');
  faqAbierta = signal<number | null>(null);

  readonly portalSectionIcon = portalSectionIcon;

  landing = computed(() => mergePortalLanding(this.config()?.landing, this.config()?.site?.tema));

  nombreCea = computed(() => this.config()?.nombreCea || DEFAULT_CEA_NOMBRE);

  heroEyebrowServial = computed(() => {
    const template = this.landing().hero.eyebrowServial?.trim() || '— Bienvenid@ a {nombreCea} —';
    return applyNombreCeaHeroText(template, this.nombreCea());
  });

  heroEyebrow = computed(() => this.landing().hero.eyebrow?.trim() || this.nombreCea());

  heroSubEyebrow = computed(
    () => this.landing().hero.subEyebrow?.trim() || 'Centro de Enseñanza Automovilística',
  );

  /** Kicker del banner promo (mismo estilo que Acerca de). */
  heroPromoKicker = computed(() =>
    this.heroEyebrowServial()
      .replace(/^[\s—–-]+|[\s—–-]+$/g, '')
      .trim(),
  );

  /** Línea blanca del título del banner promo. */
  heroPromoTitleLine = computed(() => this.heroSubEyebrow());

  /** Línea dorada del título del banner promo. */
  heroPromoTitleAccent = computed(() => this.heroTitulo());
  telefono = computed(() => this.config()?.telefono?.trim() || '');
  direccion = computed(
    () =>
      [this.config()?.direccion, this.config()?.ciudad].filter(Boolean).join(', ') ||
      'CLL 26 DN # 4-63 BARRIO VILLA DOCENTE, POPAYÁN',
  );
  heroTitulo = computed(() => this.config()?.heroTitulo || HERO_DEFAULT.titulo);
  heroSubtitulo = computed(() => this.config()?.heroSubtitulo || HERO_DEFAULT.subtitulo);
  heroEstilo = computed(() => resolvePortalHeroEstilo(this.config()?.site?.tema));
  logoUrl = computed(() => {
    const cfg = this.config();
    return resolveUploadUrl(cfg?.urlLogoAbsoluta || cfg?.urlLogo);
  });

  heroBrandEsCertificacion = computed(() => !!portalLogoCertificacionPublicUrl(this.landing().hero));

  heroBrandUrl = computed(() => {
    const cert = portalLogoCertificacionPublicUrl(this.landing().hero);
    if (cert) return cert;
    return this.logoUrl();
  });

  heroBrandAlt = computed(() => {
    const hero = this.landing().hero;
    if (portalLogoCertificacionPublicUrl(hero)) {
      return hero.logoCertificacionAlt?.trim() || 'Logo de certificación';
    }
    return this.nombreCea();
  });

  ordenSecciones = computed(() => {
    const cfg = this.config();
    const landing = mergePortalLanding(cfg?.landing, cfg?.site?.tema);
    return ordenSeccionesHome(cfg).filter((id) => {
      if (id === 'instBar' && isFinstruvialPortalTema(cfg?.site?.tema)) return false;
      if (id === 'infoCards') return false;
      if (id === 'fotosInicio') {
        return seccionHomeVisible(cfg, id) && (landing.fotosInicio?.fotos?.length ?? 0) > 0;
      }
      if (id === 'publicidadInicio') {
        const pub = landing.publicidadInicio;
        return (
          seccionHomeVisible(cfg, id) &&
          pub?.activo !== false &&
          (pub?.slides?.length ?? 0) > 0
        );
      }
      return seccionHomeVisible(cfg, id);
    });
  });

  infoCardsVisibles = computed(() => seccionHomeVisible(this.config(), 'infoCards'));

  heroImg = computed(() => this.theme.heroImageUrl(this.config()));

  finstruvialHeroEyebrow = computed(
    () => this.landing().hero.eyebrow?.trim() || FINSTRUVIAL_HERO_DEFAULTS.eyebrow,
  );

  finstruvialHeroH1 = computed(() => {
    const raw = (this.config()?.heroTitulo || '').trim();
    if (!raw || raw === HERO_DEFAULT.titulo) return FINSTRUVIAL_HERO_DEFAULTS.h1;
    return raw;
  });

  finstruvialHeroLead = computed(() => {
    const raw = (this.config()?.heroSubtitulo || '').trim();
    if (!raw || raw === HERO_DEFAULT.subtitulo) return FINSTRUVIAL_HERO_DEFAULTS.lead;
    return raw;
  });

  finstruvialHeroBg = computed(() => this.heroImg() || null);

  finstruvialHeroHighlight = computed(() => {
    const hero = this.landing().hero;
    const fromErp = promoHeroHighlightFromExtras({
      highlightIcon: hero.highlightIcon,
      highlightTitle: hero.highlightTitle,
      highlightSubtitle: hero.highlightSubtitle,
    });
    if (fromErp) return fromErp;
    return (
      splitFinstruvialHeroLeadToHighlight(this.finstruvialHeroLead()) ?? {
        icon: FINSTRUVIAL_HERO_HIGHLIGHT_DEFAULTS.highlightIcon,
        title: FINSTRUVIAL_HERO_HIGHLIGHT_DEFAULTS.highlightTitle,
        subtitle: FINSTRUVIAL_HERO_HIGHLIGHT_DEFAULTS.highlightSubtitle,
      }
    );
  });

  finstruvialHeroHighlightRadar = computed(() => {
    if (!this.finstruvialHeroHighlight()) return false;
    const hero = this.landing().hero;
    if (hero.highlightTitle?.trim()) {
      return hero.highlightRadar !== false;
    }
    return FINSTRUVIAL_HERO_HIGHLIGHT_DEFAULTS.highlightRadar;
  });

  servialHeroHighlight = computed(() => {
    const hero = this.landing().hero;
    const fromErp = promoHeroHighlightFromExtras({
      highlightIcon: hero.highlightIcon,
      highlightTitle: hero.highlightTitle,
      highlightSubtitle: hero.highlightSubtitle,
    });
    if (fromErp) return fromErp;
    return (
      splitFinstruvialHeroLeadToHighlight(this.heroSubtitulo()) ?? {
        icon: SERVIAL_HERO_HIGHLIGHT_DEFAULTS.highlightIcon,
        title: SERVIAL_HERO_HIGHLIGHT_DEFAULTS.highlightTitle,
        subtitle: SERVIAL_HERO_HIGHLIGHT_DEFAULTS.highlightSubtitle,
      }
    );
  });

  servialHeroHighlightRadar = computed(() => {
    if (!this.servialHeroHighlight()) return false;
    const hero = this.landing().hero;
    if (hero.highlightTitle?.trim()) {
      return hero.highlightRadar !== false;
    }
    return SERVIAL_HERO_HIGHLIGHT_DEFAULTS.highlightRadar;
  });

  /** Oculta el párrafo lead cuando la tarjeta destacada ya muestra ese texto. */
  servialHeroLead = computed(() => (this.servialHeroHighlight() ? '' : this.heroSubtitulo()));

  apkDownloadUrl = computed(() => this.landing().appMobile.apkUrl || DEFAULT_APK_URL);

  apkDownloadName = computed(() => this.landing().appMobile.apkNombre || DEFAULT_APK_NOMBRE);

  fotosInicioLista = computed(() => this.landing().fotosInicio?.fotos?.filter((f) => f.url?.trim()) ?? []);

  examenTeoricoCtaTexto = computed(() => {
    const raw = this.landing().examenTeorico?.ctaTexto?.trim() || '';
    if (!raw || /cursos de conducci/i.test(raw)) {
      return 'Ver información completa';
    }
    return raw;
  });

  examenTeoricoCtaUrl = computed(() =>
    homeCursoCtaUrl(this.config(), 'examenTeorico', this.landing().examenTeorico?.ctaUrl),
  );

  mercanciasPeligrosasCtaTexto = computed(() => {
    const raw = this.landing().mercanciasPeligrosas?.ctaInicioTexto?.trim() || '';
    return raw || 'Ver información completa';
  });

  mercanciasPeligrosasCtaUrl = computed(() =>
    homeCursoCtaUrl(this.config(), 'mercanciasPeligrosas', this.landing().mercanciasPeligrosas?.ctaUrl),
  );

  trabajoEnAlturasCtaTexto = computed(() => {
    const raw = this.landing().trabajoEnAlturas?.ctaInicioTexto?.trim() || '';
    return raw || 'Ver información completa';
  });

  trabajoEnAlturasCtaUrl = computed(() =>
    homeCursoCtaUrl(this.config(), 'trabajoEnAlturas', this.landing().trabajoEnAlturas?.ctaUrl),
  );

  manejoDefensivoCtaTexto = computed(() => {
    const raw = this.landing().manejoDefensivo?.ctaInicioTexto?.trim() || '';
    return raw || 'Conoce el curso de manejo defensivo';
  });

  manejoDefensivoCtaUrl = computed(() =>
    homeCursoCtaUrl(this.config(), 'manejoDefensivo', this.landing().manejoDefensivo?.ctaUrl),
  );

  primerosAuxiliosCtaTexto = computed(() => {
    const raw = this.landing().primerosAuxilios?.ctaInicioTexto?.trim() || '';
    return raw || 'Conoce el curso de primeros auxilios';
  });

  primerosAuxiliosCtaUrl = computed(() =>
    homeCursoCtaUrl(this.config(), 'primerosAuxilios', this.landing().primerosAuxilios?.ctaUrl),
  );

  homeCtaEsExterna(url: string): boolean {
    return homeCursoCtaEsExterna(url);
  }

  fotoInicioUrl(foto: { url?: string; urlAbsoluta?: string }) {
    return resolveUploadUrl(foto.urlAbsoluta || foto.url);
  }

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.seo.applyHome(c, this.cursos());
        if (!isFinstruvialPortalTema(c.site?.tema)) {
          const titulo = (c.heroTitulo || HERO_DEFAULT.titulo).trim();
          queueMicrotask(() => this.startTypewriter(titulo));
        }
      },
    });
    this.api.cursos().subscribe({
      next: (rows) => {
        this.cursos.set(rows);
        this.seo.applyHome(this.config(), rows);
      },
    });
  }

  toggleFaq(index: number) {
    this.faqAbierta.update((actual) => (actual === index ? null : index));
  }

  ngAfterViewInit() {
    if (isFinstruvialPortalTema(this.config()?.site?.tema)) return;
    queueMicrotask(() => this.startTypewriter(this.heroTitulo()));
  }

  ngOnDestroy() {
    this.stopTypewriter();
  }

  fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n || 0);
  }

  licenciaEsExterna(url: string | undefined): boolean {
    return /^https?:\/\//i.test(String(url || '').trim());
  }

  licenciaRuta(url: string | undefined): string {
    const u = String(url || '/registro').trim();
    if (!u || u === '/') return '/';
    return u.startsWith('/') ? u : `/${u}`;
  }

  heroLlamarVisible(): boolean {
    const hero = this.landing().hero;
    if (!hero.mostrarBotonLlamar) return false;
    return !!(hero.ctaLlamarUrl?.trim() || this.telefono());
  }

  heroLlamarEtiqueta(): string {
    const custom = this.landing().hero.ctaLlamarEtiqueta?.trim();
    if (custom) return custom;
    const tel = this.telefono();
    return tel ? `Llamar ${tel}` : 'Llamar';
  }

  heroLlamarHref(): string {
    return contactHrefFromInput(this.landing().hero.ctaLlamarUrl, this.telefono()) || '#';
  }

  heroLlamarEsExterno(): boolean {
    return contactHrefEsExterno(this.landing().hero.ctaLlamarUrl, this.telefono());
  }

  heroLlamarAbreNuevaPestana(): boolean {
    return contactHrefAbreNuevaPestana(this.landing().hero.ctaLlamarUrl, this.telefono());
  }

  /** Posiciona cada carrera alrededor del núcleo central (layout orbital). */
  carrerasOrbita = computed(() => {
    const items = this.landing().carreras.items;
    const n = items.length || 1;
    // Radios en % del contenedor (elipse, más ancha que alta).
    const rx = 39;
    const ry = 38;
    return items.map((c, i) => {
      const ang = ((-90 + (360 / n) * i) * Math.PI) / 180;
      return {
        ...c,
        nombreCorto: this.carreraNombreCorto(c.titulo),
        x: Math.round((50 + rx * Math.cos(ang)) * 100) / 100,
        y: Math.round((50 + ry * Math.sin(ang)) * 100) / 100,
      };
    });
  });

  private carreraNombreCorto(titulo: string) {
    const corto = (titulo || '')
      .replace(/^t[eé]cnico\s+laboral\s+por\s+competencias\s*[—–-]?\s*(en\s+)?/i, '')
      .trim();
    if (!corto) return titulo;
    return corto.charAt(0).toUpperCase() + corto.slice(1);
  }

  whatsappHref(): string | null {
    return whatsappHrefFromPhone(this.telefono());
  }

  private stopTypewriter() {
    if (this.typeTimer) {
      clearInterval(this.typeTimer);
      this.typeTimer = undefined;
    }
  }

  private formatHomeHeroTituloTwoLines(text: string): string {
    const full = text.trim();
    const licenciaMatch = full.match(/^(.+?)\s+(de\s+conducci[oó]n)\s*$/i);
    if (licenciaMatch) {
      return `${licenciaMatch[1].trim()}\n${licenciaMatch[2].trim()}`;
    }

    const words = full.split(/\s+/).filter(Boolean);
    if (words.length >= 4) {
      const half = Math.ceil(words.length / 2);
      return `${words.slice(0, half).join(' ')}\n${words.slice(half).join(' ')}`;
    }

    return full;
  }

  private typewriterText(text: string): string {
    const full = text.trim();
    if (this.heroEstilo() === 'servial-mesh') {
      return this.formatHomeHeroTituloTwoLines(full);
    }
    return full;
  }

  private typewriterEl(): HTMLElement | undefined {
    if (this.heroEstilo() === 'servial-mesh') {
      return this.heroH1Accent?.nativeElement;
    }
    return this.heroH1?.nativeElement;
  }

  private startTypewriter(text: string) {
    const el = this.typewriterEl();
    if (!el) return;

    this.stopTypewriter();
    const run = ++this.typeRun;
    const full = this.typewriterText(text.trim());
    const ariaFull = text.trim();

    if (this.heroEstilo() === 'servial-mesh') {
      const label = [this.heroPromoTitleLine(), ariaFull].filter(Boolean).join(' ');
      this.heroH1Servial?.nativeElement?.setAttribute('aria-label', label);
    } else {
      el.setAttribute('aria-label', ariaFull);
    }

    if (!full) {
      el.textContent = '';
      el.classList.remove('hero-title--typing', 'hero-title--done');
      return;
    }

    el.classList.remove('hero-title--done');
    el.classList.add('hero-title--typing');
    el.textContent = '';

    let index = 0;

    this.typeTimer = setInterval(() => {
      if (run !== this.typeRun) {
        this.stopTypewriter();
        return;
      }

      if (index < full.length) {
        el.textContent = full.slice(0, index + 1);
        index += 1;
        return;
      }

      this.stopTypewriter();
      el.classList.remove('hero-title--typing');
      el.classList.add('hero-title--done');
    }, 55);
  }
}
