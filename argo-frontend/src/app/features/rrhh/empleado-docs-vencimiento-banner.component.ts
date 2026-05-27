import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { EmpleadoDocsAlertService } from '../../core/services/empleado-docs-alert.service';

@Component({
  selector: 'argo-empleado-docs-vencimiento-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empleado-docs-vencimiento-banner.component.html',
  styleUrls: ['./empleado-docs-vencimiento-banner.component.scss'],
})
export class EmpleadoDocsVencimientoBannerComponent {
  private alertSvc = inject(EmpleadoDocsAlertService);
  private router = inject(Router);

  visible = this.alertSvc.visible;
  resumen = this.alertSvc.resumen;

  titulo = computed(() => {
    const r = this.resumen();
    if (!r) return 'Documentos de empleados vencidos o por vencer';
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
    const emp = r.empleadosAfectados === 1 ? '1 empleado' : `${r.empleadosAfectados} empleados`;
    const muestra = (r.alertas || [])
      .slice(0, 3)
      .map((a) => {
        if (a.vencido) return `${a.nombreEmpleado} · ${a.documento} (vencido)`;
        if (a.faltaFechaVence) return `${a.nombreEmpleado} · ${a.documento} (sin fecha)`;
        return `${a.nombreEmpleado} · ${a.documento}`;
      })
      .join(' · ');
    const extra = r.totalAlertas > 3 ? ` · +${r.totalAlertas - 3} más` : '';
    return `${emp} afectado(s)${muestra ? `: ${muestra}${extra}` : ''}`;
  });

  irEmpleados() {
    const primera = this.resumen()?.alertas?.[0];
    const queryParams: Record<string, string> = { seccion: 'documentos' };
    if (primera?.idEmpleado != null) {
      queryParams['empleado'] = String(primera.idEmpleado);
    }
    void this.router.navigate(['/app/rrhh/empleados'], { queryParams });
  }

  cerrar(ev: Event) {
    ev.stopPropagation();
    this.alertSvc.cerrar();
  }
}
