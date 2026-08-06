import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import {
  AulaVirtualPortalAlertService,
  AulaVirtualEventoAlerta,
} from '../../core/services/aula-virtual-portal-alert.service';
import { HeadAlarmListBannerComponent } from '../../shared/components/head-alarm-list-banner/head-alarm-list-banner.component';
import type { HeadAlarmListRow } from '../../shared/components/head-alarm-list-banner/head-alarm-list.types';

@Component({
  selector: 'argo-aula-virtual-matricula-banner',
  standalone: true,
  imports: [CommonModule, HeadAlarmListBannerComponent],
  templateUrl: './aula-virtual-matricula-banner.component.html',
  styleUrl: './aula-virtual-matricula-banner.component.scss',
})
export class AulaVirtualMatriculaBannerComponent {
  private alertSvc = inject(AulaVirtualPortalAlertService);

  visible = computed(() => this.alertSvc.matriculaAlertas().length > 0);

  rows = computed<HeadAlarmListRow[]>(() =>
    this.alertSvc.matriculaAlertas().map((a) => ({
      id: a.id,
      title: this.titulo(a),
      meta: this.meta(a),
    })),
  );

  onItemClick(row: HeadAlarmListRow) {
    const a = this.alertSvc.matriculaAlertas().find((x) => x.id === row.id);
    if (a) this.alertSvc.abrirMatricula(a);
  }

  onItemDismiss(row: HeadAlarmListRow) {
    this.alertSvc.descartarMatricula(row.id);
  }

  cerrar() {
    this.alertSvc.descartarTodasMatricula();
  }

  private titulo(a: AulaVirtualEventoAlerta): string {
    const curso = a.nombrePrograma || a.idPrograma || 'Curso';
    return `${curso} · ${a.nombreAlumno || 'Alumno'}`;
  }

  private meta(a: AulaVirtualEventoAlerta): string {
    const partes: string[] = ['Matrícula desde portal'];
    if (a.numDoc) partes.push(`CC ${a.numDoc}`);
    if (a.email) partes.push(a.email);
    return partes.join(' · ');
  }
}
