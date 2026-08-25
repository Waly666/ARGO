import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  CONFIG_ENVIO_CORREOS_DEFAULT,
  ConfigEnvioCorreosAlumno,
  ConfigEnvioCorreosAlumnoService,
  DESTINOS_CORREO_REFERIDOR,
  DestinoCorreoReferidor,
} from '../../core/services/config-envio-correos-alumno.service';
import { ArgoSwitchComponent } from '../../shared/argo-switch/argo-switch.component';

type BloqueReferidor = 'gestor';

@Component({
  selector: 'argo-config-envio-correos-alumno',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ArgoSwitchComponent],
  templateUrl: './config-envio-correos-alumno.component.html',
  styleUrl: './config-envio-correos-alumno.component.scss',
})
export class ConfigEnvioCorreosAlumnoComponent implements OnInit {
  private svc = inject(ConfigEnvioCorreosAlumnoService);

  readonly destinos = DESTINOS_CORREO_REFERIDOR;

  readonly bloquesReferidor: Array<{
    key: BloqueReferidor;
    titulo: string;
    opciones: typeof DESTINOS_CORREO_REFERIDOR;
  }> = [
    {
      key: 'gestor',
      titulo: 'Alumnos por gestor (tramitador)',
      opciones: [
        { value: 'ninguno', label: 'No enviar' },
        { value: 'alumno', label: 'Solo al alumno' },
        { value: 'referidor', label: 'Solo al gestor' },
        { value: 'ambos', label: 'Al alumno y al gestor' },
      ],
    },
  ];

  loading = signal(true);
  saving = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);
  cfg = signal<ConfigEnvioCorreosAlumno>(structuredClone(CONFIG_ENVIO_CORREOS_DEFAULT));

  ngOnInit(): void {
    this.svc.obtener().subscribe({
      next: (c) => {
        this.cfg.set(this.mergeCfg(c));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.msgError.set(true);
        this.msg.set('No se pudo cargar la configuración');
      },
    });
  }

  private mergeCfg(c: ConfigEnvioCorreosAlumno): ConfigEnvioCorreosAlumno {
    const base = structuredClone(CONFIG_ENVIO_CORREOS_DEFAULT);
    return {
      enviarCertificados: c.enviarCertificados !== false,
      enviarComprobantesIngreso: c.enviarComprobantesIngreso !== false,
      referidorComercial: {
        gestor: { ...base.referidorComercial.gestor, ...(c.referidorComercial?.gestor || {}) },
      },
    };
  }

  onCertificados(v: boolean): void {
    this.cfg.update((c) => ({ ...c, enviarCertificados: v }));
  }

  onComprobantes(v: boolean): void {
    this.cfg.update((c) => ({ ...c, enviarComprobantesIngreso: v }));
  }

  onRegla(bloque: BloqueReferidor, campo: 'comprobanteIngreso' | 'certificado', valor: DestinoCorreoReferidor): void {
    this.cfg.update((c) => ({
      ...c,
      referidorComercial: {
        ...c.referidorComercial,
        [bloque]: {
          ...c.referidorComercial[bloque],
          [campo]: valor,
        },
      },
    }));
  }

  guardar(): void {
    this.saving.set(true);
    this.svc.guardar(this.cfg()).subscribe({
      next: (c) => {
        this.cfg.set(this.mergeCfg(c));
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
