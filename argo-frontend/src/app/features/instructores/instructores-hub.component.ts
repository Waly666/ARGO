import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { PermisoService } from '../../core/services/permiso.service';
import { InstructoresListaComponent } from './instructores-lista.component';
import { InstructorPortalComponent } from './instructor-portal.component';

type VistaHub = 'directorio' | 'portal';

@Component({
  selector: 'argo-instructores-hub',
  standalone: true,
  imports: [CommonModule, InstructoresListaComponent, InstructorPortalComponent],
  template: `
    @if (mostrarTabs()) {
      <nav class="inst-hub-tabs" aria-label="Vistas de instructores">
        <button
          type="button"
          class="tab"
          [class.active]="vista() === 'directorio'"
          (click)="setVista('directorio')"
        >
          Directorio
        </button>
        <button
          type="button"
          class="tab"
          [class.active]="vista() === 'portal'"
          (click)="setVista('portal')"
        >
          Mi portal
        </button>
      </nav>
    }

    @if (vistaActiva() === 'portal') {
      <argo-instructor-portal />
    } @else if (vistaActiva() === 'directorio') {
      <argo-instructores-lista />
    } @else {
      <section class="card inst-hub-denied">
        <h2>Acceso no disponible</h2>
        <p class="hint">
          Su rol no tiene permiso para el portal de instructores ni para el directorio administrativo.
          Pida a un administrador que active «Portal del instructor» o vincule su usuario a un empleado instructor.
        </p>
      </section>
    }
  `,
  styles: [
    `
      .inst-hub-denied {
        padding: 1.25rem;
      }
      .inst-hub-tabs {
        display: flex;
        gap: 0.35rem;
        margin: 0 0 0.85rem;
        padding: 0.2rem;
        border-radius: 10px;
        background: rgba(15, 23, 42, 0.35);
        border: 1px solid var(--line, rgba(148, 163, 184, 0.25));
        width: fit-content;
        max-width: 100%;
      }
      .inst-hub-tabs .tab {
        border: 0;
        background: transparent;
        color: var(--text-soft, #94a3b8);
        padding: 0.45rem 0.9rem;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.88rem;
      }
      .inst-hub-tabs .tab.active {
        background: rgba(56, 189, 248, 0.18);
        color: var(--text, #e2e8f0);
        font-weight: 600;
      }
    `,
  ],
})
export class InstructoresHubComponent {
  private permisos = inject(PermisoService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private vistaManual = signal<VistaHub | null>(null);

  /** Admin / RRHH / gestión: listado de todos los instructores. */
  mostrarDirectorio = computed(() =>
    this.permisos.tiene(['instructores', 'rrhh', 'jornadas.gestionar']),
  );

  /** Usuario vinculado a empleado con permiso de portal. */
  mostrarPortal = computed(() => this.auth.puedeUsarPortalInstructor());

  mostrarTabs = computed(() => this.mostrarDirectorio() && this.mostrarPortal());

  vista = computed<VistaHub>(() => {
    const manual = this.vistaManual();
    if (manual) return manual;
    const q = String(this.route.snapshot.queryParamMap.get('vista') || '').toLowerCase();
    if (q === 'portal' && this.mostrarPortal()) return 'portal';
    if (q === 'directorio' && this.mostrarDirectorio()) return 'directorio';
    // Admin / directorio tiene prioridad sobre el portal personal.
    if (this.mostrarDirectorio()) return 'directorio';
    return 'portal';
  });

  vistaActiva = computed<VistaHub | null>(() => {
    const v = this.vista();
    if (v === 'directorio' && this.mostrarDirectorio()) return 'directorio';
    if (v === 'portal' && this.mostrarPortal()) return 'portal';
    if (this.mostrarDirectorio()) return 'directorio';
    if (this.mostrarPortal()) return 'portal';
    return null;
  });

  setVista(v: VistaHub): void {
    this.vistaManual.set(v);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { vista: v },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
