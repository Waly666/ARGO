import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { AutorizacionAlertService } from '../../core/services/autorizacion-alert.service';
import { HeadAlarmListBannerComponent } from '../../shared/components/head-alarm-list-banner/head-alarm-list-banner.component';
import type { HeadAlarmListRow } from '../../shared/components/head-alarm-list-banner/head-alarm-list.types';

@Component({
  selector: 'argo-autorizacion-pendiente-banner',
  standalone: true,
  imports: [CommonModule, HeadAlarmListBannerComponent],
  template: `
    <argo-head-alarm-list-banner
      [visible]="visible()"
      theme="hal-theme-default"
      icon="🔐"
      [title]="'Autorizaciones pendientes (' + rows().length + ')'"
      hint="Pulse una fila o el enlace para revisar y autorizar eliminaciones."
      [items]="rows()"
      [itemDismissible]="true"
      (closed)="cerrar()"
      (itemClick)="onItemClick()"
      (itemDismiss)="onItemDismiss($event)"
    />
  `,
})
export class AutorizacionPendienteBannerComponent {
  private alertSvc = inject(AutorizacionAlertService);

  visible = computed(() => this.alertSvc.pendientesAdmin().length > 0);

  rows = computed<HeadAlarmListRow[]>(() =>
    this.alertSvc.pendientesAdmin().map((a) => ({
      id: String(a.idSolicitud),
      title: a.resumen,
      meta: this.metaPendiente(a),
    })),
  );

  private metaPendiente(a: {
    modulo: string;
    nombreSolicita?: string | null;
    usuarioSolicita?: string | null;
    motivo?: string | null;
  }): string {
    const partes = [
      this.alertSvc.etiquetaModulo(a.modulo),
      a.nombreSolicita || a.usuarioSolicita || 'Usuario',
      a.motivo?.trim() ? `Motivo: ${a.motivo.trim()}` : null,
    ].filter(Boolean);
    const t = partes.join(' · ');
    return t.length > 160 ? `${t.slice(0, 157)}…` : t;
  }

  onItemClick(): void {
    this.alertSvc.irBandejaAdmin();
  }

  onItemDismiss(row: HeadAlarmListRow): void {
    this.alertSvc.descartarPendiente(Number(row.id));
  }

  cerrar(): void {
    this.alertSvc.descartarTodasPendientes();
  }
}

@Component({
  selector: 'argo-autorizacion-resuelta-banner',
  standalone: true,
  imports: [CommonModule, HeadAlarmListBannerComponent],
  template: `
    <argo-head-alarm-list-banner
      [visible]="visible()"
      theme="hal-theme-foro"
      icon="✓"
      [title]="'Respuesta a su solicitud de eliminación (' + rows().length + ')'"
      hint="Pulse el botón cerrar o descarte cada fila cuando haya leído el resultado."
      [items]="rows()"
      [itemDismissible]="true"
      (closed)="cerrar()"
      (itemDismiss)="onItemDismiss($event)"
    />
  `,
})
export class AutorizacionResueltaBannerComponent {
  private alertSvc = inject(AutorizacionAlertService);

  visible = computed(() => this.alertSvc.resueltasMias().length > 0);

  rows = computed<HeadAlarmListRow[]>(() =>
    this.alertSvc.resueltasMias().map((a) => ({
      id: String(a.idSolicitud),
      title: this.alertSvc.textoEstadoResuelta(a.estado),
      meta: this.metaResuelta(a),
    })),
  );

  onItemDismiss(row: HeadAlarmListRow): void {
    this.alertSvc.descartarResuelta(Number(row.id));
  }

  cerrar(): void {
    this.alertSvc.descartarTodasResueltas();
  }

  private metaResuelta(a: {
    resumen: string;
    modulo: string;
    nombreResuelve?: string | null;
    motivoRechazo?: string | null;
    errorEjecucion?: string | null;
  }): string {
    const partes = [
      a.resumen,
      this.alertSvc.etiquetaModulo(a.modulo),
      a.nombreResuelve ? `Por ${a.nombreResuelve}` : null,
      a.motivoRechazo ? `Motivo: ${a.motivoRechazo}` : null,
      a.errorEjecucion ? a.errorEjecucion : null,
    ].filter(Boolean);
    const t = partes.join(' · ');
    return t.length > 140 ? `${t.slice(0, 137)}…` : t;
  }
}
