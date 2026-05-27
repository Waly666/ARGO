import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { VehiculoDocsAlertService } from '../../core/services/vehiculo-docs-alert.service';

@Component({
  selector: 'argo-vehiculo-docs-vencimiento-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculo-docs-vencimiento-banner.component.html',
  styleUrls: ['./vehiculo-docs-vencimiento-banner.component.scss'],
})
export class VehiculoDocsVencimientoBannerComponent {
  private alertSvc = inject(VehiculoDocsAlertService);
  private router = inject(Router);

  visible = this.alertSvc.visible;
  resumen = this.alertSvc.resumen;

  titulo = computed(() => {
    const r = this.resumen();
    if (!r) return 'Documentos de vehículos vencidos o por vencer';
    if (r.docsVencidos > 0 && r.docsPorVencer > 0) {
      return `${r.docsVencidos} vencido(s) · ${r.docsPorVencer} por vencer`;
    }
    if (r.docsVencidos > 0) {
      return r.docsVencidos === 1 ? '1 documento vencido' : `${r.docsVencidos} documentos vencidos`;
    }
    return r.docsPorVencer === 1
      ? '1 documento por vencer'
      : `${r.docsPorVencer} documentos por vencer`;
  });

  detalle = computed(() => {
    const r = this.resumen();
    if (!r) return '';
    const veh = r.vehiculosAfectados === 1 ? '1 vehículo' : `${r.vehiculosAfectados} vehículos`;
    const muestra = (r.alertas || [])
      .slice(0, 3)
      .map((a) => {
        if (a.vencido) return `${a.placa} · ${a.documento} (vencido)`;
        if (a.faltaFechaVence) return `${a.placa} · ${a.documento} (sin fecha)`;
        return `${a.placa} · ${a.documento}`;
      })
      .join(' · ');
    const extra = r.totalAlertas > 3 ? ` · +${r.totalAlertas - 3} más` : '';
    return `${veh} afectado(s)${muestra ? `: ${muestra}${extra}` : ''}`;
  });

  irVehiculos() {
    const primera = this.resumen()?.alertas?.[0];
    if (primera?.vehiculoId) {
      void this.router.navigate(['/app/vehiculos', primera.vehiculoId], {
        queryParams: { tab: 'documentos' },
      });
      return;
    }
    void this.router.navigate(['/app/vehiculos']);
  }

  cerrar(ev: Event) {
    ev.stopPropagation();
    this.alertSvc.cerrar();
  }
}
