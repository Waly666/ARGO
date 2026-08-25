import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import {
  ConsignacionAlertService,
  ConsignacionAlertaPendiente,
} from '../../core/services/consignacion-alert.service';
import { HeadAlarmListBannerComponent } from '../../shared/components/head-alarm-list-banner/head-alarm-list-banner.component';
import type { HeadAlarmListRow } from '../../shared/components/head-alarm-list-banner/head-alarm-list.types';

@Component({
  selector: 'argo-consignacion-pendiente-banner',
  standalone: true,
  imports: [CommonModule, HeadAlarmListBannerComponent],
  template: `
    <argo-head-alarm-list-banner
      [visible]="visible()"
      theme="hal-theme-default"
      icon="💳"
      [title]="titulo()"
      hint="Pulse una fila para abrir el panel de aprobación de consignaciones."
      [items]="rows()"
      [itemDismissible]="true"
      (closed)="cerrar()"
      (itemClick)="onItemClick($event)"
      (itemDismiss)="onItemDismiss($event)"
    />
  `,
})
export class ConsignacionPendienteBannerComponent {
  private alertSvc = inject(ConsignacionAlertService);

  visible = computed(() => this.alertSvc.pendientes().length > 0);

  titulo = computed(() => {
    const n = this.alertSvc.pendientes().length;
    return n === 1 ? 'Consignación pendiente de aprobar' : `${n} consignaciones pendientes de aprobar`;
  });

  rows = computed<HeadAlarmListRow[]>(() =>
    this.alertSvc.pendientes().map((a) => ({
      id: a.id,
      title: this.tituloFila(a),
      meta: this.meta(a),
    })),
  );

  onItemClick(row: HeadAlarmListRow): void {
    this.alertSvc.irPanel(String(row.id));
  }

  onItemDismiss(row: HeadAlarmListRow): void {
    this.alertSvc.descartar(String(row.id));
  }

  cerrar(): void {
    this.alertSvc.descartarTodas();
  }

  private tituloFila(a: ConsignacionAlertaPendiente): string {
    const doc = a.numDoc ? ` · CC ${a.numDoc}` : '';
    return `${a.nombreAlumno}${doc}`;
  }

  private meta(a: ConsignacionAlertaPendiente): string {
    const partes = [
      a.nombreCurso,
      a.medioEtiqueta,
      a.referenciaBancaria ? `Ref. ${a.referenciaBancaria}` : null,
      a.montoCop > 0 ? this.fmtMoney(a.montoCop) : null,
    ].filter(Boolean);
    const t = partes.join(' · ');
    return t.length > 160 ? `${t.slice(0, 157)}…` : t;
  }

  private fmtMoney(n: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n);
  }
}
