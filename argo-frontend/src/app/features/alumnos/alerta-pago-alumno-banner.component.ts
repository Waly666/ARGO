import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AlarmaService } from '../../core/services/alarma.service';
import {
  AlertaPagoAlumnoItem,
  AlertaPagoAlumnoService,
} from '../../core/services/alerta-pago-alumno.service';
import { formatNumDoc } from '../../core/utils/num-doc.helpers';

@Component({
  selector: 'argo-alerta-pago-alumno-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './alerta-pago-alumno-banner.component.html',
  styleUrls: ['./alerta-pago-alumno-banner.component.scss'],
})
export class AlertaPagoAlumnoBannerComponent {
  svc = inject(AlertaPagoAlumnoService);
  private alarmas = inject(AlarmaService);

  /** inline = cabecera; panel = dashboard/caja con lista completa */
  modo = input<'inline' | 'panel'>('inline');

  visible = computed(
    () => this.alarmas.tiene('alarmas.caja.alerta_pago') && this.svc.visibleBanner(),
  );

  items = this.svc.items;

  cerrar(ev: Event) {
    ev.stopPropagation();
    this.svc.cerrar();
  }

  titulo(item: AlertaPagoAlumnoItem): string {
    return `${item.nombreCompleto} · CC ${formatNumDoc(item.numDoc)} · ${this.svc.etiquetaFrecuencia(item.alertaPagoFrecuencia)}`;
  }

  fichaLink(item: AlertaPagoAlumnoItem): string[] {
    return ['/app/alumnos', item.alumnoId];
  }

  fichaQuery = { tab: 'pagos' };
}
