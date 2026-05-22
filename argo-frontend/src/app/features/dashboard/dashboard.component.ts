import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'argo-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dash">
      <div class="card hero">
        <h1>Bienvenido{{ nombre() ? ', ' + nombre() : '' }}</h1>
        <p>Panel principal del Sistema de Información <strong>ARGO</strong>.</p>
      </div>

      <div class="grid">
        <div class="card stat">
          <span class="label">Alumnos</span>
          <span class="value">—</span>
          <span class="hint">Módulo disponible</span>
        </div>
        <div class="card stat">
          <span class="label">Programación</span>
          <span class="value">—</span>
          <span class="hint">En desarrollo</span>
        </div>
        <div class="card stat">
          <span class="label">Caja</span>
          <span class="value">—</span>
          <span class="hint">En desarrollo</span>
        </div>
        <div class="card stat">
          <span class="label">Vehículos</span>
          <span class="value">—</span>
          <span class="hint">En desarrollo</span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .dash { display: flex; flex-direction: column; gap: 18px; }
    .hero h1 { margin-bottom: 4px; }
    .hero p { color: var(--text-dim); margin: 0; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
    }
    .stat { display: flex; flex-direction: column; gap: 4px; }
    .stat .label { color: var(--text-soft); font-size: .75rem; text-transform: uppercase; letter-spacing: 1.2px; }
    .stat .value { font-size: 1.8rem; font-weight: 600; color: var(--accent-2); }
    .stat .hint  { color: var(--text-soft); font-size: .8rem; }
  `],
})
export class DashboardComponent {
  private auth = inject(AuthService);
  nombre = computed(() => {
    const u = this.auth.user();
    if (!u) return '';
    return (u.nombres?.split(' ')[0]) || u.nickName || u.username;
  });
}
