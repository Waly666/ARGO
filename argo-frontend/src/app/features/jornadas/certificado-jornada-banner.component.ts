import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';

import { CertificadoJornadaBloqueoService } from '../../core/services/certificado-jornada-bloqueo.service';
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
  private certBloqueoSvc = inject(CertificadoJornadaBloqueoService);

  alertas = this.alertSvc.alertas;
  compact = input(false);

  imprimirCertificado(a: CertificadoJornadaAlerta) {
    this.alertSvc.descartar(a.id);
    this.certBloqueoSvc.imprimirCertificadoDirecto(a.id);
  }

  cerrar(ev: Event, id: string) {
    ev.stopPropagation();
    this.alertSvc.descartar(id);
  }
}
