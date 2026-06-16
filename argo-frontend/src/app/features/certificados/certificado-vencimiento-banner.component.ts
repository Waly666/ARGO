import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { CertificadoVencimientoAlertService } from '../../core/services/certificado-vencimiento-alert.service';
import type { CertificadoVencimientoAlertaItem } from '../../core/services/certificado.service';

@Component({
  selector: 'argo-certificado-vencimiento-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificado-vencimiento-banner.component.html',
  styleUrls: ['./certificado-vencimiento-banner.component.scss'],
})
export class CertificadoVencimientoBannerComponent {
  readonly alertSvc = inject(CertificadoVencimientoAlertService);
  private router = inject(Router);

  visible = this.alertSvc.visible;
  items = this.alertSvc.items;
  peorNivel = this.alertSvc.peorNivel;

  titulo = computed(() => {
    const d = this.alertSvc.data();
    const ventana = d?.diasVentana ?? 15;
    const hoy = this.alertSvc.venceHoy();
    const total = this.alertSvc.total();
    if (hoy > 0) {
      return hoy === 1
        ? `¡Certificado vence HOY (ventana ${ventana} días)!`
        : `¡${hoy} certificados vencen HOY (ventana ${ventana} días)!`;
    }
    return total === 1
      ? `1 certificado por vencer — próximos ${ventana} días`
      : `${total} certificados por vencer — próximos ${ventana} días`;
  });

  detalle = computed(() => {
    const d = this.alertSvc.data();
    if (!d) return '';
    const partes: string[] = [];
    if (d.venceHoy > 0) partes.push(`${d.venceHoy} hoy`);
    if (d.venceManana > 0) partes.push(`${d.venceManana} mañana`);
    const resumen = partes.length ? partes.join(' · ') : `${d.total} en los próximos ${d.diasVentana} días`;

    const muestra = this.items()
      .slice(0, 2)
      .map((it) => this.alertSvc.resumenItem(it))
      .join(' · ');
    const extra = d.total > 2 ? ` · +${d.total - 2} más` : '';
    return `${resumen}${muestra ? `: ${muestra}${extra}` : ''}`;
  });

  toneClass(item?: CertificadoVencimientoAlertaItem): string {
    const n = item?.nivelUrgencia || this.peorNivel();
    return `cert-vence-${n}`;
  }

  irCertificados(ev?: Event) {
    ev?.stopPropagation();
    void this.router.navigate(['/app/certificados']);
  }

  cerrar(ev: Event) {
    ev.stopPropagation();
    this.alertSvc.cerrar();
  }
}
