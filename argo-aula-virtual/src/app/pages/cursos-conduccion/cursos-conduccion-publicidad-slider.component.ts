import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  PLATFORM_ID,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { resolveUploadUrl } from '../../core/upload-url.util';
import { PortalPublicidadLanding } from '../../core/portal-landing';

@Component({
  selector: 'av-cursos-conduccion-publicidad-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cursos-conduccion-publicidad-slider.component.html',
  styleUrl: './cursos-conduccion-publicidad-slider.component.scss',
  host: {
    '[class.cc-pub--inicio]': 'variante() === "inicio"',
    '[class.cc-pub--pagina]': 'variante() === "pagina"',
  },
})
export class CursosConduccionPublicidadSliderComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);

  publicidad = input.required<PortalPublicidadLanding>();
  variante = input<'inicio' | 'pagina'>('pagina');

  index = signal(0);
  paused = signal(false);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const total = this.slides().length;
      const intervalSec = this.publicidad().intervaloSegundos;
      if (!isPlatformBrowser(this.platformId)) return;

      untracked(() => {
        if (total > 0 && this.index() >= total) {
          this.index.set(0);
        }
        this.startTimer(total, intervalSec);
      });
    });
  }

  slides = computed(() => {
    const pub = this.publicidad();
    if (!pub?.activo) return [];
    return (pub.slides ?? [])
      .map((s) => {
        const src = resolveUploadUrl(s.urlAbsoluta || s.url) || s.url;
        if (!src?.trim()) return null;
        return {
          src,
          alt: s.alt?.trim() || 'Publicidad',
          enlace: s.enlace?.trim() || '',
        };
      })
      .filter((s): s is { src: string; alt: string; enlace: string } => !!s);
  });

  visible = computed(() => this.slides().length > 0);

  ngOnDestroy() {
    this.stopTimer();
  }

  prev() {
    const total = this.slides().length;
    if (total < 2) return;
    this.index.update((i) => (i - 1 + total) % total);
    this.bumpAutoplay();
  }

  next() {
    const total = this.slides().length;
    if (total < 2) return;
    this.index.update((i) => (i + 1) % total);
    this.bumpAutoplay();
  }

  goTo(i: number) {
    const total = this.slides().length;
    if (i < 0 || i >= total) return;
    this.index.set(i);
    this.bumpAutoplay();
  }

  onEnter() {
    this.paused.set(true);
  }

  onLeave() {
    this.paused.set(false);
  }

  private bumpAutoplay() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.startTimer(this.slides().length, this.publicidad().intervaloSegundos);
  }

  private startTimer(total: number, intervalSec: number) {
    this.stopTimer();
    if (total < 2) return;

    const ms = Math.max(3000, (Number(intervalSec) || 5) * 1000);
    this.timer = setInterval(() => {
      if (this.paused()) return;
      const count = this.slides().length;
      if (count < 2) return;
      this.index.update((i) => (i + 1) % count);
    }, ms);
  }

  private stopTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
