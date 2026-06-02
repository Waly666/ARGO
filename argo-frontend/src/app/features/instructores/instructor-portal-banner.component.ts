import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { InstructorPortalAlertService } from '../../core/services/instructor-portal-alert.service';

@Component({
  selector: 'argo-instructor-portal-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instructor-portal-banner.component.html',
  styleUrls: ['./instructor-portal-banner.component.scss'],
})
export class InstructorPortalBannerComponent {
  protected alertSvc = inject(InstructorPortalAlertService);
  private router = inject(Router);

  visible = computed(() => this.alertSvc.hayAlertasActivas());
  proxima = computed(() => this.alertSvc.bannerProximaVisible());
  asignadas = computed(() => this.alertSvc.bannerAsignadasVisible());
  inspeccion = computed(() => this.alertSvc.bannerInspeccionVisible());
  proximas = this.alertSvc.proximas;
  asignadasNuevas = this.alertSvc.asignadasNuevas;
  inspeccionInfo = this.alertSvc.inspeccion;

  irPortal(ev?: Event) {
    ev?.stopPropagation();
    void this.router.navigate(['/app/instructores']);
  }

  cerrarProxima(ev: Event) {
    ev.stopPropagation();
    this.alertSvc.cerrarProxima();
  }

  cerrarAsignadas(ev: Event) {
    ev.stopPropagation();
    this.alertSvc.cerrarAsignadas();
  }

  cerrarBanner(ev: Event) {
    ev.stopPropagation();
    if (this.proxima()) this.alertSvc.cerrarProxima();
    else if (this.asignadas()) this.alertSvc.cerrarAsignadas();
    else if (this.inspeccion()) this.alertSvc.ocultarInspeccionTemporal();
  }
}
