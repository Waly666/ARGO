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
  spin: number;
  phase: number;
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
  /** Máximo de líneas por partícula (evita manchas densas cuando se agrupan). */
  private maxLinksPerNode = 3;
  private lineAlphaMax = 0.14;
  private pulse = 0;
  private time = 0;
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
    this.repelBurst(this.mouse.x, this.mouse.y, 3.2);
  };
  private onUp = () => {
    this.mouse.down = false;
  };

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.accentRgb = this.readAccentRgb();
    const host = this.hostRef.nativeElement;
    this.heroEl = host.closest('.hero, .mp-hero, .ta-hero, .ppbh') as HTMLElement | null;
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
    const oldW = this.width;
    const oldH = this.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.linkDistance = Math.min(228, Math.max(152, this.width * 0.142));
    canvas.width = Math.floor(this.width * this.dpr);
    canvas.height = Math.floor(this.height * this.dpr);

    const newArea = this.width * this.height;
    if (reseed || !this.particles.length || newArea > prevArea * 1.2 || prevArea < 4000) {
      this.seedParticles();
      if (this.reducedMotion) this.drawFrame();
    } else if (oldW > 0 && oldH > 0 && this.particles.length) {
      const sx = this.width / oldW;
      const sy = this.height / oldH;
      for (const p of this.particles) {
        p.x *= sx;
        p.y *= sy;
        this.wrapParticle(p);
      }
    }
  }

  private particleCount(): number {
    const area = this.width * this.height;
    return Math.min(148, Math.max(85, Math.round((125 * area) / (800 * 600))));
  }

  private seedParticles(): void {
    const count = this.particleCount();
    const cols = Math.max(1, Math.ceil(Math.sqrt(count * (this.width / Math.max(this.height, 1)))));
    const rows = Math.max(1, Math.ceil(count / cols));
    const marginX = this.width * 0.04;
    const marginY = this.height * 0.04;
    const cellW = (this.width - marginX * 2) / cols;
    const cellH = (this.height - marginY * 2) / rows;
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = marginX + cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.48;
      const y = marginY + cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * 0.48;
      particles.push(this.makeParticle(x, y));
    }

    this.particles = particles;
  }

  private makeParticle(x?: number, y?: number): Particle {
    const speed = 0.22 + Math.random() * 0.28;
    const heading = Math.random() * Math.PI * 2;
    return {
      x: x ?? Math.random() * this.width,
      y: y ?? Math.random() * this.height,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed,
      size: 1.35 + Math.random() * 1.65,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.012,
      phase: Math.random() * Math.PI * 2,
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

  /** Distancia mínima entre dos puntos (solo distancia real en pantalla, sin envoltura). */
  private screenDelta(ax: number, ay: number, bx: number, by: number): { dx: number; dy: number } {
    return { dx: bx - ax, dy: by - ay };
  }

  /** Distancia mínima entre dos puntos considerando envoltura toroidal (solo para física). */
  private wrapDelta(ax: number, ay: number, bx: number, by: number): { dx: number; dy: number } {
    let dx = bx - ax;
    let dy = by - ay;
    const halfW = this.width * 0.5;
    const halfH = this.height * 0.5;
    if (dx > halfW) dx -= this.width;
    else if (dx < -halfW) dx += this.width;
    if (dy > halfH) dy -= this.height;
    else if (dy < -halfH) dy += this.height;
    return { dx, dy };
  }

  private wrapParticle(p: Particle): void {
    if (this.width <= 0 || this.height <= 0) return;
    p.x = ((p.x % this.width) + this.width) % this.width;
    p.y = ((p.y % this.height) + this.height) % this.height;
  }

  /** Empuja suavemente lejos de bordes sin rebote brusco (complementa el wrap). */
  private applyEdgeSoftening(p: Particle): void {
    const margin = Math.max(32, Math.min(this.width, this.height) * 0.08);
    const push = 0.032;

    if (p.x < margin) {
      const t = (margin - p.x) / margin;
      p.vx += t * t * push;
    } else if (p.x > this.width - margin) {
      const t = (p.x - (this.width - margin)) / margin;
      p.vx -= t * t * push;
    }

    if (p.y < margin) {
      const t = (margin - p.y) / margin;
      p.vy += t * t * push;
    } else if (p.y > this.height - margin) {
      const t = (p.y - (this.height - margin)) / margin;
      p.vy -= t * t * push;
    }
  }

  /** Separación mínima cuando casi se solapan (evita nodos apilados sin abrir la malla). */
  private applySeparation(p: Particle, index: number): void {
    const minDist = 28;
    for (let j = 0; j < this.particles.length; j++) {
      if (j === index) continue;
      const other = this.particles[j];
      const { dx, dy } = this.screenDelta(p.x, p.y, other.x, other.y);
      const dist = Math.hypot(dx, dy);
      if (dist > 0 && dist < minDist) {
        const t = (minDist - dist) / minDist;
        p.vx += (dx / dist) * t * 0.016;
        p.vy += (dy / dist) * t * 0.016;
      }
    }
  }

  /** Repulsión suave a media distancia: evita que la malla se condense con el tiempo. */
  private applySoftRepulsion(p: Particle, index: number): void {
    const radius = 72;
    for (let j = 0; j < this.particles.length; j++) {
      if (j === index) continue;
      const other = this.particles[j];
      const { dx, dy } = this.screenDelta(p.x, p.y, other.x, other.y);
      const dist = Math.hypot(dx, dy);
      if (dist <= 0 || dist >= radius) continue;
      const t = 1 - dist / radius;
      const push = t * t * 0.0045;
      p.vx -= (dx / dist) * push;
      p.vy -= (dy / dist) * push;
    }
  }
  private repelBurst(x: number, y: number, strength = 2.4): void {
    const radius = 220;
    for (const p of this.particles) {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0 && dist < radius) {
        const t = 1 - dist / radius;
        const push = t * t * t * strength;
        p.vx += (dx / dist) * push;
        p.vy += (dy / dist) * push;
        p.x += (dx / dist) * push * 0.35;
        p.y += (dy / dist) * push * 0.35;
      }
    }
  }

  /** Campo de flujo autónomo: la malla se mueve sola, como una telaraña al viento. */
  private applyFlowField(p: Particle): void {
    const t = this.time * 0.0011;
    const nx = p.x / Math.max(this.width, 1);
    const ny = p.y / Math.max(this.height, 1);

    const waveX =
      Math.sin(nx * 4.2 + t * 1.15 + p.phase) * 0.55 +
      Math.cos(ny * 3.1 - t * 0.85 + p.phase * 0.7) * 0.35;
    const waveY =
      Math.cos(nx * 3.4 - t * 0.95 + p.phase * 1.1) * 0.55 +
      Math.sin(ny * 4.8 + t * 1.05) * 0.35;

    const drift = 0.022;
    p.vx += waveX * drift;
    p.vy += waveY * drift;

    // Deriva lenta global para que nunca quede estática
    p.vx += Math.sin(t * 0.35 + p.phase) * 0.004;
    p.vy += Math.cos(t * 0.28 + p.phase * 1.3) * 0.004;
  }

  private maintainCruiseSpeed(p: Particle, target = 0.38): void {
    const speed = Math.hypot(p.vx, p.vy);
    if (speed < 0.08) {
      const a = p.phase + this.time * 0.0006;
      p.vx = Math.cos(a) * target * 0.6;
      p.vy = Math.sin(a) * target * 0.6;
      return;
    }
    if (speed < target) {
      const boost = (target - speed) * 0.04;
      p.vx += (p.vx / speed) * boost;
      p.vy += (p.vy / speed) * boost;
    }
  }

  private applyMouseRepulsion(p: Particle): void {
    if (!this.mouse.active) return;

    const radius = this.mouse.down ? 200 : 165;
    const force = this.mouse.down ? 3.4 : 2.5;
    const dx = p.x - this.mouse.x;
    const dy = p.y - this.mouse.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 0 || dist >= radius) return;

    const t = 1 - dist / radius;
    const push = t * t * t * force;

    p.vx += (dx / dist) * push;
    p.vy += (dy / dist) * push;
    // Desplazamiento inmediato: hueco visible como aceite en agua
    p.x += (dx / dist) * push * 0.42;
    p.y += (dy / dist) * push * 0.42;
  }

  private step(): void {
    this.time += 1;
    if (this.pulse > 0) this.pulse = Math.max(0, this.pulse - 0.022);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.applyFlowField(p);
      this.applyEdgeSoftening(p);
      this.maintainCruiseSpeed(p);
      this.applyMouseRepulsion(p);
      this.applySeparation(p, i);
      this.applySoftRepulsion(p, i);

      p.x += p.vx;
      p.y += p.vy;
      this.wrapParticle(p);
      p.angle += p.spin + 0.004;

      const maxSpeed = this.mouse.active ? 1.55 : 0.72;
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      p.vx *= this.mouse.active ? 0.965 : 0.988;
      p.vy *= this.mouse.active ? 0.965 : 0.988;
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

  /** Reduce visibilidad de líneas cerca del cursor (hueco en la telaraña). */
  private lineMouseFade(ax: number, ay: number, bx: number, by: number): number {
    if (!this.mouse.active) return 1;

    const holeRadius = this.mouse.down ? 155 : 130;
    const mx = this.mouse.x;
    const my = this.mouse.y;

    const distA = Math.hypot(ax - mx, ay - my);
    const distB = Math.hypot(bx - mx, by - my);
    const midX = (ax + bx) * 0.5;
    const midY = (ay + by) * 0.5;
    const distMid = Math.hypot(midX - mx, midY - my);

    const nearest = Math.min(distA, distB, distMid);
    if (nearest >= holeRadius) return 1;
    return Math.max(0, nearest / holeRadius) ** 2.2;
  }

  private drawFrame(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    const linkDistance = this.linkDistance;
    const maxLinks = this.maxLinksPerNode;
    const lineAlphaMax = this.lineAlphaMax;
    const drawnPairs = new Set<string>();

    for (let i = 0; i < this.particles.length; i++) {
      const a = this.particles[i];
      const neighbors: { j: number; dist: number; dx: number; dy: number }[] = [];

      for (let j = 0; j < this.particles.length; j++) {
        if (j === i) continue;
        const b = this.particles[j];
        const { dx, dy } = this.screenDelta(a.x, a.y, b.x, b.y);
        const dist = Math.hypot(dx, dy);
        if (dist > linkDistance) continue;
        neighbors.push({ j, dist, dx, dy });
      }

      neighbors.sort((x, y) => x.dist - y.dist);
      const closest = neighbors.slice(0, maxLinks);

      for (const n of closest) {
        const j = n.j;
        const key = i < j ? `${i}:${j}` : `${j}:${i}`;
        if (drawnPairs.has(key)) continue;
        drawnPairs.add(key);

        const mouseFade = this.lineMouseFade(a.x, a.y, a.x + n.dx, a.y + n.dy);
        if (mouseFade < 0.04) continue;

        const proximity = 1 - n.dist / linkDistance;
        const alpha = proximity * lineAlphaMax * mouseFade;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x + n.dx, a.y + n.dy);
        ctx.stroke();
      }
    }

    if (this.mouse.active && this.pulse > 0) {
      const r = (1 - this.pulse) * 160 + 16;
      ctx.strokeStyle = `rgba(${this.accentRgb}, ${this.pulse * 0.18})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(this.mouse.x, this.mouse.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    const nodeAlpha = 0.34;
    const nodeAlphaNear = 0.42;
    const nearRadius = 100;

    for (const p of this.particles) {
      let alpha = nodeAlpha;
      if (this.mouse.active) {
        const dist = Math.hypot(p.x - this.mouse.x, p.y - this.mouse.y);
        if (dist < nearRadius) {
          const t = 1 - dist / nearRadius;
          alpha = nodeAlpha + (nodeAlphaNear - nodeAlpha) * (1 - t);
          // Más tenue justo donde el cursor abre el hueco
          if (dist < nearRadius * 0.55) {
            alpha *= 0.35 + 0.65 * (dist / (nearRadius * 0.55));
          }
        }
      }
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.drawHexNode(ctx, p.x, p.y, p.size, p.angle);
    }
  }
}
