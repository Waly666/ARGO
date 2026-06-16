import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import {
  ForoMensajeAlertService,
  ForoMensajeAlerta,
} from '../../core/services/foro-mensaje-alert.service';

@Component({
  selector: 'argo-foro-mensaje-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './foro-mensaje-banner.component.html',
  styleUrl: './foro-mensaje-banner.component.scss',
})
export class ForoMensajeBannerComponent {
  private alertSvc = inject(ForoMensajeAlertService);

  alertas = this.alertSvc.alertas;

  resumenTexto(a: ForoMensajeAlerta): string {
    const t = a.texto.trim();
    return t.length > 120 ? `${t.slice(0, 117)}…` : t;
  }

  abrir(a: ForoMensajeAlerta) {
    this.alertSvc.abrir(a);
  }

  cerrar(ev: Event, id: string) {
    ev.stopPropagation();
    this.alertSvc.descartar(id);
  }
}
