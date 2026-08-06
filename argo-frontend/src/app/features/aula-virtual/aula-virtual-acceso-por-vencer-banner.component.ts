import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { AulaVirtualAccesoPorVencerAlertService } from '../../core/services/aula-virtual-acceso-por-vencer-alert.service';
import { HeadAlarmListBannerComponent } from '../../shared/components/head-alarm-list-banner/head-alarm-list-banner.component';
import type { HeadAlarmListRow } from '../../shared/components/head-alarm-list-banner/head-alarm-list.types';

@Component({
  selector: 'argo-aula-virtual-acceso-por-vencer-banner',
  standalone: true,
  imports: [CommonModule, HeadAlarmListBannerComponent],
  templateUrl: './aula-virtual-acceso-por-vencer-banner.component.html',
  styleUrl: './aula-virtual-acceso-por-vencer-banner.component.scss',
})
export class AulaVirtualAccesoPorVencerBannerComponent {
  readonly alertSvc = inject(AulaVirtualAccesoPorVencerAlertService);

  visible = this.alertSvc.visible;

  titulo = computed(() => {
    const d = this.alertSvc.data();
    const ventana = d?.diasVentana ?? 1;
    const hoy = this.alertSvc.venceHoy();
    const man = this.alertSvc.venceManana();
    const total = this.alertSvc.total();
    if (hoy > 0) {
      return hoy === 1
        ? 'Acceso sin pago vence HOY (1 curso virtual)'
        : `${hoy} accesos sin pago vencen HOY`;
    }
    if (man > 0 && total === man) {
      return man === 1
        ? 'Acceso sin pago vence mañana (1 curso virtual)'
        : `${man} accesos sin pago vencen mañana`;
    }
    return total === 1
      ? `1 acceso sin pago por vencer (ventana ${ventana} días)`
      : `${total} accesos sin pago por vencer (ventana ${ventana} días)`;
  });

  rows = computed<HeadAlarmListRow[]>(() =>
    this.alertSvc.items().map((it) => ({
      id: it.id,
      title: `${it.nombreAlumno || 'Alumno'} · ${this.alertSvc.etiquetaDias(it.diasRestantes)}`,
      meta: this.alertSvc.resumenItem(it),
      routerLink: ['/app/aula-virtual/cursos', it.idPrograma],
      queryParams: { tab: 'alumnos' },
    })),
  );

  cerrar() {
    this.alertSvc.cerrar();
  }
}
