import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { TurnstileComponent } from '../../components/turnstile/turnstile.component';
import { AuthService } from '../../core/services/auth.service';
import { rutaInicioApp } from '../../core/utils/auth-routes.util';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'argo-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TurnstileComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  @ViewChild('matrix', { static: true }) matrixRef!: ElementRef<HTMLCanvasElement>;

  turnstile = viewChild(TurnstileComponent);

  username = signal('');
  password = signal('');
  turnstileSiteKey = signal('');
  turnstileToken = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  private rafId: number | null = null;
  private resizeHandler = () => this.resizeCanvas();
  private drops: number[] = [];

  constructor() {
    this.http.get<{ turnstileSiteKey?: string }>(`${environment.apiUrl}/auth/config`).subscribe({
      next: (c) => this.turnstileSiteKey.set(c.turnstileSiteKey || ''),
      error: () => {},
    });
  }

  ngAfterViewInit(): void {
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeHandler);
    this.startMatrix();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
  }

  submit() {
    if (!this.username() || !this.password()) {
      this.error.set('Ingresa usuario y contraseña');
      return;
    }
    const token = this.turnstileToken() || this.turnstile()?.getToken() || '';
    if (this.turnstileSiteKey() && !token) {
      this.error.set('Complete la verificación anti-bot.');
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    this.auth.login(this.username().trim(), this.password(), token || undefined).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.router.navigateByUrl(
          rutaInicioApp(res.user?.permisos, {
            puedeUsarPortalInstructor: res.user?.puedeUsarPortalInstructor === true,
          }),
        );
      },
      error: (err) => {
        this.loading.set(false);
        this.turnstile()?.reset();
        const msg = err?.error?.message || 'Credenciales inválidas';
        this.error.set(msg);
      },
    });
  }

  private resizeCanvas() {
    const c = this.matrixRef?.nativeElement;
    if (!c) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const fontSize = 16;
    const columns = Math.floor(c.width / fontSize);
    this.drops = new Array(columns).fill(0).map(() => Math.floor(Math.random() * -50));
  }

  private startMatrix() {
    const c = this.matrixRef.nativeElement;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const fontSize = 16;
    const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ0123456789ARGO';

    const draw = () => {
      ctx.fillStyle = 'rgba(3, 8, 26, 0.18)';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.font = `${fontSize}px "Exo", monospace`;

      for (let i = 0; i < this.drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        const x = i * fontSize;
        const y = this.drops[i] * fontSize;

        const gradient = ctx.createLinearGradient(x, y - fontSize * 4, x, y);
        gradient.addColorStop(0, 'rgba(78, 163, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(123, 208, 255, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillText(text, x, y);

        if (y > c.height && Math.random() > 0.975) this.drops[i] = 0;
        this.drops[i]++;
      }
      this.rafId = requestAnimationFrame(draw);
    };
    draw();
  }
}
