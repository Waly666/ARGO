import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';

@Component({
  selector: 'av-activar-jornada',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="activar-page">
      <section class="activar-hero">
        <div class="container activar-card">
          @if (loading()) {
            <p class="kicker">Un momento</p>
            <h1>Activando su inscripción…</h1>
            <p class="lead">Estamos confirmando el enlace de su correo.</p>
            <div class="pulse" aria-hidden="true"></div>
          } @else if (error()) {
            <p class="kicker kicker--err">No se pudo activar</p>
            <h1>Enlace inválido o vencido</h1>
            <p class="err">{{ error() }}</p>
            <a routerLink="/jornadas-capacitacion" class="btn btn-primary">Volver a jornadas</a>
          } @else {
            <p class="kicker">Inscripción confirmada</p>
            <h1>Te has registrado en Jornadas de Capacitación</h1>
            <p class="lead">{{ mensaje() }}</p>
            @if (nombre()) {
              <p class="meta"><strong>{{ nombre() }}</strong> · Doc. {{ numDoc() }}</p>
            }
            <p class="hint">También le enviamos su código QR al correo para asistencia en las jornadas.</p>
            <a routerLink="/jornadas-capacitacion" class="btn btn-primary">Volver</a>
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    :host {
      display: block;
      font-family: var(--av-font-sans);
    }
    .activar-page {
      min-height: calc(100vh - 12rem);
      background: linear-gradient(180deg, #0b1220 0%, #0b1220 38%, #f1f5f9 38.1%, #f8fafc 100%);
    }
    .activar-hero {
      padding: clamp(2.5rem, 6vw, 4rem) 0;
      background:
        radial-gradient(ellipse 70% 60% at 80% 20%, var(--av-primary-a35), transparent 55%),
        var(--av-page-hero-bg, #0f172a);
    }
    .activar-card {
      max-width: 36rem;
      margin: 0 auto;
      padding: clamp(1.6rem, 3vw, 2.25rem);
      border-radius: 22px;
      background: #fff;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
      text-align: center;
      animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(18px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .kicker {
      display: inline-block;
      margin: 0 0 0.6rem;
      padding: 0.25rem 0.7rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #047857;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
    }
    .kicker--err {
      color: #b91c1c;
      background: #fef2f2;
      border-color: #fecaca;
    }
    h1 {
      margin: 0;
      font-size: clamp(1.45rem, 3vw, 1.85rem);
      letter-spacing: -0.025em;
      line-height: 1.15;
    }
    .lead {
      margin: 0.85rem 0 0;
      color: #475569;
      line-height: 1.55;
    }
    .meta {
      margin-top: 0.85rem;
      color: #0f172a;
    }
    .hint {
      margin-top: 1rem;
      color: #64748b;
      font-size: 0.95rem;
    }
    .err {
      color: #b91c1c;
      margin: 0.85rem 0 0;
    }
    .btn {
      display: inline-block;
      margin-top: 1.35rem;
      padding: 0.75rem 1.3rem;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--av-primary), var(--av-primary-dark));
      color: #fff;
      text-decoration: none;
      font-weight: 700;
    }
    .pulse {
      width: 42px;
      height: 42px;
      margin: 1.5rem auto 0;
      border-radius: 50%;
      border: 3px solid color-mix(in srgb, var(--av-primary) 25%, transparent);
      border-top-color: var(--av-primary);
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class ActivarJornadaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(AulaApiService);

  loading = signal(true);
  error = signal('');
  mensaje = signal(
    'Su ficha quedó marcada como alumno presencial de jornadas. La matrícula a una jornada concreta se realiza en el centro.',
  );
  nombre = signal('');
  numDoc = signal('');

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

    this.api.registroJornadaConfirmar(pendingId, codigo || undefined, linkToken || undefined).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.mensaje) this.mensaje.set(res.mensaje);
        if (res.alumno?.nombreCompleto) this.nombre.set(res.alumno.nombreCompleto);
        if (res.alumno?.numDoc != null) this.numDoc.set(String(res.alumno.numDoc));
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message || 'No se pudo confirmar la inscripción');
      },
    });
  }
}
