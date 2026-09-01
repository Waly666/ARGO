import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import { AuthService } from '../../core/services/auth.service';
import {
  JornadaCapService,
  ReprogramacionJornadasModo,
  ReprogramacionJornadasOpcionesDto,
  ReprogramacionJornadasPlanDto,
} from '../../core/services/jornada-cap.service';
import { fmtFechaCalendario } from './jornada-calendario.util';

type ReprogramarPaso = 'form' | 'auth' | 'progreso';

interface ReprogramarProgreso {
  fase: string;
  porcentaje: number;
}

@Component({
  selector: 'argo-jornada-reprogramar-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ArgoDateInputComponent],
  templateUrl: './jornada-reprogramar-modal.component.html',
  styleUrls: ['./jornada-reprogramar-modal.component.scss'],
})
export class JornadaReprogramarModalComponent implements OnChanges {
  private jornadaSvc = inject(JornadaCapService);
  auth = inject(AuthService);

  @Input({ required: true }) open = false;
  @Input({ required: true }) idContrato = '';
  @Input() codContrato = '';

  @Output() closed = new EventEmitter<void>();
  @Output() aplicado = new EventEmitter<ReprogramacionJornadasPlanDto>();

  loading = signal(false);
  previewLoading = signal(false);
  error = signal<string | null>(null);
  opciones = signal<ReprogramacionJornadasOpcionesDto | null>(null);
  preview = signal<ReprogramacionJornadasPlanDto | null>(null);
  paso = signal<ReprogramarPaso>('form');
  progreso = signal<ReprogramarProgreso>({ fase: '', porcentaje: 0 });

  modo: ReprogramacionJornadasModo = 'corrimiento';
  fechaDesde = '';
  diasCorrimiento = 1;
  fechaAncla = '';
  password = '';
  codigoMfa = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue && this.idContrato) {
      this.resetForm();
      this.cargarOpciones();
    }
    if (changes['open']?.currentValue === false) {
      this.preview.set(null);
      this.error.set(null);
      this.paso.set('form');
      this.progreso.set({ fase: '', porcentaje: 0 });
    }
  }

  fmtFecha = fmtFechaCalendario;

  minFechaDesde(): string {
    return this.opciones()?.fechaMinimaDesde || '';
  }

  reglasCalendario(): string {
    const o = this.opciones();
    if (!o) return '';
    const partes: string[] = [];
    if (o.incluiSab) partes.push('sábados');
    if (o.incluiDom) partes.push('domingos');
    if (o.incluiFest) partes.push('festivos');
    if (!partes.length) return 'Lunes a viernes (sin festivos)';
    return `Incluye ${partes.join(', ')}`;
  }

  bloqueado(): boolean {
    return this.paso() === 'progreso';
  }

  cerrar(): void {
    if (this.bloqueado()) return;
    this.closed.emit();
  }

  resetForm(): void {
    this.modo = 'corrimiento';
    this.diasCorrimiento = 1;
    this.fechaAncla = '';
    this.password = '';
    this.codigoMfa = '';
    this.preview.set(null);
    this.error.set(null);
    this.paso.set('form');
    this.progreso.set({ fase: '', porcentaje: 0 });
  }

  cargarOpciones(): void {
    if (!this.idContrato) return;
    this.loading.set(true);
    this.jornadaSvc
      .opcionesReprogramacionJornadas(this.idContrato)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (o) => {
          this.opciones.set(o);
          this.fechaDesde = o.fechaMinimaDesde || '';
          this.fechaAncla = o.fechaMinimaDesde || '';
        },
        error: (e) => this.error.set(e?.error?.message || 'No se pudieron cargar las opciones.'),
      });
  }

  paramsActuales() {
    return {
      fechaDesde: this.fechaDesde.trim(),
      modo: this.modo,
      diasCorrimiento: this.modo === 'corrimiento' ? Math.max(1, Number(this.diasCorrimiento) || 1) : undefined,
      fechaAncla: this.modo === 'fechaAncla' ? this.fechaAncla.trim() : undefined,
    };
  }

  calcularVistaPrevia(): void {
    if (!this.idContrato) return;
    this.error.set(null);
    this.preview.set(null);
    this.previewLoading.set(true);
    this.jornadaSvc
      .vistaPreviaReprogramacionJornadas(this.idContrato, this.paramsActuales())
      .pipe(finalize(() => this.previewLoading.set(false)))
      .subscribe({
        next: (p) => this.preview.set(p),
        error: (e) => this.error.set(e?.error?.message || 'No se pudo calcular la vista previa.'),
      });
  }

  solicitarAutenticacion(): void {
    const plan = this.preview();
    if (!plan || !this.idContrato) {
      this.error.set('Calcule primero la vista previa.');
      return;
    }
    if (!plan.totalCambios) {
      this.error.set('No hay cambios de fecha que aplicar.');
      return;
    }
    this.error.set(null);
    this.password = '';
    this.codigoMfa = '';
    this.paso.set('auth');
  }

  cancelarAutenticacion(): void {
    if (this.bloqueado()) return;
    this.paso.set('form');
    this.password = '';
    this.codigoMfa = '';
    this.error.set(null);
  }

  confirmarReprogramacion(): void {
    const plan = this.preview();
    if (!plan || !this.idContrato) return;

    const pass = this.password.trim();
    if (!pass) {
      this.error.set('Ingrese su contraseña de administrador.');
      return;
    }

    this.error.set(null);
    this.paso.set('progreso');
    this.progreso.set({ fase: 'Validando credenciales…', porcentaje: 12 });

    const timer = window.setTimeout(() => {
      this.progreso.set({ fase: 'Reprogramando jornadas…', porcentaje: 48 });
    }, 350);

    this.jornadaSvc
      .ejecutarReprogramacionJornadas(this.idContrato, {
        ...this.paramsActuales(),
        password: pass,
        codigoMfa: this.codigoMfa.trim() || undefined,
      })
      .pipe(
        finalize(() => {
          window.clearTimeout(timer);
        }),
      )
      .subscribe({
        next: (res) => {
          this.progreso.set({ fase: 'Reprogramación completada', porcentaje: 100 });
          window.setTimeout(() => {
            this.aplicado.emit(res);
            this.closed.emit();
          }, 700);
        },
        error: (e) => {
          this.paso.set('auth');
          this.progreso.set({ fase: '', porcentaje: 0 });
          this.error.set(e?.error?.message || 'No se pudo reprogramar las jornadas.');
        },
      });
  }
}
