import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { PermisoService } from '../../core/services/permiso.service';
import { VehiculoDocsFaltantesAlertService } from '../../core/services/vehiculo-docs-faltantes-alert.service';

@Component({
  selector: 'argo-vehiculo-docs-faltantes-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculo-docs-faltantes-banner.component.html',
  styleUrls: ['./vehiculo-docs-faltantes-banner.component.scss'],
})
export class VehiculoDocsFaltantesBannerComponent {
  private alertSvc = inject(VehiculoDocsFaltantesAlertService);
  private permisos = inject(PermisoService);
  private router = inject(Router);

  visible = this.alertSvc.visible;
  resumen = this.alertSvc.resumen;

  titulo = computed(() => {
    const r = this.resumen();
    if (!r) return 'Documentos de vehículos sin registrar';
    const n = r.totalFaltantes;
    return n === 1 ? '1 documento sin registrar' : `${n} documentos sin registrar`;
  });

  detalle = computed(() => {
    const r = this.resumen();
    if (!r) return '';
    const veh = r.vehiculosAfectados === 1 ? '1 vehículo' : `${r.vehiculosAfectados} vehículos`;
    const muestra = (r.alertas || [])
      .slice(0, 4)
      .map((a) => `${a.placa}: falta ${a.documento}`)
      .join(' · ');
    const extra = r.totalFaltantes > 4 ? ` · +${r.totalFaltantes - 4} más` : '';
    return `${veh} · ${muestra}${extra}`;
  });

  irVehiculos(ev?: Event) {
    ev?.stopPropagation();
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
