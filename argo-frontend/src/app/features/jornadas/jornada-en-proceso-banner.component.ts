import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { JornadaEnProcesoAlertService, JornadaEnProcesoAlerta } from '../../core/services/jornada-en-proceso-alert.service';
import { JornadaHubDeepLinkService, JornadaHubDeepLink } from '../../core/services/jornada-hub-deeplink.service';
import { fmtFechaCalendario } from './jornada-calendario.util';

@Component({
  selector: 'argo-jornada-en-proceso-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jornada-en-proceso-banner.component.html',
  styleUrls: ['./jornada-en-proceso-banner.component.scss'],
})
export class JornadaEnProcesoBannerComponent {
  private alertSvc = inject(JornadaEnProcesoAlertService);
  private deeplink = inject(JornadaHubDeepLinkService);
  private router = inject(Router);

  visible = this.alertSvc.visible;
  activas = this.alertSvc.activas;

  /** Una alerta por contrato (sin duplicar si hay varias jornadas del mismo contrato). */
  alertasContrato = computed(() => {
    const map = new Map<string, JornadaEnProcesoAlerta>();
    for (const j of this.activas()) {
      const key = j.idContrato || j.codContrato || j.id;
      if (!map.has(key)) map.set(key, j);
    }
    return Array.from(map.values());
  });

  /** Una alerta por jornada EN PROCESO. */
  alertasJornada = computed(() => this.activas());

  trackContrato(j: JornadaEnProcesoAlerta): string {
    return j.idContrato || j.codContrato || j.id;
  }

  tituloJornada(j: JornadaEnProcesoAlerta): string {
    const partes = [
      j.codContrato,
      j.municipio,
      j.fechaProgramacion ? fmtFechaCalendario(j.fechaProgramacion) : '',
    ].filter(Boolean);
    return partes.length ? partes.join(' · ') : 'Jornada activa';
  }

  detalleJornada(j: JornadaEnProcesoAlerta): string {
    return `${j.direccion || 'Sin dirección'} · ${j.certificadosJornada ?? 0}/${j.numeObjeJornada ?? 0} cert.`;
  }

  tituloContrato(c: JornadaEnProcesoAlerta): string {
    return `Contrato ${c.codContrato || '—'}`;
  }

  detalleContrato(c: JornadaEnProcesoAlerta): string {
    return `${c.certificadosContrato ?? 0}/${c.numeroAlumnos ?? 0} cert.`;
  }

  tituloProceso(): string {
    return 'Jornada EN PROCESO';
  }

  detalleProceso(): string {
    return this.texto() || 'Operación activa hoy';
  }

  texto = computed(() => {
    const list = this.activas();
    const n = list.length;
    if (n === 0) return '';
    if (n === 1) {
      const j = list[0];
      const partes = [
        fmtFechaCalendario(j.fechaProgramacion),
        j.municipio,
        j.direccion,
        j.codContrato || j.contratoLabel,
      ].filter((x) => x && x !== '—');
      return partes.length ? partes.join(' · ') : 'Operación activa hoy';
    }
    return `${n} jornadas activas hoy`;
  });

  irJornadas(ev?: Event) {
    ev?.stopPropagation();
    void this.router.navigate(['/app/jornadas/en-proceso']);
  }

  irContrato(c: JornadaEnProcesoAlerta, ev?: Event) {
    ev?.stopPropagation();
    const id = c.idContrato;
    if (!id) {
      void this.router.navigate(['/app/jornadas/en-proceso']);
      return;
    }
    this.navegarHub({ contrato: id }, { contrato: id });
  }

  irJornadaEdit(j: JornadaEnProcesoAlerta, ev?: Event) {
    ev?.stopPropagation();
    const contrato = j.idContrato;
    if (!contrato || !j.id) {
      void this.router.navigate(['/app/jornadas/en-proceso']);
      return;
    }
    this.navegarHub(
      { contrato, tab: 'jornadas', jornada: j.id },
      { contrato, tab: 'jornadas', jornada: j.id },
    );
  }

  private navegarHub(link: JornadaHubDeepLink, queryParams: Record<string, string>) {
    const tree = this.router.createUrlTree(['/app/jornadas'], { queryParams });
    const mismaUrl = this.router.isActive(tree, {
      paths: 'exact',
      queryParams: 'exact',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
    if (mismaUrl) {
      this.deeplink.emit(link);
      return;
    }
    void this.router.navigateByUrl(tree);
  }

  cerrar(ev: Event) {
    ev.stopPropagation();
    this.alertSvc.cerrar();
  }
}
