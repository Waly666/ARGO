import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  FacturaElectronicaItem,
  FacturacionResumen,
  FacturacionService,
} from '../../core/services/facturacion.service';
import { PermisoService } from '../../core/services/permiso.service';
import { NotaCreditoModalComponent } from './nota-credito-modal.component';

@Component({
  selector: 'argo-facturacion-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NotaCreditoModalComponent],
  templateUrl: './facturacion-hub.component.html',
  styleUrls: ['./facturacion-hub.component.scss'],
})
export class FacturacionHubComponent implements OnInit {
  private feSvc = inject(FacturacionService);
  permisoSvc = inject(PermisoService);

  loading = signal(true);
  msg = signal<string | null>(null);
  filtro = signal('');
  resumen = signal<FacturacionResumen | null>(null);
  emitidas = signal<FacturaElectronicaItem[]>([]);
  facturaNota = signal<FacturaElectronicaItem | null>(null);

  abrirNota(f: FacturaElectronicaItem): void {
    this.facturaNota.set(f);
  }

  cerrarNota(): void {
    this.facturaNota.set(null);
  }

  onNotaEmitida(): void {
    this.cerrarNota();
    this.recargar();
  }

  puedeAnular(f: FacturaElectronicaItem): boolean {
    return String(f.estado || '') !== 'anulada';
  }

  verDocumento(f: FacturaElectronicaItem): void {
    this.feSvc.verFactura(f, (m) => this.msg.set(m));
  }

  imprimirDocumento(f: FacturaElectronicaItem): void {
    this.feSvc.abrirHtmlFactura(f._id, (m) => this.msg.set(m));
  }

  ngOnInit(): void {
    this.recargar();
  }

  recargar(): void {
    this.loading.set(true);
    this.feSvc.resumen().subscribe({
      next: (r) => this.resumen.set(r),
      error: () => this.resumen.set(null),
    });
    this.buscar();
  }

  buscar(): void {
    this.loading.set(true);
    this.feSvc.listar(this.filtro()).subscribe({
      next: (r) => {
        this.emitidas.set(r.items || []);
        this.loading.set(false);
      },
      error: () => {
        this.emitidas.set([]);
        this.loading.set(false);
        this.msg.set('No se pudo cargar facturación');
      },
    });
  }

  fmt(n?: number | null): string {
    return Number(n || 0).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  }

  capEstado(item: FacturaElectronicaItem): string {
    const e = String(item.estado || '').toLowerCase();
    if (e === 'anulada') return 'cap cap-red cap-sm';
    if (item.modoDesarrollo) return 'cap cap-amber cap-sm';
    if (e === 'validada') return 'cap cap-green cap-sm';
    if (e === 'rechazada') return 'cap cap-red cap-sm';
    if (e === 'pendiente_envio') return 'cap cap-blue cap-sm';
    return 'cap cap-gray cap-sm';
  }

  labelEstado(item: FacturaElectronicaItem): string {
    const e = String(item.estado || '');
    if (e === 'anulada') return 'Anulada (nota crédito)';
    if (item.modoDesarrollo) return 'Desarrollo (sin DIAN)';
    if (e === 'validada') return 'Validada DIAN';
    if (e === 'rechazada') return 'Rechazada';
    if (e === 'pendiente_envio') return 'Pendiente DIAN';
    return e || '—';
  }
}
