import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { JornadaLiveSyncService } from '../../core/services/jornada-live-sync.service';
import { JornadaCapService } from '../../core/services/jornada-cap.service';

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

  toast = this.liveSync.toast;
  clasesEnCurso = this.liveSync.clasesEnCurso;

  cerrarToast(): void {
    this.liveSync.cerrarToast();
  }

  irClase(claseId: string): void {
    if (!claseId) return;
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
