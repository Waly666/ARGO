import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { AlarmaService } from '../../core/services/alarma.service';
import {
  ComprobanteHoyAlertService,
  ComprobanteHoyAlerta,
  ComprobanteHoyTipo,
} from '../../core/services/comprobante-hoy-alert.service';
import { ComprobanteHoyImpresionService } from '../../core/services/comprobante-hoy-impresion.service';

@Component({
  selector: 'argo-comprobante-hoy-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comprobante-hoy-banner.component.html',
  styleUrls: ['./comprobante-hoy-banner.component.scss'],
})
export class ComprobanteHoyBannerComponent {
  private alertSvc = inject(ComprobanteHoyAlertService);
  private impresionSvc = inject(ComprobanteHoyImpresionService);
  private alarmas = inject(AlarmaService);

  alertas = computed(() =>
    this.alertSvc.alertas().filter((a) => this.puedeVerTipo(a.tipo)),
  );

  private puedeVerTipo(tipo: ComprobanteHoyTipo): boolean {
    if (tipo === 'ingreso') return this.alarmas.tiene('alarmas.alumnos.comprobante_ingreso');
    if (tipo === 'egreso') return this.alarmas.tiene('alarmas.alumnos.comprobante_egreso');
    if (tipo === 'factura') return this.alarmas.tiene('alarmas.alumnos.factura');
    return false;
  }

  toneClass(tipo: ComprobanteHoyTipo): string {
    if (tipo === 'ingreso') return 'comp-tone-ingreso';
    if (tipo === 'egreso') return 'comp-tone-egreso';
    return 'comp-tone-factura';
  }

  etiquetaTipo(tipo: ComprobanteHoyTipo, a?: ComprobanteHoyAlerta): string {
    if (tipo === 'ingreso') return 'Comprobante ingreso';
    if (tipo === 'egreso') return 'Comprobante egreso';
    if (a?.idContrato || a?.origenFactura === 'contrato_cap') return 'Factura contrato';
    return 'Factura electrónica';
  }

  etiquetaRef(a: ComprobanteHoyAlerta): string {
    if (a.tipo === 'factura') return a.numeroFactura || 'Factura';
    return a.numRecibo || (a.tipo === 'ingreso' ? 'Ingreso' : 'Egreso');
  }

  titulo(a: ComprobanteHoyAlerta): string {
    const ref = this.etiquetaRef(a);
    const nom = a.nombreCompleto ? ` · ${a.nombreCompleto}` : '';
    const val = this.fmt(a.valor);
    return `${this.etiquetaTipo(a.tipo, a)} ${ref}${nom} · ${val}`;
  }

  fmt(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v || 0);
  }

  abrir(a: ComprobanteHoyAlerta, ev?: Event) {
    ev?.preventDefault();
    ev?.stopPropagation();
    this.impresionSvc.abrir(a.tipo, a.id);
  }

  cerrar(ev: Event, key: string) {
    ev.stopPropagation();
    this.alertSvc.descartar(key);
  }
}
