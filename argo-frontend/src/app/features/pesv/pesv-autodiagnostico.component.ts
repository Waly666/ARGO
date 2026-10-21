import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PesvNavComponent } from './pesv-nav.component';

import { PesvAutodiagnostico, PesvService } from '../../core/services/pesv.service';
import { AccionPermisoService } from '../../core/services/accion-permiso.service';

@Component({
  selector: 'argo-pesv-autodiagnostico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PesvNavComponent],
  templateUrl: './pesv-autodiagnostico.component.html',
  styleUrls: ['./pesv-shared.scss'],
})
export class PesvAutodiagnosticoComponent implements OnInit {
  private pesv = inject(PesvService);
  accionPerm = inject(AccionPermisoService);

  vigencia = signal(new Date().getFullYear());
  loading = signal(true);
  saving = signal(false);
  msg = signal<string | null>(null);

  misionalidad = signal<1 | 2>(2);
  totalVehiculos = signal(0);
  totalConductores = signal(0);
  observaciones = signal('');
  nivelLabel = signal<string | null>(null);

  ngOnInit(): void {
    this.pesv.config().subscribe({
      next: (c) => {
        if (c.vigenciaActiva) this.vigencia.set(c.vigenciaActiva);
        this.cargar();
      },
      error: () => this.cargar(),
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.pesv.autodiagnostico(this.vigencia()).subscribe({
      next: (r) => {
        const reg = r.registro;
        if (reg) {
          this.misionalidad.set(reg.misionalidad === 1 ? 1 : 2);
          this.totalVehiculos.set(reg.totalVehiculos ?? 0);
          this.totalConductores.set(reg.totalConductores ?? 0);
          this.observaciones.set(reg.observaciones || '');
          this.nivelLabel.set(
            reg.nivelCalculado === 'avanzado'
              ? 'Avanzado'
              : reg.nivelCalculado === 'estandar'
                ? 'Estándar'
                : 'Básico',
          );
        }
        this.loading.set(false);
      },
      error: () => {
        this.msg.set('No se pudo cargar el autodiagnóstico');
        this.loading.set(false);
      },
    });
  }

  guardar(): void {
    if (!this.accionPerm.tiene('pesv', 'editar')) {
      this.msg.set('Sin permiso para editar PESV');
      return;
    }
    this.saving.set(true);
    this.msg.set(null);
    const body: PesvAutodiagnostico & { vigencia: number } = {
      vigencia: this.vigencia(),
      misionalidad: this.misionalidad(),
      totalVehiculos: this.totalVehiculos(),
      totalConductores: this.totalConductores(),
      observaciones: this.observaciones(),
    };
    this.pesv.guardarAutodiagnostico(body).subscribe({
      next: (reg) => {
        this.nivelLabel.set(
          reg.nivelCalculado === 'avanzado'
            ? 'Avanzado'
            : reg.nivelCalculado === 'estandar'
              ? 'Estándar'
              : 'Básico',
        );
        this.saving.set(false);
        this.msg.set('Guardado. Nivel: ' + (this.nivelLabel() || ''));
      },
      error: () => {
        this.saving.set(false);
        this.msg.set('Error al guardar');
      },
    });
  }
}
