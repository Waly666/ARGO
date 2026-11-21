import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PesvClasificacion, PesvService } from '../../core/services/pesv.service';
import { AccionPermisoService } from '../../core/services/accion-permiso.service';
import { PesvAyudaComponent } from './pesv-ayuda.component';
import { PesvNavComponent } from './pesv-nav.component';

@Component({
  selector: 'argo-pesv-autodiagnostico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PesvNavComponent, PesvAyudaComponent],
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
  flota = signal(0);
  observaciones = signal('');
  guardada = signal<PesvClasificacion | null>(null);

  vista = computed(() => this.clasificar(this.flota()));

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
        this.flota.set(r.flota?.totalVehiculos || 0);
        const reg = r.registro;
        this.observaciones.set(reg?.observaciones || '');
        this.guardada.set(reg ? this.clasificar(this.flota()) : null);
        this.loading.set(false);
      },
      error: () => {
        this.msg.set('No se pudo cargar el autodiagnóstico.');
        this.loading.set(false);
      },
    });
  }

  guardar(): void {
    if (!this.accionPerm.tiene('pesv', 'editar')) {
      this.msg.set('Sin permiso para editar el PESV.');
      return;
    }
    this.saving.set(true);
    this.msg.set(null);
    this.pesv
      .guardarAutodiagnostico({
        vigencia: this.vigencia(),
        totalVehiculos: this.flota(),
        observaciones: this.observaciones(),
      })
      .subscribe({
        next: (reg) => {
          this.guardada.set(reg.clasificacion || this.clasificar(this.flota()));
          this.saving.set(false);
          this.msg.set('Diagnóstico guardado. Ya puede generar los documentos de esta vigencia.');
        },
        error: () => {
          this.saving.set(false);
          this.msg.set('No se pudo guardar el diagnóstico.');
        },
      });
  }

  private clasificar(total: number | undefined): PesvClasificacion {
    const vehiculos = Math.max(0, Number(total) || 0);
    const nivel = vehiculos >= 100 ? 'avanzado' : vehiculos >= 50 ? 'estandar' : vehiculos >= 10 ? 'basico' : null;
    const nivelLabel = nivel === 'avanzado' ? 'Avanzado' : nivel === 'estandar' ? 'Estándar' : nivel === 'basico' ? 'Básico' : 'No obligada';
    const obligado = nivel != null;
    const resumen = obligado
      ? `Con ${vehiculos} vehículos debe presentar el PESV en nivel ${nivelLabel}.`
      : `Con ${vehiculos} vehículos no está obligada a presentar el PESV. El nivel Básico empieza en 10.`;
    return {
      reglaCodigo: '40595-m2-vehiculos-2022',
      misionalidad: 2,
      misionalidadTexto: 'Actividad distinta al transporte terrestre automotor',
      umbralObligacion: 10,
      totalVehiculos: vehiculos,
      obligado,
      nivel,
      nivelLabel,
      resumen,
    };
  }
}
