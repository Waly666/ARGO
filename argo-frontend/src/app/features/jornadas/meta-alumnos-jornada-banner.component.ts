import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import {
  MetaAlumnosJornadaAlertService,
  MetaAlumnosJornadaAlerta,
} from '../../core/services/meta-alumnos-jornada-alert.service';
import { HeadAlarmListBannerComponent } from '../../shared/components/head-alarm-list-banner/head-alarm-list-banner.component';
import type { HeadAlarmListRow } from '../../shared/components/head-alarm-list-banner/head-alarm-list.types';

@Component({
  selector: 'argo-meta-alumnos-jornada-banner',
  standalone: true,
  imports: [CommonModule, HeadAlarmListBannerComponent],
  templateUrl: './meta-alumnos-jornada-banner.component.html',
})
export class MetaAlumnosJornadaBannerComponent {
  private alertSvc = inject(MetaAlumnosJornadaAlertService);

  visible = computed(() => this.alertSvc.alertas().length > 0);

  rows = computed<HeadAlarmListRow[]>(() =>
    this.alertSvc.alertas().map((a) => ({
      id: a.id,
      title: this.titulo(a),
      rowClass: a.metaSuperada ? 'hal-row-meta-superada' : 'hal-row-meta-alcanzada',
    })),
  );

  onItemDismiss(row: HeadAlarmListRow) {
    this.alertSvc.descartar(row.id);
  }

  cerrar() {
    this.alertSvc.descartarTodas();
  }

  private titulo(a: MetaAlumnosJornadaAlerta): string {
    const contrato = a.contratoLabel ? `${a.contratoLabel} · ` : '';
    const estado = a.metaSuperada ? 'Tope superado' : 'Tope alcanzado';
    return `${estado} · ${contrato}${a.alumnosLleva}/${a.metaAlumnos} alumnos — ${a.mensaje}`;
  }
}
