import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { PermisoService } from '../../core/services/permiso.service';
import { VehiculoInspeccionAlertService } from '../../core/services/vehiculo-inspeccion-alert.service';

@Component({
  selector: 'argo-vehiculo-inspeccion-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculo-inspeccion-banner.component.html',
  styleUrls: ['./vehiculo-inspeccion-banner.component.scss'],
})
export class VehiculoInspeccionBannerComponent {
  private alertSvc = inject(VehiculoInspeccionAlertService);
  private permisos = inject(PermisoService);
  private router = inject(Router);

  visible = this.alertSvc.visible;
  resumen = this.alertSvc.resumen;

  titulo = computed(() => {
    const r = this.resumen();
    if (!r) return 'Vehículos sin inspección de hoy';
    const n = r.totalPendientes;
    return n === 1 ? '1 vehículo sin inspección hoy' : `${n} vehículos sin inspección hoy`;
  });

  detalle = computed(() => {
    const r = this.resumen();
    if (!r) return '';
    const muestra = (r.alertas || [])
      .slice(0, 5)
      .map((a) => a.placa)
      .join(', ');
    const extra = r.totalPendientes > 5 ? ` · +${r.totalPendientes - 5} más` : '';
    return `Fecha ${r.fecha} · ${muestra}${extra}`;
  });

  irVehiculos(ev?: Event) {
    ev?.stopPropagation();
    const primera = this.resumen()?.alertas?.[0];
    if (primera?.vehiculoId && this.permisos.tiene('vehiculos')) {
      void this.router.navigate(['/app/vehiculos', primera.vehiculoId], {
        queryParams: { tab: 'inspeccion' },
      });
      return;
    }
    if (this.permisos.tiene('vehiculos')) {
      void this.router.navigate(['/app/vehiculos']);
      return;
    }
    void this.router.navigate(['/app/dashboard']);
  }

  cerrar(ev: Event) {
    ev.stopPropagation();
    this.alertSvc.cerrar();
  }
}
