import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ProgramacionCeaClaseProximaAlertService } from '../../core/services/programacion-cea-clase-proxima-alert.service';

@Component({
  selector: 'argo-programacion-cea-clase-proxima-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './programacion-cea-clase-proxima-banner.component.html',
  styleUrls: ['./programacion-cea-clase-proxima-banner.component.scss'],
})
export class ProgramacionCeaClaseProximaBannerComponent {
  private alertSvc = inject(ProgramacionCeaClaseProximaAlertService);
  private router = inject(Router);

  visible = this.alertSvc.visible;
  clases = this.alertSvc.clases;
  total = this.alertSvc.total;

  titulo = computed(() => {
    const n = this.total();
    if (n <= 1) return 'Clase CEA próxima';
    return `${n} clases CEA próximas`;
  });

  detalle = computed(() => {
    const rows = this.clases();
    if (!rows.length) return '';
    if (rows.length === 1) return this.alertSvc.resumenClase(rows[0]);
    const primera = this.alertSvc.resumenClase(rows[0]);
    return `${primera} (+${rows.length - 1} más)`;
  });

  irClasesHoy(ev?: Event) {
    ev?.stopPropagation();
    void this.router.navigate(['/app/programacion-cea/clases-hoy']);
  }

  cerrar(ev: Event) {
    ev.stopPropagation();
    this.alertSvc.cerrar();
  }
}
