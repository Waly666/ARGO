import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
}

@Component({
  selector: 'av-hero-particle-mesh',
  standalone: true,
  template: `<canvas #canvas class="hero-particle-canvas" aria-hidden="true"></canvas>`,
  styles: [
    `
      :host {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
      }

      .hero-particle-canvas {
        display: block;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
    `,
  ],
})
export class HeroParticleMeshComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private hostRef = inject(ElementRef<HTMLElement>);
  private platformId = inject(PLATFORM_ID);
  private frameId = 0;
  private particles: Particle[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;
  private linkDistance = 150;
  private pulse = 0;
  private heroEl: HTMLElement | null = null;
  private mouse = { x: -9999, y: -9999, active: false, down: false };
  private accentRgb = '174, 233, 41';
  private reducedMotion = false;
  private resizeObserver?: ResizeObserver;
  private onResize = () => this.syncSize(true);
  private onMove = (e: Event) => this.trackPointer(e as PointerEvent);
  private onLeave = () => {
    this.mouse.active = false;
    this.mouse.down = false;
    this.mouse.x = -9999;
    this.mouse.y = -9999;
  };
  private onDown = (e: Event) => {
    this.trackPointer(e as PointerEvent);
    this.mouse.down = true;
    this.pulse = 1;
    this.burstAt(this.mouse.x, this.mouse.y, 2.8);
  };
  private onUp = () => {
    this.mouse.down = false;
  };

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.accentRgb = this.readAccentRgb();
    const host = this.hostRef.nativeElement;
    this.heroEl = host.closest('.hero') as HTMLElement | null;
    const interactEl = this.heroEl ?? host;

    this.syncSize(true);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.syncSize(true));
      this.resizeObserver.observe(host);
    }

    window.addEventListener('resize', this.onResize, { passive: true });
    interactEl.addEventListener('pointermove', this.onMove, { passive: true });
    interactEl.addEventListener('pointerleave', this.onLeave, { passive: true });
    interactEl.addEventListener('pointerdown', this.onDown, { passive: true });
    interactEl.addEventListener('pointerup', this.onUp, { passive: true });
    interactEl.addEventListener('pointercancel', this.onUp, { passive: true });

    if (!this.reducedMotion) {
      const tick = () => {
        this.step();
        this.drawFrame();
        this.frameId = requestAnimationFrame(tick);
      };
      this.frameId = requestAnimationFrame(tick);
    }
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.onResize);
    const interactEl = this.heroEl ?? this.hostRef.nativeElement;
    interactEl.removeEventListener('pointermove', this.onMove);
    interactEl.removeEventListener('pointerleave', this.onLeave);
    interactEl.removeEventListener('pointerdown', this.onDown);
    interactEl.removeEventListener('pointerup', this.onUp);
    interactEl.removeEventListener('pointercancel', this.onUp);
  }

  private syncSize(reseed = false): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const prevArea = this.width * this.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.linkDistance = Math.min(200, Math.max(130, this.width * 0.12));
    canvas.width = Math.floor(this.width * this.dpr);
    canvas.height = Math.floor(this.height * this.dpr);

    const newArea = this.width * this.height;
    if (reseed || !this.particles.length || newArea > prevArea * 1.2 || prevArea < 4000) {
      this.seedParticles();
      if (this.reducedMotion) this.drawFrame();
    }
  }

  private particleCount(): number {
    const area = this.width * this.height;
    return Math.min(88, Math.max(48, Math.round((72 * area) / (800 * 600))));
  }

  private seedParticles(): void {
    const count = this.particleCount();
    this.particles = Array.from({ length: count }, () => this.makeParticle());
  }

  private makeParticle(x?: number, y?: number): Particle {
    const speed = 0.28 + Math.random() * 0.38;
    const angle = Math.random() * Math.PI * 2;
    return {
      x: x ?? Math.random() * this.width,
      y: y ?? Math.random() * this.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2.2 + Math.random() * 2.6,
      angle: Math.random() * Math.PI,
    };
  }

  private trackPointer(e: PointerEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
    this.mouse.active = true;
  }

  private readAccentRgb(): string {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--av-accent').trim();
    const hex = raw.replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return '174, 233, 41';
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }

  private burstAt(x: number, y: number, strength = 1.35): void {
    for (const p of this.particles) {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0 && dist < 260) {
        const push = ((260 - dist) / 260) * strength;
        p.vx += (dx / dist) * push;
        p.vy += (dy / dist) * push;
      }
    }
    for (let i = 0; i < 3; i++) {
      this.particles.push(this.makeParticle(x, y));
    }
    const max = this.particleCount() + 12;
    if (this.particles.length > max) {
      this.particles.splice(0, this.particles.length - max);
    }
  }

  private step(): void {
    const repulseDistance = this.mouse.down ? 320 : 280;
    const repulseForce = this.mouse.down ? 2.6 : 1.9;
    const grabDistance = 240;

    if (this.pulse > 0) this.pulse = Math.max(0, this.pulse - 0.028);

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.angle += 0.007 + Math.hypot(p.vx, p.vy) * 0.004;

      if (p.x <= 0 || p.x >= this.width) p.vx *= -1;
      if (p.y <= 0 || p.y >= this.height) p.vy *= -1;
      p.x = Math.max(0, Math.min(this.width, p.x));
      p.y = Math.max(0, Math.min(this.height, p.y));

      if (this.mouse.active) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < repulseDistance) {
          const t = (repulseDistance - dist) / repulseDistance;
          const push = t * t * repulseForce;
          p.vx += (dx / dist) * push;
          p.vy += (dy / dist) * push;
          p.x += (dx / dist) * push * 0.22;
          p.y += (dy / dist) * push * 0.22;
        } else if (dist > 0 && dist < grabDistance && !this.mouse.down) {
          const pull = ((grabDistance - dist) / grabDistance) * 0.08;
          p.vx -= (dx / dist) * pull;
          p.vy -= (dy / dist) * pull;
        }
      }

      const maxSpeed = this.mouse.down ? 1.75 : 1.15;
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      // Amortigua poco a poco para que no aceleren solas
      p.vx *= 0.992;
      p.vy *= 0.992;
    }
  }

  private drawHexNode(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, rotation: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = rotation + (Math.PI / 3) * i;
      const px = x + Math.cos(a) * radius;
      const py = y + Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  private drawFrame(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    const linkDistance = this.linkDistance;
    const grabDistance = 260;

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= linkDistance) {
          const alpha = (1 - dist / linkDistance) * 0.58;
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (this.mouse.active) {
      for (const p of this.particles) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < grabDistance) {
          const alpha = (1 - dist / grabDistance) * (this.mouse.down ? 0.95 : 0.72);
          ctx.strokeStyle = this.mouse.down
            ? `rgba(${this.accentRgb}, ${alpha})`
            : `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = this.mouse.down ? 1.6 : 1.2;
          ctx.beginPath();
          ctx.moveTo(this.mouse.x, this.mouse.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }

      if (this.pulse > 0) {
        const r = (1 - this.pulse) * 180 + 20;
        ctx.strokeStyle = `rgba(${this.accentRgb}, ${this.pulse * 0.45})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.mouse.x, this.mouse.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = this.mouse.down ? `rgba(${this.accentRgb}, 0.9)` : 'rgba(255, 255, 255, 0.85)';
      this.drawHexNode(ctx, this.mouse.x, this.mouse.y, this.mouse.down ? 5.5 : 4, this.pulse * Math.PI * 2);
    }

    for (const p of this.particles) {
      const nearMouse =
        this.mouse.active && Math.hypot(p.x - this.mouse.x, p.y - this.mouse.y) < grabDistance * 0.55;
      ctx.fillStyle = nearMouse ? `rgba(${this.accentRgb}, 0.88)` : 'rgba(255, 255, 255, 0.78)';
      this.drawHexNode(ctx, p.x, p.y, p.size, p.angle);
    }
  }
}
