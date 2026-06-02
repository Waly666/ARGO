import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ProgramacionCeaClaseCreadoAlertService } from '../../core/services/programacion-cea-clase-creado-alert.service';

@Component({
  selector: 'argo-programacion-cea-clase-creado-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './programacion-cea-clase-creado-banner.component.html',
  styleUrls: ['./programacion-cea-clase-creado-banner.component.scss'],
})
export class ProgramacionCeaClaseCreadoBannerComponent {
  private alertSvc = inject(ProgramacionCeaClaseCreadoAlertService);
  private router = inject(Router);

  visible = this.alertSvc.visible;
  total = this.alertSvc.total;
  totalClases = this.alertSvc.totalClases;

  titulo = computed(() => {
    const n = this.totalClases();
    if (n <= 0) return 'Pendiente programar clase licencia';
    return n === 1
      ? 'Pendiente programar clase licencia (1 clase)'
      : `Pendiente programar clase licencia (${n} clases)`;
  });

  detalle = computed(() => {
    const items = this.alertSvc.items();
    if (!items.length) return '';
    if (items.length === 1) return this.alertSvc.tituloItem(items[0]);
    const alumnos = this.total() === 1 ? '1 alumno' : `${this.total()} alumnos`;
    const muestra = items
      .slice(0, 3)
      .map((it) => this.alertSvc.tituloItem(it))
      .join(' · ');
    const extra = items.length > 3 ? ` · +${items.length - 3} más` : '';
    return `${alumnos} · ${muestra}${extra}`;
  });

  irProgramacion(ev?: Event) {
    ev?.stopPropagation();
    const primera = this.alertSvc.items()[0];
    if (primera?.alumnoId) {
      void this.router.navigate(['/app/alumnos', primera.alumnoId], {
        queryParams: { tab: 'programacion' },
      });
      return;
    }
    void this.router.navigate(['/app/alumnos']);
  }

  cerrar(ev: Event) {
    ev.stopPropagation();
    this.alertSvc.cerrar();
  }
}
