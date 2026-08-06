import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import {
  AulaVirtualPortalAlertService,
  AulaVirtualEventoAlerta,
} from '../../core/services/aula-virtual-portal-alert.service';
import { HeadAlarmListBannerComponent } from '../../shared/components/head-alarm-list-banner/head-alarm-list-banner.component';
import type { HeadAlarmListRow } from '../../shared/components/head-alarm-list-banner/head-alarm-list.types';

@Component({
  selector: 'argo-aula-virtual-registro-banner',
  standalone: true,
  imports: [CommonModule, HeadAlarmListBannerComponent],
  templateUrl: './aula-virtual-registro-banner.component.html',
  styleUrl: './aula-virtual-registro-banner.component.scss',
})
export class AulaVirtualRegistroBannerComponent {
  private alertSvc = inject(AulaVirtualPortalAlertService);

  visible = computed(() => this.alertSvc.registroAlertas().length > 0);

  rows = computed<HeadAlarmListRow[]>(() =>
    this.alertSvc.registroAlertas().map((a) => ({
      id: a.id,
      title: this.titulo(a),
      meta: this.meta(a),
    })),
  );

  onItemClick(row: HeadAlarmListRow) {
    const a = this.alertSvc.registroAlertas().find((x) => x.id === row.id);
    if (a) this.alertSvc.abrirRegistro(a);
  }

  onItemDismiss(row: HeadAlarmListRow) {
    this.alertSvc.descartarRegistro(row.id);
  }

  cerrar() {
    this.alertSvc.descartarTodasRegistro();
  }

  private titulo(a: AulaVirtualEventoAlerta): string {
    const doc = a.numDoc ? ` · CC ${a.numDoc}` : '';
    return `${a.nombreAlumno || 'Alumno'}${doc}`;
  }

  private meta(a: AulaVirtualEventoAlerta): string {
    const partes: string[] = [];
    if (a.alumnoNuevo) partes.push('Alumno nuevo en ERP');
    else partes.push('Usuario portal');
    if (a.email) partes.push(a.email);
    return partes.join(' · ');
  }
}
