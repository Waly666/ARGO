import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { CertificadoVencidoAlertService } from '../../core/services/certificado-vencido-alert.service';

@Component({
  selector: 'argo-certificado-vencido-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificado-vencido-banner.component.html',
  styleUrls: ['./certificado-vencido-banner.component.scss'],
})
export class CertificadoVencidoBannerComponent {
  readonly alertSvc = inject(CertificadoVencidoAlertService);
  private router = inject(Router);

  visible = this.alertSvc.visible;
  items = this.alertSvc.items;

  titulo = computed(() => {
    const total = this.alertSvc.total();
    return total === 1
      ? '¡Certificado VENCIDO — contacte al cliente!'
      : `¡${total} certificados VENCIDOS — contacte a los clientes!`;
  });

  detalle = computed(() => {
    const d = this.alertSvc.data();
    if (!d) return '';
    const dias = d.diasVentana ?? 3;
    const resumen = `${d.total} vencido(s) · aviso ${dias} días después`;
    const muestra = this.items()
      .slice(0, 3)
      .map((it) => this.alertSvc.resumenItem(it))
      .join(' · ');
    const extra = d.total > 3 ? ` · +${d.total - 3} más` : '';
    return `${resumen}${muestra ? `: ${muestra}${extra}` : ''}`;
  });

  irCertificados(ev?: Event) {
    ev?.stopPropagation();
    void this.router.navigate(['/app/certificados']);
  }

  cerrar(ev: Event) {
    ev.stopPropagation();
    this.alertSvc.cerrar();
  }
}
