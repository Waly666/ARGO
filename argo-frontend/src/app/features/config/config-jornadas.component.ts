import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  ConfigOperacionJornadas,
  JornadaCapService,
} from '../../core/services/jornada-cap.service';
import { JornadasOperacionConfigService } from '../../core/services/jornadas-operacion-config.service';

@Component({
  selector: 'argo-config-jornadas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './config-jornadas.component.html',
  styleUrls: ['./config-jornadas.component.scss'],
})
export class ConfigJornadasComponent implements OnInit {
  private jornadaSvc = inject(JornadaCapService);
  private operacionCfg = inject(JornadasOperacionConfigService);

  loading = signal(true);
  guardando = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);
  config = signal<ConfigOperacionJornadas>({ operacionFueraDeDiaHabilitada: false });

  ngOnInit(): void {
    this.recargar();
  }

  recargar(): void {
    this.loading.set(true);
    this.jornadaSvc.obtenerConfigOperacionJornadas().subscribe({
      next: (cfg) => {
        this.config.set(cfg);
        this.loading.set(false);
      },
      error: () => {
        this.config.set({ operacionFueraDeDiaHabilitada: false });
        this.loading.set(false);
        this.mostrar('No se pudo cargar la configuración.', true);
      },
    });
  }

  guardar(): void {
    this.guardando.set(true);
    this.jornadaSvc.guardarConfigOperacionJornadas(this.config()).subscribe({
      next: (cfg) => {
        this.config.set(cfg);
        this.operacionCfg.marcarDesdeConfig(cfg);
        this.guardando.set(false);
        this.mostrar(
          cfg.operacionFueraDeDiaHabilitada
            ? 'Operación fuera del día habilitada. Puede operar jornadas y clases en cualquier fecha programada.'
            : 'Operación fuera del día deshabilitada. Solo el día programado (hoy).',
          false,
        );
      },
      error: (e) => {
        this.guardando.set(false);
        this.mostrar(e?.error?.message || 'No se pudo guardar.', true);
      },
    });
  }

  private mostrar(texto: string, err: boolean): void {
    this.msg.set(texto);
    this.msgError.set(err);
  }
}
