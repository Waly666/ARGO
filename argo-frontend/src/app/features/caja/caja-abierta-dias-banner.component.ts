import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { CajaEstadoService } from '../../core/services/caja-estado.service';
import { HeadAlarmListBannerComponent } from '../../shared/components/head-alarm-list-banner/head-alarm-list-banner.component';
import type { HeadAlarmListRow } from '../../shared/components/head-alarm-list-banner/head-alarm-list.types';

@Component({
  selector: 'argo-caja-abierta-dias-banner',
  standalone: true,
  imports: [CommonModule, HeadAlarmListBannerComponent],
  templateUrl: './caja-abierta-dias-banner.component.html',
  styleUrls: ['./caja-abierta-dias-banner.component.scss'],
})
export class CajaAbiertaDiasBannerComponent {
  private router = inject(Router);
  private cajaEstado = inject(CajaEstadoService);

  dias = computed(() => Math.max(0, this.cajaEstado.diasSinCerrar()));

  visible = computed(
    () =>
      !this.cajaEstado.loading() &&
      this.cajaEstado.abierta() === true &&
      this.dias() >= 1 &&
      this.cajaEstado.mostrarBannerAbiertaDias(),
  );

  titulo = computed(() => {
    const n = this.dias();
    return n === 1 ? 'Caja sin cerrar · 1 día' : `Caja sin cerrar · ${n} días`;
  });

  hint = computed(() => {
    const n = this.dias();
    const texto = n === 1 ? '1 día' : `${n} días`;
    return `Lleva ${texto} con la caja abierta. Es imperativo cerrarla adecuadamente.`;
  });

  rows = computed<HeadAlarmListRow[]>(() => {
    const n = this.dias();
    const texto = n === 1 ? '1 día' : `${n} días`;
    const id = this.cajaEstado.sesion()?.idSesion;
    return [
      {
        id: 'cerrar-caja-dias',
        title: 'Ir a cerrar caja',
        meta:
          id != null
            ? `Sesión #${id} · abierta hace ${texto}. Pulse para ir al cierre.`
            : `Abierta hace ${texto}. Pulse para ir al cierre.`,
      },
    ];
  });

  onItemClick(_row: HeadAlarmListRow) {
    void this.router.navigate(['/app/caja']);
  }

  cerrar() {
    this.cajaEstado.cerrarBannerAbiertaDias();
  }
}
