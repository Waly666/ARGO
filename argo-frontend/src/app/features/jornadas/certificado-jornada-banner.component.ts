import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { certAlertToneClass, labelTipoCert } from '../../core/constants/tipos-certificado';
import {
  CertificadoJornadaAlertService,
  CertificadoJornadaAlerta,
} from '../../core/services/certificado-jornada-alert.service';
import { JornadaCapService } from '../../core/services/jornada-cap.service';
import { CertificadoService } from '../../core/services/certificado.service';
import { HeadAlarmListBannerComponent } from '../../shared/components/head-alarm-list-banner/head-alarm-list-banner.component';
import type { HeadAlarmListRow } from '../../shared/components/head-alarm-list-banner/head-alarm-list.types';

@Component({
  selector: 'argo-certificado-jornada-banner',
  standalone: true,
  imports: [CommonModule, HeadAlarmListBannerComponent],
  templateUrl: './certificado-jornada-banner.component.html',
  styleUrls: ['./certificado-jornada-banner.component.scss'],
})
export class CertificadoJornadaBannerComponent {
  private alertSvc = inject(CertificadoJornadaAlertService);
  private jornadaSvc = inject(JornadaCapService);
  private certificadoSvc = inject(CertificadoService);
  private confirmSvc = inject(ConfirmDialogService);

  visible = computed(() => this.alertSvc.alertas().length > 0);

  rows = computed<HeadAlarmListRow[]>(() =>
    this.alertSvc.alertas().map((a) => ({
      id: a.id,
      title: this.titulo(a),
      rowClass: this.rowClass(a.tipoFormatoCert),
      badge: a.origenLabel,
      badgeClass: a.origen ? `hal-badge-origen-${a.origen}` : undefined,
    })),
  );

  onItemClick(row: HeadAlarmListRow) {
    const a = this.alertSvc.alertas().find((x) => x.id === row.id);
    if (a) this.imprimirCertificado(a);
  }

  onItemDismiss(row: HeadAlarmListRow) {
    this.alertSvc.descartar(row.id);
  }

  cerrar() {
    for (const a of this.alertSvc.alertas()) {
      this.alertSvc.descartar(a.id);
    }
  }

  private rowClass(tipo?: string | null): string {
    return certAlertToneClass(tipo).replace('cert-tone-', 'hal-row-cert-');
  }

  private etiquetaTipoAlerta(a: CertificadoJornadaAlerta): string {
    return a.tipoFormatoCertLabel || labelTipoCert(a.tipoFormatoCert);
  }

  private titulo(a: CertificadoJornadaAlerta): string {
    const partes = [
      this.etiquetaTipoAlerta(a),
      a.codigoCert || '—',
      a.nombreCompleto || '',
      a.encabezado || '',
    ].filter(Boolean);
    return partes.join(' · ');
  }

  private imprimirCertificado(a: CertificadoJornadaAlerta) {
    // Abrir ventana en el gesto del clic; luego descartar la fila de la alarma.
    const onError = (msg: string) => {
      void this.confirmSvc.open({
        title: 'Impresión',
        message: msg,
        variant: 'warn',
        hideCancel: true,
        confirmLabel: 'Entendido',
      });
    };
    if (a.origen === 'jornada') {
      this.jornadaSvc.imprimirCertificadoJornada(a.id, onError);
    } else {
      this.certificadoSvc.abrirHtml(a.id, onError);
    }
    this.alertSvc.descartar(a.id);
  }
}
