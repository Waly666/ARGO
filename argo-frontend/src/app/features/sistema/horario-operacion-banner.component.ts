import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { HorarioOperacionRuntimeService } from '../../core/services/horario-operacion-runtime.service';
import { HeadAlarmListBannerComponent } from '../../shared/components/head-alarm-list-banner/head-alarm-list-banner.component';
import type { HeadAlarmListRow } from '../../shared/components/head-alarm-list-banner/head-alarm-list.types';

@Component({
  selector: 'argo-horario-operacion-banner',
  standalone: true,
  imports: [CommonModule, HeadAlarmListBannerComponent],
  templateUrl: './horario-operacion-banner.component.html',
  styleUrls: ['./horario-operacion-banner.component.scss'],
})
export class HorarioOperacionBannerComponent {
  private horarioRt = inject(HorarioOperacionRuntimeService);
  private router = inject(Router);

  aviso = computed(() => this.horarioRt.avisoGracia());
  visible = computed(() => !!this.aviso());

  titulo = computed(() => {
    const min = this.aviso()?.minutosRestantes;
    if (min != null && min > 0) return `Horario de operación · ${min} min restantes`;
    return 'Horario de operación finalizado';
  });

  hint = computed(() => this.aviso()?.mensaje || '');

  rows = computed<HeadAlarmListRow[]>(() => {
    const a = this.aviso();
    if (!a) return [];
    const meta: string[] = [];
    if (a.cajaAbierta) meta.push('Cierre la caja para finalizar su jornada.');
    if (a.graciaFinIso) {
      try {
        const fin = new Date(a.graciaFinIso);
        meta.push(`Cierre de sesión a las ${fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`);
      } catch {
        /* ignore */
      }
    }
    return [
      {
        id: 'horario-gracia',
        title: a.cajaAbierta ? 'Ir a cerrar caja' : 'Continuar trabajando',
        meta: meta.join(' ') || 'Termine su trabajo pendiente.',
      },
    ];
  });

  onItemClick(): void {
    if (this.aviso()?.cajaAbierta) void this.router.navigate(['/app/caja']);
  }

  cerrar(): void {
    this.horarioRt.cerrarAviso();
  }
}
