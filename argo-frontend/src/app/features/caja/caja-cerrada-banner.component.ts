import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { CajaEstadoService } from '../../core/services/caja-estado.service';

@Component({
  selector: 'argo-caja-cerrada-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './caja-cerrada-banner.component.html',
  styleUrls: ['./caja-cerrada-banner.component.scss'],
})
export class CajaCerradaBannerComponent {
  private router = inject(Router);
  private cajaEstado = inject(CajaEstadoService);

  @Input() blink = false;

  visible = computed(
    () => !this.cajaEstado.loading() && this.cajaEstado.abierta() === false && this.cajaEstado.mostrarBannerCerrada(),
  );

  irAbrirCaja(): void {
    void this.router.navigate(['/app/caja'], { queryParams: { abrir: 1 } });
  }

  cerrar(ev: Event): void {
    ev.stopPropagation();
    this.cajaEstado.cerrarBannerCerrada();
  }
}
