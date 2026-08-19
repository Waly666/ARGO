import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ConfigGestoresEmpresas,
  ConfigGestoresEmpresasService,
} from '../../core/services/config-gestores-empresas.service';
import { ArgoSwitchComponent } from '../../shared/argo-switch/argo-switch.component';

@Component({
  selector: 'argo-config-gestores-empresas',
  standalone: true,
  imports: [CommonModule, RouterLink, ArgoSwitchComponent],
  templateUrl: './config-gestores-empresas.component.html',
  styleUrl: './config-gestores-empresas.component.scss',
})
export class ConfigGestoresEmpresasComponent implements OnInit {
  private svc = inject(ConfigGestoresEmpresasService);

  loading = signal(true);
  saving = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);
  cfg = signal<ConfigGestoresEmpresas>({ activo: false });

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

  onActivo(v: boolean): void {
    this.cfg.update((c) => ({ ...c, activo: v }));
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
