import { CommonModule } from '@angular/common';
import { Component, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TurnstileComponent } from '../../components/turnstile/turnstile.component';
import { AulaApiService } from '../../core/aula-api.service';
import { PortalAuthService } from '../../core/portal-auth.service';
import { LOGIN_AVISO_KEY } from '../../core/interceptors/portal-auth.interceptor';
import { PortalSeoService } from '../../core/portal-seo.service';

@Component({
  selector: 'av-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TurnstileComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private api = inject(AulaApiService);
  private auth = inject(PortalAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private seo = inject(PortalSeoService);

  turnstile = viewChild(TurnstileComponent);

  email = '';
  password = '';
  turnstileSiteKey = signal('');
  turnstileToken = signal('');
  error = signal('');
  loading = signal(false);

  constructor() {
    this.mostrarAvisoSesion();
    this.api.config().subscribe({
      next: (c) => {
        this.turnstileSiteKey.set(c.turnstileSiteKey || '');
        this.seo.applyLogin(c);
      },
      error: () => this.seo.applyLogin(null),
    });
  }

  private mostrarAvisoSesion() {
    let msg = '';
    try {
      msg = sessionStorage.getItem(LOGIN_AVISO_KEY) || '';
      if (msg) sessionStorage.removeItem(LOGIN_AVISO_KEY);
    } catch {
      /* ignore */
    }
    if (!msg && this.route.snapshot.queryParamMap.get('sesion') === 'expirada') {
      msg = 'Tu sesión expiró o cerraste el navegador. Inicia sesión de nuevo.';
    }
    if (msg) this.error.set(msg);
  }

  enviar() {
    const token = this.turnstileToken() || this.turnstile()?.getToken() || '';
    if (this.turnstileSiteKey() && !token) {
      this.error.set('Complete la verificación anti-bot.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api.login(this.email, this.password, token || undefined).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.auth.setSession(res.token, res.usuario, res.alumno);
        this.router.navigateByUrl('/aula');
      },
      error: (e) => {
        this.loading.set(false);
        this.turnstile()?.reset();
        this.error.set(e?.error?.message || 'No se pudo iniciar sesión');
      },
    });
  }
}
