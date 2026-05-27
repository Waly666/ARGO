import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ProgramacionCeaPendienteAlertService } from '../../core/services/programacion-cea-pendiente-alert.service';

@Component({
  selector: 'argo-programacion-cea-pendiente-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './programacion-cea-pendiente-banner.component.html',
  styleUrls: ['./programacion-cea-pendiente-banner.component.scss'],
})
export class ProgramacionCeaPendienteBannerComponent {
  private alertSvc = inject(ProgramacionCeaPendienteAlertService);
  private router = inject(Router);

  visible = this.alertSvc.visible;
  total = this.alertSvc.total;

  detalle = computed(() => {
    const n = this.total();
    if (n <= 0) return '';
    if (n === 1) return this.alertSvc.items()[0]?.alumnoNombre || '1 servicio sin programar';
    return `${n} servicios/alumnos con horas sin programar`;
  });

  irPendientes(ev?: Event) {
    ev?.stopPropagation();
    void this.router.navigate(['/app/programacion-cea'], { queryParams: { tab: 'pendientes' } });
  }

  cerrar(ev: Event) {
    ev.stopPropagation();
    this.alertSvc.cerrar();
  }
}
