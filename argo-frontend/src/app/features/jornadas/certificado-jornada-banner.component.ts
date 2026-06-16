import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';

import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { CertificadoService } from '../../core/services/certificado.service';
import { certAlertToneClass, labelTipoCert } from '../../core/constants/tipos-certificado';
import {
  CertificadoJornadaAlertService,
  CertificadoJornadaAlerta,
} from '../../core/services/certificado-jornada-alert.service';

@Component({
  selector: 'argo-certificado-jornada-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificado-jornada-banner.component.html',
  styleUrls: ['./certificado-jornada-banner.component.scss'],
})
export class CertificadoJornadaBannerComponent {
  private alertSvc = inject(CertificadoJornadaAlertService);
  private certSvc = inject(CertificadoService);
  private confirmSvc = inject(ConfirmDialogService);

  alertas = this.alertSvc.alertas;
  compact = input(false);
  certAlertToneClass = certAlertToneClass;
  labelTipoCert = labelTipoCert;

  etiquetaTipoAlerta(a: CertificadoJornadaAlerta): string {
    return a.tipoFormatoCertLabel || labelTipoCert(a.tipoFormatoCert);
  }

  titulo(a: CertificadoJornadaAlerta): string {
    const partes = [
      this.etiquetaTipoAlerta(a),
      a.codigoCert || '—',
      a.nombreCompleto || '',
      a.encabezado || '',
    ].filter(Boolean);
    return partes.join(' · ');
  }

  imprimirCertificado(a: CertificadoJornadaAlerta) {
    this.alertSvc.descartar(a.id);
    this.certSvc.abrirHtml(a.id, (msg) => {
      void this.confirmSvc.open({
        title: 'Impresión',
        message: msg,
        variant: 'warn',
        hideCancel: true,
        confirmLabel: 'Entendido',
      });
    });
  }

  cerrar(ev: Event, id: string) {
    ev.stopPropagation();
    this.alertSvc.descartar(id);
  }
}
