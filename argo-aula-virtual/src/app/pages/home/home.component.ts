import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
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
import { resolveUploadUrl } from '../../core/upload-url.util';
import { PortalSeoService } from '../../core/portal-seo.service';
import {
  BENEFICIOS_CURSOS,
  CARRERAS_TECNICAS,
  FAQ_CURSOS,
  HERO_DEFAULT,
  OFERTAS,
  PASOS_PROGRAMAS,
  PILARES,
  SERVICIOS_EMPRESA,
  TESTIMONIOS,
  VALORES,
} from './home-content';

@Component({
  selector: 'av-home',
  standalone: true,
  imports: [CommonModule, RouterLink, RevealOnScrollDirective, AnimateTitleDirective, CursoCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('heroH1') heroH1?: ElementRef<HTMLElement>;

  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);
  private typeTimer?: ReturnType<typeof setInterval>;
  private typeRun = 0;

  config = signal<PortalConfig | null>(null);
  cursos = signal<CursoVirtual[]>([]);
  tabPilar = signal<'capacitacion' | 'campanas'>('capacitacion');
  faqAbierta = signal<number | null>(null);

  readonly ofertas = OFERTAS;
  readonly beneficios = BENEFICIOS_CURSOS;
  readonly pasos = PASOS_PROGRAMAS;
  readonly testimonios = TESTIMONIOS;
  readonly faq = FAQ_CURSOS;
  readonly servicios = SERVICIOS_EMPRESA;
  readonly valores = VALORES;
  readonly carreras = CARRERAS_TECNICAS;
  readonly pilares = PILARES;
  readonly heroDefault = HERO_DEFAULT;

  nombreCea = computed(() => this.config()?.nombreCea || 'Fundación Finstruvial');
  telefono = computed(() => this.config()?.telefono?.trim() || '');
  direccion = computed(
    () =>
      [this.config()?.direccion, this.config()?.ciudad].filter(Boolean).join(', ') ||
      'CLL 26 DN # 4-63 BARRIO VILLA DOCENTE, POPAYÁN',
  );
  heroTitulo = computed(() => this.config()?.heroTitulo || HERO_DEFAULT.titulo);
  heroSubtitulo = computed(() => this.config()?.heroSubtitulo || HERO_DEFAULT.subtitulo);
  logoUrl = computed(() => {
    const cfg = this.config();
    return resolveUploadUrl(cfg?.urlLogoAbsoluta || cfg?.urlLogo);
  });

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.seo.applyHome(c, this.cursos());
        const titulo = (c.heroTitulo || HERO_DEFAULT.titulo).trim();
        if (titulo !== HERO_DEFAULT.titulo.trim()) {
          this.startTypewriter(titulo);
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
    this.startTypewriter(this.heroTitulo());
  }

  ngOnDestroy() {
    this.stopTypewriter();
  }

  fmt(n: number) {
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n || 0);
  }

  telHref() {
    const digits = this.telefono().replace(/\D/g, '');
    if (!digits) return null;
    return `tel:+57${digits}`;
  }

  private stopTypewriter() {
    if (this.typeTimer) {
      clearInterval(this.typeTimer);
      this.typeTimer = undefined;
    }
  }

  private startTypewriter(text: string) {
    const el = this.heroH1?.nativeElement;
    if (!el) return;

    this.stopTypewriter();
    const run = ++this.typeRun;
    const full = text.trim();

    el.setAttribute('aria-label', full);

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
