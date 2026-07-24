import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { PortalAuthService } from '../../core/portal-auth.service';

@Component({
  selector: 'av-activar-registro',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="activar-page">
      <section class="container activar-card">
        @if (loading()) {
          <h1>Activando su cuenta…</h1>
          <p>Espere un momento mientras confirmamos el enlace.</p>
        } @else if (error()) {
          <h1>No se pudo activar</h1>
          <p class="err">{{ error() }}</p>
          <a routerLink="/registro" class="btn btn-primary">Volver al registro</a>
        } @else {
          <h1>Cuenta activada</h1>
          <p>Su registro en el aula virtual quedó confirmado. Ya puede entrar.</p>
          <a routerLink="/aula" class="btn btn-primary">Ir al aula</a>
        }
      </section>
    </div>
  `,
  styles: `
    .activar-page {
      min-height: calc(100vh - 12rem);
      padding: 2.5rem 0;
      background: linear-gradient(180deg, #eef2ff, #ecfeff);
    }
    .activar-card {
      max-width: 32rem;
      margin: 0 auto;
      padding: 2rem;
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
      text-align: center;
    }
    .err {
      color: #b91c1c;
    }
    .btn {
      display: inline-block;
      margin-top: 1rem;
      padding: 0.7rem 1.2rem;
      border-radius: 10px;
      background: #0ea5e9;
      color: #fff;
      text-decoration: none;
      font-weight: 600;
    }
  `,
})
export class ActivarRegistroComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(AulaApiService);
  private auth = inject(PortalAuthService);

  loading = signal(true);
  error = signal('');

  ngOnInit() {
    const q = this.route.snapshot.queryParamMap;
    const pendingId = String(q.get('pendingId') || '').trim();
    const linkToken = String(q.get('t') || q.get('linkToken') || '').trim();
    const codigo = String(q.get('codigo') || '').trim();

    if (!pendingId || (!linkToken && !codigo)) {
      this.loading.set(false);
      this.error.set('El enlace de activación no es válido o está incompleto.');
      return;
    }

    this.api.registroConfirmar(pendingId, codigo, linkToken || undefined).subscribe({
      next: (res) => {
        this.auth.setSession(res.token, res.usuario, res.alumno);
        this.loading.set(false);
        void this.router.navigateByUrl('/aula');
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message || 'No se pudo confirmar el registro');
      },
    });
  }
}
