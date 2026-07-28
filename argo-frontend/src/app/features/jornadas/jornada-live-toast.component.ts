import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { JornadaLiveSyncService } from '../../core/services/jornada-live-sync.service';
import { JornadaCapService } from '../../core/services/jornada-cap.service';
import { PermisoService } from '../../core/services/permiso.service';
import { esInstructorJornadasRestringido } from './jornadas-acceso.util';

@Component({
  selector: 'argo-jornada-live-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jornada-live-toast.component.html',
  styleUrls: ['./jornada-live-toast.component.scss'],
})
export class JornadaLiveToastComponent {
  private liveSync = inject(JornadaLiveSyncService);
  private jornadaSvc = inject(JornadaCapService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private permisoSvc = inject(PermisoService);

  toast = this.liveSync.toast;
  clasesEnCurso = this.liveSync.clasesEnCurso;

  cerrarToast(): void {
    this.liveSync.cerrarToast();
  }

  irClase(claseId: string): void {
    if (!claseId) return;
    const instructorSolo = esInstructorJornadasRestringido(
      (k) => this.permisoSvc.tiene(k),
      this.auth.user()?.rol,
    );
    if (instructorSolo) {
      void this.router.navigate(['/app/jornadas/clases-hoy'], {
        queryParams: { clase: claseId },
      });
      return;
    }
    void this.router.navigate(['/app/jornadas'], {
      queryParams: { tab: 'clases', clase: claseId },
    });
  }

  imprimirCert(certId?: string): void {
    if (!certId) return;
    this.jornadaSvc.imprimirCertificadoJornada(certId, () => undefined);
  }

  etiquetaCert(c: { codigo?: string; nombre?: string }): string {
    return [c.codigo, c.nombre].filter(Boolean).join(' · ') || 'Certificado';
  }
}
