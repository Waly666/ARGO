import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { AlumnoStore } from '../../../core/services/alumno-store.service';
import { AulaVirtualProgresoAlumnosComponent } from '../../aula-virtual/aula-virtual-progreso-alumnos.component';
import { AlumnoPortalAccesoComponent } from './alumno-portal-acceso.component';

@Component({
  selector: 'argo-alumno-aula-virtual',
  standalone: true,
  imports: [CommonModule, AlumnoPortalAccesoComponent, AulaVirtualProgresoAlumnosComponent],
  template: `
    @if (numDoc(); as nd) {
      <argo-alumno-portal-acceso />
      <argo-aula-virtual-progreso-alumnos [numDoc]="nd" [modoAlumno]="true" />
    } @else {
      <p class="alum-av-empty">No hay documento de alumno para consultar el progreso virtual.</p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .alum-av-empty {
        margin: 0;
        padding: 1.25rem;
        color: var(--text-dim);
      }
    `,
  ],
})
export class AlumnoAulaVirtualComponent {
  private store = inject(AlumnoStore);

  numDoc = computed(() => this.store.numDoc());
}
