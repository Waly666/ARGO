import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ConfigEnvioCorreosAlumno,
  ConfigEnvioCorreosAlumnoService,
} from '../../core/services/config-envio-correos-alumno.service';
import { ArgoSwitchComponent } from '../../shared/argo-switch/argo-switch.component';

@Component({
  selector: 'argo-config-envio-correos-alumno',
  standalone: true,
  imports: [CommonModule, RouterLink, ArgoSwitchComponent],
  templateUrl: './config-envio-correos-alumno.component.html',
  styleUrl: './config-envio-correos-alumno.component.scss',
})
export class ConfigEnvioCorreosAlumnoComponent implements OnInit {
  private svc = inject(ConfigEnvioCorreosAlumnoService);

  loading = signal(true);
  saving = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);
  cfg = signal<ConfigEnvioCorreosAlumno>({
    enviarCertificados: true,
    enviarComprobantesIngreso: true,
  });

  ngOnInit(): void {
    this.svc.obtener().subscribe({
      next: (c) => {
        this.cfg.set(c);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.msgError.set(true);
        this.msg.set('No se pudo cargar la configuración');
      },
    });
  }

  onCertificados(v: boolean): void {
    this.cfg.update((c) => ({ ...c, enviarCertificados: v }));
  }

  onComprobantes(v: boolean): void {
    this.cfg.update((c) => ({ ...c, enviarComprobantesIngreso: v }));
  }

  guardar(): void {
    this.saving.set(true);
    this.svc.guardar(this.cfg()).subscribe({
      next: (c) => {
        this.cfg.set(c);
        this.saving.set(false);
        this.msgError.set(false);
        this.msg.set('Configuración guardada');
      },
      error: (e) => {
        this.saving.set(false);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo guardar');
      },
    });
  }
}
