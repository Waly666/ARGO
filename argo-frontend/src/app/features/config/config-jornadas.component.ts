import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';

import {
  ConfigOperacionJornadas,
  JornadaCapService,
} from '../../core/services/jornada-cap.service';
import { JornadasOperacionConfigService } from '../../core/services/jornadas-operacion-config.service';
import { ServicioCatalogoService } from '../../core/services/servicio-catalogo.service';

interface ServicioOpcion {
  idServ: string;
  label: string;
}

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
  private servCatSvc = inject(ServicioCatalogoService);

  loading = signal(true);
  guardando = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);
  serviciosGlobales = signal<ServicioOpcion[]>([]);
  config = signal<ConfigOperacionJornadas>({
    operacionFueraDeDiaHabilitada: false,
    mostrarSwitchHorarioManual: true,
    idServCapacitacionContrato: '53',
  });

  ngOnInit(): void {
    this.servCatSvc.listar({ sinPrograma: true, catalogo: true, limit: 300 }).subscribe({
      next: (rows) => {
        this.serviciosGlobales.set(
          (rows || []).map((s) => ({
            idServ: String(s.idServ ?? s._id ?? ''),
            label: String(s.descrServicio || s.descripcion || s.idServ || '').trim(),
          })),
        );
      },
      error: () => this.serviciosGlobales.set([]),
    });
    this.recargar();
  }

  recargar(): void {
    this.loading.set(true);
    this.jornadaSvc
      .obtenerConfigOperacionJornadas()
      .pipe(
        timeout(20_000),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (cfg) => {
          this.config.set(cfg);
        },
        error: () => {
          this.config.set({
            operacionFueraDeDiaHabilitada: false,
            mostrarSwitchHorarioManual: true,
            idServCapacitacionContrato: '53',
          });
          this.mostrar('No se pudo cargar la configuración.', true);
        },
      });
  }

  patchOperacionFueraDeDia(valor: boolean): void {
    this.config.set({ ...this.config(), operacionFueraDeDiaHabilitada: valor });
  }

  patchMostrarSwitchHorarioManual(valor: boolean): void {
    this.config.set({ ...this.config(), mostrarSwitchHorarioManual: valor });
  }

  patchIdServCapacitacionContrato(idServ: string): void {
    this.config.set({ ...this.config(), idServCapacitacionContrato: idServ });
  }

  guardar(): void {
    this.guardando.set(true);
    this.jornadaSvc.guardarConfigOperacionJornadas(this.config()).subscribe({
      next: (cfg) => {
        this.config.set(cfg);
        this.operacionCfg.marcarDesdeConfig(cfg);
        this.guardando.set(false);
        const partes: string[] = [];
        if (cfg.operacionFueraDeDiaHabilitada) {
          partes.push('Operación fuera del día habilitada.');
        } else {
          partes.push('Operación fuera del día deshabilitada.');
        }
        partes.push(
          cfg.mostrarSwitchHorarioManual
            ? 'Selector de horario manual visible.'
            : 'Selector de horario manual oculto.',
        );
        partes.push(`Servicio contrato: idServ ${cfg.idServCapacitacionContrato}.`);
        this.mostrar(partes.join(' '), false);
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
