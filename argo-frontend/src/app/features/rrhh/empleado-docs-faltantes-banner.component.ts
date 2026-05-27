import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { EmpleadoDocsFaltantesAlertService } from '../../core/services/empleado-docs-faltantes-alert.service';
import { PermisoService } from '../../core/services/permiso.service';

@Component({
  selector: 'argo-empleado-docs-faltantes-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empleado-docs-faltantes-banner.component.html',
  styleUrls: ['./empleado-docs-faltantes-banner.component.scss'],
})
export class EmpleadoDocsFaltantesBannerComponent {
  private alertSvc = inject(EmpleadoDocsFaltantesAlertService);
  private permisos = inject(PermisoService);
  private router = inject(Router);

  visible = this.alertSvc.visible;
  resumen = this.alertSvc.resumen;

  titulo = computed(() => {
    const r = this.resumen();
    if (!r) return 'Documentos de empleados sin registrar';
    const n = r.totalFaltantes;
    return n === 1 ? '1 documento sin registrar' : `${n} documentos sin registrar`;
  });

  detalle = computed(() => {
    const r = this.resumen();
    if (!r) return '';
    const emp = r.empleadosAfectados === 1 ? '1 empleado' : `${r.empleadosAfectados} empleados`;
    const muestra = (r.alertas || [])
      .slice(0, 4)
      .map((a) => `${a.nombreEmpleado}: falta ${a.documento}`)
      .join(' · ');
    const extra = r.totalFaltantes > 4 ? ` · +${r.totalFaltantes - 4} más` : '';
    return `${emp} · ${muestra}${extra}`;
  });

  irEmpleados(ev?: Event) {
    ev?.stopPropagation();
    if (this.permisos.tiene('rrhh')) {
      void this.router.navigate(['/app/rrhh/empleados']);
      return;
    }
    void this.router.navigate(['/app/dashboard']);
  }

  cerrar(ev: Event) {
    ev.stopPropagation();
    this.alertSvc.cerrar();
  }
}
